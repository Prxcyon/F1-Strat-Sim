import React from 'react';
import TextPressure from './TextPressure';

export default function Header({ grandPrix, hasResults }) {
  return (
    <header className="header" style={{ 
      padding: '10px 30px', 
      height: '160px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'flex-start',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      position: 'relative'
    }}>
      {/* Title Container - Moved to absolute top with fixed height and large margin below */}
      <div style={{ width: '100%', maxWidth: '450px', height: '40px', pointerEvents: 'none', marginBottom: '60px', marginTop: '10px' }}>
        <TextPressure 
          text={`${grandPrix} Grand Prix Strategy`}
          textColor="white"
          minFontSize={18}
          scale={true}
          flex={true}
        />
      </div>
      
      {hasResults && (
        <div style={{ pointerEvents: 'none', position: 'relative', zIndex: 1 }}>
          <span style={{ 
            color: '#39B54A', 
            fontSize: '11px', 
            fontWeight: '900', 
            letterSpacing: '4px', 
            textTransform: 'uppercase',
            opacity: 1
          }}>
            RESULTS READY
          </span>
        </div>
      )}
    </header>
  );
}
