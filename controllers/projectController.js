const pool = require('../config/db');

// Yeni Klasör (Project) Oluştur
exports.createProject = async (req, res) => {
    try {
        const { user_id, name } = req.body;

        if (!user_id || !name) {
            return res.status(400).json({ error: "user_id ve name alanları zorunludur." });
        }

        const [result] = await pool.query(
            'INSERT INTO projects (user_id, name) VALUES (?, ?)', 
            [user_id, name]
        );

        return res.status(201).json({ message: "Klasör başarıyla oluşturuldu.", project_id: result.insertId });
    } catch (error) {
        console.error("Create Project Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

// Kullanıcının Tüm Klasörlerini Getir
exports.getProjects = async (req, res) => {
    try {
        const { userId } = req.params;
        const [projects] = await pool.query('SELECT id, user_id, name, created_at, image_url, caption, hashtags, format FROM projects WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        
        return res.status(200).json({ projects });
    } catch (error) {
        console.error("Get Projects Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

// Klasör (Project) Adını ve İçeriklerini Güncelle
exports.updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, caption, hashtags, image_url } = req.body;

        if (!name) {
            return res.status(400).json({ error: "name alanı zorunludur." });
        }

        const [result] = await pool.query(
            'UPDATE projects SET name = ?, caption = ?, hashtags = ?, image_url = ? WHERE id = ?', 
            [name, caption || null, hashtags || null, image_url || null, projectId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Klasör bulunamadı." });
        }

        return res.status(200).json({ message: "Klasör başarıyla güncellendi." });
    } catch (error) {
        console.error("Update Project Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

const axios = require('axios');

exports.uploadProjectImage = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: "Dosya yüklenmedi." });
        }

        // BunnyCDN'e yükle
        const fileName = `project_${projectId}_${Date.now()}.jpg`;
        const bunnyUrl = `https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/${fileName}`;

        await axios.put(bunnyUrl, req.file.buffer, {
            headers: {
                'AccessKey': process.env.BUNNY_ACCESS_KEY,
                'Content-Type': req.file.mimetype
            }
        });

        const cdnUrl = `https://${process.env.BUNNY_HOSTNAME}/${fileName}`;

        // Veritabanını güncelle
        await pool.query('UPDATE projects SET image_url = ? WHERE id = ?', [cdnUrl, projectId]);

        return res.status(200).json({
            message: "Proje görseli başarıyla yüklendi.",
            image_url: cdnUrl
        });
    } catch (error) {
        console.error("Upload Project Image Error:", error);
        res.status(500).json({ error: "Fotoğraf yüklenirken bir hata oluştu." });
    }
};

// Proje İçeriklerini Getir
exports.getProjectItems = async (req, res) => {
    try {
        const { projectId } = req.params;
        const [items] = await pool.query(
            `SELECT p.*, c.created_at as ai_created_at, c.message_text as ai_message_text, c.session_id as ai_session_id 
             FROM project_items p 
             LEFT JOIN ai_chat_history c ON p.ai_chat_id = c.id 
             WHERE p.project_id = ? 
             ORDER BY p.created_at DESC`,
            [projectId]
        );
        return res.status(200).json({ items });
    } catch (error) {
        console.error("Get Project Items Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

// Projeye Yeni İçerik Ekle
exports.addProjectItem = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { user_id, media_url, caption, hashtags, format, source, ai_chat_id } = req.body;

        if (!user_id || !media_url) {
            return res.status(400).json({ error: "user_id ve media_url zorunludur." });
        }

        const [result] = await pool.query(
            'INSERT INTO project_items (project_id, user_id, media_url, caption, hashtags, format, source, ai_chat_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [projectId, user_id, media_url, caption || null, hashtags || null, format || 'post', source || 'ai_generated', ai_chat_id || null]
        );

        if (ai_chat_id) {
            // Find the session_id for this chat
            const [rows] = await pool.query('SELECT session_id FROM ai_chat_history WHERE id = ?', [ai_chat_id]);
            if (rows.length > 0 && rows[0].session_id) {
                // Link the entire chat session to this project
                await pool.query('UPDATE ai_chat_history SET project_id = ? WHERE session_id = ?', [projectId, rows[0].session_id]);
            }
        } else if (media_url) {
            // ai_chat_id yoksa medya URL üzerinden session_id'yi bul
            const [chatRows] = await pool.query(
                `SELECT id, session_id FROM ai_chat_history
                 WHERE image_url LIKE ? AND session_id IS NOT NULL
                 ORDER BY created_at DESC LIMIT 1`,
                [`%${media_url}%`]
            );
            if (chatRows.length > 0 && chatRows[0].session_id) {
                // project_items satırını ai_chat_id ile güncelle
                await pool.query('UPDATE project_items SET ai_chat_id = ? WHERE id = ?', [chatRows[0].id, result.insertId]);
                // Tüm session'ı projeye bağla
                await pool.query('UPDATE ai_chat_history SET project_id = ? WHERE session_id = ?', [projectId, chatRows[0].session_id]);
            }
        }

        // Projenin kapak görselini her zaman en son eklenen içerikle güncelle
        await pool.query(
            'UPDATE projects SET image_url = ? WHERE id = ?',
            [media_url, projectId]
        );

        return res.status(201).json({ message: "İçerik kaydedildi.", item_id: result.insertId });
    } catch (error) {
        console.error("Add Project Item Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

// Projeyi Sil (chat geçmişi ve içerikler dahil)
exports.deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ error: "projectId zorunludur." });
        }

        // Önce bağlı verileri sil (cascade)
        await pool.query('DELETE FROM ai_chat_history WHERE project_id = ?', [projectId]);
        await pool.query('DELETE FROM project_items WHERE project_id = ?', [projectId]);
        const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [projectId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Proje bulunamadı." });
        }

        return res.status(200).json({ message: "Proje ve tüm içerikleri başarıyla silindi." });
    } catch (error) {
        console.error("Delete Project Error:", error);
        res.status(500).json({ error: "Proje silinirken bir hata oluştu." });
    }
};

// Proje veya chat öğesini Sil
exports.deleteProjectItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { source } = req.query;

        if (source === 'ai_generated') {
            await pool.query('DELETE FROM ai_chat_history WHERE id = ?', [itemId]);
        } else {
            await pool.query('DELETE FROM project_items WHERE id = ?', [itemId]);
        }
        
        return res.status(200).json({ message: "Öğe başarıyla silindi." });
    } catch (error) {
        console.error("Delete Project Item Error:", error);
        res.status(500).json({ error: "Öğe silinirken bir hata oluştu." });
    }
};