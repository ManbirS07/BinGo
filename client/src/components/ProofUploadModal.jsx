import React, { useState } from 'react'
import { Upload, X, Check, Loader2 } from 'lucide-react'

const ProofUploadModal = ({ isOpen, onClose, mission, userId }) => {
  const [proof, setProof] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const completeMission = async (missionId, userId, proofUrl) => {
    // Mock function - replace with actual service call
    console.log('Completing mission:', missionId, userId, proofUrl)
  }

  const handleSubmit = async () => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', proof)
    formData.append('upload_preset', 'BinGo_CodePaglus')

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dgclo6bft/image/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      await completeMission(mission._id, userId, data.secure_url)
      setUploading(false)
      onClose()
      window.location.reload()
    } catch (error) {
      console.error('Upload failed:', error)
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files[0] && files[0].type.startsWith('image/')) {
      setProof(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md relative border border-slate-700/50 backdrop-blur-xl animate-in zoom-in-95 duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 animate-pulse"></div>
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-red-400 transition-all duration-300 hover:rotate-90 hover:scale-110 z-10"
        >
          <X size={24} />
        </button>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Upload Proof
          </h2>
          <p className="text-slate-300 mb-6 opacity-80">
            "{mission?.title || 'Sample Mission'}"
          </p>

          {/* File upload area */}
          <div 
            className={`relative mb-6 p-8 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer group ${
              dragOver 
                ? 'border-emerald-400 bg-emerald-400/10 scale-105' 
                : proof 
                  ? 'border-emerald-500 bg-emerald-500/5' 
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input 
              id="file-input"
              type="file" 
              accept="image/*" 
              onChange={(e) => setProof(e.target.files[0])} 
              className="hidden"
            />
            
            <div className="flex flex-col items-center text-center">
              {proof ? (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-medium">{proof.name}</p>
                  <p className="text-slate-400 text-sm mt-1">Ready to upload</p>
                </div>
              ) : (
                <div className="animate-in slide-in-from-top-4 duration-300">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                    dragOver ? 'bg-emerald-500/30 scale-110' : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                  }`}>
                    <Upload className={`w-8 h-8 transition-all duration-300 ${
                      dragOver ? 'text-emerald-300 scale-110' : 'text-slate-400 group-hover:text-slate-300'
                    }`} />
                  </div>
                  <p className="text-slate-300 font-medium mb-1">
                    {dragOver ? 'Drop your image here' : 'Choose image or drag & drop'}
                  </p>
                  <p className="text-slate-500 text-sm">PNG, JPG, or WEBP</p>
                </div>
              )}
            </div>

            {/* Animated border glow effect */}
            <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
              dragOver ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 animate-pulse"></div>
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!proof || uploading}
            className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform relative overflow-hidden ${
              !proof || uploading
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]'
            }`}
          >
            {/* Button background glow */}
            {!uploading && proof && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 animate-pulse rounded-xl"></div>
            )}
            
            <div className="relative flex items-center justify-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Submit Proof</span>
                </>
              )}
            </div>
          </button>

          {/* Progress indicator */}
          {uploading && (
            <div className="mt-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProofUploadModal