import express from 'express'
import { handleImageAnalysis } from '../controllers/imageController.js'

export default (genAI) => {
  const router = express.Router()
  router.post('/', handleImageAnalysis(genAI))
  return router
}