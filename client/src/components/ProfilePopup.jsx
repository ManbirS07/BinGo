import React, { useRef, useState, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'

const videoConstraints = {
  width: 320,
  height: 320,
  facingMode: "user"
}

const ProfilePopup = ({ isOpen, onClose, onSave, userImage }) => {
  const webcamRef = useRef(null)
  const [imgSrc, setImgSrc] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userImage) setImgSrc(userImage)
  }, [userImage])

  const capture = useCallback(() => {
    try {
      const imageSrc = webcamRef.current.getScreenshot()
      setImgSrc(imageSrc)
      setError(null)
    } catch (e) {
      setError("Unable to access webcam.")
    }
  }, [])

  const handleSave = () => {
    if (imgSrc) {
      onSave(imgSrc)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl p-6 shadow-xl w-[350px] flex flex-col items-center relative">
        <button
          className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-xl"
          onClick={onClose}
        >×</button>
        <h2 className="text-lg font-bold mb-2">Upload Profile Photo</h2>
        {!imgSrc ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="rounded-full border-4 border-green-400 mb-3"
            />
            <button
              onClick={capture}
              className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-green-600 transition mb-2"
            >
              Capture Photo
            </button>
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </>
        ) : (
          <>
            <img src={imgSrc} alt="Profile" className="rounded-full w-32 h-32 object-cover border-4 border-green-400 mb-3" />
            <div className="flex gap-2">
              <button
                onClick={() => setImgSrc(null)}
                className="bg-gray-300 text-gray-700 px-3 py-1 rounded-full font-semibold hover:bg-gray-400 transition"
              >
                Retake
              </button>
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-4 py-1 rounded-full font-semibold hover:bg-green-600 transition"
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProfilePopup
