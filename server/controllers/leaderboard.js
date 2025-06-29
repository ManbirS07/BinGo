// controllers/leaderboardController.js
import User from '../models/User.js'

export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({}, 'name profileImage totalPoints level')
      .sort({ totalPoints: -1 })

    res.json({ users })
  } catch (err) {
    console.error('Leaderboard error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}
