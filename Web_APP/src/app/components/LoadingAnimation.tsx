"use client";

import { useEffect, useState, useRef } from 'react';
import SignInForm from './SignInForm';
import ULogo from './ULogo';

interface LoadingAnimationProps {
  onSignIn?: (email: string, password: string) => void;
}

const LoadingAnimation = ({ onSignIn }: LoadingAnimationProps) => {
  const [animationStage, setAnimationStage] = useState(0);
  const animationStartedRef = useRef(false);
  
  useEffect(() => {
    // Prevent animation from starting multiple times
    if (animationStartedRef.current) return;
    animationStartedRef.current = true;
    
    // Stage 1: U in the middle (initial appearance)
    const stage1 = setTimeout(() => setAnimationStage(1), 500);
    // Stage 2: U slides to left
    const stage2 = setTimeout(() => setAnimationStage(2), 1300);
    // Stage 3: Text appears
    const stage3 = setTimeout(() => setAnimationStage(3), 2200);
    // Stage 4: Logo slides up and form appears
    const stage4 = setTimeout(() => setAnimationStage(4), 3000);
    
    return () => {
      clearTimeout(stage1);
      clearTimeout(stage2);
      clearTimeout(stage3);
      clearTimeout(stage4);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Logo animation container */}
      <div 
        className={`absolute flex items-center transition-all duration-1000 ease-in-out transform ${
          animationStage >= 4 ? '-translate-y-[30vh]' : '-translate-y-[10vh]'
        }`}
      >
        {/* The "U" logo part - centered initially then moves left */}
        <div 
          className={`relative transition-all duration-700 ease-in-out ${
            animationStage >= 1 ? 'opacity-100' : 'opacity-0 scale-95'
          }`}
          style={{
            position: 'relative',
            left: animationStage < 2 ? '50%' : '0',
            transform: animationStage < 2 ? 'translateX(-50%)' : 'none',
            transition: 'left 0.7s ease-in-out, transform 0.7s ease-in-out, opacity 0.7s ease-in-out'
          }}
        >
          {/* Exact U logo that matches the image */}
          <div className="w-[120px] h-[120px]">
            <ULogo width={120} height={120} />
          </div>
        </div>
        
        {/* Vertical line separator */}
        <div 
          className={`w-0.5 h-32 mx-4 bg-[#F39C12] transition-all duration-500 ease-in-out ${
            animationStage >= 2 ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
          }`}
        ></div>
        
        {/* Text part */}
        <div 
          className={`flex flex-col text-[#005694] font-bold transition-all duration-700 ease-in-out ${
            animationStage >= 3 ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-10'
          }`}
        >
          <span className="text-2xl tracking-wide">ECOLE</span>
          <span className="text-2xl tracking-wide">POLYTECHNIQUE</span>
          <span className="text-2xl tracking-wide">D&apos;AGADIR</span>
        </div>
      </div>

      {/* Sign in form - appears when logo slides up */}
      <div 
        className={`absolute transition-all duration-1000 ease-in-out transform ${
          animationStage >= 4 ? 'opacity-100 translate-y-[10vh]' : 'opacity-0 translate-y-32'
        }`}
        style={{ transitionDelay: animationStage >= 4 ? '300ms' : '0ms' }}
      >
        <SignInForm showLogo={false} onSubmit={onSignIn} />
      </div>
    </div>
  );
};

export default LoadingAnimation; 