import React from "react";

/**
 * FlipText (3D Rolling Entrance)
 * Wraps content and rolls it into view along the 3D X-axis.
 */
export function FlipText({ className = "", children, delay = 0 }) {
  return (
    <div 
      className={`relative overflow-hidden block leading-tight ${className}`}
      style={{ perspective: "1000px" }}
    >
      <div 
        className="opacity-0"
        style={{ 
          transformStyle: "preserve-3d",
          transformOrigin: "bottom center",
          animation: `rollUpEntrance 1.2s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s forwards`
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes rollUpEntrance {
          0% { 
            opacity: 0;
            transform: rotateX(-90deg) translateY(20px); 
          }
          100% { 
            opacity: 1;
            transform: rotateX(0deg) translateY(0); 
          }
        }
      `}</style>
    </div>
  );
}

export default FlipText;