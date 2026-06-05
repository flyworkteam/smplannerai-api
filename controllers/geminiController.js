const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const LANGUAGE_NAMES = {
    'tr': 'Türkçe',
    'en': 'English',
    'de': 'Deutsch',
    'fr': 'Français',
    'es': 'Español',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'ja': '日本語',
    'ko': '한국어',
    'zh': '中文',
    'hi': 'हिन्दी',
};

/**
 * POST /api/gemini/generate-prompt
 * Body: { brand: { brandName, sector, targetAudience, brandColors }, contentType, userLanguage? }
 * Returns: { prompt: "..." }
 */
exports.generateBrandPrompt = async (req, res) => {
    const { brand, contentType, userLanguage = 'en' } = req.body;

    if (!brand || !contentType) {
        return res.status(400).json({ error: 'brand ve contentType zorunludur.' });
    }

    const langName = LANGUAGE_NAMES[userLanguage] || 'English';

    const now = new Date();
    const upcomingDays = getUpcomingSpecialDays(now);

    const upcomingText = upcomingDays.length === 0
        ? `No upcoming special days.`
        : 'Upcoming special days:\n' + upcomingDays.map(d =>
            `• ${d.name} (in ${d.daysLeft} days, ${d.date.getDate()}.${d.date.getMonth() + 1}.${d.date.getFullYear()})`
        ).join('\n');

    const colorText = (brand.brandColors && brand.brandColors.length > 0)
        ? brand.brandColors.join(', ')
        : 'not specified';

    const contentTypeLabel = getContentTypeLabel(contentType);

    const userPrompt = `
You are a social media content expert. Based on the brand information and upcoming special days below, write a social media content prompt.
This prompt will be shown to the user in their native language: ${langName}.

CRITICAL LANGUAGE RULE: The ENTIRE output MUST be written in ${langName} (language code: ${userLanguage}). 
Do NOT use English unless the requested language is English. Even though this prompt might be used for AI generation later, for now, you MUST write the text completely and exclusively in ${langName}.

BRAND INFORMATION:
- Brand Name: ${brand.brandName || 'My Brand'}
- Sector: ${brand.sector || 'not specified'}
- Target Audience: ${brand.targetAudience || 'not specified'}
- Brand Colors: ${colorText}

CONTENT TYPE: ${contentType} (${contentTypeLabel})

TODAY'S DATE: ${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}

${upcomingText}

TASK:
Write a 2-4 sentence content prompt in ${langName} describing the visual scene, atmosphere, and content for a social media ${contentTypeLabel}.
Make sure to incorporate the brand identity and adapt the theme for any upcoming special days if applicable.

RULES:
- Get straight to the point.
- Do NOT use labels like "Prompt:" or any other prefix.
- The output MUST be 100% in ${langName}. Absolutely no English words (unless they are brand names).
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: `You are a social media content expert. You MUST write your entire response in ${langName} (language code: ${userLanguage}). Do NOT use any other language. Write ONLY in ${langName}.`
            }
        });

        const promptText = response.text?.trim();
        if (!promptText) {
            return res.status(500).json({ error: 'Gemini boş yanıt döndürdü.' });
        }

        return res.status(200).json({ prompt: promptText });
    } catch (error) {
        console.warn('Gemini generateBrandPrompt hatası, OpenAI fallback devreye giriyor:', JSON.stringify(error?.response?.data || error.message));

        try {
            const { OpenAI } = require('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const gptResponse = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a social media content expert. You MUST write your entire response in ${langName} (language code: ${userLanguage}). Do NOT use any other language under any circumstances.`
                    },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 300,
                temperature: 0.9,
            });

            const promptText = gptResponse.choices[0]?.message?.content?.trim();
            if (!promptText) {
                return res.status(500).json({ error: 'Prompt üretilemedi.' });
            }
            return res.status(200).json({ prompt: promptText });
        } catch (openaiError) {
            console.error('OpenAI fallback da başarısız:', openaiError.message);
            return res.status(500).json({ error: 'Prompt üretilemedi: ' + openaiError.message });
        }
    }
};

/**
 * POST /api/gemini/revise-image
 * Body: { imageUrl?, imageBase64?, mimeType?, brand?, format? }
 * Mevcut görseli analiz edip yaklaşan özel günleri göz önünde bulundurarak
 * yeni bir görsel üretir (OpenAI vision + gpt-image-1).
 * Returns: { imageUrl, prompt }
 */
