import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { GiftIcon, LeafIcon, TrophyIcon, CameraIcon, SparklesIcon, UserIcon, MailIcon, PhoneIcon, CalendarIcon } from 'lucide-react'
import ProfilePopup from '../components/ProfilePopup'
import axios from 'axios'

const CLOUDINARY_UPLOAD_PRESET = 'BinGo_CodePaglus'
const CLOUDINARY_CLOUD_NAME = 'dgclo6bft'

const Dashboard = () => {
  const { user } = useUser()
  const profileImage = user?.unsafeMetadata?.profileImage
  const [showPopup, setShowPopup] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    phone: user?.primaryPhoneNumber?.phoneNumber || ''
  })
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (user && !user.unsafeMetadata?.profileImage) {
      setShowPopup(true)
    }
  }, [user])

  useEffect(() => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      email: user?.primaryEmailAddress?.emailAddress || '',
      phone: user?.primaryPhoneNumber?.phoneNumber || ''
    })
  }, [user])

  const handleSaveImage = async (img) => {
    try {
      const data = new FormData()
      data.append('file', img)
      data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
      data.append('cloud_name', CLOUDINARY_CLOUD_NAME)

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        data
      )
      const url = res.data.secure_url

      await user.update({
        unsafeMetadata: {
          profileImage: url
        }
      })
      setShowPopup(false)
    } catch (err) {
      console.error('Error updating image:', err)
    }
  }

  const handleEdit = () => {
    setEditMode(true)
    setShowDetails(true)
    setSuccessMsg('')
  }

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg('')
    try {
      await user.update({
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username
       
      })
      setEditMode(false)
      setSuccessMsg('Profile updated successfully!')
    } catch (err) {
      setSuccessMsg('Error updating profile.')
      console.error(err)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-emerald-900 text-white px-6 md:px-16 py-12 pt-32 relative overflow-x-hidden">
      {/* Animated sparkles background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute animate-pulse left-1/4 top-10 opacity-30">
          <SparklesIcon className="w-16 h-16 text-green-300" />
        </div>
        <div className="absolute animate-pulse right-10 top-1/3 opacity-20">
          <SparklesIcon className="w-24 h-24 text-yellow-200" />
        </div>
        <div className="absolute animate-pulse left-10 bottom-10 opacity-20">
          <SparklesIcon className="w-20 h-20 text-emerald-400" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 z-10 relative">
        {/* Profile Card with Glow and Animation */}
        <div className="relative group">
          <div className="absolute -inset-2 rounded-full blur-2xl opacity-60 group-hover:opacity-90 transition-all duration-500 bg-gradient-to-tr from-green-400/40 via-emerald-400/30 to-yellow-200/30 animate-blob" />
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-green-400 shadow-2xl bg-white z-10 relative transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
            <img
              src={profileImage || '/default-avatar.png'}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
              style={{ aspectRatio: '1/1' }}
            />
          </div>
          <button
            onClick={() => setShowPopup(true)}
            className="absolute bottom-2 right-2 bg-gradient-to-tr from-green-500 to-emerald-400 p-3 rounded-full hover:scale-110 transition shadow-lg border-2 border-white"
            title="Change Photo"
          >
            <CameraIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* User Info and Stats */}
        <div className="text-left w-full">
          <h1 className="text-4xl font-extrabold text-green-200 mb-2 drop-shadow-lg flex items-center gap-2">
            Welcome, {user?.firstName || 'Eco Hero'} <span className="animate-wiggle">👋</span>
          </h1>
          <p className="text-gray-200 text-lg mb-6 font-medium">
            You're on a mission to keep your city clean and green! <span className="text-green-300">#BinGo</span>
          </p>

          {/* Animated Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-100/10 p-6 rounded-2xl shadow-xl border border-yellow-200/30 flex flex-col items-center animate-fade-in-up">
              <GiftIcon className="w-8 h-8 text-yellow-300 mb-2 animate-spin-slow" />
              <p className="font-extrabold text-2xl text-yellow-200">123</p>
              <p className="text-sm text-yellow-100">Points</p>
            </div>
            <div className="bg-gradient-to-br from-lime-400/20 to-lime-100/10 p-6 rounded-2xl shadow-xl border border-lime-200/30 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <LeafIcon className="w-8 h-8 text-lime-300 mb-2 animate-pulse" />
              <p className="font-extrabold text-2xl text-lime-200">47 kg</p>
              <p className="text-sm text-lime-100">Waste Reduced</p>
            </div>
            <div className="bg-gradient-to-br from-orange-400/20 to-orange-100/10 p-6 rounded-2xl shadow-xl border border-orange-200/30 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <TrophyIcon className="w-8 h-8 text-orange-300 mb-2 animate-bounce" />
              <p className="font-extrabold text-2xl text-orange-200">5</p>
              <p className="text-sm text-orange-100">Badges Earned</p>
            </div>
          </div>

          {/* Add Details Button */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 px-6 py-2 rounded-full font-semibold shadow-lg transition"
            >
              <UserIcon className="w-5 h-5" />
              {showDetails ? 'Hide Details' : 'Add/View Details'}
            </button>
            {!editMode && showDetails && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 px-6 py-2 rounded-full font-semibold shadow-lg transition"
              >
                Edit Details
              </button>
            )}
          </div>

          {/* User Details Section */}
          {showDetails && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-8 animate-fade-in-up">
              <h3 className="text-lg font-bold text-green-200 mb-3 flex items-center gap-2">
                <UserIcon className="w-5 h-5" /> User Details
              </h3>
              {editMode ? (
                <form className="space-y-4" onSubmit={handleFormSubmit}>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-green-300 font-semibold mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 rounded-lg bg-white/20 border border-green-300/30 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                        required
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-green-300 font-semibold mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 rounded-lg bg-white/20 border border-green-300/30 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-green-300 font-semibold mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 rounded-lg bg-white/20 border border-green-300/30 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-green-300 font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      disabled
                      className="w-full px-3 py-2 rounded-lg bg-white/20 border border-green-300/30 text-gray-300 cursor-not-allowed"
                    />
                  </div>
                 
                  <div className="flex gap-3 mt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-semibold shadow transition"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditMode(false); setSuccessMsg(''); }}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-full font-semibold shadow transition"
                    >
                      Cancel
                    </button>
                  </div>
                  {successMsg && (
                    <div className={`mt-2 text-sm font-semibold ${successMsg.includes('success') ? 'text-green-300' : 'text-red-300'}`}>
                      {successMsg}
                    </div>
                  )}
                </form>
              ) : (
                <ul className="space-y-2 text-base">
                  <li className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-green-300" /><span className="font-semibold text-green-300">Full Name:</span> {user?.fullName || 'N/A'}</li>
                  <li className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-green-300" /><span className="font-semibold text-green-300">Username:</span> {user?.username || 'N/A'}</li>
                  <li className="flex items-center gap-2"><MailIcon className="w-4 h-4 text-green-300" /><span className="font-semibold text-green-300">Email:</span> {user?.primaryEmailAddress?.emailAddress || 'N/A'}</li>
                  <li className="flex items-center gap-2"><PhoneIcon className="w-4 h-4 text-green-300" /><span className="font-semibold text-green-300">Phone:</span> {user?.primaryPhoneNumber?.phoneNumber || 'N/A'}</li>
                  <li className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-green-300" /><span className="font-semibold text-green-300">Joined:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</li>
                </ul>
              )}
            </div>
          )}

          {/* Missions List */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-green-300" /> Your Missions
            </h2>
            <ul className="space-y-3">
              <li className="bg-white/10 p-4 rounded-lg border border-white/10 flex items-center gap-2 animate-fade-in-up">
                <span className="text-green-300 text-xl">✅</span> Collected plastics near Community Park
              </li>
              <li className="bg-white/10 p-4 rounded-lg border border-white/10 flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <span className="text-green-300 text-xl">✅</span> Suggested bin location near Main Street
              </li>
              <li className="bg-white/10 p-4 rounded-lg border border-white/10 flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <span className="text-green-300 text-xl">✅</span> Completed 3-day streak mission
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ProfilePopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        onSave={handleSaveImage}
        userImage={profileImage}
      />

      {/* Custom Animations */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-10deg);}
          50% { transform: rotate(10deg);}
        }
        .animate-wiggle { animation: wiggle 1.2s infinite; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s both; }
        @keyframes spin-slow {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        @keyframes blob {
          0%,100% { transform: scale(1) translateY(0px);}
          50% { transform: scale(1.08) translateY(10px);}
        }
        .animate-blob { animation: blob 6s infinite ease-in-out; }
      `}</style>
    </div>
  )
}

export default Dashboard