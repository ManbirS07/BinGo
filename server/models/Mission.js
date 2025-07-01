import mongoose from 'mongoose'

const missionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tags: [String],
  reward: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'emerald'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requirements: {
    minStreak: Number,
    prerequisiteMissions: [Number]
  }
}, {
  timestamps: true
})

export default mongoose.model('Mission', missionSchema)

// Default missions data
export const DEFAULT_MISSIONS = [
  {
    id: 1,
    title: "Dispose Waste",
    description: "Dispose of at least 3 pieces of litter in a public bin and upload a photo as proof of your eco-action.",
    tags: ["Waste", "Action", "Photo"],
    reward: 25,
    category: "Waste Disposal",
    color: "emerald"
  },
  {
    id: 2,
    title: "Suggest Bin",
    description: "Suggest a new location for a public waste bin in your area to help keep the community clean.",
    tags: ["Community", "Suggestion"],
    reward: 15,
    category: "Suggest Bin",
    color: "blue"
  },
  {
    id: 3,
    title: "3-Day Streak",
    description: "Dispose waste for 3 consecutive days to earn a streak badge and build a sustainable habit.",
    tags: ["Streak", "Habit", "Badge"],
    reward: 50,
    category: "Streaks",
    color: "amber",
    requirements: {
      minStreak: 3
    }
  },
  {
    id: 4,
    title: "Sort Waste",
    description: "Sort your household waste into recyclables and non-recyclables and upload a photo of your sorting.",
    tags: ["Sorting", "Recycling", "Photo"],
    reward: 20,
    category: "Sorting",
    color: "purple"
  }
]