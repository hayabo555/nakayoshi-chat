const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let onlineUsers = {}; // { socketId: username }
let chatHistories = {}; // { roomName: [messages] }
const MAX_HISTORY = 100;

io.on('connection', (socket) => {
    // ログイン処理
    socket.on('login', (username) => {
        onlineUsers[socket.id] = username;
        // 全員に現在の「名前リスト」を送信
        io.emit('update-online-users', Object.values(onlineUsers));
    });

    // 部屋（グループ・個人）への入室
    socket.on('join-room', (roomName) => {
        socket.rooms.forEach(r => { if(r !== socket.id) socket.leave(r); });
        socket.join(roomName);
        
        if (!chatHistories[roomName]) chatHistories[roomName] = [];
        socket.emit('load-history', chatHistories[roomName]);
    });

    // メッセージ送信
    socket.on('chat-message', (data) => {
        const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        let msgData = { ...data, time, type: 'text' };

        // おみくじコマンド判定
        if (data.text === '/おみくじ') {
            const results = ['🌟超大吉', '✨大吉', '🎵中吉', '😊小吉', '🍀吉', '🍬末吉'];
            const res = results[Math.floor(Math.random() * results.length)];
            msgData.text = `おみくじ結果：【${res}】`;
            msgData.type = 'omikuji';
        }

        if (!chatHistories[data.room]) chatHistories[data.room] = [];
        chatHistories[data.room].push(msgData);
        if (chatHistories[data.room].length > MAX_HISTORY) chatHistories[data.room].shift();

        io.to(data.room).emit('chat-message', msgData);
    });

    // 管理者：履歴削除
    socket.on('admin-clear-history', (data) => {
        if (data.password === "0830") {
            chatHistories[data.room] = [];
            io.to(data.room).emit('load-history', []);
        }
    });

    socket.on('disconnect', () => {
        delete onlineUsers[socket.id];
        io.emit('update-online-users', Object.values(onlineUsers));
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));