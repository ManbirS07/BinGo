import mongoose from 'mongoose'

const missionProgressSchema = new mongoose.Schema({
  missionId: {
    type: Number,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  proofUrl: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date,
    default: null
  },
  pointsEarned: {
    type: Number,
    default: 0
  }
})

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  missions: [missionProgressSchema],
  achievements: [{
    id: String,
    name: String,
    description: String,
    earnedAt: Date,
    icon: String
  }],
  streakData: {
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastCompletionDate: {
      type: Date,
      default: null
    }
  },
  statistics: {
    totalMissionsCompleted: {
      type: Number,
      default: 0
    },
    wasteDisposed: {
      type: Number,
      default: 0
    },
    binsRecommended: {
      type: Number,
      default: 0
    },
    wasteSorted: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
})

// Calculate user level based on points
userSchema.methods.calculateLevel = function() {
  const pointsForNextLevel = 100 // Points needed for each level
  this.level = Math.floor(this.totalPoints / pointsForNextLevel) + 1
  return this.level
}

// Add points and update level
userSchema.methods.addPoints = function(points) {
  this.totalPoints += points
  this.calculateLevel()
  return this.totalPoints
}

// User.js (updated parts)
// Update streak method
userSchema.methods.updateStreak = function() {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to midnight
  
  if (!this.streakData) {
    this.streakData = {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null
    }
  }
  
  const lastCompletion = this.streakData.lastCompletionDate
    ? new Date(this.streakData.lastCompletionDate)
    : null
  
  if (lastCompletion) {
    lastCompletion.setHours(0, 0, 0, 0)
  }
  
  // If already completed today, return current streak
  if (lastCompletion && lastCompletion.getTime() === today.getTime()) {
    return this.streakData.currentStreak
  }
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  if (!lastCompletion || lastCompletion.getTime() < yesterday.getTime()) {
    // Reset streak if not consecutive
    this.streakData.currentStreak = 1
  } else if (lastCompletion.getTime() === yesterday.getTime()) {
    // Increment streak if consecutive
    this.streakData.currentStreak += 1
  }
  
  // Update longest streak if needed
  if (this.streakData.currentStreak > this.streakData.longestStreak) {
    this.streakData.longestStreak = this.streakData.currentStreak
  }
  
  this.streakData.lastCompletionDate = today
  return this.streakData.currentStreak
}

export default mongoose.model('User', userSchema)