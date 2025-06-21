// backend/seed.js
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Mission from './models/Mission.js'

dotenv.config()
await mongoose.connect(process.env.MONGO_URI)

await Mission.deleteMany({})
await Mission.insertMany([
  {
    title: "Dispose Waste",
    description: "Dispose of at least 3 pieces of litter in a public bin and upload a photo as proof.",
    tags: ["Waste", "Action", "Photo"],
    reward: 25,
    category: "Waste Disposal"
  },
  {
    title: "Suggest Bin",
    description: "Suggest a new location for a public waste bin in your area.",
    tags: ["Community", "Suggestion"],
    reward: 15,
    category: "Suggest Bin"
  },
  {
    title: "3-Day Streak",
    description: "Dispose waste for 3 consecutive days to earn a streak badge.",
    tags: ["Streak", "Habit", "Badge"],
    reward: 50,
    category: "Streaks"
  },
  {
    title: "Sort Waste",
    description: "Sort your household waste into recyclables and non-recyclables and upload a photo.",
    tags: ["Sorting", "Recycling", "Photo"],
    reward: 20,
    category: "Sorting"
  }
])
console.log('Missions seeded!')
process.exit()