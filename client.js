const WebSocket = require('ws');

// 建立 WebSocket 連線
const ws = new WebSocket('ws://localhost:5000');

// 連線建立時的事件處理
ws.on('open', () => {
  console.log('已連線至 WebSocket 伺服器！');
  
  // 傳送訊息給伺服器
  ws.send('Hello WebSocket Server!');
});

// 接收伺服器傳來的訊息
ws.on('message', (message) => {
  console.log(`收到伺服器訊息：${message}`);
});

// 連線關閉時的事件處理
ws.on('close', () => {
  console.log('連線已關閉！');
});
