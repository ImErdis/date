import React, { useState } from 'react';
import { Heart, Moon, Copy, ArrowRight, Loader2 } from 'lucide-react';

interface LobbyProps {
  onCreateRoom: () => void;
  onJoinRoom: (id: string) => void;
  isConnecting: boolean;
  generatedId: string | null;
}

const Lobby: React.FC<LobbyProps> = ({ onCreateRoom, onJoinRoom, isConnecting, generatedId }) => {
  const [joinId, setJoinId] = useState('');
  const [mode, setMode] = useState<'SELECT' | 'CREATE' | 'JOIN'>('SELECT');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (generatedId) {
      navigator.clipboard.writeText(generatedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnecting && mode === 'JOIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in-up">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
        <h2 className="text-xl text-white font-handwriting">Flying to the rooftop...</h2>
      </div>
    );
  }

  if (mode === 'CREATE') {
    return (
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 text-center animate-fade-in-up">
        <h2 className="text-2xl font-bold text-white mb-2">Room Created</h2>
        <p className="text-indigo-200 mb-6 text-sm">Share this code with your partner so she can join you.</p>
        
        <div className="relative mb-6">
          <div className="bg-black/50 p-4 rounded-lg border border-purple-500/30 text-2xl tracking-wider font-mono text-purple-200">
             {generatedId || <Loader2 className="w-6 h-6 animate-spin mx-auto"/>}
          </div>
          {generatedId && (
            <button 
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <Copy className={`w-5 h-5 ${copied ? 'text-green-400' : 'text-white/50'}`} />
            </button>
          )}
        </div>

        <div className="text-xs text-white/40 mb-8">
            Waiting for connection...
        </div>
        
        <button onClick={() => setMode('SELECT')} className="text-white/60 hover:text-white text-sm">
          Cancel
        </button>
      </div>
    );
  }

  if (mode === 'JOIN') {
    return (
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 text-center animate-fade-in-up">
        <h2 className="text-2xl font-bold text-white mb-6">Join Rooftop</h2>
        
        <input
          type="text"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          placeholder="Enter his Room Code"
          className="w-full bg-black/50 border border-white/20 rounded-lg p-4 text-center text-white placeholder-white/30 focus:border-purple-500 outline-none mb-6 font-mono text-lg"
        />

        <button
          onClick={() => onJoinRoom(joinId)}
          disabled={!joinId}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
        >
          <span>Join Him</span> <ArrowRight className="w-4 h-4" />
        </button>
        
        <button onClick={() => setMode('SELECT')} className="mt-4 text-white/60 hover:text-white text-sm">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl animate-fade-in-up">
      <button 
        onClick={() => { setMode('CREATE'); onCreateRoom(); }}
        className="group relative bg-indigo-950/40 hover:bg-indigo-900/60 backdrop-blur border border-indigo-500/20 p-8 rounded-2xl transition-all hover:scale-105 text-left"
      >
        <div className="absolute top-4 right-4 bg-indigo-500/20 p-2 rounded-full">
           <Moon className="w-6 h-6 text-indigo-300" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Create Room</h3>
        <p className="text-indigo-200/70 text-sm">Start the date night. You will control the movies and set the mood.</p>
      </button>

      <button 
        onClick={() => setMode('JOIN')}
        className="group relative bg-rose-950/40 hover:bg-rose-900/60 backdrop-blur border border-rose-500/20 p-8 rounded-2xl transition-all hover:scale-105 text-left"
      >
        <div className="absolute top-4 right-4 bg-rose-500/20 p-2 rounded-full">
           <Heart className="w-6 h-6 text-rose-300" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Join Partner</h3>
        <p className="text-rose-200/70 text-sm">Enter the code he gives you to join him on the rooftop.</p>
      </button>
    </div>
  );
};

export default Lobby;
