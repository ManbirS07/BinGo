import React from 'react'
import { MapPinIcon, Trash2Icon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const SuggestBinButton = () => {
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-6 left-6 z-50 group">
      <button
        onClick={() => navigate('/map')}
        className="bg-yellow-600 hover:bg-yellow-500 text-white p-3 rounded-full shadow-lg animate-bounce transition"
        title="Suggest Bin"
      >
        <Trash2Icon className="w-8 h-8 relative z-10 transition-transform duration-300 group-hover:scale-110" />
        
      </button>

    </div>
  )
}

export default SuggestBinButton