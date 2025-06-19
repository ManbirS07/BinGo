import React, { useEffect, useState, useRef } from 'react'
import { GiftIcon, TrophyIcon, CameraIcon, MapPinIcon, ScanIcon, CheckCircle2Icon, Loader2Icon, InfoIcon, SparklesIcon, StarIcon } from 'lucide-react'
import clsx from 'clsx'
import Webcam from 'react-webcam'

const CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset'
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name'

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
  "Every small action counts towards a greener planet."
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
  const user = { id: 'mock-user', name: 'Eco Hero' }

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
  const fileInputRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIdx(idx => (idx + 1) % funFacts.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

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
  }

  const handleProofSubmit = async () => {
    setConfirmSubmit(false)
    if (!proofImage) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', proofImage)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      const uploadedUrl = data.secure_url
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
      setMotivation("Great job! You've completed a mission and made your city cleaner! 🌱")
      setTimeout(() => setShowConfetti(false), 2500)
    } catch (err) {
      alert("Upload failed. Try again.")
      console.error(err)
    }
    setLoading(false)
  }

  const streakDays = userMissions.find(m => m.missionId === 3 && m.completed)
    ? 3
    : userMissions.find(m => m.missionId === 3 && m.joined)
    ? 2
    : 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-black to-emerald-900 pt-32 pb-16 px-6 md:px-16">
      <div className="max-w-5xl mx-auto">
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
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-white rounded-xl p-8 shadow-xl w-[350px] flex flex-col items-center relative">
              <button
                className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-xl"
                onClick={() => setShowModal(false)}
              >×</button>
              <h2 className="text-lg font-bold mb-4 text-green-700 text-center">
                Upload Proof for "{selectedMission?.title}"
              </h2>

              <div className="flex gap-2 mb-4">
  <button
    onClick={() => {
      setUseCamera(false)
      setTimeout(() => fileInputRef.current && fileInputRef.current.click(), 0)
    }}
    className={`px-3 py-1 rounded-full font-semibold ${!useCamera ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}
    type="button"
  >
    Upload
  </button>
  <button
    onClick={() => setUseCamera(true)}
    className={`px-3 py-1 rounded-full font-semibold ${useCamera ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}
    type="button"
  >
    Camera
  </button>
</div>

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
      }}
    />
    {proofImage && (
      <div className="flex flex-col items-center mb-3">
        <img src={URL.createObjectURL(proofImage)} alt="Preview" className="w-24 h-24 rounded-lg object-cover border-2 border-green-400 mb-2" />
        <button
          className="text-sm text-blue-600 underline mb-1"
          onClick={() => {
            setProofImage(null)
            setConfirmSubmit(false)
          }}
        >
          Upload Again
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
      className="w-48 h-48 rounded-lg mb-3 border-2 border-green-400"
    />
    <button
      onClick={() => {
        const imageSrc = webcamRef.current.getScreenshot()
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "proof.jpg", { type: blob.type })
            setProofImage(file)
            setConfirmSubmit(false)
          })
      }}
      className="bg-emerald-500 text-white px-4 py-1 rounded-full font-semibold hover:bg-emerald-600 mb-2"
    >
      Capture
    </button>
    {proofImage && (
      <div className="flex flex-col items-center mb-3">
        <img src={URL.createObjectURL(proofImage)} alt="Preview" className="w-24 h-24 rounded-lg object-cover border-2 border-green-400 mb-2" />
        <button
          className="text-sm text-blue-600 underline mb-1"
          onClick={() => {
            setProofImage(null)
            setConfirmSubmit(false)
          }}
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
                  className="bg-yellow-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-yellow-600 transition mt-2"
                >
                  Continue
                </button>
              )}

              {confirmSubmit && (
                <div className="flex flex-col items-center mt-2">
                  <div className="mb-3 text-green-700 font-semibold text-center">
                    Are you sure you want to submit this image as proof?
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleProofSubmit}
                      disabled={loading}
                      className="bg-green-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600 transition"
                    >
                      {loading ? <Loader2Icon className="w-5 h-5 animate-spin" /> : "Yes, Submit"}
                    </button>
                    <button
                      onClick={() => setConfirmSubmit(false)}
                      className="bg-gray-400 text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-500 transition"
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