import React, { useRef, useEffect } from 'react'
import { ArrowRight, LeafIcon, UsersIcon, GiftIcon, ScanIcon, CameraIcon, MapPinIcon, TrophyIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Tilt from 'react-parallax-tilt'



// ...existing imports...

const ParticlesBG = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    // Dustbin position (bottom center)
    const dustbin = {
      x: width / 2,
      y: height - 80,
      r: 36,
    }

    // Fixed reward target (top right, like a reward button)
    function getRewardTarget() {
      return {
        x: width - 60,
        y: 40,
      }
    }

    // Waste particle shapes/colors
    const wasteTypes = [
      { color: '#fbbf24', shape: 'circle' },   // yellow
      { color: '#60a5fa', shape: 'rect' },     // blue
      { color: '#34d399', shape: 'triangle' }, // green
      { color: '#f472b6', shape: 'star' },     // pink star
      { color: '#a3e635', shape: 'oval' },     // lime oval
    ]

    // Generate random waste particles
    const particles = Array.from({ length: 28 }).map(() => {
      const type = wasteTypes[Math.floor(Math.random() * wasteTypes.length)]
      const startX = Math.random() * width
      const startY = Math.random() * (height * 0.7)
      const size = 10 + Math.random() * 12
      const speed = 0.7 + Math.random() * 1.2
      return {
        ...type,
        x: startX,
        y: startY,
        size,
        speed,
        angle: Math.atan2(dustbin.y - startY, dustbin.x - startX),
        progress: 0,
      }
    })

    // Coins flying to top right
    const coins = []

    function drawCoin(ctx, r, alpha = 1) {
      ctx.save()
      ctx.globalAlpha = alpha
      // Outer coin
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, 2 * Math.PI)
      ctx.fillStyle = 'gold'
      ctx.shadowBlur = 16
      ctx.shadowColor = '#ffe066'
      ctx.fill()
      // Inner shine
      ctx.beginPath()
      ctx.arc(-r * 0.3, -r * 0.3, r * 0.4, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fill()
      // Coin edge
      ctx.lineWidth = 2
      ctx.strokeStyle = '#f59e42'
      ctx.stroke()
      ctx.restore()
    }

    function drawStar(ctx, r, color, alpha = 1) {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(
          Math.cos((18 + i * 72) / 180 * Math.PI) * r,
          -Math.sin((18 + i * 72) / 180 * Math.PI) * r
        )
        ctx.lineTo(
          Math.cos((54 + i * 72) / 180 * Math.PI) * r * 0.5,
          -Math.sin((54 + i * 72) / 180 * Math.PI) * r * 0.5
        )
      }
      ctx.closePath()
      ctx.fillStyle = color
      ctx.shadowBlur = 16
      ctx.shadowColor = color
      ctx.fill()
      ctx.restore()
    }

    function animate() {
      ctx.clearRect(0, 0, width, height)
      // Draw and move waste particles
      particles.forEach(p => {
        // Move toward dustbin
        p.progress += p.speed * 0.008
        p.x += Math.cos(p.angle) * p.speed
        p.y += Math.sin(p.angle) * p.speed

        // Draw shape with blur
        ctx.save()
        ctx.globalAlpha = 0.8
        ctx.shadowBlur = 12
        ctx.shadowColor = p.color
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        switch (p.shape) {
         
          case 'rect':
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
            break
          case 'triangle':
            ctx.beginPath()
            ctx.moveTo(0, -p.size / 2)
            ctx.lineTo(-p.size / 2, p.size / 2)
            ctx.lineTo(p.size / 2, p.size / 2)
            ctx.closePath()
            ctx.fill()
            break
          case 'star':
            drawStar(ctx, p.size / 2, p.color)
            break
          case 'oval':
            ctx.save()
            ctx.scale(1.3, 0.7)
            ctx.beginPath()
            ctx.arc(0, 0, p.size / 2, 0, 2 * Math.PI)
            ctx.fill()
            ctx.restore()
            break
          default:
            break
        }
        ctx.restore()

        // If reached dustbin, spawn coin and reset
        const rewardTarget = getRewardTarget()
        if (Math.hypot(p.x - dustbin.x, p.y - dustbin.y) < 30) {
          // Quadratic Bezier control point for arc
          const control = {
            x: dustbin.x + (rewardTarget.x - dustbin.x) * 0.3,
            y: Math.min(dustbin.y, rewardTarget.y) - 120,
          }
          coins.push({
            t: 0,
            duration: 80 + Math.random() * 10,
            start: { x: dustbin.x, y: dustbin.y - 10 },
            end: { x: rewardTarget.x, y: rewardTarget.y },
            control,
            size: 13 + Math.random() * 8,
            collected: false,
          })
          // Reset waste particle
          p.x = Math.random() * width
          p.y = Math.random() * (height * 0.7)
          p.angle = Math.atan2(dustbin.y - p.y, dustbin.x - p.x)
        }
      })

      // Draw and animate coins
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i]
        c.t += 1
        const progress = Math.min(1, c.t / c.duration)
        // Quadratic Bezier interpolation
        const x =
          (1 - progress) * (1 - progress) * c.start.x +
          2 * (1 - progress) * progress * c.control.x +
          progress * progress * c.end.x
        const y =
          (1 - progress) * (1 - progress) * c.start.y +
          2 * (1 - progress) * progress * c.control.y +
          progress * progress * c.end.y
        const alpha = 1 - Math.max(0, progress - 0.85) / 0.15 // fade out at end
        ctx.save()
        ctx.translate(x, y)
        drawCoin(ctx, c.size / 2, alpha)
        ctx.restore()
        // If reached target, remove
        if (progress >= 1 && !c.collected) {
          c.collected = true
          coins.splice(i, 1)
        }
      }

      // Draw dustbin icon (SVG)
      ctx.save()
      ctx.translate(dustbin.x, dustbin.y)
      ctx.scale(1.2, 1.2)
      ctx.globalAlpha = 0.95
      ctx.lineWidth = 2
      ctx.strokeStyle = '#fff'
      ctx.fillStyle = '#222'
      // Bin body
      ctx.beginPath()
      ctx.moveTo(-18, 0)
      ctx.lineTo(-14, 32)
      ctx.lineTo(14, 32)
      ctx.lineTo(18, 0)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      // Bin lid
      ctx.beginPath()
      ctx.rect(-20, -8, 40, 10)
      ctx.fillStyle = '#444'
      ctx.fill()
      ctx.stroke()
      // Bin handle
      ctx.beginPath()
      ctx.arc(0, -8, 8, Math.PI, 2 * Math.PI)
      ctx.stroke()
      ctx.restore()

      // Draw a static coin at the top right as a "reward" icon
      const rewardTarget = getRewardTarget()
      ctx.save()
      ctx.translate(rewardTarget.x, rewardTarget.y)
      drawCoin(ctx, 18, 1)
      ctx.restore()

      requestAnimationFrame(animate)
    }

    animate()

    // Resize handler
    function handleResize() {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      dustbin.x = width / 2
      dustbin.y = height - 80
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: "#000" }}
      aria-hidden
    />
  )
}

