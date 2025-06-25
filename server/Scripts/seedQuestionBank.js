// scripts/seedQuestionBank.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import QuestionBank from '../models/QuestionBank.js';
import fs from 'fs';
import path from 'path';

dotenv.config(); // load MONGO_URI etc.

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // options if needed
    });
    console.log('Connected to MongoDB for seeding');

    // Read JSON file
    const filePath = path.join(process.cwd(), 'data', 'questionBank.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const questions = JSON.parse(raw);

    // Optionally clear existing:
    await QuestionBank.deleteMany({});
    console.log('Cleared existing QuestionBank');

    // Insert all
    await QuestionBank.insertMany(questions);
    console.log(`Inserted ${questions.length} questions into QuestionBank`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
