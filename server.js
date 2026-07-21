const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const brandRoutes = require('./routes/brandRoutes');
const projectRoutes = require('./routes/projectRoutes');
const chatRoutes = require('./routes/chatRoutes');
const postRoutes = require('./routes/postRoutes');
const webhookRoutes = require('./routes/webhook');
const geminiRoutes = require('./routes/geminiRoutes');
const klingRoutes = require('./routes/klingRoutes');
const panelRoutes = require('./routes/panelRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/webhooks', webhookRoutes);
app.use('/panel/v1', panelRoutes);

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'online',
        message: 'SM Planner Backend çalışıyor',
        timestamp: new Date()
    });
});

// HTTP sunucusu oluştur (Socket.IO için gerekli)
const server = http.createServer(app);

// Socket.IO kurulumu
const io = new Server(server, {
    cors: {
        origin: '*', // Flutter'dan bağlantıya izin ver
        methods: ['GET', 'POST']
    }
});

// io'yu global olarak erişilebilir yap (videoProcessor.js kullanacak)
global.io = io;

// Socket.IO bağlantı yönetimi
io.on('connection', (socket) => {
    console.log(`[Socket.IO] 🔌 Yeni bağlantı: ${socket.id}`);

    socket.on('join_project', (projectId) => {
        const room = `project_${projectId}`;
        socket.join(room);
        console.log(`[Socket.IO] Socket ${socket.id} → oda: ${room}`);
        socket.emit('joined', { room, message: 'Odaya katıldınız.' });
    });

    socket.on('join_user', (userId) => {
        const room = `user_${userId}`;
        socket.join(room);
        console.log(`[Socket.IO] Socket ${socket.id} → oda: ${room}`);
        socket.emit('joined', { room, message: 'Kullanıcı odasına katıldınız.' });
    });

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] 🔌 Bağlantı koptu: ${socket.id}`);
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/post', postRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/kling', klingRoutes);

const PORT = process.env.PORT || 3037;
server.listen(PORT, () => {
    console.log(`SM Planner çalışıyor: http://localhost:${PORT}`);
    console.log(`[Socket.IO] WebSocket hazır: ws://localhost:${PORT}`);
    console.log(`Ağdan erişim (fiziksel cihaz): http://<Mac-IP>:${PORT}`);
});