exports.reviseImage = async (req, res) => {
    const { imageUrl, imageBase64, mimeType: inMimeType, brand, format } = req.body;

    if (!imageUrl && !imageBase64) {
        return res.status(400).json({ error: 'imageUrl veya imageBase64 zorunludur.' });
    }

    const now = new Date();
    const upcomingDays = getUpcomingSpecialDays(now);
    const upcomingText = upcomingDays.length === 0
        ? 'No upcoming special days.'
        : 'Upcoming special days:\n' + upcomingDays.map(d =>
            `• ${d.name} (in ${d.daysLeft} days)`
        ).join('\n');

    const brandInfo = brand
        ? `Brand: ${brand.brandName || 'N/A'}, Sector: ${brand.sector || 'N/A'}, Target: ${brand.targetAudience || 'N/A'}`
        : 'No brand info provided.';

    const formatLabel = getContentTypeLabel(format || 'post');

    try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // 1. Görseli base64 + mimeType olarak hazırla
        let finalBase64 = null;
        let mimeType = inMimeType || 'image/jpeg';

        if (imageBase64) {
            // Flutter'dan direkt base64 geldi
            finalBase64 = imageBase64;
        } else if (imageUrl) {
            // URL'den indir → base64'e çevir
            try {
                const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
                finalBase64 = Buffer.from(imgRes.data).toString('base64');
                const ct = imgRes.headers['content-type'];
                if (ct) mimeType = ct.split(';')[0];
            } catch (dlErr) {
                console.warn('Görsel URL\'den indirilemedi, devam ediliyor:', dlErr.message);
            }
        }

        // 2. Vision ile görseli analiz edip otomatik prompt üret
        const imageContent = finalBase64
            ? { type: 'image_url', image_url: { url: `data:${mimeType};base64,${finalBase64}` } }
            : { type: 'image_url', image_url: { url: imageUrl } };

        const visionMessages = [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `You are a social media content expert. Analyze this image and create an improved image generation prompt.

${brandInfo}
Format: ${formatLabel}
Today: ${now.toISOString().split('T')[0]}

${upcomingText}

Based on the image style, colors, and composition — write a detailed English image generation prompt that:
1. Keeps the same visual style and mood as the original
2. Incorporates the brand identity
3. If there's an upcoming special day within 7 days, makes the content thematic for that day
4. Is optimized for ${formatLabel}

Write ONLY the prompt, no explanations. Max 3 sentences.`
                    },
                    imageContent
                ]
            }
        ];

        const visionRes = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: visionMessages,
            max_tokens: 300,
        });
        const autoPrompt = visionRes.choices[0]?.message?.content?.trim()
            || 'Social media visual content, vibrant colors, professional style';

        console.log('[reviseImage] Auto prompt:', autoPrompt);

        // 3. Yeni görseli üret
        const imageRes = await openai.images.generate({
            model: 'gpt-image-1',
            prompt: autoPrompt,
            n: 1,
            size: '1024x1024',
            quality: 'medium',
        });

        const b64 = imageRes.data[0]?.b64_json;
        if (!b64) {
            return res.status(500).json({ error: 'Görsel üretilemedi.' });
        }

        // 4. BunnyCDN'e yükle
        const fileName = `revised_${Date.now()}.jpg`;
        const bunnyUploadUrl = `https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/${fileName}`;
        const imageBuffer = Buffer.from(b64, 'base64');

        await axios.put(bunnyUploadUrl, imageBuffer, {
            headers: {
                'AccessKey': process.env.BUNNY_ACCESS_KEY,
                'Content-Type': 'image/jpeg',
            },
        });

        const cdnUrl = `https://${process.env.BUNNY_HOSTNAME}/${fileName}`;
        console.log('[reviseImage] Done:', cdnUrl);
        return res.status(200).json({ imageUrl: cdnUrl, prompt: autoPrompt });

    } catch (err) {
        console.error('reviseImage error:', err.message);
        return res.status(500).json({ error: 'Görsel revize edilemedi: ' + err.message });
    }
};


function getContentTypeLabel(type) {
    switch ((type || '').toLowerCase()) {
        case 'story': return 'Instagram Story (9:16 vertical)';
        case 'reels': return 'Instagram Reels (9:16 vertical video)';
        case 'post': return 'Instagram Post (1:1 square)';
        case 'carousel': return 'Carousel (multi-slide)';
        default: return type;
    }
}

function getUpcomingSpecialDays(now) {
    const year = now.getFullYear();

    const allDays = [
        { name: 'New Year', date: new Date(year, 0, 1) },
        { name: "Valentine's Day", date: new Date(year, 1, 14) },
        { name: "International Women's Day", date: new Date(year, 2, 8) },
        { name: "National Sovereignty and Children's Day", date: new Date(year, 3, 23) },
        { name: 'Labour Day', date: new Date(year, 4, 1) },
        { name: "Atatürk Youth and Sports Day", date: new Date(year, 4, 19) },
        { name: "Mother's Day", date: mothersDayTR(year) },
        { name: 'World Environment Day', date: new Date(year, 5, 5) },
        { name: "Father's Day", date: fathersDayTR(year) },
        { name: 'Victory Day', date: new Date(year, 7, 30) },
        { name: 'World Animal Day', date: new Date(year, 9, 4) },
        { name: 'Republic Day', date: new Date(year, 9, 29) },
        { name: 'Black Friday', date: blackFriday(year) },
        { name: 'Christmas & New Year Shopping Season', date: new Date(year, 11, 20) },
        { name: 'New Year', date: new Date(year + 1, 0, 1) },
        { name: "Valentine's Day", date: new Date(year + 1, 1, 14) },
    ];

    return allDays
        .map(d => ({
            ...d,
            daysLeft: Math.floor((d.date - now) / (1000 * 60 * 60 * 24))
        }))
        .filter(d => d.daysLeft >= 0 && d.daysLeft <= 30)
        .sort((a, b) => a.daysLeft - b.daysLeft);
}

function mothersDayTR(year) {
    let d = new Date(year, 4, 1);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + 7);
    return d;
}

function fathersDayTR(year) {
    let d = new Date(year, 5, 1);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + 14);
    return d;
}

function blackFriday(year) {
    let d = new Date(year, 10, 30);
    while (d.getDay() !== 5) d.setDate(d.getDate() - 1);
    return d;
}
