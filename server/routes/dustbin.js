import express from 'express'
import Dustbin from '../models/Dustbin.js'
import multer from 'multer'

const router = express.Router({ strict: true })

// Configure multer for image upload
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'), false)
    }
  }
})

// Get all dustbins within a radius
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query // radius in meters, default 5km

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' })
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    const searchRadius = parseInt(radius)

    if (isNaN(latitude) || isNaN(longitude) || isNaN(searchRadius)) {
      return res.status(400).json({ error: 'Invalid coordinates or radius' })
    }

    const dustbins = await Dustbin.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: searchRadius
        }
      },
      status: 'active'
    }).sort({ createdAt: -1 })

    res.json(dustbins)
  } catch (error) {
    console.error('Error fetching nearby dustbins:', error)
    res.status(500).json({ error: 'Failed to fetch dustbins' })
  }
})

// Get all dustbins (for map view)
router.get('/', async (req, res) => {
  try {
    const dustbins = await Dustbin.find({ status: 'active' }).sort({ createdAt: -1 })
    res.json(dustbins)
  } catch (error) {
    console.error('Error fetching dustbins:', error)
    res.status(500).json({ error: 'Failed to fetch dustbins' })
  }
})

// Add new dustbin
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { lat, lng, address, description, addedBy, addedByName } = req.body

    if (!lat || !lng || !address || !addedBy) {
      return res.status(400).json({ error: 'Latitude, longitude, address, and addedBy are required' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' })
    }

    // Convert image to base64
    const imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

    const dustbin = new Dustbin({
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      },
      address,
      description: description || '',
      image: imageBase64,
      addedBy,
      addedByName: addedByName || 'Anonymous'
    })

    await dustbin.save()
    res.status(201).json(dustbin)
  } catch (error) {
    console.error('Error adding dustbin:', error)
    res.status(500).json({ error: 'Failed to add dustbin' })
  }
})

// Delete dustbin (only by the user who added it)
router.delete('/:dustbinId', async (req, res) => {
  try {
    const { dustbinId } = req.params
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (!dustbinId || dustbinId.length !== 24) {
      return res.status(400).json({ error: 'Invalid dustbin ID' })
    }

    const dustbin = await Dustbin.findById(dustbinId)
    
    if (!dustbin) {
      return res.status(404).json({ error: 'Dustbin not found' })
    }

    if (dustbin.addedBy !== userId) {
      return res.status(403).json({ error: 'You can only delete dustbins you added' })
    }

    await Dustbin.findByIdAndDelete(dustbinId)
    res.json({ message: 'Dustbin deleted successfully' })
  } catch (error) {
    console.error('Error deleting dustbin:', error)
    res.status(500).json({ error: 'Failed to delete dustbin' })
  }
})

// Like a dustbin
router.post('/:dustbinId/like', async (req, res) => {
  try {
    const { dustbinId } = req.params
    
    if (!dustbinId || dustbinId.length !== 24) {
      return res.status(400).json({ error: 'Invalid dustbin ID' })
    }
    
    const dustbin = await Dustbin.findByIdAndUpdate(
      dustbinId,
      { $inc: { likes: 1 } },
      { new: true }
    )
    
    if (!dustbin) {
      return res.status(404).json({ error: 'Dustbin not found' })
    }
    
    res.json(dustbin)
  } catch (error) {
    console.error('Error liking dustbin:', error)
    res.status(500).json({ error: 'Failed to like dustbin' })
  }
})

// Report a dustbin
router.post('/:dustbinId/report', async (req, res) => {
  try {
    const { dustbinId } = req.params
    
    if (!dustbinId || dustbinId.length !== 24) {
      return res.status(400).json({ error: 'Invalid dustbin ID' })
    }
    
    const dustbin = await Dustbin.findByIdAndUpdate(
      dustbinId,
      { $inc: { reports: 1 } },
      { new: true }
    )
    
    if (!dustbin) {
      return res.status(404).json({ error: 'Dustbin not found' })
    }
    
    // Auto-hide if too many reports
    if (dustbin.reports >= 5) {
      dustbin.status = 'reported'
      await dustbin.save()
    }
    
    res.json(dustbin)
  } catch (error) {
    console.error('Error reporting dustbin:', error)
    res.status(500).json({ error: 'Failed to report dustbin' })
  }
})

export default router