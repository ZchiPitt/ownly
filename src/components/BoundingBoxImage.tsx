import { useState, useRef, useEffect, useCallback } from 'react';

interface BoundingBoxImageProps {
  src: string;
  alt: string;
  /** Bounding box as [x%, y%, width%, height%] in 0-100 range */
  bbox?: [number, number, number, number] | null;
  className?: string;
  imgClassName?: string;
  showOverlay?: boolean;
  boxColor?: string;
  boxStyle?: 'dashed' | 'solid' | 'dotted';
  boxWidth?: number;
  onClick?: () => void;
}

function isFullImageBbox(bbox: [number, number, number, number]): boolean {
  return bbox[0] === 0 && bbox[1] === 0 && bbox[2] >= 95 && bbox[3] >= 95;
}

export function BoundingBoxImage({
  src,
  alt,
  bbox,
  className = '',
  imgClassName = '',
  showOverlay = true,
  boxColor = '#ef4444',
  boxStyle = 'dashed',
  boxWidth = 2,
  onClick,
}: BoundingBoxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [overlayRect, setOverlayRect] = useState<{
    left: number; top: number; width: number; height: number;
  } | null>(null);

  const shouldShowOverlay = showOverlay && bbox && !isFullImageBbox(bbox);

  const calculateOverlay = useCallback(() => {
    if (!shouldShowOverlay || !bbox || !imgRef.current || !containerRef.current) {
      setOverlayRect(null);
      return;
    }

    const container = containerRef.current;
    const img = imgRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (!naturalWidth || !naturalHeight) {
      setOverlayRect(null);
      return;
    }

    // Calculate rendered image dimensions within object-contain
    const scale = Math.min(
      containerWidth / naturalWidth,
      containerHeight / naturalHeight
    );
    const renderedWidth = naturalWidth * scale;
    const renderedHeight = naturalHeight * scale;
    const offsetX = (containerWidth - renderedWidth) / 2;
    const offsetY = (containerHeight - renderedHeight) / 2;

    setOverlayRect({
      left: offsetX + (bbox[0] / 100) * renderedWidth,
      top: offsetY + (bbox[1] / 100) * renderedHeight,
      width: (bbox[2] / 100) * renderedWidth,
      height: (bbox[3] / 100) * renderedHeight,
    });
  }, [shouldShowOverlay, bbox]);

  const handleImageLoad = useCallback(() => {
    calculateOverlay();
  }, [calculateOverlay]);

  // Recalculate on container resize
  useEffect(() => {
    if (!shouldShowOverlay || !containerRef.current) return;

    const observer = new ResizeObserver(() => {
      calculateOverlay();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [shouldShowOverlay, calculateOverlay]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`w-full h-full object-contain ${imgClassName}`}
        onLoad={handleImageLoad}
        draggable={false}
      />
      {overlayRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${overlayRect.left}px`,
            top: `${overlayRect.top}px`,
            width: `${overlayRect.width}px`,
            height: `${overlayRect.height}px`,
            border: `${boxWidth}px ${boxStyle} ${boxColor}`,
            borderRadius: '4px',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
