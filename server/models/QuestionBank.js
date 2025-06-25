import mongoose from 'mongoose';

const questionBankSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true }, 
  correctAnswer: { type: Number, required: true } 
}, { timestamps: true });


export default mongoose.model('QuestionBank', questionBankSchema);
