require('dotenv').config()

// 1. 引入 express
const express = require('express');
const mongoose = require('mongoose');
const itemRoutes = require('./routes/itemRoutes');
const chatRoutes = require('./routes/chatRoutes');
const cors = require('cors');
const multer = require('multer');
const http = require('http'); // 引入 Node.js 内置的 http 模块
const { Server } = require("socket.io"); // 引入 Socket.IO 的 Server 类
const Message = require('./models/message'); // 引入 Message 模型

// 2. 创建应用对象
const app = express();
app.use(cors());
const server = http.createServer(app); 

// 3. 定义一个端口号
const port = 3001; // 前端React/Vue项目默认经常使用3000

const path = require('path');

// 4. 初始化 Socket.IO，并配置 CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // 指定前端的 URL
    methods: ["GET", "POST"]
  }
});

// 5. 设置 Socket.IO 的连接监听逻辑
io.on('connection', (socket) => {
  console.log('一个用户已连接:', socket.id);

  // 监听 'joinRoom' 事件
  // 当前端用户点开某个物品的聊天窗口时，会发送这个事件
  socket.on('joinRoom', (itemId) => {
    socket.join(itemId);
    console.log(`Socket ${socket.id} 进入聊天: ${itemId}`);
  });

  // 监听 'sendMessage' 事件
  // 当前端用户发送消息时
  socket.on('sendMessage', async (data) => {
    try {
      const { conversationId, senderAddress, receiverAddress, content } = data;
      
      // a. 将消息保存到数据库
      const newMessage = new Message({
        conversationId,
        senderAddress,
        receiverAddress,
        content
      });
      const savedMessage = await newMessage.save();

      // b. 将保存后的消息广播给房间里的所有人（包括发送者自己）
      io.to(conversationId).emit('newMessage', savedMessage);
      
    } catch (error) {
      console.error('处理消息时出错:', error);
      // 也可以向发送者单独发送一个错误事件
      socket.emit('messageError', { message: '消息发送失败' });
    }
  });

  // 监听断开连接事件
  socket.on('disconnect', () => {
    console.log('一个用户已断开连接:', socket.id);
  });
});

// 中间件，解析 JSON 请求体
app.use(express.json());

// 访问 http://localhost:3001/uploads/img.jpg 就可以拿到图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 访问 http://localhost:3001/metadata/1.json 就可以拿到元数据
app.use('/metadata', express.static(path.join(__dirname, 'metadata')));

app.use('/api', itemRoutes);
app.use('/api', chatRoutes);

app.use((err, req, res, next) => {
  // 检查错误是否是 Multer 抛出的
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: '文件太大！图片大小不能超过 5MB。'
      });
    }
  } else if (err) {
    // 捕获我们在 fileFilter 中自定义的错误
    if (err.message) {
      return res.status(400).json({ message: err.message });
    }
  }

  // 如果不是我们预期的错误，交给 Express 的默认处理器
  next(err);
});

// --- 连接 MongoDB ---
const dbURI = 'mongodb://localhost:27017/lost-and-found';

mongoose.connect(dbURI)
  .then((result) => {
    console.log('成功连接到 MongoDB 数据库');
    // 只有当数据库连接成功后，才启动服务器
    server.listen(port, () => {
      console.log(`Socket.IO 与服务器正在 http://localhost:${port} 上运行`);
    });
  })
  .catch((err) => {
    console.log('Failed to connect to MongoDB database:', err);
  });
// --------------------

// 当有人访问服务器的根路径 (/) 时，执行回调函数
app.get('/', (req, res) => {
  res.send('The server for Lost & Found is running...');
});