import mongoose from 'mongoose'
const UserMissionSchema = new mongoose.Schema({
  userId: String,
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission' },
  completed: Boolean,
  proofUrl: String,
  completedAt: Date
})
export default mongoose.model('UserMission', UserMissionSchema)