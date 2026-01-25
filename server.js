const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let onlineUsers = {}; 
let chatHistories = {}; // 部屋ごとの履歴を保存

io.on('connection', (socket) => {
    // ログイン：人数カウント用
    socket.on('login', (username) => {
        onlineUsers[socket.id] = username;
        io.emit('update-online-count', Object.keys(onlineUsers).length);
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
        const msgData = { ...data, time };
        
        if (!chatHistories[data.room]) chatHistories[data.room] = [];
        chatHistories[data.room].push(msgData);
        if (chatHistories[data.room].length > 100) chatHistories[data.room].shift();

        io.to(data.room).emit('chat-message', msgData);
    });

    socket.on('disconnect', () => {
        delete onlineUsers[socket.id];
        io.emit('update-online-count', Object.keys(onlineUsers).length);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));