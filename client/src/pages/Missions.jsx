import React, { useEffect, useState, useRef } from 'react'
import { GiftIcon, TrophyIcon, CameraIcon, MapPinIcon, ScanIcon, CheckCircle2Icon, Loader2Icon, InfoIcon, SparklesIcon, StarIcon, AlertTriangleIcon, XCircleIcon, CheckIcon } from 'lucide-react'
import clsx from 'clsx'
import Webcam from 'react-webcam'
import { useUser } from '@clerk/clerk-react'
import { verifyFace } from '../utils/verifyFace'

const CLOUDINARY_UPLOAD_PRESET = 'BinGo_CodePaglus'
const CLOUDINARY_CLOUD_NAME = 'dgclo6bft'
const BACKEND_URL = 'http://127.0.0.1:5000'

const missionIcons = {
  "Dispose Waste": <CameraIcon className="w-6 h-6 text-pink-400" />,
  "Suggest Bin": <MapPinIcon className="w-6 h-6 text-blue-400" />,
  "3-Day Streak": <TrophyIcon className="w-6 h-6 text-yellow-300" />,
  "Sort Waste": <ScanIcon className="w-6 h-6 text-green-300" />,
}

const statusColors = {
  not_joined: 'bg-gray-500 text-gray-100',
  joined: 'bg-yellow-500 text-yellow-100',
  completed: 'bg-green-600 text-green-100'
}

const funFacts = [
  "Recycling one aluminum can saves enough energy to run a TV for 3 hours.",
  "Plastic can take up to 1,000 years to decompose in landfills.",
  "Composting food waste reduces methane emissions from landfills.",
  "Suggesting new bin locations helps keep your city cleaner!",
  "Every small action counts towards a greener planet.",
  "AI detection helps prevent fake submissions and ensures authentic eco-actions.",
  "Our duplicate detection system ensures fair play for all users."
]

const MOCK_MISSIONS = [
  {
    id: 1,
    title: "Dispose Waste",
    description: "Dispose of at least 3 pieces of litter in a public bin and upload a photo as proof.",
    tags: ["Waste", "Action", "Photo"],
    reward: 25,
    category: "Waste Disposal"
  },
  {
    id: 2,
    title: "Suggest Bin",
    description: "Suggest a new location for a public waste bin in your area.",
    tags: ["Community", "Suggestion"],
    reward: 15,
    category: "Suggest Bin"
  },
  {
    id: 3,
    title: "3-Day Streak",
    description: "Dispose waste for 3 consecutive days to earn a streak badge.",
    tags: ["Streak", "Habit", "Badge"],
    reward: 50,
    category: "Streaks"
  },
  {
    id: 4,
    title: "Sort Waste",
    description: "Sort your household waste into recyclables and non-recyclables and upload a photo.",
    tags: ["Sorting", "Recycling", "Photo"],
    reward: 20,
    category: "Sorting"
  }
]

const todayStr = () => new Date().toISOString().slice(0, 10)

