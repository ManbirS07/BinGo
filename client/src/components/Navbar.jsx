import { useState } from 'react'
import { assets } from '../assets/assets'
import { Link, useNavigate } from 'react-router-dom'
import { MenuIcon, SearchIcon, GiftIcon, XIcon } from 'lucide-react'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()
  const { openSignIn } = useClerk()
  const navigate = useNavigate()

  return (
    <div className='fixed top-0 left-0 z-50 w-full flex items-center justify-center px-6 md:px-16 lg:px-36 py-5'>
      <div className='flex items-center justify-between w-full max-w-6xl'>
        <Link to="/">
          <img src={assets.logo1} alt="BinGo Logo" className='w-41 h-auto' />
        </Link>

        <div className={`max-md:absolute max-md:left-0 max-md:top-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-green-950/80 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 ${isOpen ? 'max-md:w-full' : 'max-md:w-0'}`}>
          <XIcon className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer' onClick={() => setIsOpen(!isOpen)} />
          <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/">Home</Link>
          <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/missions">Missions</Link>
          <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/leaderboard">Leaderboard</Link>
          <Link onClick={() => { scrollTo(0, 0); setIsOpen(false) }} to="/rewards">Rewards</Link>
        </div>

        <div className='flex items-center gap-4'>
          <SearchIcon className='max-md:hidden w-6 h-6 cursor-pointer' />
          {
            !user ? (
              <button onClick={openSignIn} className='px-4 py-1 sm:px-7 sm:py-2 bg-green-600 hover:bg-green-500 transition rounded-full font-medium text-white cursor-pointer'>
                Login
              </button>
            ) : (
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action label='My Rewards' labelIcon={<GiftIcon width={15} />} onClick={() => navigate('/my-rewards')} />
                </UserButton.MenuItems>
              </UserButton>
            )
          }
        </div>

        <MenuIcon className='md:ml-4 md:hidden w-8 h-8 cursor-pointer' onClick={() => setIsOpen(!isOpen)} />
      </div>
    </div>
  )
}

export default Navbar
