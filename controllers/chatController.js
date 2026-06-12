const axios = require('axios');
const pool = require('../config/db');
const aiService = require('../services/aiService');
const { processVideos, emitToProject } = require('../services/videoProcessor');

// Dil kodu → başlangıç mesajı (video üretimi başlatıldığında kullanıcıya gösterilir)
const REELS_START_MESSAGES = {
    'tr': 'Süper fikir! Senin için en etkili sahneleri planlıyor ve birden fazla video üreterek bunları birleştiriyorum. Bu işlem birkaç dakika sürebilir, tamamlandığında sana haber vereceğim! 🚀',
    'en': 'Great idea! I\'m planning the most effective scenes for you and combining multiple videos. This process may take a few minutes — I\'ll notify you when it\'s done! 🚀',
    'de': 'Tolle Idee! Ich plane die effektivsten Szenen für dich und kombiniere mehrere Videos. Dieser Vorgang kann einige Minuten dauern — ich benachrichtige dich, wenn es fertig ist! 🚀',
    'fr': 'Super idée ! Je planifie les scènes les plus efficaces pour toi et je combine plusieurs vidéos. Ce processus peut prendre quelques minutes — je te notifierai quand ce sera prêt ! 🚀',
    'es': '¡Gran idea! Estoy planificando las escenas más efectivas para ti y combinando varios videos. Este proceso puede tardar unos minutos — ¡te avisaré cuando esté listo! 🚀',
    'it': 'Ottima idea! Sto pianificando le scene più efficaci per te e combinando più video. Questo processo potrebbe richiedere alcuni minuti — ti avviserò quando sarà pronto! 🚀',
    'pt': 'Ótima ideia! Estou planejando as cenas mais eficazes para você e combinando vários vídeos. Este processo pode levar alguns minutos — vou te notificar quando estiver pronto! 🚀',
    'ru': 'Отличная идея! Я планирую для тебя самые эффективные сцены и объединяю несколько видео. Этот процесс может занять несколько минут — я уведомлю тебя, когда будет готово! 🚀',
    'ja': '素晴らしいアイデアです！最も効果的なシーンを計画し、複数の動画を組み合わせています。この処理には数分かかる場合があります — 完了したらお知らせします！ 🚀',
    'ko': '멋진 아이디어입니다! 가장 효과적인 장면을 계획하고 여러 비디오를 결합하고 있습니다. 이 작업은 몇 분 정도 걸릴 수 있습니다 — 완료되면 알려드리겠습니다! 🚀',
    'zh': '好主意！我正在为您规划最有效的场景并合并多个视频。此过程可能需要几分钟——完成后我会通知您！ 🚀',
    'hi': 'शानदार विचार! मैं आपके लिए सबसे प्रभावी दृश्य योजना बना रहा हूं और कई वीडियो को मिला रहा हूं। इस प्रक्रिया में कुछ मिनट लग सकते हैं — पूरा होने पर मैं आपको सूचित करूंगा! 🚀',
};

// Görsel üretimi başlatıldığında kullanıcıya gösterilir (async işlem)
const IMAGE_START_MESSAGES = {
    'tr': 'Harika! Senin için görseli oluşturuyorum. Bu işlem biraz sürebilir, tamamlandığında sana haber vereceğim! ✨',
    'en': 'Great! I\'m creating your image. This may take a moment — I\'ll notify you when it\'s ready! ✨',
    'de': 'Super! Ich erstelle dein Bild. Das kann einen Moment dauern — ich benachrichtige dich, wenn es fertig ist! ✨',
    'fr': 'Super ! Je crée votre image. Cela peut prendre un moment — je vous préviendrai quand ce sera prêt ! ✨',
    'es': '¡Genial! Estoy creando tu imagen. Puede tardar un momento — te avisaré cuando esté lista! ✨',
    'it': 'Ottimo! Sto creando la tua immagine. Potrebbe volerci un momento — ti avviserò quando sarà pronta! ✨',
    'pt': 'Ótimo! Estou criando sua imagem. Isso pode levar um momento — avisarei quando estiver pronta! ✨',
    'ru': 'Отлично! Я создаю ваше изображение. Это может занять некоторое время — я уведомлю вас, когда будет готово! ✨',
    'ja': '素晴らしい！画像を作成しています。少し時間がかかる場合があります — 完了したらお知らせします！ ✨',
    'ko': '좋아요! 이미지를 생성하고 있습니다. 잠시 걸릴 수 있습니다 — 완료되면 알려드리겠습니다! ✨',
    'zh': '太好了！我正在为您生成图片。这可能需要一点时间 — 完成后我会通知您！ ✨',
    'hi': 'बढ़िया! मैं आपके लिए छवि बना रहा हूं। इसमें थोड़ा समय लग सकता है — तैयार होने पर मैं आपको सूचित करूंगा! ✨',
};

