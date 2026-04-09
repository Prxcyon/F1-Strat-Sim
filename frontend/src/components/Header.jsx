import React from 'react';
import TextPressure from './TextPressure';

export default function Header({ grandPrix, hasResults }) {
  return (
    <header className="header" style={{ padding: '15px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', height: '100px', position: 'relative', zIndex: 10 }}>
      <div style={{ width: '100%', height: '60px' }}>
        <TextPressure 
          text={`${grandPrix} Grand Prix Strategy`}
          textColor="white"
          minFontSize={28}
          scale={true}
          flex={true}
        />
      </div>
      {hasResults && <span style={{ color: '#4caf50', marginTop: '5px', display: 'block', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>RESULTS READY</span>}
    </header>
  );
}
