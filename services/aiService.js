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

// Dünyanın her yerinden çağrılabilecek ana içerik üretim fonksiyonu
exports.generateSmartContent = async (message_text, content_type) => {
    const selectedType = content_type ? content_type.toLowerCase() : 'post';

    let systemInstruction = `Sen bir sosyal medya uzmanı ve içerik stratejistisin. Kullanıcının isteğine uygun içerik üret.`;
    if (['reel', 'reels', 'tiktok', 'video'].includes(selectedType)) {
        systemInstruction += ` Kullanıcı bir VİDEO/REELS formatı seçti. Lütfen uzun bir video senaryosu veya saniye saniye akış YAZMA. Sadece doğrudan sosyal medyada paylaşılabilecek tek bir kısa gönderi metni (caption) ve hashtagler ver.`;
    } else {
        systemInstruction += ` Kullanıcı bir GÖRSEL/METİN formatı seçti. Yanıt olarak harika bir gönderi metni (caption) ve hashtag kombinasyonları hazırla.`;
    }

    // 2. Metin/Senaryo Üret (Gemini ilk tercih, hata durumunda OpenAI yedek)
    let aiResponseText = "";
    try {
        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message_text,
            config: { systemInstruction: systemInstruction + " Yanıtı cana yakın bir dille ve Kullanıcı hangi dilde sorduysa o dilde cevap ver." }
        });
        aiResponseText = geminiResponse.text;
    } catch (error) {
        console.warn("Gemini Hatası (Yedek OpenAI modeline geçiliyor):", error.message);
        const gptResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemInstruction + " Yanıtı cana yakın bir dille ve Kullanıcı hangi dilde sorduysa o dilde cevap ver." },
                { role: "user", content: message_text }
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
                prompt: `Profesyonel sosyal medya video çekimi, dikey format.yazılan dile ait ülkenin yerel insan topluluğunun görünümünü göz önünde bulunduran bir video generate et ${message_text}`,
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
            let promptModifier = `Sosyal medya paylaşımı için profesyonel tasarım, format: ${selectedType}. ${message_text}`;
            if (selectedType === 'carousel') {
                promptModifier += ` (Bu bir kaydırmalı post serisinin ${i + 1}. görselidir, diğer görsellerle tarz olarak uyumlu olmalıdır.)`;
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
