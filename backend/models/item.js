// backend/models/item.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const claimSchema = new Schema({
  applierAddress: { type: String, required: true },
  secretMessage: { type: String, required: true },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true }); // 'createdAt' 会告诉我们申请提交的时间

const itemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  
  // [!! 关键 !!] 谁捡到的 (来自前端 useEthers)
  finderAddress: { type: String, required: true, index: true }, 
  
  // [!! 关键 !!] 图片在服务器上的 URL
  imageUrl: { type: String, required: true }, 
  
  // [!! 关键 !!] 元数据在服务器上的 URL
  metadataUrl: { type: String, required: true },
  
  // [!! 关键 !!] 链上的 Token ID
  tokenId: { type: String, unique: true, sparse: true }, 

  // 物品状态
  status: {
    type: String,
    enum: ['available', 'pending_handover', 'claimed'], // 'available' (可认领), 'pending_handover' (等待交接), 'claimed' (已认领)
    default: 'available'
  },
  
  // (可选) 认领者
  losterAddress: { type: String },
  
  claims: [claimSchema]

}, { timestamps: true }); // timestamps 会自动添加 createdAt 和 updatedAt 字段

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
