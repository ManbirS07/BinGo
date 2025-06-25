import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Home from './pages/Home'
import MovieDetails from './pages/MovieDetails'
import Favourite from './pages/Favourite'
import {Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import Missions from './pages/Missions'
import ChatbotButton from './components/ChatbotButton'
import MapPage from './pages/MapPage'
import SuggestBinButton from './components/SuggestBinButton'
import SuggestBin from './pages/SuggestBin'
import DustbinMap from './pages/DustbinMap'
import DailyQuest from './pages/DailyQuest'

import { UserDataProvider } from './context/userDataContext'

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
        <Route path="/missions/:id" element={<MovieDetails />} />
        <Route path='/missions/:id/:date' element={<SeatLayout />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/favourite" element={<Favourite />} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path='/suggest-bin' element={<SuggestBin/>} />
        <Route path="/map" element={<DustbinMap />} />
          <Route path="/dustbin-map" element={<DustbinMap />} />
          <Route path="/daily-quest" element={<DailyQuest />} />
      </Routes>
      </UserDataProvider>
      <SuggestBinButton/>
        <ChatbotButton/>
       {!shouldHideNavbar && <Footer/>}
       </>
  )
}

export default App
