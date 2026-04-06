import { useRef, useEffect } from 'react'
import Hyperspeed from './Hyperspeed'
import Hero3D from './Hero3D'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ScrambledText from './ScrambledText'

gsap.registerPlugin(ScrollTrigger)

export default function LandingPage({ children }) {
  const containerRef = useRef()
  const dashboardRef = useRef()

  const projectText = "The F1 Strategy Engine represents the pinnacle of racing intelligence, combining session-wide telemetry, high-fidelity spatial interpolation, and advanced predictive modeling to decode the invisible patterns of the track. By leveraging SHAP-enhanced insights, real-time tire degradation analysis, and autonomous strategic simulations, we transform raw racing data into a decisive competitive edge. This is Next-Gen Racing Intelligence, defined by precision, speed, and the relentless pursuit of the ultimate lap."

  useEffect(() => {
    let ctx = gsap.context(() => {
      // The scroll trigger controls the entrance of the Dashboard over the 3D Canvas
      gsap.to(dashboardRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: '80% bottom', // Start the dashboard reveal late
          end: 'bottom bottom',
          scrub: 1,
        },
        y: 0,
        opacity: 1,
        ease: 'power3.out'
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100vw', minHeight: '350vh', background: '#000000', overflowX: 'hidden' }}>
      
      {/* Dynamic Background Layer */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Hyperspeed />
      </div>

      {/* 3D Scene stays sticky to the viewport */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100vw', zIndex: 1, pointerEvents: 'none' }}>
        <Hero3D />
      </div>

      {/* Scrambled Text Description Section - Natural Flow */}
      <div className="description-section" style={{ 
        position: 'relative', 
        zIndex: 5, 
        marginTop: '100vh',
        marginBottom: '100vh',
        width: '100vw',
        minHeight: '40vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}>
        <ScrambledText radius={200} duration={1.5} speed={0.4}>
          {projectText}
        </ScrambledText>
      </div>

      {/* Dashboard container slides up from the bottom */}
      <div 
        ref={dashboardRef}
        style={{ 
          position: 'absolute', 
          bottom: '5vh', 
          left: '5vw',
          width: '90vw',
          height: '85vh',
          overflow: 'hidden',
          zIndex: 10,
          background: 'rgba(15, 15, 15, 0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          transform: 'translateY(100vh)', /* Starts hidden below */
          opacity: 0,
          padding: '10px'
        }}
      >
        {children}
      </div>
    </div>
  )
}
