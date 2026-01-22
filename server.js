const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// publicフォルダの中身（HTML/CSS）を公開
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('ユーザーが接続しました');

    // ルーム入室処理
    socket.on('join-room', (roomId) => {
        socket.rooms.forEach(room => {
            if (room !== socket.id) socket.leave(room);
        });
        socket.join(roomId);
        console.log(`入室: ${roomId}`);
    });

    // メッセージ受信と全員への転送
    socket.on('chat-message', (data) => {
        // 同じ部屋にいる全員（自分含む）に送る
        io.to(data.roomId).emit('chat-message', data);
    });

    socket.on('disconnect', () => {
        console.log('切断されました');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});