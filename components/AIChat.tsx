import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Film, MessageCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { generateRomanticResponse, suggestMovies } from '../services/geminiService';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! I'm Luna. I'm here to help make your night magical. Need a movie suggestion or a topic to talk about?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const reply = await generateRomanticResponse(input, messages);
    
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: reply,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleQuickAction = async (action: 'movie' | 'topic' | 'poem') => {
      let prompt = "";
      if (action === 'movie') prompt = "Suggest a romantic movie for us.";
      if (action === 'topic') prompt = "Give us a deep conversation topic.";
      if (action === 'poem') prompt = "Write a short 4 line poem about love and stars.";

      setInput(prompt);
      // We could auto-send, but let's let the user see it first or just auto send for magic feel
      // Let's auto send for smoother UX
      if (isLoading) return;
      
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: prompt,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);
      
      // If movie, use the specialized function sometimes, or just the chat wrapper.
      // Let's use generic chat wrapper for consistency of persona
      const reply = await generateRomanticResponse(prompt, messages);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: reply,
        timestamp: new Date()
      }]);
      setIsLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-24 right-4 w-80 md:w-96 h-96 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-30 animate-fade-in-up">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-indigo-900/40">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-medium">Luna Concierge</h3>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          &times;
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-slate-700/80 text-white/90 rounded-bl-none border border-white/5'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700/50 rounded-2xl px-4 py-2 flex space-x-1 items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 flex space-x-2 overflow-x-auto scrollbar-thin">
          <button onClick={() => handleQuickAction('movie')} className="flex items-center space-x-1 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full text-xs text-purple-200 border border-purple-500/30 whitespace-nowrap transition-colors">
              <Film className="w-3 h-3" /> <span>Movie Idea</span>
          </button>
          <button onClick={() => handleQuickAction('topic')} className="flex items-center space-x-1 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full text-xs text-purple-200 border border-purple-500/30 whitespace-nowrap transition-colors">
              <MessageCircle className="w-3 h-3" /> <span>Topic</span>
          </button>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-slate-900/50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Luna..."
            className="flex-1 bg-slate-800 border-none rounded-full px-4 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none placeholder-white/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-purple-600 rounded-full text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
