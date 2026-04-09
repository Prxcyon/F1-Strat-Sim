import React from 'react';
import TextPressure from './TextPressure';

export default function Header({ grandPrix, hasResults }) {
  return (
    <header className="header" style={{ 
      padding: '15px 30px', 
      height: '120px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'flex-start',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      position: 'relative'
    }}>
      {/* Title Container - Increased marginBottom and moved up using padding-top */}
      <div style={{ width: '100%', maxWidth: '450px', height: '40px', pointerEvents: 'none', marginBottom: '20px', marginTop: '10px' }}>
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
            opacity: 0.9
          }}>
            RESULTS READY
          </span>
        </div>
      )}
    </header>
  );
}