async function processImageInBackground({
    user_id,
    project_id,
    sessionId,
    message_text,
    selectedType,
    selectedLang,
    referenceImageBuffer,
}) {
    try {
        emitToProject(project_id, user_id, 'image:processing', {
            user_id,
            project_id,
            session_id: sessionId,
            message: IMAGE_START_MESSAGES[selectedLang] || IMAGE_START_MESSAGES['en'],
            progress: 15,
        });

        const aiResult = await aiService.generateSmartContent(
            message_text,
            selectedType,
            selectedLang,
            referenceImageBuffer,
        );

        const dbImageUrlValue = aiResult.images.length > 0 ? JSON.stringify(aiResult.images) : null;
        const [result] = await pool.query(
            'INSERT INTO ai_chat_history (user_id, project_id, session_id, message_role, message_text, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, project_id || null, sessionId, 'ai', aiResult.text, dbImageUrlValue],
        );

        if (aiResult.images.length > 0 && project_id) {
            await pool.query(
                'UPDATE projects SET image_url = COALESCE(image_url, ?) WHERE id = ?',
                [aiResult.images[0], project_id],
            );
        }

        emitToProject(project_id, user_id, 'image:ready', {
            user_id,
            project_id,
            session_id: sessionId,
            chat_id: result.insertId,
            message_text: aiResult.text,
            image_urls: aiResult.images,
            progress: 100,
        });

        console.log(`[ImageGen] ✅ Tamamlandı session=${sessionId} images=${aiResult.images.length}`);
    } catch (error) {
        console.error('[ImageGen] Hata:', error.message);
        emitToProject(project_id, user_id, 'image:error', {
            user_id,
            project_id,
            session_id: sessionId,
            message: error.message,
        });
    }
}

exports.sendMessage = async (req, res) => {
    try {
        const { user_id, project_id, message_text, content_type, user_language, session_id } = req.body;

        if (!user_id || !message_text) {
            return res.status(400).json({ error: "Eksik bilgi gönderdiniz." });
        }

        // Eğer session_id gelmezse yeni bir oturum UUID'si üret
        const sessionId = session_id || require('crypto').randomUUID();

        const selectedType = content_type ? content_type.toLowerCase() : 'post';
        const selectedLang = user_language || 'en';

        // 1. Kullanıcı mesajını her halükarda veritabanına kaydet
        await pool.query(
            'INSERT INTO ai_chat_history (user_id, project_id, session_id, message_role, message_text) VALUES (?, ?, ?, ?, ?)',
            [user_id, project_id || null, sessionId, 'user', `[Format: ${selectedType}] ${message_text}`]
        );

        if (['reel', 'reels', 'tiktok', 'video'].includes(selectedType)) {

            const n8nWebhookUrl = 'http://89.252.179.227:5678/webhook/generate-reels';
            
            axios.post(n8nWebhookUrl, {
                user_id,
                project_id,
                session_id: sessionId,
                message_text,
                content_type: selectedType
            }).then(() => {
                console.log("n8n'e video üretim isteği başarıyla fırlatıldı!");
            }).catch(err => {
                console.error("n8n webhook hatası:", err.message);
            });

            // Flutter uygulamasına hemen cevap dönüyoruz ki kullanıcı donup kalmasın
            const reelsMsg = REELS_START_MESSAGES[selectedLang] || REELS_START_MESSAGES['en'];
            return res.status(200).json({
                message: "Video production process started.",
                session_id: sessionId,
                user_message: message_text,
                content_type: selectedType,
                ai_response: {
                    id: null,
                    text: reelsMsg,
                    images: []
                }
            });
        }

        // Referans görsel varsa buffer'ını al (multer ile yüklendi)
        const referenceImageBuffer = req.file ? req.file.buffer : null;

        // POST / CAROUSEL: Görsel üretimi uzun sürebilir — hemen cevap dön, arka planda üret
        const imageStartMsg = IMAGE_START_MESSAGES[selectedLang] || IMAGE_START_MESSAGES['en'];

        setImmediate(() => {
            processImageInBackground({
                user_id,
                project_id,
                sessionId,
                message_text,
                selectedType,
                selectedLang,
                referenceImageBuffer,
            }).catch((err) => console.error('[ImageGen] Beklenmedik hata:', err.message));
        });

        return res.status(200).json({
            message: 'Image production process started.',
            session_id: sessionId,
            user_message: message_text,
            content_type: selectedType,
            ai_response: {
                id: null,
                text: imageStartMsg,
                images: [],
            },
        });

    } catch (error) {
        console.error("Chat Controller Hatası:", error);
        res.status(500).json({ error: "İçerik üretilirken bir hata oluştu." });
    }
};

