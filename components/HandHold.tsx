import React, { useState, useEffect } from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface HandHoldProps {
  onHoldChange: (isHolding: boolean) => void;
  isPartnerHolding: boolean;
}

const HandHold: React.FC<HandHoldProps> = ({ onHoldChange, isPartnerHolding }) => {
  const [isHolding, setIsHolding] = useState(false);
  const [duration, setDuration] = useState(0);

  // Handle local holding
  const handleHoldStart = () => {
    setIsHolding(true);
    onHoldChange(true);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    onHoldChange(false);
  };

  useEffect(() => {
    let interval: number;
    // Timer runs if YOU are holding or THEY are holding (connection felt)
    if (isHolding && isPartnerHolding) {
      interval = window.setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isHolding, isPartnerHolding]);

  const formatTime = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    return `${m}m ${secs % 60}s`;
  };

  const isConnected = isHolding && isPartnerHolding;

  return (
    <div className="relative flex flex-col items-center justify-center">
      
      {/* Background Ripples (CSS Only) */}
      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .animate-ripple {
          animation: ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
        }
        .animate-heartbeat {
          animation: heartbeat 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Connection Glow Effects */}
      {isConnected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-rose-500/30 rounded-full blur-[40px] animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border-2 border-rose-400/50 rounded-full animate-ripple"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-rose-400/30 rounded-full animate-ripple" style={{ animationDelay: '0.5s' }}></div>
        </div>
      )}

      {/* Partner Presence Indicator */}
      {isPartnerHolding && !isHolding && (
        <div className="absolute -inset-4 border border-indigo-400/50 rounded-full animate-pulse-slow pointer-events-none">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-900/80 backdrop-blur px-3 py-1 rounded-full text-[10px] text-indigo-200 border border-indigo-500/30">
             Partner is waiting...
          </div>
        </div>
      )}

      {/* Main Interaction Button */}
      <button
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        className={`
          relative z-10 w-24 h-24 rounded-full flex items-center justify-center
          backdrop-blur-md border transition-all duration-500 ease-out
          focus:outline-none select-none touch-none
          ${isConnected 
            ? 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-300 shadow-[0_0_40px_rgba(225,29,72,0.6)] animate-heartbeat' 
            : isHolding 
              ? 'bg-rose-500/80 border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.4)] scale-95' 
              : isPartnerHolding 
                ? 'bg-indigo-950/60 border-indigo-400/50 hover:border-indigo-300'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
          }
        `}
      >
        <div className="relative">
          <Heart 
            className={`
              w-10 h-10 transition-all duration-500
              ${isConnected 
                ? 'text-white fill-white drop-shadow-md' 
                : isHolding 
                  ? 'text-white fill-white scale-90'
                  : isPartnerHolding
                    ? 'text-indigo-300 animate-pulse' 
                    : 'text-white/40'
              }
            `}
            strokeWidth={isConnected ? 0 : 1.5}
          />
          
          {isConnected && (
            <Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-yellow-200 animate-bounce" />
          )}
        </div>
      </button>

      {/* Status Text Area */}
      <div className="h-12 mt-4 flex flex-col items-center justify-center text-center transition-all duration-300">
        {isConnected ? (
          <div className="animate-fade-in-up">
            <p className="text-white font-handwriting text-xl drop-shadow-lg">Connected</p>
            <p className="text-rose-200/80 text-xs font-mono tracking-widest">{formatTime(duration)}</p>
          </div>
        ) : isHolding ? (
           <p className="text-rose-300/80 text-sm font-medium animate-pulse">Waiting for partner...</p>
        ) : isPartnerHolding ? (
           <p className="text-indigo-300/80 text-sm font-medium">Touch to hold hand</p>
        ) : (
           <p className="text-white/20 text-xs font-medium uppercase tracking-widest group-hover:text-white/40 transition-colors">Hold Hand</p>
        )}
      </div>
    </div>
  );
};

export default HandHold;