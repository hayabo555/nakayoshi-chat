const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// publicフォルダ（HTML/CSS）を公開する
app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    // 部屋に入る処理
    socket.on('join-room', (roomId) => {
        socket.rooms.forEach(room => {
            if (room !== socket.id) socket.leave(room);
        });
        socket.join(roomId);
    });

    // メッセージを送受信する処理
    socket.on('chat-message', (data) => {
        io.to(data.roomId).emit('chat-message', data);
    });
});

// Renderのポート設定
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});