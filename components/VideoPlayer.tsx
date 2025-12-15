import React, { useState, useEffect, useRef } from 'react';
import { Play, Link as LinkIcon, AlertCircle, Captions, Loader2, Settings, X, Check } from 'lucide-react';
import { VideoConfig, SyncEvent, SubtitleStyle } from '../types';

// Declare global YT interface
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  videoConfig: VideoConfig | null;
  setVideoConfig: (config: VideoConfig | null) => void;
  isHost: boolean;
  onSyncAction: (type: string, payload: any) => void;
  incomingSyncEvent: SyncEvent | null;
}

const srtToVtt = (srt: string) => {
  return "WEBVTT\n\n" + srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoConfig, 
  setVideoConfig, 
  isHost,
  onSyncAction,
  incomingSyncEvent
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState('');
  
  // Subtitle State
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [showSubSettings, setShowSubSettings] = useState(false);
  const [subStyle, setSubStyle] = useState<SubtitleStyle>({
    fontSize: 24,
    color: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 0.5
  });

  const [partnerBuffering, setPartnerBuffering] = useState(false);
  
  // Refs
  const mp4Ref = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const isRemoteUpdate = useRef(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // --- CLEANUP LOGIC ---
  useEffect(() => {
    // If videoConfig is cleared, reset EVERYTHING
    if (!videoConfig) {
      if (subtitleUrl) {
        URL.revokeObjectURL(subtitleUrl);
        setSubtitleUrl(null);
      }
      setPartnerBuffering(false);
      setInputUrl('');
      setError('');
      setShowSubSettings(false);
      // Reset styles to default
      setSubStyle({
        fontSize: 24,
        color: '#ffffff',
        backgroundColor: '#000000',
        backgroundOpacity: 0.5
      });
      // Destroy YT player if exists
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch(e){}
        ytPlayerRef.current = null;
      }
    }
  }, [videoConfig]);

  // --- YouTube API Loader ---
  useEffect(() => {
    if (videoConfig?.type === 'youtube' && !window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        if (playerContainerRef.current) {
          initYoutubePlayer();
        }
      };
    } else if (videoConfig?.type === 'youtube' && window.YT) {
      initYoutubePlayer();
    }
    // Cleanup/Switching handled by the generic cleanup above or unmount
  }, [videoConfig?.url, videoConfig?.type]);

  const initYoutubePlayer = () => {
    if (!videoConfig || videoConfig.type !== 'youtube') return;
    if (ytPlayerRef.current) return; // Already initialized

    ytPlayerRef.current = new window.YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      videoId: videoConfig.url,
      playerVars: {
        'playsinline': 1,
        'controls': 1,
        'modestbranding': 1,
        'rel': 0,
        'origin': window.location.origin
      },
      events: {
        'onStateChange': onPlayerStateChange
      }
    });
  };

  // --- Sync Event Handling (Incoming) ---
  useEffect(() => {
    if (!incomingSyncEvent) return;

    const { type, payload } = incomingSyncEvent;
    
    // Check for Subtitle Sync first (doesn't require remote update flag check)
    if (type === 'SUBTITLE_CHANGE') {
      const textContent = payload.text;
      if (textContent) {
        // Revoke old
        if (subtitleUrl) URL.revokeObjectURL(subtitleUrl);
        const blob = new Blob([textContent], { type: 'text/vtt' });
        const newUrl = URL.createObjectURL(blob);
        setSubtitleUrl(newUrl);
        return; 
      }
    }

    // Set flag to prevent echoing back the playback event
    isRemoteUpdate.current = true;

    const handleRemote = async () => {
      // Common Pause/Buffer handling
      if (type === 'BUFFER_START') {
        setPartnerBuffering(true);
        if (mp4Ref.current) mp4Ref.current.pause();
        if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();
      } else if (type === 'BUFFER_END') {
        setPartnerBuffering(false);
      }

      // MP4 Handling
      if (videoConfig?.type === 'mp4' && mp4Ref.current) {
        const vid = mp4Ref.current;
        if (type === 'PLAY') {
          setPartnerBuffering(false);
          // Sync time if drift is large (>1s)
          if (Math.abs(vid.currentTime - payload.currentTime) > 1) {
            vid.currentTime = payload.currentTime;
          }
          vid.play().catch(console.error);
        } else if (type === 'PAUSE') {
          vid.pause();
          vid.currentTime = payload.currentTime;
        } else if (type === 'SEEK') {
          vid.currentTime = payload.currentTime;
        }
      }

      // YouTube Handling
      if (videoConfig?.type === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.getPlayerState) {
        const player = ytPlayerRef.current;
        if (type === 'PLAY') {
          setPartnerBuffering(false);
          if (Math.abs(player.getCurrentTime() - payload.currentTime) > 1) {
            player.seekTo(payload.currentTime, true);
          }
          player.playVideo();
        } else if (type === 'PAUSE') {
          player.pauseVideo();
          player.seekTo(payload.currentTime, true);
        } else if (type === 'SEEK') {
          player.seekTo(payload.currentTime, true);
        }
      }

      // Reset flag after a short delay
      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 500);
    };

    handleRemote();

  }, [incomingSyncEvent, videoConfig?.type]);


  // --- Event Emitters (Outgoing) ---

  const onMp4Play = () => {
    if (isRemoteUpdate.current) return;
    onSyncAction('PLAY', { currentTime: mp4Ref.current?.currentTime || 0 });
  };

  const onMp4Pause = () => {
    if (isRemoteUpdate.current) return;
    onSyncAction('PAUSE', { currentTime: mp4Ref.current?.currentTime || 0 });
  };

  const onMp4Seek = () => {
    if (isRemoteUpdate.current) return;
    onSyncAction('SEEK', { currentTime: mp4Ref.current?.currentTime || 0 });
  };
  
  const onMp4Waiting = () => {
    onSyncAction('BUFFER_START', {});
  };

  const onMp4Playing = () => {
    onSyncAction('BUFFER_END', {});
    if (!isRemoteUpdate.current) {
        onSyncAction('PLAY', { currentTime: mp4Ref.current?.currentTime || 0 });
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (isRemoteUpdate.current) return;
    const player = event.target;
    const currentTime = player.getCurrentTime();
    switch(event.data) {
      case 1: // Playing
        onSyncAction('BUFFER_END', {});
        onSyncAction('PLAY', { currentTime });
        break;
      case 2: // Paused
        onSyncAction('PAUSE', { currentTime });
        break;
      case 3: // Buffering
        onSyncAction('BUFFER_START', {});
        break;
    }
  };

  // --- Subtitles ---
  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (entry) => {
      let content = entry.target?.result as string;
      if (file.name.endsWith('.srt')) {
        content = srtToVtt(content);
      }
      
      // Create Local
      const blob = new Blob([content], { type: 'text/vtt' });
      const url = URL.createObjectURL(blob);
      setSubtitleUrl(url);

      // Send to Partner (Shared Subtitles)
      onSyncAction('SUBTITLE_CHANGE', { text: content });
    };
    reader.readAsText(file);
  };

  const handleLoadVideo = () => {
    if (!isHost) return;
    setError('');
    if (!inputUrl.trim()) return;

    // Reset old sub
    if (subtitleUrl) URL.revokeObjectURL(subtitleUrl);
    setSubtitleUrl(null);

    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = inputUrl.match(ytRegex);

    if (ytMatch) {
      setVideoConfig({ url: ytMatch[1], type: 'youtube' });
      return;
    }
    if (inputUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      setVideoConfig({ url: inputUrl, type: 'mp4' });
      return;
    }
    setVideoConfig({ url: inputUrl, type: 'embed' });
  };

  // --- CSS Injection for Subtitles ---
  // Using a style tag to target ::cue pseudo-element
  const subStyles = `
    video::cue {
      font-size: ${subStyle.fontSize}px;
      color: ${subStyle.color};
      background-color: rgba(${parseInt(subStyle.backgroundColor.slice(1, 3), 16)}, ${parseInt(subStyle.backgroundColor.slice(3, 5), 16)}, ${parseInt(subStyle.backgroundColor.slice(5, 7), 16)}, ${subStyle.backgroundOpacity});
      text-shadow: 1px 1px 2px black;
      font-family: 'Inter', sans-serif;
    }
  `;

  // --- RENDER ---

  if (!videoConfig) {
    if (!isHost) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-8 shadow-2xl animate-fade-in-up">
           <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
                  <Play className="w-8 h-8 text-white/30" />
                </div>
                <div className="absolute top-0 right-0 w-4 h-4 bg-purple-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <h2 className="text-3xl font-handwriting text-white mb-1">Waiting for Him...</h2>
                <p className="text-indigo-200/60 text-sm">He is choosing a movie for tonight.</p>
              </div>
           </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-8 shadow-2xl animate-fade-in-up">
        <div className="text-center space-y-4 max-w-md w-full">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
            <Play className="w-8 h-8 text-white/80" />
          </div>
          <h2 className="text-2xl font-handwriting font-bold text-white mb-2">Cinema Screen</h2>
          
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-white/40" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-4 border border-white/20 rounded-xl leading-5 bg-black/50 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition duration-150 ease-in-out"
              placeholder="Paste YouTube or MP4 Link..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
            />
          </div>
          
          {error && (
             <div className="flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
             </div>
          )}

          <button
            onClick={handleLoadVideo}
            className="w-full flex justify-center py-4 px-4 border border-transparent font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all shadow-lg shadow-purple-900/40 hover:scale-[1.02]"
          >
            Start Movie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={playerContainerRef} className="w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 relative group">
       <style>{subStyles}</style>

       {/* Sync Buffering Overlay */}
       {partnerBuffering && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center bg-black/80 p-6 rounded-2xl border border-white/10">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-3" />
              <p className="text-white font-medium">Waiting for partner...</p>
              <p className="text-white/40 text-xs mt-1">They are buffering</p>
            </div>
         </div>
       )}

       {/* Top Right Controls (Close) */}
       {isHost && (
         <button 
           onClick={() => setVideoConfig(null)}
           className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur"
           title="Close Video"
         >
           <X className="w-5 h-5" />
         </button>
       )}

       {/* Subtitle Controls (MP4 only) */}
       {videoConfig.type === 'mp4' && (
         <>
            {/* Toggle Settings Button */}
            <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                <button 
                  onClick={() => setShowSubSettings(!showSubSettings)}
                  className="bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur transition-colors"
                  title="Subtitle Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                <label className="cursor-pointer bg-black/50 hover:bg-black/80 text-white p-2 rounded-full flex items-center space-x-2 backdrop-blur transition-colors">
                  <Captions className="w-5 h-5" />
                  <input 
                    type="file" 
                    accept=".srt,.vtt" 
                    className="hidden" 
                    onChange={handleSubtitleUpload}
                  />
                </label>
            </div>

            {/* Settings Modal */}
            {showSubSettings && (
               <div className="absolute top-16 left-4 z-30 bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-xl w-64 text-xs shadow-2xl animate-fade-in-up">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-white">Subtitle Style</h3>
                    <button onClick={() => setShowSubSettings(false)} className="text-white/50 hover:text-white"><X className="w-3 h-3"/></button>
                  </div>
                  
                  {/* Size */}
                  <div className="mb-3">
                    <label className="block text-white/70 mb-1">Size: {subStyle.fontSize}px</label>
                    <input 
                      type="range" min="12" max="48" 
                      value={subStyle.fontSize} 
                      onChange={(e) => setSubStyle({...subStyle, fontSize: parseInt(e.target.value)})}
                      className="w-full accent-purple-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                     <div>
                       <label className="block text-white/70 mb-1">Text Color</label>
                       <div className="flex space-x-1">
                          {['#ffffff', '#facc15', '#00ff00'].map(c => (
                            <button 
                              key={c} 
                              onClick={() => setSubStyle({...subStyle, color: c})}
                              className={`w-6 h-6 rounded-full border ${subStyle.color === c ? 'border-white' : 'border-transparent'}`}
                              style={{backgroundColor: c}}
                            />
                          ))}
                       </div>
                     </div>
                     <div>
                       <label className="block text-white/70 mb-1">Bg Color</label>
                       <div className="flex space-x-1">
                          {['#000000', '#0f172a', '#ffffff'].map(c => (
                            <button 
                              key={c} 
                              onClick={() => setSubStyle({...subStyle, backgroundColor: c})}
                              className={`w-6 h-6 rounded-full border ${subStyle.backgroundColor === c ? 'border-white' : 'border-transparent'}`}
                              style={{backgroundColor: c}}
                            />
                          ))}
                       </div>
                     </div>
                  </div>

                  {/* Opacity */}
                  <div>
                    <label className="block text-white/70 mb-1">Background Opacity: {Math.round(subStyle.backgroundOpacity * 100)}%</label>
                    <input 
                      type="range" min="0" max="1" step="0.1"
                      value={subStyle.backgroundOpacity} 
                      onChange={(e) => setSubStyle({...subStyle, backgroundOpacity: parseFloat(e.target.value)})}
                      className="w-full accent-purple-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
               </div>
            )}
         </>
       )}

      {/* Players */}
      {videoConfig.type === 'youtube' && (
        <div id="youtube-player" className="w-full h-full" />
      )}

      {videoConfig.type === 'mp4' && (
        <video 
          ref={mp4Ref}
          controls 
          autoPlay 
          className="w-full h-full object-contain"
          onPlay={onMp4Play}
          onPause={onMp4Pause}
          onSeeked={onMp4Seek}
          onWaiting={onMp4Waiting}
          onPlaying={onMp4Playing}
        >
          <source src={videoConfig.url} type="video/mp4" />
          {subtitleUrl && (
            <track label="Subtitles" kind="subtitles" src={subtitleUrl} default />
          )}
          Your browser does not support the video tag.
        </video>
      )}

      {videoConfig.type === 'embed' && (
          <iframe
          width="100%"
          height="100%"
          src={videoConfig.url}
          title="Embedded Content"
          frameBorder="0"
          allowFullScreen
          className="bg-white"
        ></iframe>
      )}
    </div>
  );
};

export default VideoPlayer;
