export const fetchMissions = async () => {
  const res = await fetch('/api/missions')
  return res.json()
}

export const fetchUserMissions = async (userId) => {
  const res = await fetch(`/api/user-missions/${userId}`)
  return res.json()
}

export const joinMission = async (missionId, userId) => {
  await fetch('/api/join-mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionId, userId })
  })
}

export const completeMission = async (missionId, userId, imageUrl) => {
  await fetch('/api/complete-mission', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ missionId, userId, imageUrl })
  })
}
