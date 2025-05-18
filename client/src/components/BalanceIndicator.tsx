import { useRef, useEffect } from 'react';

interface BalanceIndicatorProps {
  balanceValue: number;
  balanceCG: number;
  balanceStatus: 'safe' | 'moderate' | 'warning' | 'caution';
  onWidthChange?: (width: number) => void;
}

export default function BalanceIndicator({ 
  balanceValue, 
  balanceCG, 
  balanceStatus,
  onWidthChange 
}: BalanceIndicatorProps) {
  // Reference for measuring the balance scale width
  const balanceScaleRef = useRef<HTMLDivElement>(null);
  
  // Update width measurement on mount and window resize
  useEffect(() => {
    const updateWidth = () => {
      if (balanceScaleRef.current) {
        const width = balanceScaleRef.current.getBoundingClientRect().width;
        if (onWidthChange) {
          onWidthChange(width);
        }
      }
    };
    
    // Initial measurement
    updateWidth();
    
    // Add resize listener
    window.addEventListener('resize', updateWidth);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateWidth);
    };
  }, [onWidthChange]);
  
  // Format the status text
  const statusText = 
    balanceStatus === 'safe' ? 'Safe' : 
    balanceStatus === 'moderate' ? 'Moderate' :
    balanceStatus === 'warning' ? 'Warning' : 'Caution';
  
  // Format the status color
  const statusColor = 
    balanceStatus === 'safe' ? 'text-green-500' : 
    balanceStatus === 'moderate' ? 'text-green-400' :
    balanceStatus === 'warning' ? 'text-yellow-500' : 'text-orange-500';
  
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-medium">Balance</h3>
        <span className={`text-xs font-medium ${statusColor}`}>
          {statusText}
        </span>
      </div>
      
      {/* Balance Meter */}
      <div ref={balanceScaleRef} className="h-8 relative mb-1 rounded-md">
        {/* Container for the gradient background with overflow hidden - flipped direction for FWD right, AFT left */}
        <div className="absolute inset-0 overflow-hidden" style={{ 
          background: 'linear-gradient(to left, #ea580c 0%, #f59e0b 20%, #84cc16 40%, #22c55e 50%, #84cc16 60%, #f59e0b 80%, #ea580c 100%)'
        }}></div>
        
        {/* Indicator needle - light blue/teal needle, extending equally past top and bottom */}
        <div 
          className="absolute shadow-md"
          style={{ 
            backgroundColor: '#40C4D9', // Light blue/teal color
            width: '1px',
            // For flipped scale (FWD right, AFT left): invert the percentage calculation
            // Calculate position by inverting the scale: 100% - original calculation
            left: `${100 - Math.max(0, Math.min(100, ((Math.max(18, Math.min(88, balanceCG)) - 18) / 70) * 100))}%`,
            top: '-50%', // Extends 50% above
            height: '200%', // Makes it extend 50% below as well
            transform: 'translateX(-50%)',
            transition: 'left 0.3s ease-out',
            zIndex: 10, // Bring forward
            boxShadow: '0px 0px 3px rgba(0, 0, 0, 0.3)' // Add slight shadow for better visibility
          }}
        >
          {/* Current CG value above the needle */}
          <div 
            className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: 'rgba(64, 196, 217, 0.9)', // Matching the #40C4D9 needle color
              color: 'white',
              textShadow: '0px 0px 2px rgba(0, 0, 0, 0.5)'
            }}
          >
            {balanceCG.toFixed(2)}°
          </div>
        </div>
        
        {/* Labels - flipped so FWD is on right and AFT is on left */}
        <div className="absolute inset-0 flex justify-between px-2 items-center text-[10px] font-medium text-white">
          <span>AFT</span>
          <span className="mx-auto">BALANCED</span>
          <span>FWD</span>
        </div>
      </div>
      
      {/* CG Scale Markings - flipped for FWD right, AFT left */}
      <div className="relative h-8 mb-4">
        {/* Generate tick marks and labels */}
        {[...Array(71)].map((_, i) => {
          // Invert the position calculation for the flipped scale
          const position = 100 - (i * (100 / 70)); // 100-0% across the width (right to left)
          const value = 18 + i; // 18-88 degrees
          const isMajorTick = value % 5 === 0; // Every 5th tick is major
          const isEndpoint = value === 18 || value === 88; // First or last value
          
          return (
            <div key={`tick-${i}`}>
              {/* Tick mark - thicker for every 5th mark */}
              <div 
                className={`absolute top-0 ${isMajorTick ? 'w-0.5' : 'w-px'} ${isMajorTick ? 'bg-gray-500 dark:bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'}`}
                style={{ 
                  left: `${position}%`,
                  height: isMajorTick ? '8px' : '5px'
                }}
              ></div>
              
              {/* Label (only on major ticks or endpoints) */}
              {(isMajorTick || isEndpoint) && (
                <div 
                  className={`absolute text-[9px] ${isEndpoint ? 'font-bold' : 'font-medium'} ${isEndpoint ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}
                  style={{ 
                    left: `${position}%`, 
                    top: '12px',
                    transform: 'translateX(-50%)'
                  }}
                >
                  {value}°
                </div>
              )}
            </div>
          );
        })}
        
        {/* Aircraft-specific balance reference lines */}
        <div className="absolute inset-0 border-t border-gray-300 dark:border-gray-700 opacity-30" style={{ top: '25px' }}>
          {/* Empty - removed the center line per user request */}
        </div>
      </div>
    </div>
  );
}