// controllers/dailyQuizController.js
import QuestionBank from '../models/QuestionBank.js';
import UserQuizAttempt from '../models/UserQuizAttempt.js';
import { getISTDateString, getDaysSinceBase } from '../Utils/dateUtils.js';

const BASE_DATE = '2025-06-23'; // quiz launch date, Day 0

export const getDailyQuiz = async (req, res) => {
  try {
    // 1. Identify user
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 2. Compute today date in IST
    const todayDate = getISTDateString(); // e.g., "2025-06-23"

    // 3. Check if user already attempted
    const existingAttempt = await UserQuizAttempt.findOne({ userId, date: todayDate });
    const attempted = Boolean(existingAttempt);
    const previousScore = existingAttempt ? existingAttempt.score : null;
    const previousPoints = existingAttempt ? existingAttempt.pointsEarned : null;

    // 4. Fetch all questions
    const allQuestions = await QuestionBank.find().lean();
    const totalQuestions = allQuestions.length;
    if (totalQuestions === 0) {
      return res.status(404).json({ message: 'Question bank is empty' });
    }

    // 5. Compute rotation
    const daysSince = getDaysSinceBase(BASE_DATE);
    const itemsPerDay = 5;
    const startIndex = (daysSince * itemsPerDay) % totalQuestions;

    // 6. Pick 5 questions with wrap-around
    const quizQuestions = [];
    for (let i = 0; i < itemsPerDay; i++) {
      const idx = (startIndex + i) % totalQuestions;
      const q = allQuestions[idx];
      // Exclude correctAnswer field when sending to frontend? 
      // Actually we need correctAnswer only for scoring. But we don’t send correctAnswer to client.
      // So strip it here.
      quizQuestions.push({
        _id: q._id,
        question: q.question,
        options: q.options
      });
    }

    // 7. Respond with questions and attempt info
    return res.json({
      date: todayDate,
      attempted,
      previousScore,
      previousPoints,
      questions: quizQuestions
    });
  } catch (err) {
    console.error('getDailyQuiz error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
// controllers/dailyQuizController.js (continued)
import User from '../models/User.js';

export const submitDailyQuiz = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { answers } = req.body;
    // answers: array of selected indices, length should be 5

    // 1. Compute today date in IST
    const todayDate = getISTDateString();

    // 2. Prevent multiple attempts
    const existingAttempt = await UserQuizAttempt.findOne({ userId, date: todayDate });
    if (existingAttempt) {
      return res.status(400).json({ message: 'Already attempted today' });
    }

    // 3. Fetch all questions to reconstruct today’s questions and correct answers
    const allQuestions = await QuestionBank.find().lean();
    const totalQuestions = allQuestions.length;
    if (totalQuestions === 0) {
      return res.status(404).json({ message: 'Question bank is empty' });
    }

    // 4. Compute rotation same as getDailyQuiz
    const daysSince = getDaysSinceBase(BASE_DATE);
    const itemsPerDay = 5;
    const startIndex = (daysSince * itemsPerDay) % totalQuestions;

    const quizQuestions = [];
    for (let i = 0; i < itemsPerDay; i++) {
      const idx = (startIndex + i) % totalQuestions;
      quizQuestions.push(allQuestions[idx]);
    }

    // 5. Score calculation
    let score = 0;
    for (let i = 0; i < itemsPerDay; i++) {
      const userAns = answers[i];
      const correctIdx = quizQuestions[i].correctAnswer;
      if (typeof userAns === 'number' && userAns === correctIdx) {
        score++;
      }
    }

    // 6. Points logic, e.g., 2 points per correct
    const pointsPerCorrect = 2;
    const pointsEarned = score * pointsPerCorrect;

    // 7. Store attempt
    await UserQuizAttempt.create({
      userId,
      date: todayDate,
      score,
      total: itemsPerDay,
      pointsEarned
    });

    // 8. Update user points
    await User.findByIdAndUpdate(userId, { $inc: { points: pointsEarned } });

    // 9. Respond with result
    return res.json({
      message: `You scored ${score}/${itemsPerDay} and earned ${pointsEarned} points!`,
      score,
      total: itemsPerDay,
      pointsEarned
    });
  } catch (err) {
    console.error('submitDailyQuiz error', err);
    // If unique index violation on attempt (race condition), handle:
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Already attempted today' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};
