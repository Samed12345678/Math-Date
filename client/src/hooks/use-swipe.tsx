import { useState, useCallback } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

interface SwipePosition {
  x: number;
  y: number;
}

interface SwipeHook {
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  swipeDirection: "left" | "right" | "up" | "down" | null;
  swipePosition: SwipePosition;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 100,
}: SwipeHandlers): SwipeHook {
  const [startPos, setStartPos] = useState<SwipePosition>({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState<SwipePosition>({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | "up" | "down" | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setCurrentPos({ x: 0, y: 0 });
    setSwipeDirection(null);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (startPos.x === 0 && startPos.y === 0) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startPos.x;
      const deltaY = touch.clientY - startPos.y;

      // Only update position if horizontal movement is greater than vertical
      // This prevents interference with page scrolling
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();
        setCurrentPos({ x: deltaX, y: 0 });
      }
    },
    [startPos]
  );

  const handleTouchEnd = useCallback(() => {
    const deltaX = currentPos.x;
    const deltaY = currentPos.y;

    // Determine swipe direction based on thresholds
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        setSwipeDirection("right");
        onSwipeRight?.();
      } else {
        setSwipeDirection("left");
        onSwipeLeft?.();
      }
    } else if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        setSwipeDirection("down");
        onSwipeDown?.();
      } else {
        setSwipeDirection("up");
        onSwipeUp?.();
      }
    }

    // Reset positions (but keep swipe direction for animation)
    setStartPos({ x: 0, y: 0 });
    
    // Reset current position after a short delay to allow for animation
    setTimeout(() => {
      setCurrentPos({ x: 0, y: 0 });
      setSwipeDirection(null);
    }, 300);
  }, [currentPos, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    swipeDirection,
    swipePosition: currentPos,
  };
}
