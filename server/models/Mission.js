import mongoose from 'mongoose'
const MissionSchema = new mongoose.Schema({
  title: String,
  description: String,
  tags: [String],
  reward: Number,
  category: String
})
export default mongoose.model('Mission', MissionSchema)