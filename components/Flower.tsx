import React from 'react';
import flowersSvg from '../flowers.svg?raw';

const Flower: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative box-border">
      <style>{`
        .card-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 70cqw;
  width: 70cqw;
  background-color: var(--card-color);
  box-shadow: rgba(0, 0, 0, 0.16) 0px 10px 36px 0px,
    rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;
  border: 10px solid #073223;
}

/* PHOTO */

.main-photo {
  width: 73vh;
  height: 100%;
  display: flex;
  justify-content: center;
}

.pop-out-photo {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 150%;
  overflow: hidden;
}

.main-photo svg {
  min-width: 135%;
  height: 183%;
}
      `}</style>
      <div className="card-container">
        <div className="pop-out-photo">
          <div className="main-photo"
               dangerouslySetInnerHTML={{ __html: flowersSvg }}>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flower;