// ==========================================
// KIE.AI TASK + BATCH MAPPING
// task_id → context (hangi batch'e ait, hangi sahne)
// batch_id → toplanan video URL'leri (3 sahneyi birleştirmek için)
// ==========================================
const kieTaskMap = new Map(); // task_id → { user_id, project_id, session_id, batch_id, scene_number, total_clips }
const kieBatchMap = new Map(); // batch_id → { user_id, project_id, session_id, total_clips, received: [{scene, url}], timer }

const BATCH_TIMEOUT_MS = 5 * 60 * 1000; // 5 dakika

exports.registerKieTask = (task_id, context) => {
    kieTaskMap.set(task_id, context);
    console.log(`[KieTask] Kaydedildi: task_id=${task_id}`, context);

    // batch_id varsa kieBatchMap'e de kaydet
    const { batch_id, user_id, project_id, session_id, total_clips } = context;
    if (batch_id && !kieBatchMap.has(batch_id)) {
        const timer = setTimeout(() => {
            // Timeout: gelenleri birleştir
            const batch = kieBatchMap.get(batch_id);
            if (!batch) return;
            console.log(`[KieBatch] ⏰ Timeout! batch_id=${batch_id} | gelen=${batch.received.length}/${batch.total_clips}`);
            _processBatch(batch_id);
        }, BATCH_TIMEOUT_MS);

        kieBatchMap.set(batch_id, {
            user_id,
            project_id,
            session_id,
            total_clips: total_clips || 3,
            received: [],
            timer
        });
        console.log(`[KieBatch] Yeni batch oluşturuldu: ${batch_id} | beklenen=${total_clips || 3} clip`);
    }
};

/**
 * Batch tamamlandığında veya timeout olduğunda çağrılır.
 * Toplanan URL'leri sıralayıp processVideos'a gönderir.
 */
function _processBatch(batchId) {
    const batch = kieBatchMap.get(batchId);
    if (!batch) return;

    // Timer'ı temizle
    if (batch.timer) clearTimeout(batch.timer);
    kieBatchMap.delete(batchId);

    if (batch.received.length === 0) {
        console.error(`[KieBatch] ❌ Hiç video gelmedi! batch_id=${batchId}`);
        return;
    }

    // Sahne sırasına göre sırala
    batch.received.sort((a, b) => a.scene - b.scene);
    const sortedUrls = batch.received.map(r => r.url);

    console.log(`[KieBatch] ✅ Batch tamamlandı: ${batchId} | ${sortedUrls.length}/${batch.total_clips} video birleştirilecek`);
    
    setImmediate(() => {
        processVideos(batch.user_id, batch.project_id, sortedUrls, batch.session_id)
            .then(() => console.log(`[KieBatch] processVideos tamamlandı | batch_id=${batchId}`))
            .catch(err => console.error('[KieBatch] processVideos hatası:', err.message));
    });
}

