import express from 'express'
import Mission from '../models/Mission.js'
import UserMission from '../models/UserMission.js'

const router = express.Router()

// Get all missions
router.get('/missions', async (req, res) => {
  const missions = await Mission.find()
  res.json(missions)
})

// Get user missions
router.get('/user-missions/:userId', async (req, res) => {
  const userMissions = await UserMission.find({ userId: req.params.userId })
  res.json(userMissions)
})

// Join a mission
router.post('/join-mission', async (req, res) => {
  const { userId, missionId } = req.body
  const exists = await UserMission.findOne({ userId, missionId })
  if (!exists) {
    await UserMission.create({ userId, missionId, completed: false })
  }
  res.json({ success: true })
})

// Complete a mission
router.post('/complete-mission', async (req, res) => {
  const { userId, missionId, proofUrl } = req.body
  await UserMission.findOneAndUpdate(
    { userId, missionId },
    { completed: true, proofUrl, completedAt: new Date() }
  )
  res.json({ success: true })
})

export default router