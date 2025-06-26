import express from 'express';
import { getDailyQuestions, submitDailyAnswers } from '../controllers/dailyQuest.js';
import { withAuth } from '@clerk/clerk-sdk-node';

const router = express.Router();

router.get('/', withAuth(getDailyQuestions));
router.post('/', withAuth(submitDailyAnswers));
router.get('/test', (req, res) => res.json({ ok: true }));
export default router;