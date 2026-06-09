'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function DesktopBoundary({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Allow landing page to load normally
  if (!mounted || pathname === '/') {
    return <>{children}</>
  }

  if (isMobile) {
    return (
      <div style={{ height: '100vh', background: '#0d0d0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '0 24px', textAlign: 'center' }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
          style={{ fontSize: '48px', color: '#c8a85c' }}>⚔</motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: '20px', color: '#e8e0d0', letterSpacing: '0.15em', margin: 0 }}>
            DESKTOP RECOMMENDED
          </p>
          <div style={{ height: '1px', background: '#4a3f25', width: '100px', margin: '0 auto' }} />
        </div>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#a09080', letterSpacing: '0.05em', lineHeight: 1.6, maxWidth: '400px', margin: 0 }}>
          Normie Dungeons requires a larger screen to display the full game interface. Please open this session on a desktop/laptop computer or increase your window size.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
