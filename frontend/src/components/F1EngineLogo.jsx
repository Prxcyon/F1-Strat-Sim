import React from 'react';

const F1EngineLogo = ({ className = "" }) => {
  return (
    <div className={`f1-engine-logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 8px rgba(232, 0, 45, 0.6))' }}
      >
        <path
          d="M10 20H90L80 80H20L10 20Z"
          fill="#1a1a1a"
          stroke="#E8002D"
          strokeWidth="4"
        />
        <path
          d="M30 40L70 40M35 50L65 50M40 60L60 60"
          stroke="#E8002D"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M15 15L25 25M85 15L75 25M15 85L25 75M85 85L75 75"
          stroke="#E8002D"
          strokeWidth="2"
        />
        <text
          x="50"
          y="58"
          fill="#E8002D"
          fontSize="24"
          fontWeight="900"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          style={{ letterSpacing: '1px' }}
        >
          F1
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1' }}>
        <span style={{ 
          fontSize: '22px', 
          fontWeight: '900', 
          color: 'white', 
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontFamily: 'Outfit, sans-serif'
        }}>
          F1 Engine
        </span>
        <span style={{ 
          fontSize: '10px', 
          color: 'rgba(255,255,255,0.4)', 
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginTop: '4px'
        }}>
          Racing Intelligence
        </span>
      </div>
    </div>
  );
};

export default F1EngineLogo;
