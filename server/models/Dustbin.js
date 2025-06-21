import mongoose from 'mongoose'

const dustbinSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  address: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String, // Base64 encoded image or URL
    required: true
  },
  addedBy: {
    type: String,
    required: true // User ID or identifier
  },
  addedByName: {
    type: String,
    default: 'Anonymous'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'reported'],
    default: 'active'
  },
  verified: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  reports: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Create geospatial index for location-based queries
dustbinSchema.index({ location: '2dsphere' })

export default mongoose.model('Dustbin', dustbinSchema)