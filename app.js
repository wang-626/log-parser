const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

require('dotenv').config();
const app = express();

app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'ntut.html'));
});

app.get('/hk', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'hk.html'));
});

app.get('/hk-old', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'hk-old.html'));
});

app.post('/command', (req, res) => {

  const cmd = req.body.cmd;
  const command = process.env.PYTHON_COMMAND + cmd + " -p " + process.env.COM_PORT

  exec(command , (error, stdout, stderr) => {
    if (error) {
      console.error(`执行 Python 命令时发生错误： ${error}`);
      res.status(500).json({ error: `执行 Python 命令时发生错误： ${error}` });
      return;
    }
  
    console.log('Python 命令输出：');
    console.log(stdout);
  
    console.error('Python 命令错误输出：');
    console.error(stderr);

    res.status(200).json({ stdout, stderr });
  });
});

console.log(`server run in http://127.0.0.1:${process.env.WEB_PORT}`);
app.listen(process.env.WEB_PORT);