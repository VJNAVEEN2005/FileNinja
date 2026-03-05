import { useState, useEffect } from 'react';
import './IntroAnimation.css';

export default function IntroAnimation() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Check if animation already played this session
    const hasPlayed = sessionStorage.getItem('intro_played');
    if (!hasPlayed) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem('intro_played', 'true');
        // Small delay after fade out to unmount
        setTimeout(() => setShouldRender(false), 800);
      }, 3500); // SVG animation is ~4.5s, but we can transition out earlier for better UX
      return () => clearTimeout(timer);
    }
  }, []);

  if (!shouldRender) return null;

  return (
    <div className={`intro-overlay ${!isVisible ? 'intro-overlay--hidden' : ''}`}>
      <div className="intro-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
            <defs>
                <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF9B8C"/>
                    <stop offset="45%" stopColor="#FF5F3A"/>
                    <stop offset="100%" stopColor="#FF9E1B"/>
                </linearGradient>
                
                <linearGradient id="foldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFA882"/>
                    <stop offset="100%" stopColor="#FF8340"/>
                </linearGradient>

                <linearGradient id="glossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5"/>
                    <stop offset="35%" stopColor="#ffffff" stopOpacity="0.0"/>
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.15"/>
                </linearGradient>

                <filter id="docShadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="18" stdDeviation="15" floodColor="#D14A28" floodOpacity="0.25"/>
                </filter>

                <filter id="foldShadow" x="-20%" y="-20%" width="150%" height="150%">
                    <feDropShadow dx="-3" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.12"/>
                </filter>

                <filter id="maskShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#B33A1F" floodOpacity="0.35"/>
                </filter>
            </defs>

            <style>{`
                @keyframes popIn {
                    0% { transform: translateY(250px) scale(0.4) rotate(15deg); opacity: 0; }
                    15% { transform: translateY(-15px) scale(1.05) rotate(-3deg); opacity: 1; }
                    25% { transform: translateY(0) scale(1) rotate(0); }
                    75% { transform: translateY(0) scale(1) rotate(0); }
                    85% { transform: translateY(-15px) scale(1.05) rotate(3deg); opacity: 1; }
                    100% { transform: translateY(250px) scale(0.4) rotate(-15deg); opacity: 0; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes maskPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                .anim-entry { transform-origin: 250px 250px; animation: popIn 4.5s cubic-bezier(0.25, 1.2, 0.5, 1) infinite; }
                .anim-float { animation: float 2.5s ease-in-out infinite; }
                .anim-mask { transform-origin: 250px 240px; animation: maskPulse 2.5s ease-in-out infinite; }
            `}</style>

            <g className="anim-entry">
                <g className="anim-float">
                    <path d="M 120 100 C 120 80, 140 60, 160 60 L 300 60 L 380 140 L 380 400 C 380 420, 360 440, 340 440 L 160 440 C 140 440, 120 420, 120 400 Z" 
                          fill="url(#docGrad)" filter="url(#docShadow)"/>

                    <path d="M 120 100 C 120 80, 140 60, 160 60 L 300 60 L 380 140 L 380 400 C 380 420, 360 440, 340 440 L 160 440 C 140 440, 120 420, 120 400 Z" 
                          fill="url(#glossGrad)" style={{ pointerEvents: 'none' }}/>

                    <path d="M 300 60 L 300 110 C 300 125, 315 140, 330 140 L 380 140 C 350 120, 320 90, 300 60 Z" 
                          fill="url(#foldGrad)" filter="url(#foldShadow)"/>
                    
                    <g className="anim-mask">
                        <path fillRule="evenodd" d="
                            M 140 240 C 140 190, 210 190, 250 210 C 290 190, 360 190, 360 240 C 360 290, 290 290, 250 265 C 210 290, 140 290, 140 240 Z
                            M 175 230 C 200 235, 220 245, 235 255 C 215 260, 195 260, 175 250 C 160 240, 165 235, 175 230 Z
                            M 325 230 C 300 235, 280 245, 265 255 C 285 260, 305 260, 325 250 C 340 240, 335 235, 325 230 Z" 
                        fill="#FFFFFF" filter="url(#maskShadow)"/>
                    </g>
                </g>
            </g>
        </svg>
      </div>
    </div>
  );
}
