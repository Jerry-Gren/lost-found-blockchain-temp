// backend/index.js
require('dotenv').config()

const express = require('express');
const mongoose = require('mongoose');
const itemRoutes = require('./routes/itemRoutes');
const cors = require('cors');
const path = require('path'); // [!! 1. 引入 path !!]

const app = express();
const port = 3001; 

// 启用 CORS
app.use(cors());

// 解析 JSON 请求体
app.use(express.json());

// [!! 2. 新增：配置静态文件服务 !!]
// 这样 http://localhost:3001/uploads/image.jpg 就能访问到图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 这样 http://localhost:3001/metadata/1.json 就能访问到元数据
app.use('/metadata', express.static(path.join(__dirname, 'metadata')));


// --- 连接 MongoDB ---
const dbURI = 'mongodb://localhost:27017/lost-and-found'; // 确保你的 DB 名字正确
mongoose.connect(dbURI)
  .then((result) => {
    console.log('成功连接到 MongoDB 数据库');
    app.listen(port, () => {
      console.log(`服务器正在 http://localhost:${port} 上运行`);
    });
  })
  .catch((err) => {
    console.log('Failed to connect to MongoDB database:', err);
  });
// --------------------

app.get('/', (req, res) => {
  res.send('The server for Lost & Found is running...');
});

// [!! 3. 路由 (保持不变) !!]
app.use('/api', itemRoutes);
