const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const pool = require('../config/db');
const { uploadToBunnyCDN } = require('./aiService');

// fluent-ffmpeg'e hem ffmpeg hem ffprobe binary yolunu söyle
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
console.log('[VideoProcessor] FFmpeg :', ffmpegPath);
console.log('[VideoProcessor] FFprobe:', ffprobePath);

// Geçici dosyaları saklamak için temp klasörü
const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log('[VideoProcessor] temp/ klasörü oluşturuldu:', TEMP_DIR);
}

// ─────────────────────────────────────────────────────────────────
// Socket.IO emit yardımcısı
// ─────────────────────────────────────────────────────────────────
function emitToProject(project_id, user_id, event, data) {
    if (global.io) {
        const room = project_id ? `project_${project_id}` : `user_${user_id}`;
        global.io.to(room).emit(event, data);
        console.log(`[Socket.IO] ↗️  Emit "${event}" → ${room}`);
    }
}

// ─────────────────────────────────────────────────────────────────
// Video indir
// ─────────────────────────────────────────────────────────────────
async function downloadVideo(url, fileName) {
    const filePath = path.join(TEMP_DIR, fileName);
    console.log(`[VideoProcessor] ⬇️  İndiriliyor: ${url}`);

    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 120000,
        maxRedirects: 5,
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on('finish', () => {
            const sizeKB = Math.round(fs.statSync(filePath).size / 1024);
            console.log(`[VideoProcessor] ✅ İndirildi: ${fileName} (${sizeKB} KB)`);
            resolve(filePath);
        });
        writer.on('error', (err) => {
            console.error(`[VideoProcessor] ❌ İndirme hatası (${fileName}):`, err.message);
            reject(err);
        });
    });
}

// ─────────────────────────────────────────────────────────────────
// Video birleştir
// ─────────────────────────────────────────────────────────────────
function mergeVideos(inputPaths, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`[VideoProcessor] 🎬 ${inputPaths.length} video birleştiriliyor...`);

        const command = ffmpeg();
        inputPaths.forEach(p => command.input(p));

        command
            .on('start', (cmdLine) => {
                console.log('[VideoProcessor] FFmpeg başlatıldı:', cmdLine.substring(0, 120) + '...');
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    process.stdout.write(`\r[VideoProcessor] İlerleme: %${Math.round(progress.percent)}`);
                }
            })
            .on('error', (err) => {
                console.error('\n[VideoProcessor] ❌ FFmpeg hatası:', err.message);
                reject(err);
            })
            .on('end', () => {
                const sizeKB = fs.existsSync(outputPath)
                    ? Math.round(fs.statSync(outputPath).size / 1024)
                    : 0;
                console.log(`\n[VideoProcessor] ✅ Birleştirme tamamlandı (${sizeKB} KB)`);
                resolve(outputPath);
            })
            .mergeToFile(outputPath, TEMP_DIR);
    });
}

// ─────────────────────────────────────────────────────────────────
// Temp dosyaları temizle
// ─────────────────────────────────────────────────────────────────
async function cleanupFiles(filePaths) {
    for (const fp of filePaths) {
        try {
            if (fs.existsSync(fp)) {
                fs.unlinkSync(fp);
                console.log(`[VideoProcessor] 🗑️  Silindi: ${path.basename(fp)}`);
            }
        } catch (err) {
            console.warn(`[VideoProcessor] ⚠️  Temizlik hatası (${path.basename(fp)}):`, err.message);
        }
    }
}

