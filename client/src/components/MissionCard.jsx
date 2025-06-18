import React from 'react'

const statusColors = {
  not_joined: 'bg-gray-400',
  joined: 'bg-yellow-400',
  completed: 'bg-green-500'
}

const MissionCard = ({ mission, status, onProofUpload, userId }) => {
  return (
    <div className="bg-white/10 border border-green-300/20 rounded-xl p-6 shadow-lg flex flex-col justify-between min-h-[260px]">
      <div>
        <h2 className="text-xl font-bold text-green-300 mb-2">{mission.title}</h2>
        <p className="text-gray-200 mb-4">{mission.description}</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {mission.tags?.map(tag => (
            <span key={tag} className="bg-green-700/40 text-green-200 px-2 py-1 rounded text-xs">{tag}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[status] || 'bg-gray-400'} text-white`}>
          {status === 'not_joined' && 'Not Joined'}
          {status === 'joined' && 'In Progress'}
          {status === 'completed' && 'Completed'}
        </span>
        {status === 'joined' && (
          <button
            onClick={onProofUpload}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-full font-semibold transition"
          >
            Upload Proof
          </button>
        )}
        {status === 'not_joined' && (
          <button
            onClick={onProofUpload}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded-full font-semibold transition"
          >
            Join & Upload Proof
          </button>
        )}
        {status === 'completed' && (
          <span className="text-green-300 font-bold">🎉</span>
        )}
      </div>
    </div>
  )
}

export default MissionCard