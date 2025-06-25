import mongoose from 'mongoose';

const userQuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, 
  score: { type: Number, required: true },
  total: { type: Number, required: true }, 
  pointsEarned: { type: Number, required: true }
}, { timestamps: true });


userQuizAttemptSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('UserQuizAttempt', userQuizAttemptSchema);
