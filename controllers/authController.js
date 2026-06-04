const pool = require('../config/db');
const admin = require('firebase-admin');
const axios = require('axios');

try {
    const serviceAccount = require('../smplannerai-cd453-firebase-adminsdk-fbsvc-f27411d8f4.json');
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} catch (e) {
    console.error("Firebase admin init error:", e);
}

exports.login = async (req, res) => {
    try {
        const { firebase_uid, idToken, auth_type, email, full_name } = req.body;

        if (!firebase_uid || !auth_type) {
            return res.status(400).json({ error: "firebase_uid ve auth_type zorunludur." });
        }

        if (idToken && auth_type !== 'guest') {
            try {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                if (decodedToken.uid !== firebase_uid) {
                    return res.status(401).json({ error: "Geçersiz Firebase UID eşleşmesi." });
                }
            } catch (err) {
                console.error("Firebase Token Verify Error:", err);
                return res.status(401).json({ error: "Yetkilendirme başarısız (Token geçersiz)." });
            }
        }

        const [users] = await pool.query('SELECT * FROM users WHERE firebase_uid = ?', [firebase_uid]);

        if (users.length > 0) {
            let user = users[0];
            const now = new Date();
            const expireDate = new Date(user.premium_expire_date);

            if (user.is_premium && now > expireDate) {
                await pool.query(
                    'UPDATE users SET is_premium = false, subscription_plan = "none" WHERE id = ?',
                    [user.id]
                );
                user.is_premium = 0;
                user.subscription_plan = 'none';
            }

            return res.status(200).json({ message: "Giriş başarılı.", user: user });
        } else {
            const insertQuery = `
                INSERT INTO users (firebase_uid, auth_type, email, full_name, is_premium, subscription_plan, premium_expire_date) 
                VALUES (?, ?, ?, ?, true, 'trial', DATE_ADD(NOW(), INTERVAL 1 DAY))
            `;
            const [result] = await pool.query(insertQuery, [firebase_uid, auth_type, email, full_name]);
            const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);

            return res.status(201).json({ message: "Yeni kayıt oluşturuldu ve 24 saatlik Premium tanımlandı.", user: newUser[0] });
        }
    } catch (error) {
        console.error("Auth Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        const { firebase_uid } = req.body;

        if (!firebase_uid) {
            return res.status(400).json({ error: "firebase_uid zorunludur." });
        }

        const [result] = await pool.query('DELETE FROM users WHERE firebase_uid = ?', [firebase_uid]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "Hesap başarıyla silindi." });
        } else {
            return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }
    } catch (error) {
        console.error("Delete Profile Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const { firebase_uid } = req.params;

        if (!firebase_uid) {
            return res.status(400).json({ error: "firebase_uid zorunludur." });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE firebase_uid = ?', [firebase_uid]);

        if (users.length > 0) {
            return res.status(200).json({ user: users[0] });
        } else {
            return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firebase_uid, full_name, profile_photo } = req.body;

        if (!firebase_uid || !full_name) {
            return res.status(400).json({ error: "firebase_uid ve full_name zorunludur." });
        }

        let query = 'UPDATE users SET full_name = ?';
        let params = [full_name];

        if (profile_photo !== undefined) {
            query += ', profile_image = ?';
            params.push(profile_photo);
        }

        query += ' WHERE firebase_uid = ?';
        params.push(firebase_uid);

        const [result] = await pool.query(query, params);

        if (result.affectedRows > 0) {
            const [updatedUser] = await pool.query('SELECT * FROM users WHERE firebase_uid = ?', [firebase_uid]);
            return res.status(200).json({ message: "Profil başarıyla güncellendi.", user: updatedUser[0] });
        } else {
            return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

exports.uploadProfilePhoto = async (req, res) => {
    try {
        const { firebase_uid } = req.body;

        if (!firebase_uid) {
            return res.status(400).json({ error: "firebase_uid zorunludur." });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Dosya yüklenmedi." });
        }

        // BunnyCDN'e yükle
        const fileName = `profile_${firebase_uid}_${Date.now()}.jpg`;
        const bunnyUrl = `https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/${fileName}`;

        await axios.put(bunnyUrl, req.file.buffer, {
            headers: {
                'AccessKey': process.env.BUNNY_ACCESS_KEY,
                'Content-Type': req.file.mimetype
            }
        });

        const cdnUrl = `https://${process.env.BUNNY_HOSTNAME}/${fileName}`;

        // Veritabanını güncelle
        await pool.query('UPDATE users SET profile_image = ? WHERE firebase_uid = ?', [cdnUrl, firebase_uid]);

        const [updatedUser] = await pool.query('SELECT * FROM users WHERE firebase_uid = ?', [firebase_uid]);

        return res.status(200).json({
            message: "Profil fotoğrafı başarıyla güncellendi.",
            profile_image: cdnUrl,
            user: updatedUser[0]
        });
    } catch (error) {
        console.error("Upload Profile Photo Error:", error);
        res.status(500).json({ error: "Fotoğraf yüklenirken bir hata oluştu." });
    }
};

const SUPPORTED_LANGUAGES = ['en', 'de', 'it', 'fr', 'tr', 'ja', 'es', 'ru', 'ko', 'hi', 'pt', 'zh'];

exports.updateLanguage = async (req, res) => {
    try {
        const { firebase_uid, language } = req.body;

        if (!firebase_uid || !language) {
            return res.status(400).json({ error: "firebase_uid ve language zorunludur." });
        }

        if (!SUPPORTED_LANGUAGES.includes(language)) {
            return res.status(400).json({
                error: `Geçersiz dil kodu. Desteklenen diller: ${SUPPORTED_LANGUAGES.join(', ')}`
            });
        }

        const [result] = await pool.query(
            'UPDATE users SET language = ? WHERE firebase_uid = ?',
            [language, firebase_uid]
        );

        if (result.affectedRows > 0) {
            const [updatedUser] = await pool.query('SELECT * FROM users WHERE firebase_uid = ?', [firebase_uid]);
            return res.status(200).json({ message: "Dil tercihi güncellendi.", user: updatedUser[0] });
        } else {
            return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }
    } catch (error) {
        console.error("Update Language Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};