// ─────────────────────────────────────────────────────────────────
// ANA FONKSİYON
// Tablo: ai_chat_history
// ─────────────────────────────────────────────────────────────────
async function processVideos(user_id, project_id, videoUrls) {
    const timestamp = Date.now();
    const downloadedPaths = [];
    const outputPath = path.join(TEMP_DIR, `merged_${user_id}_${project_id}_${timestamp}.mp4`);

    console.log('\n========================================');
    console.log(`[VideoProcessor] 🚀 İŞLEM BAŞLADI`);
    console.log(`  user_id: ${user_id} | project_id: ${project_id} | video: ${videoUrls.length}`);
    console.log('========================================\n');

    // ── SOCKET: İşlem başladı bildirimi ──
    emitToProject(project_id, user_id, 'video:processing', {
        user_id,
        project_id,
        message: '🎬 Videolarınız indiriliyor ve birleştiriliyor...',
        step: 'downloading'
    });

    try {
        // ADIM 1: İndir
        for (let i = 0; i < videoUrls.length; i++) {
            const fileName = `seg_${user_id}_${project_id}_${timestamp}_${i + 1}.mp4`;
            const filePath = await downloadVideo(videoUrls[i], fileName);
            downloadedPaths.push(filePath);

            // Her video indirilince Flutter'ı güncelle
            emitToProject(project_id, user_id, 'video:processing', {
                user_id,
                project_id,
                message: `🎬 Video ${i + 1}/${videoUrls.length} indirildi...`,
                step: 'downloading',
                progress: Math.round(((i + 1) / videoUrls.length) * 50)
            });
        }

        // ADIM 2: Birleştir
        emitToProject(project_id, user_id, 'video:processing', {
            user_id,
            project_id,
            message: '⚙️ Videolar birleştiriliyor...',
            step: 'merging',
            progress: 60
        });
        await mergeVideos(downloadedPaths, outputPath);

        // ADIM 3: CDN'e yükle
        emitToProject(project_id, user_id, 'video:processing', {
            user_id,
            project_id,
            message: '☁️ Video yükleniyor...',
            step: 'uploading',
            progress: 85
        });
        console.log('[VideoProcessor] ☁️ CDN\'e yükleniyor...');
        const fileBuffer = fs.readFileSync(outputPath);
        const base64Video = fileBuffer.toString('base64');
        const cdnUrl = await uploadToBunnyCDN(base64Video, true, 'mp4', 'video/mp4');
        console.log('[VideoProcessor] ✅ CDN URL:', cdnUrl);

        // ADIM 4: DB'ye kaydet
        const [dbResult] = await pool.query(
            `INSERT INTO ai_chat_history 
             (user_id, project_id, message_role, message_text, image_url) 
             VALUES (?, ?, 'ai', ?, ?)`,
            [
                user_id,
                project_id,
                '🎬 Reels videon hazır!',
                JSON.stringify([cdnUrl])
            ]
        );
        console.log(`[VideoProcessor] ✅ DB kaydı oluşturuldu: ai_chat_history.id=${dbResult.insertId}`);

        // Projenin kapak görselini güncelle
        if (project_id) {
            await pool.query(
                'UPDATE projects SET image_url = COALESCE(image_url, ?) WHERE id = ?',
                [cdnUrl, project_id]
            );
        }

        // ── SOCKET: Video hazır! Flutter'a gönder ──
        emitToProject(project_id, user_id, 'video:ready', {
            user_id,
            project_id,
            chat_id: dbResult.insertId,
            message_text: '🎬 Reels videon hazır!',
            video_url: cdnUrl,
            progress: 100
        });

        console.log('\n========================================');
        console.log('[VideoProcessor] 🎉 TAMAMLANDI → ' + cdnUrl);
        console.log('========================================\n');

    } catch (err) {
        console.error('\n[VideoProcessor] ❌ HATA:', err.message);
        console.error(err.stack);

        // ── SOCKET: Hata bildirimi ──
        emitToProject(project_id, user_id, 'video:error', {
            user_id,
            project_id,
            message: '⚠️ Video oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
        });

        // Hata mesajını DB'ye yaz
        try {
            await pool.query(
                `INSERT INTO ai_chat_history 
                 (user_id, project_id, message_role, message_text) 
                 VALUES (?, ?, 'ai', ?)`,
                [user_id, project_id, '⚠️ Video oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.']
            );
        } catch (dbErr) {
            console.error('[VideoProcessor] DB hata kaydı başarısız:', dbErr.message);
        }
    } finally {
        await cleanupFiles([...downloadedPaths, outputPath]);
        console.log('[VideoProcessor] 🧹 Temizlik tamamlandı.');
    }
}

module.exports = { processVideos };
