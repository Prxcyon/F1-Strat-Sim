import React from 'react';
import TextPressure from './TextPressure';

export default function Header({ grandPrix, hasResults }) {
  return (
    <header className="header" style={{ 
      padding: '20px 30px', 
      height: '110px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      position: 'relative'
    }}>
      {/* Title Container - Capped at 450px to constrain automatic scaling */}
      <div style={{ width: '100%', maxWidth: '450px', height: '40px', pointerEvents: 'none', marginBottom: '8px' }}>
        <TextPressure 
          text={`${grandPrix} Grand Prix Strategy`}
          textColor="white"
          minFontSize={20}
          scale={true}
          flex={true}
        />
      </div>
      
      {hasResults && (
        <div style={{ pointerEvents: 'none' }}>
          <span style={{ 
            color: '#39B54A', 
            fontSize: '11px', 
            fontWeight: '900', 
            letterSpacing: '3px', 
            textTransform: 'uppercase',
            opacity: 0.8
          }}>
            RESULTS READY
          </span>
        </div>
      )}
    </header>
  );
}
