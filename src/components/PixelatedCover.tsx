import { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  /** 0 = très pixelisé, 1 = image nette */
  reveal: number;
  className?: string;
}

export function PixelatedCover({ src, reveal, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = 400;
      canvas.width = size;
      canvas.height = size;

      const t = Math.min(1, Math.max(0, reveal));
      // Peu de blocs = très pixelisé ; plus de blocs = image nette (reveal 0 → 1)
      const blocks = Math.max(8, Math.round(8 + t * 40));

      const sw = img.width;
      const sh = img.height;
      const side = Math.min(sw, sh);
      const sx = (sw - side) / 2;
      const sy = (sh - side) / 2;

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, blocks, blocks);
      ctx.drawImage(canvas, 0, 0, blocks, blocks, 0, 0, size, size);
      setReady(true);
    };
    img.onerror = () => setReady(false);
    img.src = src;
  }, [src, reveal]);

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full object-cover transition-opacity duration-150 ${ready ? "opacity-100" : "opacity-40"} ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}