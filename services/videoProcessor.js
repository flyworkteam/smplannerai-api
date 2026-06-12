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
// Çoklu dil mesajları (kullanıcıya gösterilen tüm metinler)
// ─────────────────────────────────────────────────────────────────
const VIDEO_MESSAGES = {
    downloading: {
        tr: '🎬 Videolarınız indiriliyor ve birleştiriliyor...',
        en: '🎬 Your videos are being downloaded and merged...',
        de: '🎬 Deine Videos werden heruntergeladen und zusammengeführt...',
        fr: '🎬 Vos vidéos sont en cours de téléchargement et de fusion...',
        es: '🎬 Tus videos se están descargando y fusionando...',
        it: '🎬 I tuoi video vengono scaricati e uniti...',
        pt: '🎬 Seus vídeos estão sendo baixados e mesclados...',
        ru: '🎬 Ваши видео загружаются и объединяются...',
        ja: '🎬 動画をダウンロードして結合しています...',
        ko: '🎬 영상을 다운로드하고 합치는 중입니다...',
        zh: '🎬 正在下载并合并您的视频...',
        hi: '🎬 आपके वीडियो डाउनलोड और मर्ज किए जा रहे हैं...',
    },
    downloaded: {
        tr: (i, total) => `🎬 Video ${i}/${total} indirildi...`,
        en: (i, total) => `🎬 Video ${i}/${total} downloaded...`,
        de: (i, total) => `🎬 Video ${i}/${total} heruntergeladen...`,
        fr: (i, total) => `🎬 Vidéo ${i}/${total} téléchargée...`,
        es: (i, total) => `🎬 Video ${i}/${total} descargado...`,
        it: (i, total) => `🎬 Video ${i}/${total} scaricato...`,
        pt: (i, total) => `🎬 Vídeo ${i}/${total} baixado...`,
        ru: (i, total) => `🎬 Видео ${i}/${total} загружено...`,
        ja: (i, total) => `🎬 動画 ${i}/${total} ダウンロード完了...`,
        ko: (i, total) => `🎬 영상 ${i}/${total} 다운로드 완료...`,
        zh: (i, total) => `🎬 视频 ${i}/${total} 已下载...`,
        hi: (i, total) => `🎬 वीडियो ${i}/${total} डाउनलोड हो गया...`,
    },
    merging: {
        tr: '⚙️ Videolar birleştiriliyor...',
        en: '⚙️ Merging videos...',
        de: '⚙️ Videos werden zusammengeführt...',
        fr: '⚙️ Fusion des vidéos en cours...',
        es: '⚙️ Fusionando videos...',
        it: '⚙️ Unione dei video in corso...',
        pt: '⚙️ Mesclando vídeos...',
        ru: '⚙️ Объединение видео...',
        ja: '⚙️ 動画を結合中...',
        ko: '⚙️ 영상 합치는 중...',
        zh: '⚙️ 正在合并视频...',
        hi: '⚙️ वीडियो मर्ज किए जा रहे हैं...',
    },
    uploading: {
        tr: '☁️ Video yükleniyor...',
        en: '☁️ Uploading video...',
        de: '☁️ Video wird hochgeladen...',
        fr: '☁️ Téléchargement de la vidéo...',
        es: '☁️ Subiendo video...',
        it: '☁️ Caricamento video...',
        pt: '☁️ Enviando vídeo...',
        ru: '☁️ Загрузка видео...',
        ja: '☁️ 動画をアップロード中...',
        ko: '☁️ 영상 업로드 중...',
        zh: '☁️ 正在上传视频...',
        hi: '☁️ वीडियो अपलोड हो रहा है...',
    },
    ready: {
        tr: '🎬 Reels videon hazır!',
        en: '🎬 Your Reels video is ready!',
        de: '🎬 Dein Reels-Video ist fertig!',
        fr: '🎬 Votre vidéo Reels est prête !',
        es: '🎬 ¡Tu video de Reels está listo!',
        it: '🎬 Il tuo video Reels è pronto!',
        pt: '🎬 Seu vídeo Reels está pronto!',
        ru: '🎬 Ваше видео Reels готово!',
        ja: '🎬 リール動画が完成しました！',
        ko: '🎬 릴스 영상이 준비되었습니다!',
        zh: '🎬 您的 Reels 视频已准备好！',
        hi: '🎬 आपका रील्स वीडियो तैयार है!',
    },
    error: {
        tr: '⚠️ Video oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
        en: '⚠️ An error occurred while creating the video. Please try again.',
        de: '⚠️ Beim Erstellen des Videos ist ein Fehler aufgetreten. Bitte versuche es erneut.',
        fr: '⚠️ Une erreur est survenue lors de la création de la vidéo. Veuillez réessayer.',
        es: '⚠️ Ocurrió un error al crear el video. Por favor, inténtalo de nuevo.',
        it: '⚠️ Si è verificato un errore durante la creazione del video. Riprova.',
        pt: '⚠️ Ocorreu um erro ao criar o vídeo. Por favor, tente novamente.',
        ru: '⚠️ Произошла ошибка при создании видео. Пожалуйста, попробуйте снова.',
        ja: '⚠️ 動画の作成中にエラーが発生しました。もう一度お試しください。',
        ko: '⚠️ 영상 생성 중 오류가 발생했습니다. 다시 시도해 주세요.',
        zh: '⚠️ 创建视频时出错。请重试。',
        hi: '⚠️ वीडियो बनाते समय एक त्रुटि हुई। कृपया पुनः प्रयास करें।',
    },
};

