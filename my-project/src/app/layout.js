"use client";
import { useEffect, useState, useRef } from 'react';
import './globals.css';

export default function RootLayout({ children }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);
  const counterRef = useRef(0); 

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX: x, clientY: y } = e;
      setPosition({ x, y });
      
      if (Math.random() > 0.9) {
        counterRef.current += 1;
        const newRipple = { 
          x, 
          y, 
          id: `${Date.now()}-${counterRef.current}` 
        };
        setRipples((prev) => [...prev.slice(-15), newRipple]);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <html lang="zh">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          @font-face {
            font-family: 'YourCustomFont';
            src: url('/ziti/Kingnammm-Maiyuan-II-Regular-2.ttf') format('truetype'); 
          }
        `}</style>
      </head>
      <body>
        {/* 1. 橙色狗爪光标 - 确保 pointer-events: none 在 CSS 中已设置 */}
        <div 
          className="cursor-paw" 
          style={{ 
            left: position.x, 
            top: position.y,
            transform: 'translate(-50%, -50%)',
            position: 'fixed',
            zIndex: 9999,
            pointerEvents: 'none' // 双重保险，防止挡住点击
          }} 
        />

        {/* 2. 动态足迹 */}
        {ripples.map(r => (
          <div 
            key={r.id} 
            className="ripple" 
            style={{ 
              left: r.x, 
              top: r.y,
              transform: 'translate(-50%, -50%)',
              position: 'fixed',
              pointerEvents: 'none'
            }} 
          />
        ))}
        
        {/* 3. 主容器：移除 p-12 和 relative，防止干扰 page.js 的 fixed 定位 */}
        <main>
          {children}
        </main>
        {/* 4. 页脚声明 */}
        <footer style={{
        textAlign: 'center',
        padding: '2rem 0.1rem',
        color: '#666',
        fontSize: '1.0rem',
        fontFamily: 'YourCustomFont, sans-serif', // 使用你的自定义字体
        
        
    }}>
      <p style={{
        margin:0,
        fontWeight: 'bold'
      }}>
        © {new Date().getFullYear()} mupics. 本网站所有内容（包括但不限于图片、设计）仅供个人欣赏，未经明确书面授权，禁止任何形式的转载、复制或用于商业用途。
      </p>
      </footer>
      </body>
    </html>
  );
}