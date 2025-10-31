const express = require('express');
const { ethers } = require('ethers');
const Item = require('../models/item');
const Message = require('../models/message'); // 引入 Message 模型

const router = express.Router();

// GET /items/:id/messages - 获取特定物品下的所有聊天记录
router.get('/items/:id/messages', async (req, res) => {
  const { id: itemId } = req.params;
  const { userAddress, signature, signatureMessage } = req.query; // 通过查询参数获取签名

  // --- 安全验证 ---
  // 1. 检查签名，确保请求者是合法的
  if (!userAddress || !signature || !signatureMessage) {
    return res.status(403).json({ message: '缺少身份验证签名' });
  }
  let recoveredAddress;
  try {
    recoveredAddress = ethers.verifyMessage(signatureMessage, signature);
  } catch (e) {
    return res.status(400).json({ message: '签名格式无效' });
  }
  if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
    return res.status(403).json({ message: '签名验证失败' });
  }

  // 2. 检查用户是否有权查看该聊天记录
  try {
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: '未找到物品' });
    }
    
    const finder = item.finderAddress.toLowerCase();
    const appliers = item.claims.map(c => c.applierAddress.toLowerCase());

    // 只有物品的拾取者和所有申请者才有权查看聊天记录
    if (userAddress.toLowerCase() !== finder && !appliers.includes(userAddress.toLowerCase())) {
        return res.status(403).json({ message: '你无权查看此对话' });
    }

    // 3. 验证通过，获取消息
    const messages = await Message.find({ conversationId: itemId }).sort({ createdAt: 'asc' });
    res.status(200).json({ message: '成功获取历史消息', data: messages });

  } catch (err) {
    res.status(500).json({ message: '服务器内部错误', error: err });
  }
});

module.exports = router;