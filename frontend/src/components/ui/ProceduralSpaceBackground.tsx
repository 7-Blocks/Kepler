import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';

interface Props {
  viewer: Cesium.Viewer | null;
}

const TILE_SIZE = 2048;

function createOffscreenCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawStars(ctx: CanvasRenderingContext2D, count: number, maxRadius: number, colors: string[]) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * TILE_SIZE;
    const y = Math.random() * TILE_SIZE;
    const radius = Math.random() * maxRadius + 0.1;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Add subtle glow for larger stars
    if (radius > 1) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

function drawNebula(ctx: CanvasRenderingContext2D, count: number) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * TILE_SIZE;
    const y = Math.random() * TILE_SIZE;
    const radius = Math.random() * 400 + 100;
    
    // Soft subtle colors
    const r = Math.floor(Math.random() * 30 + 10);
    const g = Math.floor(Math.random() * 20 + 5);
    const b = Math.floor(Math.random() * 50 + 30);
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

export const ProceduralSpaceBackground: React.FC<Props> = ({ viewer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!viewer || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Resize observer to keep main canvas full screen
    const resizeObserver = new ResizeObserver(() => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    resizeObserver.observe(document.body);
    
    // Pre-generate layers
    const layer1 = createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const ctx1 = layer1.getContext('2d')!;
    ctx1.fillStyle = '#030508';
    ctx1.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    drawNebula(ctx1, 8);
    drawStars(ctx1, 2000, 0.8, ['#ffffff', '#aaddff', '#ffddaa', '#444455']); // Background faint stars
    
    const layer2 = createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const ctx2 = layer2.getContext('2d')!;
    drawStars(ctx2, 800, 1.2, ['#ffffff', '#aaddff', '#ffcc88']); // Midground stars
    
    const layer3 = createOffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const ctx3 = layer3.getContext('2d')!;
    drawStars(ctx3, 100, 0.9, ['#ffffff60', '#88a0c040']); // Subtle distant stars
    
    const drawTiled = (source: HTMLCanvasElement, xOffset: number, yOffset: number) => {
      // Wrap offsets
      let ox = xOffset % TILE_SIZE;
      if (ox < 0) ox += TILE_SIZE;
      let oy = yOffset % TILE_SIZE;
      if (oy < 0) oy += TILE_SIZE;
      
      // Calculate how many tiles we need to cover the screen
      const startX = -ox;
      const startY = -oy;
      
      for (let x = startX; x < canvas.width; x += TILE_SIZE) {
        for (let y = startY; y < canvas.height; y += TILE_SIZE) {
          ctx.drawImage(source, x, y);
        }
      }
    };
    
    const onPreRender = () => {
      // Extract camera state
      const heading = viewer.camera.heading; // 0 to 2PI
      const pitch = viewer.camera.pitch; // -PI/2 to PI/2
      
      // We also use altitude to slightly scale or shift things
      const alt = viewer.camera.positionCartographic.height;
      // Normal map altitude between 1000km and 50000km
      const zoomFactor = Math.max(0, Math.min(1, (alt - 1000000) / 40000000));
      
      // 360 degrees = 4000 pixels of scrolling
      const radToPixels = 4000 / (Math.PI * 2);
      
      const baseX = heading * radToPixels;
      const baseY = pitch * radToPixels;
      
      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw layers with parallax
      // Layer 1 (slowest, background)
      drawTiled(layer1, baseX * 0.1, baseY * 0.1);
      
      // Layer 2 (mid)
      drawTiled(layer2, baseX * 0.3, baseY * 0.3 + (zoomFactor * 50));
      
      // Layer 3 (fastest, foreground)
      drawTiled(layer3, baseX * 0.6, baseY * 0.6 + (zoomFactor * 150));
    };
    
    viewer.scene.preRender.addEventListener(onPreRender);
    
    return () => {
      resizeObserver.disconnect();
      if (viewer && !viewer.isDestroyed()) {
        viewer.scene.preRender.removeEventListener(onPreRender);
      }
    };
  }, [viewer]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ background: '#030508' }}
    />
  );
};
