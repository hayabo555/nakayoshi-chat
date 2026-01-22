const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const https = require('https');

app.use(express.static(path.join(__dirname, 'public')));

// --- 常に動作させるためのセルフ・ピング機能 ---
// 自分のRender URLをここに設定するか、環境変数から取得
const APP_URL = process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`;

setInterval(() => {
    if (APP_URL.includes("onrender.com")) {
        https.get(APP_URL, (res) => {
            console.log(`Self-ping sent to ${APP_URL}: status ${res.statusCode}`);
        }).on('error', (e) => {
            console.error(`Self-ping error: ${e.message}`);
        });
    }
}, 1000 * 60 * 20); // 20分ごとに自分を起こす

// --- Socket.io 通信ロジック ---
io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        socket.rooms.forEach(room => { if (room !== socket.id) socket.leave(room); });
        socket.join(roomId);
    });

    socket.on('chat-message', (data) => {
        io.to(data.roomId).emit('chat-message', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});