function msg(key, lang, ...args) {
    const entry = VIDEO_MESSAGES[key];
    if (!entry) return key;
    const val = entry[lang] || entry['en'];
    return typeof val === 'function' ? val(...args) : val;
}

// ─────────────────────────────────────────────────────────────────
// Kullanıcının dilini DB'den çek
// ─────────────────────────────────────────────────────────────────
async function getUserLanguage(user_id) {
    try {
        const [rows] = await pool.query('SELECT language FROM users WHERE id = ? LIMIT 1', [user_id]);
        return (rows && rows.length > 0 && rows[0].language) ? rows[0].language : 'en';
    } catch (err) {
        console.warn('[VideoProcessor] Kullanıcı dili alınamadı, varsayılan: en', err.message);
        return 'en';
    }
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

exports.emitToProject = emitToProject;

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
async function processVideos(user_id, project_id, videoUrls, session_id = null) {
    const timestamp = Date.now();
    const downloadedPaths = [];
    const outputPath = path.join(TEMP_DIR, `merged_${user_id}_${project_id}_${timestamp}.mp4`);

    // Kullanıcının tercih ettiği dili DB'den al
    const lang = await getUserLanguage(user_id);
    console.log(`[VideoProcessor] 🌐 Kullanıcı dili: ${lang}`);

    console.log('\n========================================');
    console.log(`[VideoProcessor] 🚀 İŞLEM BAŞLADI`);
      console.log(`  user_id: ${user_id} | project_id: ${project_id} | session_id: ${session_id} | video: ${videoUrls.length}`);
    console.log('========================================\n');

    // ── SOCKET: İşlem başladı bildirimi ──
    emitToProject(project_id, user_id, 'video:processing', {
        user_id,
        project_id,
        message: msg('downloading', lang),
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
                message: msg('downloaded', lang, i + 1, videoUrls.length),
                step: 'downloading',
                progress: Math.round(((i + 1) / videoUrls.length) * 50)
            });
        }

        // ADIM 2: Birleştir
        emitToProject(project_id, user_id, 'video:processing', {
            user_id,
            project_id,
            message: msg('merging', lang),
            step: 'merging',
            progress: 60
        });
        await mergeVideos(downloadedPaths, outputPath);

        // ADIM 3: CDN'e yükle
        emitToProject(project_id, user_id, 'video:processing', {
            user_id,
            project_id,
            message: msg('uploading', lang),
            step: 'uploading',
            progress: 85
        });
        console.log('[VideoProcessor] ☁️ CDN\'e yükleniyor...');
        const fileBuffer = fs.readFileSync(outputPath);
        const base64Video = fileBuffer.toString('base64');
        const cdnUrl = await uploadToBunnyCDN(base64Video, true, 'mp4', 'video/mp4');
        console.log('[VideoProcessor] ✅ CDN URL:', cdnUrl);

        // ADIM 4: DB'ye kaydet
        const readyMsg = msg('ready', lang);
        const [dbResult] = await pool.query(
            `INSERT INTO ai_chat_history 
             (user_id, project_id, session_id, message_role, message_text, image_url) 
             VALUES (?, ?, ?, 'ai', ?, ?)`,
            [
                user_id,
                project_id,
                session_id,
                readyMsg,
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
            message_text: readyMsg,
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
        const errorMsg = msg('error', lang);
        emitToProject(project_id, user_id, 'video:error', {
            user_id,
            project_id,
            message: errorMsg
        });

        // Hata mesajını DB'ye yaz
        try {
            await pool.query(
                `INSERT INTO ai_chat_history 
                 (user_id, project_id, session_id, message_role, message_text) 
                 VALUES (?, ?, ?, 'ai', ?)`,
                [user_id, project_id, session_id, errorMsg]
            );
        } catch (dbErr) {
            console.error('[VideoProcessor] DB hata kaydı başarısız:', dbErr.message);
        }
    } finally {
        await cleanupFiles([...downloadedPaths, outputPath]);
        console.log('[VideoProcessor] 🧹 Temizlik tamamlandı.');
    }
}

module.exports = { processVideos, emitToProject };
