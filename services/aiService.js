const { GoogleGenAI } = require('@google/genai');
const { OpenAI } = require('openai');
const axios = require('axios');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Özel ve bağımsız BunnyCDN yükleyicisi — videoProcessor.js tarafından da kullanılır
async function uploadToBunnyCDN(sourceData, isBase64 = false, fileExt = 'jpg', mimeType = 'image/jpeg') {
    try {
        let buffer;
        if (isBase64) {
            buffer = Buffer.from(sourceData, 'base64');
        } else {
            const response = await axios({ method: 'get', url: sourceData, responseType: 'arraybuffer' });
            buffer = response.data;
        }

        const fileName = `media_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const bunnyUrl = `https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/${fileName}`;
        
        await axios.put(bunnyUrl, buffer, {
            headers: { 'AccessKey': process.env.BUNNY_ACCESS_KEY, 'Content-Type': mimeType }
        });
        return `https://${process.env.BUNNY_HOSTNAME}/${fileName}`;
    } catch (error) {
        console.error("BunnyCDN Error:", error.message);
        throw new Error(`Medya CDN'e yüklenemedi: ${error.message}`);
    }
}

// uploadToBunnyCDN'i dışarıya aç (videoProcessor.js da kullanıyor)
exports.uploadToBunnyCDN = uploadToBunnyCDN;

/** Haziran 2026+: DALL·E API kapatıldı; GPT Image modelleri kullanılır. */
const OPENAI_IMAGE_MODELS = ['gpt-image-2', 'gpt-image-1', 'gpt-image-1-mini'];

function aspectRatioToOpenAiSize(imageAspectRatio) {
    if (imageAspectRatio === '9:16') return '1024x1536';
    if (imageAspectRatio === '16:9') return '1536x1024';
    return '1024x1024';
}

/** OpenAI Images API — b64_json veya url ile CDN'e yükler. */
async function generateImageWithOpenAI(promptModifier, imageAspectRatio) {
    const size = aspectRatioToOpenAiSize(imageAspectRatio);
    const prompt = promptModifier.substring(0, 32000);

    for (const model of OPENAI_IMAGE_MODELS) {
        try {
            const response = await openai.images.generate({
                model,
                prompt,
                n: 1,
                size,
                quality: 'medium',
            });

            const item = response.data?.[0];
            if (!item) throw new Error('Boş görsel yanıtı');

            if (item.b64_json) {
                const url = await uploadToBunnyCDN(item.b64_json, true, 'jpg', 'image/jpeg');
                console.log(`${model} görsel CDN'e yüklendi: ${url}`);
                return url;
            }
            if (item.url) {
                const url = await uploadToBunnyCDN(item.url, false, 'jpg', 'image/jpeg');
                console.log(`${model} görsel CDN'e yüklendi: ${url}`);
                return url;
            }
            throw new Error('b64_json veya url yok');
        } catch (err) {
            console.warn(`${model} (OpenAI) Görsel Üretim Hatası: ${err.message}`);
        }
    }
    return null;
}

// Dili kod → tam ad eşlemesi (AI'a daha net anlatmak için)
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

