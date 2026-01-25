const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let onlineUsers = {}; 
let chatHistories = {}; 
const MAX_HISTORY = 100;

io.on('connection', (socket) => {
    // ログイン
    socket.on('login', (username) => {
        onlineUsers[socket.id] = username;
        io.emit('update-online-count', Object.keys(onlineUsers).length);
    });

    // 入室
    socket.on('join-room', (roomName) => {
        socket.rooms.forEach(r => { if(r !== socket.id) socket.leave(r); });
        socket.join(roomName);
        if (!chatHistories[roomName]) chatHistories[roomName] = [];
        socket.emit('load-history', chatHistories[roomName]);
    });

    // メッセージ受信
    socket.on('chat-message', (data) => {
        const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        let msgData = { ...data, time, type: 'text' };

        // --- おみくじ機能 ---
        if (data.text === '/おみくじ') {
            const results = ['🌟超大吉', '✨大吉', '🎵中吉', '😊小吉', '🍀吉', '🍬末吉'];
            const res = results[Math.floor(Math.random() * results.length)];
            msgData.text = `おみくじを引きました！結果は... 【${res}】 です！`;
            msgData.type = 'omikuji';
        }

        if (!chatHistories[data.room]) chatHistories[data.room] = [];
        chatHistories[data.room].push(msgData);
        if (chatHistories[data.room].length > MAX_HISTORY) chatHistories[data.room].shift();

        io.to(data.room).emit('chat-message', msgData);
    });

    // 管理者：履歴削除 (パスワード: 0830)
    socket.on('admin-clear-history', (data) => {
        if (data.password === "0830") {
            chatHistories[data.room] = [];
            io.to(data.room).emit('load-history', []);
        }
    });

    socket.on('disconnect', () => {
        delete onlineUsers[socket.id];
        io.emit('update-online-count', Object.keys(onlineUsers).length);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server started on port ${PORT}`));