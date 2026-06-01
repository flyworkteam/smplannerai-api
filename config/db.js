const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
    timezone: '+03:00'
});

pool.getConnection()
    .then(() => console.log("✅ MySQL Veritabanına Başarıyla Bağlanıldı!"))
    .catch((err) => console.error("❌ Veritabanı Bağlantı Hatası:", err));

module.exports = pool;