// ...rest of your HeroSection code remains unchanged...


// --- Main Hero Section ---
const HeroSection = () => {
  const navigate = useNavigate()

 
const cards = [
  {
    title: "Dispose Waste",
    icon: <CameraIcon className='w-4 h-4 text-pink-400' />,
    task: "Photo proof, instant points.",
    reward: "+50"
  },
  {
    title: "Suggest Bin",
    icon: <MapPinIcon className='w-4 h-4 text-blue-400' />,
    task: "Mark a new spot.",
    reward: "+30"
  },
  {
    title: "3-Day Streak",
    icon: <TrophyIcon className='w-4 h-4 text-yellow-300' />,
    task: "Log daily action.",
    reward: "+40"
  },
  {
    title: "Sort Waste",
    icon: <ScanIcon className='w-4 h-4 text-green-300' />,
    task: "Scan & sort items.",
    reward: "+25"
  }
]

  return (
    <div className='relative flex flex-col md:flex-row items-center justify-between gap-10 px-6 md:px-16 lg:px-36 min-h-screen text-white overflow-hidden bg-black'>
      <ParticlesBG />
      {/* Left Content */}
      <div className='flex flex-col justify-center gap-6 md:w-1/2 z-10'>
          <motion.h1
          className='text-4xl md:text-6xl font-bold leading-tight max-w-3xl'
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Turn Trash Into Triumph with <span className='text-green-300'>BinGo</span>
        </motion.h1>

         <motion.p
          className='text-xl md:text-2xl font-bold text-green-200 mt-2'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.7 }}
        >
          Snap, Bin, Win !!
        </motion.p>

        <motion.p
          className='max-w-xl text-lg text-gray-100/90'
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Take a live photo of your eco-action, verify through AI, and rise on the leaderboard. Make waste count and earn badges, points, and real-world rewards.
        </motion.p>

        <motion.button
          onClick={() => navigate('/missions')}
          className='flex items-center gap-2 px-7 py-3 text-base bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 transition rounded-full font-semibold shadow-xl w-max ring-2 ring-green-300/30'
          whileHover={{ scale: 1.07, boxShadow: "0 8px 32px 0 rgba(34,197,94,0.25)" }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Start Your Mission
          <ArrowRight className='w-5 h-5' />
        </motion.button>

        <motion.div
          className='flex flex-wrap gap-4 mt-10 text-sm'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <div className='flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full shadow hover:scale-105 transition border border-white/20'>
            <UsersIcon className='text-green-300 w-5 h-5' />
            5,000+ Users Joined
          </div>
          <div className='flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full shadow hover:scale-105 transition border border-white/20'>
            <GiftIcon className='text-yellow-300 w-5 h-5' />
            12,300 Rewards Claimed
          </div>
          <div className='flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full shadow hover:scale-105 transition border border-white/20'>
            <LeafIcon className='text-lime-400 w-5 h-5' />
            18 Tons Waste Collected
          </div>
        </motion.div>
      </div>

      {/* Right Grid */}
      <motion.div
        className="md:w-3/8 hidden md:grid grid-cols-2 grid-rows-2 gap-10 relative z-10"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        {cards.map((card, i) => (
          <Tilt key={i} tiltMaxAngleX={12} tiltMaxAngleY={12} scale={1.08} transitionSpeed={250}>
            <motion.div
              className="relative z-10 bg-white/20 backdrop-blur-xl p-7 rounded-3xl shadow-2xl w-64 h-64 flex flex-col justify-between border border-white/30 hover:scale-[1.04] hover:shadow-green-300/30 transition-all duration-300 group"
              whileHover={{ y: -8, boxShadow: "0 8px 32px 0 rgba(34,197,94,0.15)" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.15, duration: 0.7, type: "spring" }}
            >
              <div>
                <h3 className="text-lg font-semibold text-green-200 flex items-center gap-2">
                  {card.icon} {card.title}
                </h3>
                <p className="text-sm mt-3 text-gray-100/90">{card.task}</p>
              </div>
              <div className='flex justify-between items-end mt-4'>
                <span className="text-yellow-300 font-bold text-base">{card.reward}</span>
                <button
                  onClick={() => navigate('/missions')}
                  className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 text-sm font-semibold rounded-full transition shadow-lg ring-1 ring-green-200/30"
                >
                  Join
                </button>
              </div>
            </motion.div>
          </Tilt>
        ))}
      </motion.div>
    </div>
  )
}

export default HeroSection