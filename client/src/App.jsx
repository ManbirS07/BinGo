import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import {Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import Missions from './pages/Missions'
import ChatbotButton from './components/ChatbotButton'
import SuggestBinButton from './components/SuggestBinButton'
import SuggestBin from './pages/SuggestBin'
import DustbinMap from './pages/DustbinMap'
import DailyQuest from './pages/DailyQuest'
import Rewards from './pages/Rewards'
import Leaderboard from './pages/LeaderBoard'
import { UserDataProvider } from './context/userDataContext'
import { Invite } from './pages/Invitation'

const App = () => {
const location = useLocation()
const path = location.pathname

const shouldHideNavbar =
  path.startsWith('/admin') ||
  path === '/suggest-bin' ||
  path === '/dustbin-map' ||
  path === '/map' 

  return (
    <>
    <Toaster/>
     {!shouldHideNavbar && <Navbar/>}
     <UserDataProvider>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/missions" element={<Missions/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path='/suggest-bin' element={<SuggestBin/>} />
        <Route path="/map" element={<DustbinMap />} />
        <Route path="/dustbin-map" element={<DustbinMap />} />
        <Route path="/daily-quest" element={<DailyQuest />} />
        <Route path="/rewards" element={<Rewards />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

        <Route path="/invitation-form" element ={<Invite />}></Route>
      </Routes>
      </UserDataProvider>
      <SuggestBinButton/>
        <ChatbotButton/>
       {!shouldHideNavbar && <Footer/>}
       </>
  )
}

export default App
