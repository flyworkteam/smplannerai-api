const axios = require('axios'); // n8n'e istek atmak için axios ekledik
const pool = require('../config/db');
const aiService = require('../services/aiService');
const { processVideos } = require('../services/videoProcessor');

exports.sendMessage = async (req, res) => {
    try {
        const { user_id, project_id, message_text, content_type } = req.body;

        if (!user_id || !project_id || !message_text) {
            return res.status(400).json({ error: "Eksik bilgi gönderdiniz." });
        }

        const selectedType = content_type ? content_type.toLowerCase() : 'post';

        // 1. Kullanıcı mesajını her halükarda veritabanına kaydet
        await pool.query(
            'INSERT INTO ai_chat_history (user_id, project_id, message_role, message_text) VALUES (?, ?, ?, ?)',
            [user_id, project_id, 'user', `[Format: ${selectedType}] ${message_text}`]
        );

        if (['reel', 'reels', 'tiktok', 'video'].includes(selectedType)) {

            const n8nWebhookUrl = 'http://89.252.179.227:5678/webhook/generate-reels';
            
            axios.post(n8nWebhookUrl, {
                user_id,
                project_id,
                message_text,
                content_type: selectedType
            }).then(() => {
                console.log("n8n'e video üretim isteği başarıyla fırlatıldı!");
            }).catch(err => {
                console.error("n8n webhook hatası:", err.message);
            });

            // Flutter uygulamasına hemen cevap dönüyoruz ki kullanıcı donup kalmasın
            return res.status(200).json({
                message: "Video üretim süreci başarıyla başlatıldı.",
                user_message: message_text,
                content_type: selectedType,
                ai_response: {
                    id: null,
                    text: "Süper fikir! Senin için en etkili sahneleri planlıyor ve birden fazla video üreterek bunları birleştiriyorum. Bu işlem birkaç dakika sürebilir, tamamlandığında sana haber vereceğim! 🚀",
                    images: [] // Video gelene kadar boş kalacak
                }
            });
        }

        // ==========================================
        // 3. DİĞER İÇERİKLER (POST, CAROUSEL VS. - ESKİ SİSTEM)
        // ==========================================
        const aiResult = await aiService.generateSmartContent(message_text, selectedType);

        // Veritabanına AI cevabını kaydet
        const dbImageUrlValue = aiResult.images.length > 0 ? JSON.stringify(aiResult.images) : null;
        const [result] = await pool.query(
            'INSERT INTO ai_chat_history (user_id, project_id, message_role, message_text, image_url) VALUES (?, ?, ?, ?, ?)',
            [user_id, project_id, 'ai', aiResult.text, dbImageUrlValue]
        );

        // Projenin kapak görselini güncelle (henüz yoksa)
        if (aiResult.images.length > 0) {
            await pool.query(
                'UPDATE projects SET image_url = COALESCE(image_url, ?) WHERE id = ?',
                [aiResult.images[0], project_id]
            );
        }

        return res.status(200).json({
            message: "İçerik başarıyla üretildi.",
            user_message: message_text,
            content_type: aiResult.format,
            ai_response: {
                id: result.insertId,
                text: aiResult.text,
                images: aiResult.images
            }
        });

    } catch (error) {
        console.error("Chat Controller Hatası:", error);
        res.status(500).json({ error: "İçerik üretilirken bir hata oluştu." });
    }
};

// ==========================================
// N8N CALLBACK ENDPOINT
// n8n otomasyon, video URL'lerini bu endpoint'e gönderir
// ==========================================
exports.n8nCallback = (req, res) => {
    // Anında 200 dönüyoruz — n8n timeout yemesin
    res.status(200).json({ status: 'accepted', message: 'Video işleme başlatıldı.' });

    // ──────────────────────────────────────────────────────
    // Yanıt zaten gönderildi, şimdi arka planda işlemi başlat
    // ──────────────────────────────────────────────────────
    const { user_id, project_id, videos } = req.body;

    // Temel doğrulama
    if (!user_id || !project_id || !Array.isArray(videos) || videos.length === 0) {
        console.error('[n8nCallback] Geçersiz payload:', req.body);
        return; // res zaten gönderildi, sadece işlemi durdurabiliriz
    }

    console.log(`[n8nCallback] Arka plan işlemi başlatılıyor | user_id=${user_id}, project_id=${project_id}, video sayısı=${videos.length}`);

    // setImmediate: Yanıt tamamen gönderildikten sonra başlasın
    setImmediate(() => {
        processVideos(user_id, project_id, videos)
            .then(() => {
                console.log(`[n8nCallback] processVideos tamamlandı | project_id=${project_id}`);
            })
            .catch(err => {
                // processVideos zaten kendi içinde hata yönetimi yapıyor,
                // bu sadece beklenmedik üst seviye hatalar için
                console.error('[n8nCallback] Beklenmedik hata:', err.message);
            });
    });
};

// getChatHistory metodu aynen kalıyor...
exports.getChatHistory = async (req, res) => {
    try {
        const { projectId } = req.params;
        const [chats] = await pool.query('SELECT * FROM ai_chat_history WHERE project_id = ? ORDER BY created_at ASC', [projectId]);
        const formattedChats = chats.map(chat => {
            let imageUrls = [];
            if (chat.image_url) {
                try {
                    const parsed = JSON.parse(chat.image_url);
                    imageUrls = Array.isArray(parsed) ? parsed : [parsed];
                } catch (_) {
                    imageUrls = [chat.image_url];
                }
            }
            return { ...chat, image_url: imageUrls };
        });
        return res.status(200).json({ chat_history: formattedChats });
    } catch (error) {
        console.error("Get Chat History Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

// Kullanıcının tüm projelerindeki AI mesaj geçmişini döndürür (Chat History sayfası için)
exports.getUserChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        // Her projeden yalnızca EN SON AI mesajını al, tarih DESC sıralı
        const [chats] = await pool.query(
            `SELECT h.* 
             FROM ai_chat_history h
             INNER JOIN (
               SELECT project_id, MAX(created_at) as max_date
               FROM ai_chat_history
               WHERE user_id = ? AND message_role = 'ai'
               GROUP BY project_id
             ) latest ON h.project_id = latest.project_id AND h.created_at = latest.max_date
             WHERE h.user_id = ? AND h.message_role = 'ai'
             ORDER BY h.created_at DESC`,
            [userId, userId]
        );
        const formattedChats = chats.map(chat => {
            let imageUrls = [];
            if (chat.image_url) {
                try {
                    const parsed = JSON.parse(chat.image_url);
                    imageUrls = Array.isArray(parsed) ? parsed : [parsed];
                } catch (_) {
                    imageUrls = [chat.image_url];
                }
            }
            return { ...chat, image_url: imageUrls };
        });
        return res.status(200).json({ chat_history: formattedChats });
    } catch (error) {
        console.error("Get User Chat History Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};


// clearChatHistory metodu aynen kalıyor...
exports.clearChatHistory = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { date } = req.query; 

        if (date) {
            await pool.query('DELETE FROM ai_chat_history WHERE project_id = ? AND DATE(created_at) = ?', [projectId, date]);
        } else {
            await pool.query('DELETE FROM ai_chat_history WHERE project_id = ?', [projectId]);
        }

        return res.status(200).json({ message: "Sohbet geçmişi silindi." });
    } catch (error) {
        console.error("Clear Chat History Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};