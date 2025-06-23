import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { GoogleGenerativeAI } from '@google/generative-ai'
import chatRoutes from './routes/chat.js'
import analyzeImageRoutes from './routes/analyzeImage.js'
import dustbinRoutes from './routes/dustbin.js'
// import dailyQuizRoutes from './routes/dailyQuizRoutes.js';
dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err))

// Routes
app.use('/api/chat', chatRoutes(genAI))
app.use('/api/analyze-image', analyzeImageRoutes(genAI))
app.use('/api/dustbins', dustbinRoutes)

// app.use('/api', dailyQuizRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'BinGo Assistant API is running',
    timestamp: new Date().toISOString(),
    gemini_configured: !!process.env.GOOGLE_API_KEY,
    mongodb_connected: mongoose.connection.readyState === 1
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error)
  
  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' })
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field.' })
  }
  
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})


const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`BinGo Assistant API ready`)
  console.log(`Dustbin mapping feature enabled`)
})