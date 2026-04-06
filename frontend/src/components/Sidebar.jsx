import { useState } from 'react'
import CircularGallery from './CircularGallery'
import CyberInput from './CyberInput'
import F1EngineLogo from './F1EngineLogo'

import bahrainImg from '../assets/tracks/Bahrain.png'
import saudiImg from '../assets/tracks/Saudi Arabia.png'
import australiaImg from '../assets/tracks/Australia.png'
import azerbaijanImg from '../assets/tracks/Azerbaijan.png'
import miamiImg from '../assets/tracks/Miami.png'
import imolaImg from '../assets/tracks/Imola.png'
import monacoImg from '../assets/tracks/Monaco.png'
import spainImg from '../assets/tracks/Spain.png'
import canadaImg from '../assets/tracks/Canada.png'
import austriaImg from '../assets/tracks/Austria.png'
import silverstoneImg from '../assets/tracks/Silverstone.png'
import hungaryImg from '../assets/tracks/Hungary.png'
import belgiumImg from '../assets/tracks/Belgium.png'
import netherlandsImg from '../assets/tracks/Netherlands.png'
import italyImg from '../assets/tracks/Italy.png'
import japanImg from '../assets/tracks/Japan.png'
import lasVegasImg from '../assets/tracks/Las Vegas.png'
import abuDhabiImg from '../assets/tracks/Abu Dhabi.png'
import singaporeImg from '../assets/tracks/Singapore.png'
import qatarImg from '../assets/tracks/Qatar.png'
import cotaImg from '../assets/tracks/COTA.png'
import brazilImg from '../assets/tracks/Brazil.png'
import mexicoImg from '../assets/tracks/Mexico.png'

const GP_OPTIONS = [
  { value: 'Bahrain',       label: 'Bahrain',       laps: 57, image: bahrainImg },
  { value: 'Saudi Arabia',  label: 'Saudi Arabia',  laps: 50, image: saudiImg },
  { value: 'Australia',     label: 'Australia',     laps: 58, image: australiaImg },
  { value: 'Azerbaijan',    label: 'Azerbaijan',    laps: 51, image: azerbaijanImg },
  { value: 'Miami',         label: 'Miami',         laps: 57, image: miamiImg },
  { value: 'Imola',         label: 'Imola',         laps: 63, image: imolaImg },
  { value: 'Monaco',        label: 'Monaco',        laps: 78, image: monacoImg },
  { value: 'Spain',         label: 'Spain',         laps: 66, image: spainImg },
  { value: 'Canada',        label: 'Canada',        laps: 70, image: canadaImg },
  { value: 'Austria',       label: 'Austria',       laps: 71, image: austriaImg },
  { value: 'Great Britain', label: 'Silverstone',   laps: 52, image: silverstoneImg },
  { value: 'Hungary',       label: 'Hungary',       laps: 70, image: hungaryImg },
  { value: 'Belgium',       label: 'Spa',           laps: 44, image: belgiumImg },
  { value: 'Netherlands',   label: 'Zandvoort',     laps: 72, image: netherlandsImg },
  { value: 'Italy',         label: 'Monza',         laps: 53, image: italyImg },
  { value: 'Singapore',     label: 'Singapore',     laps: 62, image: singaporeImg },
  { value: 'Japan',         label: 'Suzuka',        laps: 53, image: japanImg },
  { value: 'Qatar',         label: 'Qatar',         laps: 57, image: qatarImg },
  { value: 'United States', label: 'COTA',          laps: 56, image: cotaImg },
  { value: 'Mexico',        label: 'Mexico',        laps: 71, image: mexicoImg },
  { value: 'Brazil',        label: 'Interlagos',    laps: 71, image: brazilImg },
  { value: 'Las Vegas',     label: 'Las Vegas',     laps: 50, image: lasVegasImg },
  { value: 'Abu Dhabi',     label: 'Abu Dhabi',     laps: 58, image: abuDhabiImg },
]

