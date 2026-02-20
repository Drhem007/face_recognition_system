import React from 'react';

const ULogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Orange background */}
      <rect width="100" height="100" fill="#F39C12" />
      
      {/* Three horizontal stripes at the top-left */}
      <rect x="20" y="12" width="15" height="2" fill="white" />
      <rect x="20" y="16" width="15" height="2" fill="white" />
      <rect x="20" y="20" width="15" height="2" fill="white" />
      
      {/* One single, continuous U shape */}
      <path 
        d="M20 25H35V60C35 68 41 71 45 71H55C59 71 65 68 65 60V12H80V60C80 76 68 85 56 85H44C32 85 20 76 20 60V25Z" 
        fill="white" 
      />
    </svg>
  );
};

export default ULogo; 