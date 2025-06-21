import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  sessionId: String,
  messages: [{
    role: { type: String, enum: ['user', 'model', 'system'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Chat', chatSchema)