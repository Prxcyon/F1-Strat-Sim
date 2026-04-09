import React from 'react';
import TextPressure from './TextPressure';

export default function Header({ grandPrix, hasResults }) {
  return (
    <header className="header" style={{ padding: '15px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', height: '120px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '600px', height: '50px', pointerEvents: 'none' }}>
        <TextPressure 
          text={`${grandPrix} Grand Prix Strategy`}
          textColor="white"
          minFontSize={20}
          scale={true}
          flex={true}
        />
      </div>
      {hasResults && <span style={{ color: '#4caf50', marginTop: '10px', display: 'block', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>RESULTS READY</span>}
    </header>
  );
}
