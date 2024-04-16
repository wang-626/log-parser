const WebSocket = require('ws');


let connects = []
// 建立 WebSocket 伺服器
const wss = new WebSocket.Server({ port: 5000 });

const data_parse = (data) => {
  try {
    json_data = JSON.parse(data)
    switch (json_data['cmd']) {
      case 'new_log':
        return JSON.stringify(json_data)
    }
    return false
  }
  catch (error) {
    console.log("error:", error);
    return false
  }

}

// 監聽連線事件
wss.on('connection', (ws) => {
  console.log('有新的連線！');
  connects.push(ws)

  // 接收客戶端傳來的訊息
  ws.on('message', (message) => {
    send_data = data_parse(message)

    if (send_data) {
      connects.forEach((ws) => {
        ws.send(send_data)
      })
    }


  });

  // 送出訊息給客戶端
  ws.send('歡迎連線至 WebSocket 伺服器！');
});

console.log('WebSocket 伺服器已啟動，監聽埠號 5000...');
