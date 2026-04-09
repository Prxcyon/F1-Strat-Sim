import React from 'react';
import TextPressure from './TextPressure';

export default function Header({ grandPrix, hasResults }) {
  return (
    <header className="header" style={{ padding: '15px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', height: '90px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {hasResults && <span style={{ color: '#4caf50', marginBottom: '8px', display: 'block', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>RESULTS READY</span>}
      <div style={{ width: '100%', height: '40px', pointerEvents: 'none' }}>
        <TextPressure 
          text={`${grandPrix} Grand Prix Strategy`}
          textColor="white"
          minFontSize={22}
          scale={true}
          flex={true}
        />
      </div>
    </header>
  );
}
