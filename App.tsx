
import React, { useState, useEffect, useRef } from 'react';
import StarField from './components/StarField';
import VideoPlayer from './components/VideoPlayer';
import HandHold from './components/HandHold';
import Lobby from './components/Lobby';
import GiftOverlay from './components/GiftOverlay';
import { VideoConfig, ConnectionRole, SyncEvent, SyncActionType } from './types';
import { Maximize2, Minimize2, Wifi } from 'lucide-react';
import { Peer, DataConnection } from 'peerjs';

// Extend Window interface for console command
declare global {
  interface Window {
    sendGift: (message: string, forceLocal?: boolean) => void;
  }
}

const App: React.FC = () => {
  const [videoConfig, setVideoConfig] = useState<VideoConfig | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Connection State
  const [peerId, setPeerId] = useState<string | null>(null);
  const [role, setRole] = useState<ConnectionRole | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Partner State
  const [partnerHolding, setPartnerHolding] = useState(false);
  
  // Gift State
  const [giftData, setGiftData] = useState<{ message: string } | null>(null);
  
  // Sync Logic
  const [incomingSyncEvent, setIncomingSyncEvent] = useState<SyncEvent | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);

  useEffect(() => {
    // Initialize Peer on mount
    const newPeer = new Peer();
    
    newPeer.on('open', (id) => {
      setPeerId(id);
    });

    newPeer.on('connection', (conn) => {
      setupConnection(conn);
      // If we are host and someone joins, send them current state
      setRole('HOST');
      setIsInRoom(true);
    });

    peerRef.current = newPeer;

    // --- GLOBAL CONSOLE COMMAND SETUP ---
    // Defined here to ensure it has access to the refs and state setters
    window.sendGift = (message: string, forceLocal: boolean = false) => {
      const conn = connectionRef.current;
      
      if (forceLocal) {
        console.log(`🎁 Gift triggered locally (Testing): "${message}"`);
        setGiftData({ message });
        return;
      }

      if (conn && conn.open) {
        const payload = { message };
        conn.send({ type: 'SEND_GIFT', payload });
        console.log(`🎁 Gift sent to partner: "${message}"`);
      } else {
        console.warn("⚠️ Not connected to a partner. Use window.sendGift('msg', true) to test locally.");
      }
    };

    return () => {
      newPeer.destroy();
      // Cleanup window function
      window.sendGift = () => console.log("App unmounted");
    };
  }, []);

  const setupConnection = (conn: DataConnection) => {
    connectionRef.current = conn; // Update ref immediately

    conn.on('open', () => {
      // setConnection(conn); // We rely on ref now for sending
      setIsConnecting(false);
      setIsInRoom(true);
      
      // If I am host, I should send my current video config if I have one
      if (role === 'HOST' && videoConfig) {
        conn.send({ type: 'VIDEO_CHANGE', payload: videoConfig });
      }
    });

    conn.on('data', (data: any) => {
      const event = data as SyncEvent;
      
      // Route events
      if (event.type === 'VIDEO_CHANGE') {
        setVideoConfig(event.payload);
      } else if (event.type === 'HAND_HOLD') {
        setPartnerHolding(true);
      } else if (event.type === 'HAND_RELEASE') {
        setPartnerHolding(false);
      } else if (event.type === 'SEND_GIFT') {
        setGiftData(event.payload);
      } else {
        // Pass playback and subtitle events to VideoPlayer
        setIncomingSyncEvent(event);
      }
    });

    conn.on('close', () => {
      connectionRef.current = null;
      setPartnerHolding(false);
      alert("Partner disconnected");
      setIsInRoom(false);
      setRole(null);
      // Reset state on disconnect
      setVideoConfig(null);
    });
  };

  const createRoom = () => {
    setRole('HOST');
  };

  const joinRoom = (hostId: string) => {
    if (!peerRef.current) return;
    setIsConnecting(true);
    setRole('GUEST');
    const conn = peerRef.current.connect(hostId);
    setupConnection(conn);
  };

  const sendSyncEvent = (type: SyncActionType, payload: any) => {
    const conn = connectionRef.current;
    if (conn && conn.open) {
      conn.send({ type, payload });
    }
  };

  // Wrapper for VideoPlayer specific actions
  const handlePlayerSyncAction = (type: string, payload: any) => {
    sendSyncEvent(type as SyncActionType, payload);
  };

  const handleVideoConfigChange = (config: VideoConfig | null) => {
    setVideoConfig(config);
    sendSyncEvent('VIDEO_CHANGE', config);
  };

  const handleHandHoldChange = (isHolding: boolean) => {
    sendSyncEvent(isHolding ? 'HAND_HOLD' : 'HAND_RELEASE', null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020617]">
      <StarField />
      
      {/* Gift Overlay */}
      {giftData && (
        <GiftOverlay 
          message={giftData.message} 
          onClose={() => setGiftData(null)} 
        />
      )}

      {/* Rooftop Silhouette */}
      <div className="absolute bottom-0 left-0 w-full h-1/4 pointer-events-none z-0">
         <svg className="w-full h-full text-[#0f172a]" preserveAspectRatio="none" viewBox="0 0 1200 300" fill="currentColor">
            <path d="M0,300 L0,200 L50,200 L50,180 L150,180 L150,220 L200,220 L200,150 L350,150 L350,250 L500,250 L500,100 L650,100 L650,230 L800,230 L800,190 L950,190 L950,260 L1050,260 L1050,210 L1200,210 L1200,300 Z" opacity="0.6"/>
            <path d="M0,300 L0,250 L100,250 L100,230 L220,230 L220,280 L300,280 L300,200 L450,200 L450,270 L600,270 L600,150 L850,150 L850,260 L900,260 L900,230 L1050,230 L1050,280 L1200,280 L1200,300 Z" />
            {/* String lights */}
            <path d="M0,200 Q300,250 600,200 T1200,200" fill="none" stroke="rgba(255,255,200,0.3)" strokeWidth="2" />
            <circle cx="150" cy="223" r="3" fill="#fef3c7" className="animate-pulse" />
            <circle cx="300" cy="225" r="3" fill="#fef3c7" className="animate-pulse" style={{animationDelay: '0.5s'}} />
            <circle cx="450" cy="223" r="3" fill="#fef3c7" className="animate-pulse" style={{animationDelay: '1s'}} />
            <circle cx="600" cy="200" r="3" fill="#fef3c7" className="animate-pulse" style={{animationDelay: '1.5s'}} />
            <circle cx="750" cy="223" r="3" fill="#fef3c7" className="animate-pulse" style={{animationDelay: '0.2s'}} />
            <circle cx="900" cy="225" r="3" fill="#fef3c7" className="animate-pulse" style={{animationDelay: '0.7s'}} />
            <circle cx="1050" cy="210" r="3" fill="#fef3c7" className="animate-pulse" style={{animationDelay: '1.2s'}} />
         </svg>
         <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-indigo-900/40 to-transparent pointer-events-none"></div>
      </div>

      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 md:p-8">
        
        {/* Title */}
        {!videoConfig && (
          <header className="absolute top-8 text-center animate-fade-in-down transition-opacity duration-500">
            <h1 className="text-4xl md:text-6xl font-handwriting text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
              Date Night
            </h1>
            <p className="text-indigo-200/60 mt-2 font-light tracking-widest text-sm uppercase">
              {isInRoom 
                ? (role === 'HOST' ? "Hosting the Evening" : "Joined for a magical night") 
                : "Under the Stars"}
            </p>
          </header>
        )}

        {/* LOBBY VIEW or APP VIEW */}
        {!isInRoom ? (
          <Lobby 
            onCreateRoom={createRoom} 
            onJoinRoom={joinRoom}
            isConnecting={isConnecting}
            generatedId={peerId}
          />
        ) : (
          <>
            {/* Connected Badge */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-green-900/30 border border-green-500/30 px-3 py-1 rounded-full text-xs text-green-400 backdrop-blur z-20">
              <Wifi className="w-3 h-3" />
              <span>Online with {role === 'HOST' ? 'Her' : 'Him'}</span>
            </div>

            <div className={`
              transition-all duration-700 ease-in-out
              ${videoConfig 
                ? 'w-full max-w-5xl aspect-video' 
                : 'w-full max-w-2xl h-auto'
              }
            `}>
              <VideoPlayer 
                videoConfig={videoConfig} 
                setVideoConfig={handleVideoConfigChange}
                isHost={role === 'HOST'}
                onSyncAction={handlePlayerSyncAction}
                incomingSyncEvent={incomingSyncEvent}
              />
            </div>

            <div className="absolute bottom-8 w-full max-w-7xl px-4 flex items-center justify-center pointer-events-none z-20">
              {/* Center the HandHold */}
              <div className="pointer-events-auto transform translate-y-2">
                 <HandHold onHoldChange={handleHandHoldChange} isPartnerHolding={partnerHolding} />
              </div>

              {/* Float the fullscreen button to the right */}
              <div className="absolute right-4 pointer-events-auto">
                <button 
                  onClick={toggleFullscreen}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur text-white transition-colors border border-white/10 group"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5 opacity-70 group-hover:opacity-100"/> : <Maximize2 className="w-5 h-5 opacity-70 group-hover:opacity-100"/>}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
