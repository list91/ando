import { useState, useRef, useCallback } from "react";

interface ImageMagnifierProps {
  src: string;
  alt: string;
  className?: string;
  magnifierSize?: number;
  zoomLevel?: number;
}

/**
 * ImageMagnifier - компонент для hover-zoom эффекта
 * Показывает увеличенное превью, следующее за курсором
 * Работает только на desktop (pointer: fine)
 */
const ImageMagnifier = ({
  src,
  alt,
  className = "",
  magnifierSize = 180,
  zoomLevel = 2.5,
}: ImageMagnifierProps) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    // Проверяем, что это не touch-устройство
    if (window.matchMedia("(pointer: fine)").matches) {
      setShowMagnifier(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowMagnifier(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Позиция курсора относительно контейнера
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Позиция magnifier (центрирован на курсоре)
      setMagnifierPosition({
        x: x - magnifierSize / 2,
        y: y - magnifierSize / 2,
      });

      // Позиция фона для zoom-эффекта (в процентах)
      const bgX = (x / rect.width) * 100;
      const bgY = (y / rect.height) * 100;

      setBackgroundPosition({ x: bgX, y: bgY });
    },
    [magnifierSize]
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain select-none"
        loading="eager"
        draggable={false}
      />

      {/* Magnifier lens */}
      {showMagnifier && (
        <div
          className="pointer-events-none absolute rounded-full border-2 border-white/50 shadow-lg transition-opacity duration-150 ease-out"
          style={{
            width: magnifierSize,
            height: magnifierSize,
            left: magnifierPosition.x,
            top: magnifierPosition.y,
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomLevel * 100}%`,
            backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%`,
            backgroundRepeat: "no-repeat",
            opacity: showMagnifier ? 1 : 0,
            // Subtle inner shadow for depth
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.15)",
          }}
        />
      )}
    </div>
  );
};

export default ImageMagnifier;
