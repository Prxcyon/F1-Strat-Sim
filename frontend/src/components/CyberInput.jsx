import React from 'react';
import styled from 'styled-components';

const CyberInput = ({ label, value, onChange, type = "text", placeholder = "Search...", showIcon = true, showFilter = true, ...props }) => {
  return (
    <StyledWrapper className="cyber-input-wrapper">
      <div className="input-outer-container">
        <div id="poda">
          <div className="glow" />
          <div className="darkBorderBg" />
          <div className="darkBorderBg" />
          <div className="darkBorderBg" />
          <div className="white" />
          <div className="border" />
          <div id="main">
            <input 
              placeholder={placeholder} 
              type={type} 
              value={value}
              onChange={onChange}
              className="input cursor-target" 
              style={{ 
                paddingInline: showIcon ? '50px' : '20px'
              }}
              {...props}
            />
            <div id="input-mask" />
            <div id="pink-mask" />
            {showFilter && <div className="filterBorder" />}
            {showFilter && (
              <div id="filter-icon">
                <svg preserveAspectRatio="none" height={20} width={20} viewBox="4.8 4.56 14.832 15.408" fill="none">
                  <path d="M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z" stroke="#d6d6e6" strokeWidth={1} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            {showIcon && (
              <div id="search-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width={20} viewBox="0 0 24 24" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" height={20} fill="none" className="feather feather-search">
                  <circle stroke="url(#search)" r={8} cy={11} cx={11} />
                  <line stroke="url(#searchl)" y2="16.65" y1={22} x2="16.65" x1={22} />
                  <defs>
                    <linearGradient gradientTransform="rotate(50)" id="search">
                      <stop stopColor="#f8e7f8" offset="0%" />
                      <stop stopColor="#b6a9b7" offset="50%" />
                    </linearGradient>
                    <linearGradient id="searchl">
                      <stop stopColor="#b6a9b7" offset="0%" />
                      <stop stopColor="#837484" offset="50%" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  margin-bottom: 20px;
  
  #poda {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
  }

  .white,
  .border,
  .darkBorderBg,
  .glow {
    max-height: 56px;
    height: 100%;
    width: 100%;
    position: absolute;
    overflow: hidden;
    z-index: -1;
    border-radius: 12px;
    filter: blur(3px);
  }

  .input {
    background-color: #010201;
    border: none;
    width: 100%;
    height: 56px;
    border-radius: 12px;
    color: white;
    padding-inline: 50px;
    font-size: 16px;
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.3s;
  }

  .input::placeholder {
    color: #4a4a4a;
  }

  .input:focus {
    outline: none;
    background-color: #050505;
  }

  #main:focus-within > #input-mask {
    display: none;
  }

  #input-mask {
    pointer-events: none;
    width: 60px;
    height: 20px;
    position: absolute;
    background: linear-gradient(90deg, transparent, black);
    top: 18px;
    left: 20px;
    display: none;
  }

  #pink-mask {
    pointer-events: none;
    width: 100px;
    height: 40px;
    position: absolute;
    background: var(--accent);
    top: 10px;
    left: 10px;
    filter: blur(30px);
    opacity: 0.15;
    transition: all 0.8s ease;
  }

  #main:hover > #pink-mask {
    opacity: 0.3;
    transform: scale(1.2);
  }

  .white {
    filter: blur(2px);
    opacity: 0.3;
  }

  .white::before {
    content: "";
    z-index: -2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(83deg);
    position: absolute;
    width: 600px;
    height: 600px;
    background-repeat: no-repeat;
    background-position: 0 0;
    filter: brightness(1.4);
    background-image: conic-gradient(
      rgba(0, 0, 0, 0) 0%,
      var(--accent),
      rgba(0, 0, 0, 0) 8%,
      rgba(0, 0, 0, 0) 50%,
      var(--accent),
      rgba(0, 0, 0, 0) 58%
    );
    transition: all 1.5s;
  }

  .border {
    filter: blur(0.5px);
    opacity: 0.5;
  }

  .border::before {
    content: "";
    z-index: -2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(70deg);
    position: absolute;
    width: 600px;
    height: 600px;
    filter: brightness(1.3);
    background-repeat: no-repeat;
    background-position: 0 0;
    background-image: conic-gradient(
      #1c191c,
      var(--accent) 5%,
      #1c191c 14%,
      #1c191c 50%,
      var(--accent) 60%,
      #1c191c 64%
    );
    transition: all 1.5s;
  }

  .darkBorderBg::before {
    content: "";
    z-index: -2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(82deg);
    position: absolute;
    width: 600px;
    height: 600px;
    background-repeat: no-repeat;
    background-position: 0 0;
    background-image: conic-gradient(
      rgba(0, 0, 0, 0),
      #18116a,
      rgba(0, 0, 0, 0) 10%,
      rgba(0, 0, 0, 0) 50%,
      #6e1b60,
      rgba(0, 0, 0, 0) 60%
    );
    transition: all 1.5s;
  }

  #poda:hover > .darkBorderBg::before {
    transform: translate(-50%, -50%) rotate(-98deg);
  }
  #poda:hover > .glow::before {
    transform: translate(-50%, -50%) rotate(-120deg);
  }
  #poda:hover > .white::before {
    transform: translate(-50%, -50%) rotate(-97deg);
  }
  #poda:hover > .border::before {
    transform: translate(-50%, -50%) rotate(-110deg);
  }

  #poda:focus-within > .darkBorderBg::before {
    transform: translate(-50%, -50%) rotate(442deg);
    transition: all 3s;
  }
  #poda:focus-within > .glow::before {
    transform: translate(-50%, -50%) rotate(420deg);
    transition: all 3s;
  }
  #poda:focus-within > .white::before {
    transform: translate(-50%, -50%) rotate(443deg);
    transition: all 3s;
  }
  #poda:focus-within > .border::before {
    transform: translate(-50%, -50%) rotate(430deg);
    transition: all 3s;
  }

  .glow {
    overflow: hidden;
    filter: blur(30px);
    opacity: 0.2;
    max-height: 80px;
  }

  .glow:before {
    content: "";
    z-index: -2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(60deg);
    position: absolute;
    width: 600px;
    height: 600px;
    background-repeat: no-repeat;
    background-position: 0 0;
    background-image: conic-gradient(
      #000,
      var(--accent) 5%,
      #000 38%,
      #000 50%,
      var(--accent) 60%,
      #000 87%
    );
    transition: all 1.5s;
  }

  @keyframes rotate {
    100% {
      transform: translate(-50%, -50%) rotate(450deg);
    }
  }

  #filter-icon {
    position: absolute;
    top: 13px;
    right: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    height: 30px;
    width: 30px;
    border-radius: 8px;
    background: linear-gradient(180deg, #161329, black, #1d1b4b);
    border: 1px solid rgba(255,255,255,0.1);
  }

  .filterBorder {
    height: 34px;
    width: 34px;
    position: absolute;
    overflow: hidden;
    top: 11px;
    right: 13px;
    border-radius: 9px;
    z-index: 1;
  }

  .filterBorder::before {
    content: "";
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(90deg);
    position: absolute;
    width: 200px;
    height: 200px;
    background-repeat: no-repeat;
    background-position: 0 0;
    filter: brightness(1.35);
    background-image: conic-gradient(
      rgba(0, 0, 0, 0),
      #3d3a4f,
      rgba(0, 0, 0, 0) 50%,
      rgba(0, 0, 0, 0) 50%,
      #3d3a4f,
      rgba(0, 0, 0, 0) 100%
    );
    animation: rotate 4s linear infinite;
  }

  #main {
    position: relative;
    width: 100%;
  }

  #search-icon {
    position: absolute;
    left: 15px;
    top: 18px;
    z-index: 2;
    opacity: 0.6;
  }
`;

export default CyberInput;