// Dünyanın her yerinden çağrılabilecek ana içerik üretim fonksiyonu
exports.generateSmartContent = async (message_text, content_type, userLanguage = 'en') => {
    const selectedType = content_type ? content_type.toLowerCase() : 'post';
    const langName = LANGUAGE_NAMES[userLanguage] || 'English';

    let systemInstruction = `You are a social media expert and content strategist.

CRITICAL LANGUAGE RULE — MUST FOLLOW:
- The user's selected app language is: ${langName} (language code: ${userLanguage})
- You MUST write ALL of your response EXCLUSIVELY in ${langName}.
- Do NOT use any other language, not even partially.
- Even if the user writes in a different language, your FIRST response must be in ${langName}.
- If the user continues the conversation in a different language, switch to that language.
- Any text overlays or captions in image generation prompts must also be written in ${langName}.

OUTPUT RULES (STRICTLY REQUIRED):
- Generate content that can be used directly on social media.
- Do NOT include labels like "Here is your content:", "Caption:", "Hashtag combinations:", "---", or any explanation or heading.
- The response must start directly with the caption text (emoji or first word).
- Add hashtags at the end of the caption with a blank line in between.
- Write NOTHING else — only the shareable text + hashtags.`;

    if (['reel', 'reels', 'tiktok', 'video'].includes(selectedType)) {
        systemInstruction += `\n- Format: Short attention-grabbing caption for Reels/Video (1-3 sentences) with relevant hashtags. Write in ${langName}.`;
    } else {
        systemInstruction += `\n- Format: Engaging Instagram post caption (2-4 sentences) with relevant hashtags. Write in ${langName}.`;
    }


    // 2. Metin/Senaryo Üret (Gemini ilk tercih, hata durumunda OpenAI yedek)
    let aiResponseText = "";
    const langReminder = `IMPORTANT: Write your entire response in ${langName} only.`;
    try {
        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${langReminder}\n\n${message_text}`,
            config: { systemInstruction: systemInstruction + ` Write in a warm, friendly tone. If the user later writes in a different language, switch to that language.` }
        });
        aiResponseText = geminiResponse.text;
    } catch (error) {
        console.warn("Gemini Hatası (Yedek OpenAI modeline geçiliyor):", error.message);
        const gptResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemInstruction + ` Write in a warm, friendly tone. If the user later writes in a different language, switch to that language.` },
                { role: "user", content: `${langReminder}\n\n${message_text}` }
            ]
        });
        aiResponseText = gptResponse.choices[0].message.content;
    }


    // 3. İçerik Üretimi (Video / Görsel)
    let imageLinks = [];
    
    if (['reel', 'reels', 'tiktok', 'video'].includes(selectedType)) {
        try {
            console.log("Veo 3.1 Lite ile video üretiliyor (Bu işlem 1-3 dakika sürebilir)...");
            const op = await ai.models.generateVideos({
                model: 'veo-3.1-lite-generate-preview',
                prompt: `Professional social media vertical video for ${langName} speaking audience. Visual style and cultural context matching ${langName} culture. ${message_text}`,
                config: {
                    aspectRatio: "9:16",
                    // personGeneration: "ALLOW_ADULT"
                }
            });
            
            let videoResponse = null;
            let operationName = op.name;
            for (let i = 0; i < 30; i++) { // wait up to 5 minutes
                const pollRes = await axios.get(`https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${process.env.GEMINI_API_KEY}`);
                if (pollRes.data.done) {
                    if (pollRes.data.error) throw new Error(pollRes.data.error.message);
                    videoResponse = pollRes.data.response;
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 10000));
            }

            if (videoResponse && videoResponse.generateVideoResponse && videoResponse.generateVideoResponse.generatedSamples && videoResponse.generateVideoResponse.generatedSamples.length > 0) {
                const videoUri = videoResponse.generateVideoResponse.generatedSamples[0].video.uri;
                const downloadUrl = videoUri.includes('?') ? `${videoUri}&key=${process.env.GEMINI_API_KEY}` : `${videoUri}?key=${process.env.GEMINI_API_KEY}`;
                const permanentCdnUrl = await uploadToBunnyCDN(downloadUrl, false, 'mp4', 'video/mp4');
                imageLinks.push(permanentCdnUrl);
                console.log("Video CDN'e başarıyla yüklendi:", permanentCdnUrl);
            } else {
                console.warn("Video üretilemedi veya yanıt formatı hatalı: ", JSON.stringify(videoResponse));
            }
        } catch (err) {
            console.warn(`Veo (Gemini) Video Üretim Hatası: ${err.message}`);
            // Hata durumunda sadece metin senaryosuyla devam edecek
        }
    } else {
        let imageAspectRatio = "1:1";
        let loopCount = 1;

        if (['story', 'vertical'].includes(selectedType)) imageAspectRatio = "9:16";
        else if (['horizontal'].includes(selectedType)) imageAspectRatio = "16:9";
        else if (selectedType === 'carousel') loopCount = 3;

        for (let i = 0; i < loopCount; i++) {
            // Görsel prompt'una dil bağlamını ekle — özellikle üzerinde yazı varsa o dilde olsun
            let promptModifier = `Professional social media visual, format: ${selectedType}, target audience: ${langName} speakers. If the image contains any text overlays, write them in ${langName}. ${message_text}`;
            if (selectedType === 'carousel') {
                promptModifier += ` (This is slide ${i + 1} of a carousel series, maintain consistent style with other slides.)`;
            }

            const permanentCdnUrl = await generateImageWithOpenAI(
                promptModifier,
                imageAspectRatio,
            );
            if (permanentCdnUrl) {
                imageLinks.push(permanentCdnUrl);
            }
        }
    }

    // Ortak servis çıktısı
    return {
        text: aiResponseText,
        images: imageLinks,
        format: selectedType
    };
};
