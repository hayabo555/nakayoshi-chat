const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let onlineCount = 0;
let chatHistory = []; // 📝 メッセージ履歴を保存する配列
const MAX_HISTORY = 100; // 最大100件まで保存（サーバーのメモリ節約のため）

io.on('connection', (socket) => {
    onlineCount++;
    io.emit('update-online-count', onlineCount);

    // 📥 新しく入った人に過去の履歴を全部送る
    socket.emit('load-history', chatHistory);

    socket.on('chat-message', (data) => {
        const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        const msgData = { ...data, time };

        // 履歴に追加
        chatHistory.push(msgData);
        if (chatHistory.length > MAX_HISTORY) chatHistory.shift(); // 古い順に削除

        io.emit('chat-message', msgData); 
    });

    socket.on('disconnect', () => {
        onlineCount--;
        io.emit('update-online-count', onlineCount);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));