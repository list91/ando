import { useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { getLargeUrl } from "@/lib/imageUrl";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  alt?: string;
}

const ImageLightbox = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  alt = "Product image",
}: ImageLightboxProps) => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const swipeDirection = useRef<"horizontal" | "vertical" | null>(null);
  const hasSwiped = useRef<boolean>(false);

  const getImageIndex = useCallback(
    (index: number) => {
      return (index + images.length) % images.length;
    },
    [images.length]
  );

  const goToPrev = useCallback(() => {
    onNavigate(getImageIndex(currentIndex - 1));
  }, [currentIndex, getImageIndex, onNavigate]);

  const goToNext = useCallback(() => {
    onNavigate(getImageIndex(currentIndex + 1));
  }, [currentIndex, getImageIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrev();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, goToPrev, goToNext]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipeDirection.current = null;
    hasSwiped.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (images.length <= 1 || hasSwiped.current) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determine direction on first significant movement
    if (
      swipeDirection.current === null &&
      (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)
    ) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        swipeDirection.current = "vertical";
        return;
      } else {
        swipeDirection.current = "horizontal";
      }
    }

    if (swipeDirection.current === "vertical") {
      return;
    }

    // Horizontal swipe - instant navigation at threshold
    if (swipeDirection.current === "horizontal") {
      const threshold = 60; // px for switch

      if (deltaX < -threshold) {
        goToNext();
        hasSwiped.current = true;
        touchStartX.current = e.touches[0].clientX;
      } else if (deltaX > threshold) {
        goToPrev();
        hasSwiped.current = true;
        touchStartX.current = e.touches[0].clientX;
      }
    }
  };

  const handleTouchEnd = () => {
    swipeDirection.current = null;
    hasSwiped.current = false;
  };

  // Click outside to close (on overlay, not on image)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/95" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Image container with click-outside detection */}
          <div
            className="w-full h-full flex items-center justify-center p-4 md:p-16"
            onClick={handleOverlayClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              key={currentIndex}
              src={getLargeUrl(images[currentIndex])}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none animate-in fade-in-0 zoom-in-95 duration-200"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Dots indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(idx)}
                  className="p-1"
                  aria-label={`Go to image ${idx + 1}`}
                >
                  <span
                    className={`block w-2 h-2 rounded-full transition-all ${
                      idx === currentIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 text-white/70 text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ImageLightbox;
