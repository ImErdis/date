
import React, { useState } from 'react';
import { X, Heart, Sparkles } from 'lucide-react';
import Flower from './Flower';

interface GiftOverlayProps {
  message: string;
  onClose: () => void;
}

const GiftOverlay: React.FC<GiftOverlayProps> = ({ message, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in perspective-1000">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2 z-50"
        >
          <X className="w-8 h-8" />
        </button>

        <style>{`
          .perspective-1000 {
            perspective: 1500px;
          }
          .card-wrapper {
            position: relative;
            transform-style: preserve-3d;
            transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
          }
          /* Increase base size for better visibility */
          .card-wrapper {
             width: 320px;
             height: 440px;
          }
          @media (min-width: 768px) {
            .card-wrapper {
              width: 450px;
              height: 600px;
            }
          }

          /* The front cover that flips */
          .card-cover {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            transform-origin: left center;
            transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
            transform-style: preserve-3d;
            z-index: 20;
          }
          
          .open .card-cover {
            transform: rotateY(-135deg);
          }

          /* The actual visual faces of the cover */
          .cover-front, .cover-back {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 12px;
          }
          
          /* The inside left of the card (back of the cover) */
          .cover-back {
            transform: rotateY(180deg);
            background: linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
          }

          /* The base of the card (right side/inside right) */
          .card-base {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #fff;
            border-radius: 12px;
            z-index: 10;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
            display: flex;
            flex-col: column;
            overflow: hidden;
          }
        `}</style>

        <div className={`card-wrapper ${isOpen ? 'open' : ''}`}>
           
           {/* BACK / RIGHT SIDE (Base) - Always visible, but covered initially */}
           <div className="card-base bg-[#f8f9fa] border-r-4 border-b-4 border-gray-200">
               <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  {/* Flower Container */}
                  <div className="relative w-full h-[60%] flex items-center justify-center overflow-hidden rounded-lg mb-4 [container-type:size]">
                     <div className={`transform transition-all duration-1000 ease-out delay-500 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                        <Flower />
                     </div>
                  </div>
                  
                  {/* Message */}
                  <div className="w-full text-center px-4">
                    <p className={`font-handwriting text-2xl md:text-3xl text-slate-800 transition-all duration-1000 delay-700 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                      {message}
                    </p>
                  </div>
               </div>
           </div>

           {/* FRONT COVER (Rotates) */}
           <div 
             className="card-cover cursor-pointer"
             onClick={!isOpen ? handleOpen : undefined}
           >
              {/* Front Face */}
              <div className="cover-front bg-gradient-to-br from-rose-400 to-pink-600 border-l-2 border-t-2 border-white/20 shadow-xl flex flex-col items-center justify-center">
                  <div className="absolute inset-4 border-2 border-white/30 rounded-lg flex flex-col items-center justify-center space-y-6">
                      <div className="relative">
                         <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse">
                            <Heart className="w-12 h-12 text-white fill-white/80" />
                         </div>
                         <Sparkles className="absolute -top-2 -right-2 text-yellow-200 w-6 h-6 animate-bounce" />
                      </div>
                      <h2 className="text-white font-handwriting text-5xl font-bold drop-shadow-md">For You</h2>
                      <p className="text-white/80 text-xs uppercase tracking-[0.2em] mt-8 bg-white/10 px-4 py-1 rounded-full">Tap to Open</p>
                  </div>
              </div>

              {/* Back Face (Inside Left) */}
              <div className="cover-back border-r border-gray-100">
                  <div className="p-8 text-center opacity-40">
                     <Heart className="w-32 h-32 text-rose-200 fill-rose-100 mx-auto mb-4" />
                     <p className="text-rose-300 font-handwriting text-xl">
                       With all my love...
                     </p>
                  </div>
              </div>
           </div>
           
        </div>
    </div>
  );
};

export default GiftOverlay;