const Missions = () => {
  const { user: clerkUser } = useUser()
  const profileImage = clerkUser?.unsafeMetadata?.profileImage
  const userId = clerkUser?.id || 'mock-user'

  const [userMissions, setUserMissions] = useState(() =>
    MOCK_MISSIONS.map(m => ({
      missionId: m.id,
      completed: false,
      joined: false,
      proofUrl: '',
      completedAt: null
    }))
  )

  const [missions] = useState(MOCK_MISSIONS)
  const [selectedMission, setSelectedMission] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [factIdx, setFactIdx] = useState(0)
  const [proofImage, setProofImage] = useState(null)
  const [useCamera, setUseCamera] = useState(false)
  const webcamRef = useRef(null)
  const [motivation, setMotivation] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const fileInputRef = useRef(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [error, setError] = useState('')
  const [duplicateDetails, setDuplicateDetails] = useState(null)
  const [aiDetectionResult, setAiDetectionResult] = useState(null)
  const [faceVerificationResult, setFaceVerificationResult] = useState(null)
  const [backendHealth, setBackendHealth] = useState('unknown')
  const [stepStatus, setStepStatus] = useState({
    ai: null,
    duplicate: null,
    face: null
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIdx(idx => (idx + 1) % funFacts.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`)
      if (response.ok) {
        setBackendHealth('healthy')
      } else {
        setBackendHealth('unhealthy')
      }
    } catch {
      setBackendHealth('unhealthy')
    }
  }

  const getStatus = (missionId) => {
    const um = userMissions.find(m => m.missionId === missionId)
    if (!um) return 'not_joined'
    if (um.completed) return 'completed'
    if (um.joined) return 'joined'
    return 'not_joined'
  }

  const completedCount = userMissions.filter(m => m.completed).length
  const totalCount = missions.length
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  const handleJoinMission = (mission) => {
    setUserMissions(prev =>
      prev.map(m =>
        m.missionId === mission.id
          ? { ...m, joined: true }
          : m
      )
    )
    setMotivation("Mission joined! Upload your proof to complete it.")
  }

  const handleProofUpload = (mission) => {
    setSelectedMission(mission)
    setShowModal(true)
    setProofImage(null)
    setUseCamera(false)
    setMotivation('')
    setConfirmSubmit(false)
    setUploadStatus('')
    setError('')
    setDuplicateDetails(null)
    setAiDetectionResult(null)
    setFaceVerificationResult(null)
    setStepStatus({ ai: null, duplicate: null, face: null })
  }

  // Sequential check logic
  const handleProofSubmit = async () => {
    setConfirmSubmit(false)
    if (!proofImage) return

    setLoading(true)
    setUploadStatus('Uploading image to cloud storage...')
    setError('')
    setDuplicateDetails(null)
    setAiDetectionResult(null)
    setFaceVerificationResult(null)
    setStepStatus({ ai: null, duplicate: null, face: null })

    try {
      if (backendHealth === 'unhealthy') {
        await checkBackendHealth()
        if (backendHealth === 'unhealthy') {
          throw new Error('Backend service is currently unavailable. Please try again later.')
        }
      }

      // 1. Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', proofImage)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })

      if (!cloudinaryResponse.ok) {
        throw new Error('Failed to upload image to cloud storage. Please try again.')
      }

      const cloudinaryData = await cloudinaryResponse.json()
      const uploadedUrl = cloudinaryData.secure_url

      // Step 1: AI Detection
      setUploadStatus('Running AI detection...')
      setStepStatus(s => ({ ...s, ai: 'loading' }))
      const aiRes = await fetch(`${BACKEND_URL}/analyze_ai_only`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: uploadedUrl })
      })
      const aiData = await aiRes.json()
      setAiDetectionResult({
        isAiGenerated: aiData.ai_generated,
        confidence: aiData.confidence,
        details: aiData.details
      })
      if (aiData.ai_generated && aiData.confidence > 0.7) {
        setStepStatus(s => ({ ...s, ai: 'fail' }))
        setError(`❌ AI-Generated Image Detected!\n\nThis image appears to be artificially generated with ${(aiData.confidence * 100).toFixed(1)}% confidence.\n\nFor fair play, please upload authentic photos of your actual eco-actions.`)
        setUploadStatus('')
        setLoading(false)
        return
      } else {
        setStepStatus(s => ({ ...s, ai: 'pass' }))
        setUploadStatus('AI detection passed. Checking for duplicates...')
      }

      // Step 2: Duplicate Detection
      setStepStatus(s => ({ ...s, duplicate: 'loading' }))
      const dupRes = await fetch(`${BACKEND_URL}/check_duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: uploadedUrl, user_id: userId, mission_id: selectedMission?.id })
      })
      const dupData = await dupRes.json()
      if (dupData.status === "rejected" || dupData.duplicate) {
        setStepStatus(s => ({ ...s, duplicate: 'fail' }))
        const matchDate = dupData.matched_date ? new Date(dupData.matched_date).toLocaleDateString() : 'Unknown'
        const detectionMethod = dupData.method ? dupData.method.toUpperCase() : 'UNKNOWN'
        setDuplicateDetails({
          matchedImage: dupData.matched_image,
          matchedDate: matchDate,
          method: detectionMethod,
          similarity: dupData.similarity
        })
        setError(`🔍 Duplicate Image Detected!\n\nThis image matches one you uploaded on ${matchDate}.\nDetection method: ${detectionMethod}${dupData.similarity ? `\nSimilarity: ${(dupData.similarity * 100).toFixed(1)}%` : ''}\n\nPlease upload a new, unique photo for this mission.`)
        setUploadStatus('')
        setLoading(false)
        return
      } else {
        setStepStatus(s => ({ ...s, duplicate: 'pass' }))
        setUploadStatus('Duplicate check passed. Running face verification...')
      }

      // Step 3: Face Verification (if profile image available)
      if (profileImage) {
        setStepStatus(s => ({ ...s, face: 'loading' }))
        setUploadStatus('Running face verification...')
        const faceResult = await verifyFace(profileImage, proofImage)
        setFaceVerificationResult(faceResult)
        if (faceResult.error) {
          setStepStatus(s => ({ ...s, face: 'fail' }))
          setError(`❌ Face Verification Error: ${faceResult.error}`)
          setUploadStatus('')
          setLoading(false)
          return
        }
        if (faceResult.verified === false) {
          setStepStatus(s => ({ ...s, face: 'fail' }))
          setError(`❌ Face Verification Failed!\n\nThe face in your proof image does not match your profile image.`)
          setUploadStatus('')
          setLoading(false)
          return
        }
        if (faceResult.verified === undefined) {
          setStepStatus(s => ({ ...s, face: 'fail' }))
          setError(`❌ No face detected in one or both images. Please ensure your face is clearly visible.`)
          setUploadStatus('')
          setLoading(false)
          return
        }
        setStepStatus(s => ({ ...s, face: 'pass' }))
        setUploadStatus('Face verification successful!')
      } else {
        setStepStatus(s => ({ ...s, face: 'skip' }))
      }

      // All checks passed
      setUploadStatus('All checks passed! Completing mission...')
      setTimeout(() => {
        setUserMissions(prev =>
          prev.map(m =>
            m.missionId === selectedMission.id
              ? {
                  ...m,
                  completed: true,
                  joined: true,
                  proofUrl: uploadedUrl,
                  completedAt: todayStr()
                }
              : m
          )
        )
        setShowModal(false)
        setShowConfetti(true)
        setMotivation(`🎉 Mission completed successfully! You've earned ${selectedMission.reward} points and made your city cleaner! 🌱`)
        setTimeout(() => setShowConfetti(false), 3000)
      }, 1200)

    } catch (err) {
      setError(`❌ Upload Failed\n\n${err.message}\n\nPlease check your internet connection and try again.`)
    }

    setLoading(false)
    setUploadStatus('')
  }

  const resetModal = () => {
    setProofImage(null)
    setConfirmSubmit(false)
    setError('')
    setUploadStatus('')
    setDuplicateDetails(null)
    setAiDetectionResult(null)
    setFaceVerificationResult(null)
    setStepStatus({ ai: null, duplicate: null, face: null })
  }

  const streakDays = userMissions.find(m => m.missionId === 3 && m.completed)
    ? 3
    : userMissions.find(m => m.missionId === 3 && m.joined)
    ? 2
    : 1

  // Helper for step status
  const renderStepStatus = (label, status) => (
    <div className="flex items-center gap-2 text-sm mb-1">
      {status === 'loading' && <Loader2Icon className="w-4 h-4 animate-spin text-blue-600" />}
      {status === 'pass' && <CheckCircle2Icon className="w-4 h-4 text-green-500" />}
      {status === 'fail' && <XCircleIcon className="w-4 h-4 text-red-500" />}
      {status === 'skip' && <InfoIcon className="w-4 h-4 text-gray-400" />}
      <span className={
        status === 'pass' ? 'text-green-700' :
        status === 'fail' ? 'text-red-700' :
        status === 'loading' ? 'text-blue-700' :
        'text-gray-700'
      }>
        {label}
        {status === 'skip' && ' (skipped)'}
      </span>
    </div>
  )



  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-black to-emerald-900 pt-32 pb-16 px-6 md:px-16">
      <div className="max-w-5xl mx-auto">
        {/* Backend Status Indicator */}
        <div className="fixed top-4 right-4 z-40">
          <div className={clsx(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold",
            backendHealth === 'healthy' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
            backendHealth === 'unhealthy' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
            'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
          )}>
            <div className={clsx(
              "w-2 h-2 rounded-full",
              backendHealth === 'healthy' ? 'bg-green-400' :
              backendHealth === 'unhealthy' ? 'bg-red-400' :
              'bg-yellow-400'
            )} />
            AI Detection: {backendHealth === 'healthy' ? 'Online' : backendHealth === 'unhealthy' ? 'Offline' : 'Checking...'}
          </div>
        </div>

        {/* Profile image */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-400 shadow-2xl bg-white flex items-center justify-center">
            <img
              src={profileImage || '/default-avatar.png'}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
              style={{ aspectRatio: '1/1' }}
            />
          </div>
        </div>

        {/* Welcome and fun fact */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-green-200 mb-2 drop-shadow-lg flex items-center gap-2">
              <TrophyIcon className="w-8 h-8 text-yellow-300" /> Missions
            </h1>
            <p className="text-lg text-gray-200 mb-2">
              Complete eco-missions, earn points, and climb the leaderboard!
            </p>
            <div className="flex items-center gap-2 bg-green-900/40 px-4 py-2 rounded-lg shadow mt-2">
              <InfoIcon className="w-5 h-5 text-green-300 animate-pulse" />
              <span className="text-green-100 font-medium">{funFacts[factIdx]}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
              <GiftIcon className="w-6 h-6 text-yellow-300" />
              <span className="font-semibold text-green-100">Total Rewards: </span>
              <span className="text-yellow-200 font-bold">{userMissions.filter(m => m.completed).reduce((sum, m) => sum + (missions.find(ms => ms.id === m.missionId)?.reward || 0), 0)}</span>
            </div>
            <div className="w-48 bg-white/10 rounded-full h-4 mt-2 relative">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-4 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-white font-bold">{progress}% Complete</span>
            </div>
          </div>
        </div>

        {/* Mission categories */}
        <div className="mb-8 flex flex-wrap gap-4">
          <span className="bg-green-700/60 text-green-100 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
            <CameraIcon className="w-5 h-5" /> Waste Disposal
          </span>
          <span className="bg-blue-700/60 text-blue-100 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
            <MapPinIcon className="w-5 h-5" /> Suggest Bin
          </span>
          <span className="bg-yellow-700/60 text-yellow-100 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
            <TrophyIcon className="w-5 h-5" /> Streaks
          </span>
          <span className="bg-emerald-700/60 text-emerald-100 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
            <ScanIcon className="w-5 h-5" /> Sorting
          </span>
        </div>

        {/* Motivation message */}
        {motivation && (
          <div className="mb-6 flex items-center gap-2 bg-emerald-900/60 px-4 py-3 rounded-lg shadow text-green-200 font-semibold animate-fade-in-up">
            <SparklesIcon className="w-6 h-6 text-yellow-300" />
            {motivation}
          </div>
        )}

        {/* Confetti for completed mission */}
        {showConfetti && (
          <div className="fixed inset-0 z-50 pointer-events-none flex justify-center items-start">
            {[...Array(20)].map((_, i) => (
              <StarIcon
                key={i}
                className="w-8 h-8 text-yellow-300 animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 40 + 10}%`,
                  position: 'absolute',
                  animationDelay: `${Math.random()}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Mission cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {missions.map((mission, idx) => {
            const status = getStatus(mission.id)
            const um = userMissions.find(m => m.missionId === mission.id)
            return (
              <div
                key={mission.id}
                className={clsx(
                  "relative bg-white/10 border border-green-300/20 rounded-2xl p-7 shadow-xl flex flex-col justify-between min-h-[280px] overflow-hidden group transition-all duration-300",
                  status === 'completed' && 'ring-2 ring-green-400/60'
                )}
              >
                {/* Icon */}
                <div className="absolute -top-6 -right-6 opacity-30 group-hover:opacity-60 transition">
                  {missionIcons[mission.title] || <TrophyIcon className="w-16 h-16 text-green-400" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-200 mb-2 flex items-center gap-2">
                    {missionIcons[mission.title] || <TrophyIcon className="w-6 h-6 text-green-400" />}
                    {mission.title}
                  </h2>
                  <p className="text-gray-100 mb-4">{mission.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {mission.tags?.map(tag => (
                      <span key={tag} className="bg-green-700/40 text-green-200 px-2 py-1 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
                    {status === 'not_joined' && 'Not Joined'}
                    {status === 'joined' && 'In Progress'}
                    {status === 'completed' && (
                      <span className="flex items-center gap-1">
                        Completed <CheckCircle2Icon className="w-4 h-4 text-green-300 ml-1" />
                      </span>
                    )}
                  </span>
                  <span className="text-yellow-300 font-bold text-base flex items-center gap-1">
                    <GiftIcon className="w-5 h-5" /> {mission.reward || 0}
                  </span>
                </div>
                <div className="flex justify-end mt-4">
                  {status === 'not_joined' && (
                    <button
                      onClick={() => handleJoinMission(mission)}
                      className="px-5 py-2 rounded-full font-semibold shadow-lg transition bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-gray-900"
                    >
                      Join Mission
                    </button>
                  )}
                  {status === 'joined' && (
                    <button
                      onClick={() => handleProofUpload(mission)}
                      className="px-5 py-2 rounded-full font-semibold shadow-lg transition bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-white"
                    >
                      Upload Proof
                    </button>
                  )}
                  {status === 'completed' && (
                    <button
                      onClick={() => handleProofUpload(mission)}
                      className="px-5 py-2 rounded-full font-semibold shadow-lg transition bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-white"
                    >
                      Upload Again
                    </button>
                  )}
                </div>
                {/* Confetti animation for completed */}
                {status === 'completed' && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute left-1/2 top-2 animate-bounce">
                      <TrophyIcon className="w-10 h-10 text-yellow-300 drop-shadow-lg" />
                    </div>
                  </div>
                )}
                {/* Show proof image if completed */}
                {status === 'completed' && um?.proofUrl && (
                  <div className="mt-4">
                    <span className="block text-green-200 text-xs mb-1">Your Proof:</span>
                    <img src={um.proofUrl} alt="Proof" className="w-24 h-24 rounded-lg object-cover border-2 border-green-400 shadow" />
                  </div>
                )}
                {/* Show streak progress for streak mission */}
                {mission.title === "3-Day Streak" && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-yellow-200 font-bold">Streak:</span>
                    {[1, 2, 3].map(day => (
                      <span key={day} className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center font-bold",
                        streakDays >= day ? "bg-yellow-400 text-yellow-900" : "bg-gray-400 text-gray-100"
                      )}>{day}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Proof Upload Modal */}
         // ...existing code...

// Replace the Proof Upload Modal section with this updated, more interactive UI:
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="bg-gradient-to-br from-green-50 via-white to-emerald-100 rounded-2xl p-7 shadow-2xl w-full max-w-md flex flex-col items-center relative max-h-[90vh] overflow-y-auto border-2 border-emerald-200 animate-fade-in-up">
      <button
        className="absolute top-2 right-3 text-gray-400 hover:text-red-500 text-2xl transition"
        onClick={() => setShowModal(false)}
        aria-label="Close"
      >×</button>
      <h2 className="text-xl font-extrabold mb-5 text-emerald-700 text-center tracking-tight flex items-center gap-2">
        <CameraIcon className="w-6 h-6 text-emerald-400" />
        Upload Proof for <span className="text-green-900">"{selectedMission?.title}"</span>
      </h2>

      {/* Step-by-step status */}
      <div className="w-full mb-4">
        {renderStepStatus("AI Detection", stepStatus.ai)}
        {renderStepStatus("Duplicate Check", stepStatus.duplicate)}
        {profileImage && renderStepStatus("Face Verification", stepStatus.face)}
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div className="mb-4 flex items-center gap-3 bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-3 rounded-xl border border-blue-200 w-full shadow animate-pulse">
          <Loader2Icon className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-blue-900 text-base font-semibold">{uploadStatus}</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-gradient-to-r from-red-100 to-red-50 border border-red-200 rounded-xl p-4 w-full shadow">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-red-800 text-base whitespace-pre-line font-semibold">{error}</div>
          </div>
          {duplicateDetails && (
            <div className="mt-2 text-xs text-red-600">
              <div>Method: {duplicateDetails.method}</div>
              <div>Similarity: {(duplicateDetails.similarity * 100).toFixed(1)}%</div>
            </div>
          )}
        </div>
      )}

      {/* AI Detection Results */}
      {aiDetectionResult && (
        <div className={`mb-4 rounded-xl p-4 w-full border-2 shadow transition-all duration-300 ${
          aiDetectionResult.isAiGenerated
            ? "bg-gradient-to-r from-red-100 to-red-50 border-red-300"
            : "bg-gradient-to-r from-green-100 to-green-50 border-green-300"
        }`}>
          <div className="flex items-center gap-3 mb-1">
            {aiDetectionResult.isAiGenerated ? (
              <XCircleIcon className="w-6 h-6 text-red-600" />
            ) : (
              <CheckIcon className="w-6 h-6 text-green-600" />
            )}
            <span className={`font-bold text-base ${
              aiDetectionResult.isAiGenerated ? "text-red-800" : "text-green-800"
            }`}>
              {aiDetectionResult.isAiGenerated ? "AI Generated" : "Authentic Photo"}
            </span>
          </div>
          <div className={`text-xs ${
            aiDetectionResult.isAiGenerated ? "text-red-600" : "text-green-600"
          }`}>
            Confidence: {(aiDetectionResult.confidence * 100).toFixed(1)}%
          </div>
        </div>
      )}

      {/* Face Verification Results */}
      {faceVerificationResult && (
        <div className="mb-4 rounded-xl p-4 w-full border-2 bg-gradient-to-r from-blue-100 to-blue-50 border-blue-300 shadow">
          <div className="flex items-center gap-3 mb-1">
            {faceVerificationResult.verified ? (
              <CheckIcon className="w-6 h-6 text-green-600" />
            ) : (
              <XCircleIcon className="w-6 h-6 text-red-600" />
            )}
            <span className={`font-bold text-base ${
              faceVerificationResult.verified ? "text-green-800" : "text-red-800"
            }`}>
              {faceVerificationResult.verified ? "Face Verified" : "Face Not Matched"}
            </span>
          </div>
          {faceVerificationResult.distance && (
            <div className="text-xs text-blue-700">
              Distance: {faceVerificationResult.distance.toFixed(3)} (Threshold: {faceVerificationResult.threshold?.toFixed(3)})
            </div>
          )}
          {faceVerificationResult.error && (
            <div className="text-xs text-red-700">{faceVerificationResult.error}</div>
          )}
        </div>
      )}

      {/* Camera/Upload Toggle */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => {
            setUseCamera(false)
            resetModal()
            setTimeout(() => fileInputRef.current && fileInputRef.current.click(), 0)
          }}
          className={`px-4 py-2 rounded-full font-bold shadow transition-all duration-200 ${
            !useCamera ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white scale-105' : 'bg-gray-200 text-gray-700'
          }`}
          type="button"
          disabled={loading}
        >
          Upload
        </button>
        <button
          onClick={() => {
            setUseCamera(true)
            resetModal()
          }}
          className={`px-4 py-2 rounded-full font-bold shadow transition-all duration-200 ${
            useCamera ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white scale-105' : 'bg-gray-200 text-gray-700'
          }`}
          type="button"
          disabled={loading}
        >
          Camera
        </button>
      </div>

      {/* File Upload */}
      {!useCamera ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              setProofImage(e.target.files[0])
              setConfirmSubmit(false)
              setError('')
              setDuplicateDetails(null)
              setAiDetectionResult(null)
              setStepStatus({ ai: null, duplicate: null, face: null })
            }}
            disabled={loading}
          />
          {proofImage && (
            <div className="flex flex-col items-center mb-4">
              <img src={URL.createObjectURL(proofImage)} alt="Preview" className="w-36 h-36 rounded-xl object-cover border-4 border-green-400 shadow-lg mb-2 transition-all duration-300" />
              <button
                className="text-sm text-blue-700 underline mb-1 hover:text-blue-900"
                onClick={() => {
                  resetModal()
                  setTimeout(() => fileInputRef.current && fileInputRef.current.click(), 0)
                }}
                disabled={loading}
              >
                Upload Different Image
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-48 h-48 rounded-xl mb-3 border-4 border-green-400 shadow-lg"
          />
          <button
            className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-2 rounded-full font-bold hover:from-emerald-600 hover:to-green-600 mb-2 shadow"
            onClick={() => {
              const imageSrc = webcamRef.current.getScreenshot();
              if (imageSrc) {
                fetch(imageSrc)
                  .then(res => res.blob())
                  .then(blob => {
                    const file = new File([blob], "proof.jpg", { type: blob.type });
                    setProofImage(file);
                    setConfirmSubmit(false);
                    setError('');
                    setDuplicateDetails(null);
                    setAiDetectionResult(null);
                    setStepStatus({ ai: null, duplicate: null, face: null })
                  });
              }
            }}
            disabled={loading}
          >
            Capture
          </button>
          {proofImage && (
            <div className="flex flex-col items-center mb-4">
              <img src={URL.createObjectURL(proofImage)} alt="Preview" className="w-36 h-36 rounded-xl object-cover border-4 border-green-400 shadow-lg mb-2 transition-all duration-300" />
              <button
                className="text-sm text-blue-700 underline mb-1 hover:text-blue-900"
                onClick={() => {
                  setProofImage(null);
                  setConfirmSubmit(false);
                  setError('');
                  setDuplicateDetails(null);
                  setAiDetectionResult(null);
                  setStepStatus({ ai: null, duplicate: null, face: null })
                }}
                disabled={loading}
              >
                Capture Again
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirm before final submit */}
      {proofImage && !confirmSubmit && (
        <button
          onClick={() => setConfirmSubmit(true)}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-8 py-2 rounded-full font-bold hover:from-yellow-500 hover:to-yellow-600 transition mt-2 shadow-lg"
          disabled={loading}
        >
          Continue
        </button>
      )}

      {confirmSubmit && (
        <div className="flex flex-col items-center mt-2">
          <div className="mb-3 text-green-700 font-bold text-center text-lg">
            Are you sure you want to submit this image as proof?
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleProofSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-2 rounded-full font-bold hover:from-green-600 hover:to-emerald-600 transition shadow-lg"
            >
              {loading ? <Loader2Icon className="w-5 h-5 animate-spin" /> : "Yes, Submit"}
            </button>
            <button
              onClick={() => setConfirmSubmit(false)}
              className="bg-gray-300 text-gray-700 px-8 py-2 rounded-full font-bold hover:bg-gray-400 transition shadow"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

        {/* Mission history */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-green-200 mb-4 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-green-300" /> Your Mission History
          </h2>
          <ul className="space-y-3">
            {userMissions.filter(m => m.completed).length === 0 && (
              <li className="text-gray-300">No missions completed yet. Start your eco journey now!</li>
            )}
            {userMissions.filter(m => m.completed).map(m => {
              const mission = missions.find(ms => ms.id === m.missionId)
              return (
                <li key={m.missionId} className="bg-white/10 p-4 rounded-lg border border-white/10 flex items-center gap-3">
                  <CheckCircle2Icon className="w-6 h-6 text-green-300" />
                  <span className="font-semibold text-green-100">{mission?.title}</span>
                  <span className="text-gray-300 text-sm ml-auto">{m.completedAt}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(-10px);}
        }
        .animate-bounce { animation: bounce 1.2s infinite; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s both; }
        @keyframes confetti {
          0% { transform: translateY(-20px) scale(1);}
          100% { transform: translateY(400px) scale(0.7);}
        }
        .animate-confetti { animation: confetti 1.5s linear forwards; }
      `}</style>
    </div>
  )
}

export default Missions