const COMPOUNDS = [
  { name: 'SOFT',   color: '#E8002D' },
  { name: 'MEDIUM', color: '#d4ab00' },
  { name: 'HARD',   color: '#c8c8c8' },
]

export default function Sidebar({ mode, config, onChange, onOptimize, loading, isGalleryOpen, setIsGalleryOpen }) {
  const update = (key, val) => onChange(prev => ({ ...prev, [key]: val }))

  const galleryItems = GP_OPTIONS.map(gp => ({
    text: gp.label,
    image: gp.image
  }))

  const handleTrackSelect = (trackName) => {
    const gp = GP_OPTIONS.find(o => o.label === trackName)
    if (gp) {
      update('grandPrix', gp.value)
      setIsGalleryOpen(false)
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ marginBottom: '30px', padding: '0 10px' }}>
        <F1EngineLogo />
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-title">Race Config</p>

        <div className="form-group">
          <label>Grand Prix Track</label>
          <button 
            className="track-select-trigger cursor-target"
            onClick={() => setIsGalleryOpen(true)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'var(--bg2)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '12px',
              color: 'var(--accent)',
              fontWeight: 'bold',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            {config.grandPrix}
            <span>⌄</span>
          </button>
        </div>

        {mode === 'optimizer' && (
          <>
            <div className="form-group">
              <label>Base Lap Time (s)</label>
              <CyberInput
                type="number" 
                step="0.5" 
                min="60" 
                max="150"
                value={config.baseLapTime}
                onChange={e => update('baseLapTime', +e.target.value)}
                placeholder="92.0"
              />
            </div>

            <div className="form-group" style={{ marginTop: '-10px' }}>
              <label>Pit Stop Loss (s)</label>
              <CyberInput
                type="number" 
                step="0.5" 
                min="15" 
                max="35"
                value={config.pitLoss}
                onChange={e => update('pitLoss', +e.target.value)}
                placeholder="22.0"
              />
            </div>

            <div className="form-group" style={{ marginTop: '0px' }}>
              <label>Max Pit Stops</label>
              <div className="stops-grid">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    className={`stop-btn cursor-target ${config.maxStops === n ? 'active' : ''}`}
                    onClick={() => update('maxStops', n)}
                  >
                    {n}-Stop
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {mode === 'optimizer' && (
        <>
          <div className="sidebar-divider" />

          <button className="run-btn cursor-target" onClick={onOptimize} disabled={loading}>
            {loading ? 'Running…' : 'Run Optimiser'}
          </button>

          <div className="sidebar-divider" />

          <div className="compound-legend">
            <p className="sidebar-section-title">Tyre Compounds</p>
            {COMPOUNDS.map(c => (
              <div key={c.name} className="compound-row">
                <span className="compound-dot" style={{ background: c.color }} />
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TRACK SELECTION GALLERY OVERLAY */}
      {isGalleryOpen && (
        <div 
          className="gallery-overlay" 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 1000, 
            background: 'rgba(0,0,0,0.95)', 
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}
        >
          <div style={{ position: 'absolute', top: '40px', left: '40px' }}>
            <h2 style={{ fontSize: '3rem', margin: 0, color: 'var(--accent)' }}>Select Track</h2>
            <p style={{ color: 'var(--text3)' }}>Scroll & Click to select the Grand Prix circuit</p>
          </div>
          
          <button 
            className="cursor-target close-gallery" 
            onClick={() => setIsGalleryOpen(false)}
            style={{ 
              position: 'absolute', 
              top: '40px', 
              right: '40px',
              background: 'transparent',
              border: '2px solid var(--accent)',
              color: 'var(--accent)',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>

          <div style={{ width: '100%', height: '70vh' }}>
            <CircularGallery items={galleryItems} bend={4} borderRadius={0.1} onSelect={handleTrackSelect} />
          </div>
        </div>
      )}
    </aside>
  )
}