// ==========================================
// N8N CALLBACK ENDPOINT
// 1) KIE.AI'dan gelen direkt callback (data.state + data.resultJson)
// 2) n8n'den gelen task kayıt (submitted) callback
// ==========================================
exports.n8nCallback = (req, res) => {
    // Anında 200 dönüyoruz — timeout yemesin
    res.status(200).json({ status: 'accepted', message: 'Video işleme başlatıldı.' });

    const body = req.body;

    // ── FORMAT 1: KIE.AI'ın direkt callback'i ──
    if (body.code !== undefined && body.data?.taskId) {
        const taskId = body.data.taskId;
        const state = body.data.state;
        console.log(`[KieCallback] KIE.AI direkt callback | taskId=${taskId}, state=${state}`);

        if (state !== 'success') {
            console.error(`[KieCallback] Task başarısız | taskId=${taskId}, state=${state}`);
            // Başarısız sahneyi de batch'e "gelmedi" olarak işaretle
            const context = kieTaskMap.get(taskId);
            if (context?.batch_id) {
                const batch = kieBatchMap.get(context.batch_id);
                if (batch) {
                    console.log(`[KieCallback] Başarısız sahne ${context.scene_number} batch'ten düşürüldü | ${batch.received.length}/${batch.total_clips - 1} kaldı`);
                    batch.total_clips = Math.max(1, batch.total_clips - 1);
                    if (batch.received.length >= batch.total_clips) {
                        _processBatch(context.batch_id);
                    }
                }
            }
            kieTaskMap.delete(taskId);
            return;
        }

        // resultJson string JSON içinde URL'leri çek
        let videoUrls = [];
        try {
            const resultJson = JSON.parse(body.data.resultJson || '{}');
            videoUrls = resultJson.resultUrls || [];
        } catch (e) {
            console.error('[KieCallback] resultJson parse hatası:', e.message);
            return;
        }

        if (videoUrls.length === 0) {
            console.error('[KieCallback] Video URL bulunamadı | taskId=', taskId);
            return;
        }

        // Mapping'den context bul
        const context = kieTaskMap.get(taskId);
        if (!context) {
            console.error(`[KieCallback] task_id için context bulunamadı: ${taskId}`);
            return;
        }
        kieTaskMap.delete(taskId);

        const { user_id, project_id, session_id, batch_id, scene_number } = context;
        const url = videoUrls[0]; // Her task 1 video üretir

        // ── BATCH MODU: batch_id varsa topla ──
        if (batch_id) {
            const batch = kieBatchMap.get(batch_id);
            if (!batch) {
                console.error(`[KieCallback] batch_id bulunamadı: ${batch_id}, tek video olarak işleniyor`);
                setImmediate(() => {
                    processVideos(user_id, project_id, videoUrls, session_id)
                        .then(() => console.log(`[KieCallback] processVideos tamamlandı (fallback)`))
                        .catch(err => console.error('[KieCallback] processVideos hatası:', err.message));
                });
                return;
            }

            batch.received.push({ scene: scene_number || batch.received.length + 1, url });
            console.log(`[KieBatch] Sahne ${scene_number} geldi | batch=${batch_id} | ${batch.received.length}/${batch.total_clips}`);

            // Tüm clip'ler geldiyse birleştir
            if (batch.received.length >= batch.total_clips) {
                _processBatch(batch_id);
            }
            return;
        }

        // ── TEK VIDEO MODU: batch_id yoksa eski mantık ──
        console.log(`[KieCallback] Tek video işleniyor | user_id=${user_id}, project_id=${project_id}, session_id=${session_id}`);
        setImmediate(() => {
            processVideos(user_id, project_id, videoUrls, session_id)
                .then(() => console.log(`[KieCallback] processVideos tamamlandı | project_id=${project_id}`))
                .catch(err => console.error('[KieCallback] processVideos hatası:', err.message));
        });
        return;
    }

    // ── FORMAT 2: n8n workflow'unun gönderdiği callback ──
    const { user_id, project_id, videos, task_id, status } = body;
    const session_id = body.session_id || null;
    const batch_id = body.batch_id || null;
    const total_clips = body.total_clips || 1;
    const scene_number = body.scene_number || 1;

    // n8n task_id gönderiyorsa (submitted) → mapping kaydet
    if (task_id && user_id && project_id !== undefined && (!videos || videos.length === 0)) {
        exports.registerKieTask(task_id, { user_id, project_id, session_id, batch_id, scene_number, total_clips });
        console.log(`[n8nCallback] Task kaydedildi: ${task_id} → batch=${batch_id}, sahne=${scene_number}/${total_clips}`);
        return;
    }

    // Temel doğrulama
    if (!user_id || project_id === undefined || !Array.isArray(videos) || videos.length === 0) {
        console.error('[n8nCallback] Geçersiz payload:', body);
        return;
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

// Proje i\u00e7in olu\u015fturulmu\u015f g\u00f6rselleri ai_chat_history ile e\u015fle\u015ftirip session_id bulur
// "Sohbete Devam Et" butonu bu endpoint ile orijinal sohbete gider
exports.findSessionByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        // 1. Proje \u00f6\u011felerindeki t\u00fcm medya URL'lerini al
        const [items] = await pool.query(
            'SELECT media_url FROM project_items WHERE project_id = ?',
            [projectId]
        );

        if (items.length === 0) {
            return res.status(200).json({ session_id: null });
        }

        // 2. Her medya URL i\u00e7in ai_chat_history'de e\u015fle\u015fen session_id'yi bul
        for (const item of items) {
            const [rows] = await pool.query(
                `SELECT session_id FROM ai_chat_history
                 WHERE image_url LIKE ? AND session_id IS NOT NULL
                 ORDER BY created_at DESC LIMIT 1`,
                [`%${item.media_url}%`]
            );
            if (rows.length > 0 && rows[0].session_id) {
                return res.status(200).json({ session_id: rows[0].session_id });
            }
        }

        // 3. Bulunamazsa: projeye ba\u011fl\u0131 normal chat var m\u0131 kontrol et
        const [directChat] = await pool.query(
            `SELECT session_id FROM ai_chat_history
             WHERE project_id = ? AND session_id IS NOT NULL
             ORDER BY created_at DESC LIMIT 1`,
            [projectId]
        );
        if (directChat.length > 0) {
            return res.status(200).json({ session_id: directChat[0].session_id });
        }

        return res.status(200).json({ session_id: null });
    } catch (error) {
        console.error('Find Session By Project Error:', error);
        res.status(500).json({ error: 'Sunucu taraf\u0131nda bir hata olu\u015ftu.' });
    }
};

