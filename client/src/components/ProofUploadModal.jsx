import React, { useState } from 'react'
import { completeMission } from '../services/MissionsService'

const ProofUploadModal = ({ isOpen, onClose, mission, userId }) => {
  const [proof, setProof] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async () => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', proof)
    formData.append('upload_preset', 'BinGo_CodePaglus')

    const res = await fetch('https://api.cloudinary.com/v1_1/dgclo6bft/image/upload', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    await completeMission(mission._id, userId, data.secure_url)
    setUploading(false)
    onClose()
    window.location.reload()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-red-600 font-bold text-xl">×</button>
        <h2 className="text-xl font-bold mb-4 text-green-600">Upload Proof for "{mission.title}"</h2>

        <input type="file" accept="image/*" onChange={(e) => setProof(e.target.files[0])} className="mb-4" />

        <button
          onClick={handleSubmit}
          disabled={!proof || uploading}
          className="bg-green-600 text-white px-6 py-2 rounded-full w-full hover:bg-green-700 transition"
        >
          {uploading ? 'Uploading...' : 'Submit Proof'}
        </button>
      </div>
    </div>
  )
}

export default ProofUploadModal
