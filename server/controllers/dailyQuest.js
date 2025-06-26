// controllers/dailyQuest.js
import Question from '../models/QuestionBank.js';
import User     from '../models/User.js';

const START_DATE = new Date('2025-01-01'); // pivot for rotating batches

export async function getDailyQuestions(req, res) {
   console.log('getDailyQuestions called');
  console.log('req.auth:', req.auth);
  const clerkId = req.auth.userId;
  const user = await User.findOne({ clerkId });
  if (!user) return res.status(404).send('User not found');

  // normalize dates to midnight
  const today = new Date(); today.setHours(0,0,0,0);
  if (user.lastDailyQuestDate && user.lastDailyQuestDate.getTime() === today.getTime()) {
    return res.status(403).json({ message: 'Already attempted today.' });
  }

  // compute batch index
  const diffDays = Math.floor((today - START_DATE) / 86400000);
  const totalQs  = await Question.countDocuments();
  const batchSize = 5;
  const batchCount = Math.ceil(totalQs / batchSize);
  const batchIndex = diffDays % batchCount;
  const skip = batchIndex * batchSize;

  const questions = await Question
    .find({})
    .skip(skip)
    .limit(batchSize)
    .select('question options')    // don’t send correctAnswer
    .lean();

  res.json({ questions });
}

export async function submitDailyAnswers(req, res) {
  const { answers } = req.body; // e.g. [1,0,3,2,1]
  const clerkId = req.auth.userId;
  const user = await User.findOne({ clerkId });
  if (!user) return res.status(404).send('User not found');

  const today = new Date(); today.setHours(0,0,0,0);
  if (user.lastDailyQuestDate && user.lastDailyQuestDate.getTime() === today.getTime()) {
    return res.status(403).json({ message: 'Already submitted today.' });
  }

  // fetch same batch of questions
  const diffDays   = Math.floor((today - START_DATE) / 86400000);
  const totalQs    = await Question.countDocuments();
  const batchSize  = 5;
  const batchCount = Math.ceil(totalQs / batchSize);
  const batchIndex = diffDays % batchCount;
  const skip       = batchIndex * batchSize;
  const qsBatch    = await Question.find({}).skip(skip).limit(batchSize);

  // calculate score
  let score = 0;
  qsBatch.forEach((q, i) => {
    if (answers[i] === q.correctAnswer) score++;
  });

  // update user
  user.totalPoints += score;
  user.calculateLevel();            // your existing method
  user.lastDailyQuestDate = today;
  await user.save();

  res.json({ score, totalPoints: user.totalPoints });
}
