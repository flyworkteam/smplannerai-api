const pool = require('../config/db');

// Yeni Gönderi Planla / Zamanla (Schedule Post)
exports.schedulePost = async (req, res) => {
    try {
        const { user_id, project_id, brand_kit_id, platform, account_handle, caption, media_url, scheduled_date } = req.body;

        if (!user_id || !project_id || !platform || !media_url || !scheduled_date) {
            return res.status(400).json({ error: "Lütfen zorunlu alanları (user, project, platform, media, date) doldurun." });
        }

        const insertQuery = `
            INSERT INTO scheduled_posts (user_id, project_id, brand_kit_id, platform, account_handle, caption, media_url, scheduled_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(insertQuery, [
            user_id,
            project_id,
            brand_kit_id || null,
            platform,
            account_handle || null,
            caption || null,
            media_url,
            scheduled_date
        ]);

        return res.status(201).json({
            message: "Gönderi başarıyla zamanlandı ve takvime eklendi.",
            post_id: result.insertId
        });

    } catch (error) {
        console.error("Schedule Post Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

// Belirli bir klasördeki (Project) planlanmış gönderileri getir (Takvim görünümü için)

exports.getScheduledPostsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const [posts] = await pool.query(
            'SELECT * FROM scheduled_posts WHERE project_id = ? ORDER BY scheduled_date ASC', 
            [projectId]
        );
        
        return res.status(200).json({ posts });
    } catch (error) {
        console.error("Get Scheduled Posts Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};
// Zamanlanmış Gönderinin Tarihini/Saatini Güncelleme
exports.updatePostSchedule = async (req, res) => {
    try {
        const { id } = req.params; // Gönderinin ID'si
        const { new_scheduled_date } = req.body; // Flutter'dan gelecek yeni tarih (YYYY-MM-DD HH:MM:SS)

        if (!new_scheduled_date) {
            return res.status(400).json({ error: "Yeni planlama tarihi (new_scheduled_date) zorunludur." });
        }

        // 1. Gönderiyi veritabanından bulalım
        const [posts] = await pool.query('SELECT * FROM scheduled_posts WHERE id = ?', [id]);

        if (posts.length === 0) {
            return res.status(404).json({ error: "Güncellenecek gönderi bulunamadı." });
        }

        const post = posts[0];

        // 2. Kontrol: Eğer gönderi zaten paylaşıldıysa veya hata aldıysa değiştirilemesin
        if (post.status === 'published') {
            return res.status(400).json({ error: "Bu gönderi zaten paylaşıldığı için zamanı değiştirilemez." });
        }
        if (post.status === 'failed') {
            return res.status(400).json({ error: "Hata almış bir gönderinin zamanı değiştirilemez, lütfen yeniden planlayın." });
        }

        // 3. Kontrol: Orijinal planlama süresi zaten geçmiş mi? (Manuel bir gecikme olduysa koruma amacıyla)
        const now = new Date();
        const oldScheduledDate = new Date(post.scheduled_date);
        if (oldScheduledDate < now && post.status === 'scheduled') {
            return res.status(400).json({ error: "Orijinal paylaşım süresi geçmiş olan bir gönderi güncellenemez." });
        }

        // 4. Her şey yolundaysa yeni tarihi ve durumu güncelle (Yeniden 'scheduled' moduna alıyoruz)
        const updateQuery = `
            UPDATE scheduled_posts 
            SET scheduled_date = ?, status = 'scheduled' 
            WHERE id = ?
        `;
        await pool.query(updateQuery, [new_scheduled_date, id]);

        return res.status(200).json({ 
            message: "Gönderi paylaşım zamanı başarıyla güncellendi.",
            new_date: new_scheduled_date 
        });

    } catch (error) {
        console.error("Update Post Schedule Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};