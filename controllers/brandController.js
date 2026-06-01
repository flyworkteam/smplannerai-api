const pool = require('../config/db');

// Yeni Marka Kiti Oluşturma
exports.createBrandKit = async (req, res) => {
    try {
        const { user_id, brand_name, brand_colors, sector, target_audience, logo_url } = req.body;

        if (!user_id || !brand_name) {
            return res.status(400).json({ error: "user_id ve brand_name alanları zorunludur." });
        }

        // Flutter'dan gelen renk array'ini (['#HEX', '#HEX']) DB'ye JSON string olarak basıyoruz
        const colorsJson = brand_colors ? JSON.stringify(brand_colors) : null;

        const insertQuery = `
            INSERT INTO brand_kits (user_id, brand_name, brand_colors, sector, target_audience, logo_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.query(insertQuery, [
            user_id,
            brand_name,
            colorsJson,
            sector,
            target_audience,
            logo_url || null // Logo henüz yoksa null geçer, varmış gibi davranabiliriz
        ]);

        return res.status(201).json({
            message: "Marka kiti başarıyla oluşturuldu.",
            brand_kit_id: result.insertId
        });

    } catch (error) {
        console.error("Brand Kit Creation Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

// Kullanıcının Tüm Marka Kitlerini Getirme
exports.getBrandKitsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        const [brands] = await pool.query('SELECT * FROM brand_kits WHERE user_id = ?', [userId]);

        // Veritabanından gelen JSON formatındaki renkleri tekrar temiz bir Array'e çevirip dönüyoruz
        const formattedBrands = brands.map(brand => ({
            ...brand,
            brand_colors: brand.brand_colors ? JSON.parse(brand.brand_colors) : []
        }));

        return res.status(200).json({ brand_kits: formattedBrands });

    } catch (error) {
        console.error("Get Brand Kits Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};
exports.getBrandKitById = async (req, res) => {
    try {
        const { id } = req.params;

        const [brands] = await pool.query('SELECT * FROM brand_kits WHERE id = ?', [id]);

        if (brands.length === 0) {
            return res.status(404).json({ error: "Marka kiti bulunamadı." });
        }

        const brand = brands[0];
        
        brand.brand_colors = brand.brand_colors ? JSON.parse(brand.brand_colors) : [];

        return res.status(200).json({ brand_kit: brand });

    } catch (error) {
        console.error("Get Brand Kit Detail Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};
// Marka Kitini Güncelleme (Update)
exports.updateBrandKit = async (req, res) => {
    try {
        const { id } = req.params;
        const { brand_name, brand_colors, sector, target_audience, logo_url } = req.body;

        // 1. Önce bu ID'ye sahip bir marka var mı diye kontrol edelim
        const [existingBrands] = await pool.query('SELECT * FROM brand_kits WHERE id = ?', [id]);

        if (existingBrands.length === 0) {
            return res.status(404).json({ error: "Güncellenecek marka kiti bulunamadı." });
        }

        const existingBrand = existingBrands[0];

        // 2. Gelen verileri kontrol et, boş gelenleri eski veriyle doldur (Veri kaybını önler)
        const newBrandName = brand_name || existingBrand.brand_name;
        const newColorsJson = brand_colors ? JSON.stringify(brand_colors) : existingBrand.brand_colors;
        const newSector = sector !== undefined ? sector : existingBrand.sector;
        const newTargetAudience = target_audience !== undefined ? target_audience : existingBrand.target_audience;
        const newLogoUrl = logo_url !== undefined ? logo_url : existingBrand.logo_url;

        // 3. Veritabanını Güncelle
        const updateQuery = `
            UPDATE brand_kits 
            SET brand_name = ?, brand_colors = ?, sector = ?, target_audience = ?, logo_url = ?
            WHERE id = ?
        `;

        await pool.query(updateQuery, [newBrandName, newColorsJson, newSector, newTargetAudience, newLogoUrl, id]);

        return res.status(200).json({ message: "Marka kiti başarıyla güncellendi." });

    } catch (error) {
        console.error("Update Brand Kit Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};

// Marka Kitini Silme (Delete)
exports.deleteBrandKit = async (req, res) => {
    try {
        const { id } = req.params;

        // Önce markanın varlığını kontrol edelim
        const [existingBrands] = await pool.query('SELECT * FROM brand_kits WHERE id = ?', [id]);
        if (existingBrands.length === 0) {
            return res.status(404).json({ error: "Silinecek marka kiti bulunamadı." });
        }

        // Silme işlemi
        await pool.query('DELETE FROM brand_kits WHERE id = ?', [id]);

        return res.status(200).json({ message: "Marka kiti başarıyla silindi." });

    } catch (error) {
        console.error("Delete Brand Kit Error:", error);
        res.status(500).json({ error: "Sunucu tarafında bir hata oluştu." });
    }
};