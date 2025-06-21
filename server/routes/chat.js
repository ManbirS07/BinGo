import express from 'express'
import { handleChat, getChatHistory, clearChatHistory } from '../controllers/chatController.js'

export default (genAI) => {
  const router = express.Router()
  router.post('/', handleChat(genAI))
  router.get('/:sessionId', getChatHistory)
  router.delete('/:sessionId', clearChatHistory)
  return router
}