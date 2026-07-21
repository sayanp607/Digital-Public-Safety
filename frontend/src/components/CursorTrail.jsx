import { useEffect, useState } from 'react'

export default function CursorTrail() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      // Keep a history of the last 15 mouse positions
      setTrail((prevTrail) => {
        const newTrail = [...prevTrail, { x: e.clientX, y: e.clientY, id: Date.now() }];
        // Only keep the last 15 positions
        return newTrail.slice(-15);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999999 }}>
      
      {/* The main cursor dot */}
      <div
        style={{
          position: 'absolute',
          top: mousePos.y - 10,
          left: mousePos.x - 10,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#6366f1',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.8)',
          pointerEvents: 'none',
          transition: 'top 0.05s linear, left 0.05s linear',
        }}
      />

      {/* The trailing dots */}
      {trail.map((pos, index) => (
        <div
          key={pos.id + index} // Unique key
          style={{
            position: 'absolute',
            top: pos.y - 8,
            left: pos.x - 8,
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: 'rgba(99, 102, 241, 0.5)',
            transform: `scale(${index / 15})`, // The oldest dots are the smallest
            pointerEvents: 'none',
            transition: 'top 0.1s ease-out, left 0.1s ease-out, opacity 0.3s ease-out',
            opacity: index / 15,
          }}
        />
      ))}
    </div>
  )
}