// Session ID'ye göre sohbet geçmişini döndür
exports.getChatHistoryBySession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const [chats] = await pool.query(
            'SELECT * FROM ai_chat_history WHERE session_id = ? ORDER BY created_at ASC',
            [sessionId]
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
        console.error('Get Session Chat History Error:', error);
        res.status(500).json({ error: 'Sunucu tarafında bir hata oluştu.' });
    }
};

// Kullanıcının tüm sohbetlerindeki son AI mesajını döndürür (Chat History sayfası için)
// Her session_id başına bir kart gösterilir
exports.getUserChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        // Her session'dan EN SON AI mesajını al, tarih DESC sıralı
        const [chats] = await pool.query(
            `SELECT h.* 
             FROM ai_chat_history h
             INNER JOIN (
               SELECT session_id, MAX(created_at) as max_date
               FROM ai_chat_history
               WHERE user_id = ? AND message_role = 'ai' AND session_id IS NOT NULL
               GROUP BY session_id
             ) latest ON h.session_id = latest.session_id AND h.created_at = latest.max_date
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

// Belirli bir kullanıcının tarihe göre tüm sohbet geçmişini siler
exports.clearUserChatHistoryByDate = async (req, res) => {
    try {
        const { userId } = req.params;
        const { date } = req.query; 

        if (date) {
            await pool.query('DELETE FROM ai_chat_history WHERE user_id = ? AND DATE(created_at) = ?', [userId, date]);
        } else {
            await pool.query('DELETE FROM ai_chat_history WHERE user_id = ?', [userId]);
        }

        return res.status(200).json({ message: "Kullanıcı sohbet geçmişi silindi." });
    } catch (error) {
        console.error("Clear User Chat History Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};
