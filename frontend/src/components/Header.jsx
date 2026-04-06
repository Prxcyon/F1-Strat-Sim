import React from 'react';
import TextPressure from './TextPressure';

export default function Header({ grandPrix, hasResults }) {
  return (
    <header className="header" style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', height: '120px' }}>
      <div style={{ width: '100%', height: '80px' }}>
        <TextPressure 
          text={`${grandPrix} Grand Prix Strategy`}
          textColor="white"
          minFontSize={36}
          scale={true}
          flex={true}
        />
      </div>
      {hasResults && <span style={{ color: '#4caf50', marginTop: '10px', display: 'block', fontWeight: 'bold', letterSpacing: '1px' }}>RESULTS READY</span>}
    </header>
  );
}
