import express from 'express';
import { getDailyQuiz, submitDailyQuiz } from '../controllers/dailyQuizController.js';
import authMiddleware from '../middleware/auth.js'; // your existing auth middleware

const router = express.Router();

// GET today’s quiz with attempt info
router.get('/daily-quiz', authMiddleware, getDailyQuiz);

// POST answers to quiz
router.post('/daily-quiz/submit', authMiddleware, submitDailyQuiz);

export default router;
