import { MotionValue, useMotionValue, useSpring } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

export type BubbleEdge =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface BubblePosition {
  edge: BubbleEdge;
  percentage: number; // 0-100, position along the edge
}

const BUBBLE_SIZE = 56; // 14 * 4 (h-14 w-14)
const OFFSET = 10; // Distance from screen edge
const MAGNETIC_THRESHOLD = 60; // Distance in pixels to activate magnetic effect
const MAGNETIC_STRENGTH = 0.4; // Strength of magnetic attraction (0-1)
const SPRING_STIFFNESS = 1000; // High stiffness for immediate response during drag
const SPRING_DAMPING = 50; // Higher damping to prevent overshoot

interface SnapPoint {
  x: number;
  y: number;
  edge: BubbleEdge;
}

/**
 * Converts a BubblePosition to pixel coordinates (top-left corner of bubble)
 */
function positionToPixels(
  position: BubblePosition,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  const halfBubble = BUBBLE_SIZE / 2;
  let centerX: number;
  let centerY: number;

  switch (position.edge) {
    case 'left':
      centerX = halfBubble + OFFSET;
      centerY = (position.percentage / 100) * viewportHeight;
      break;
    case 'right':
      centerX = viewportWidth - halfBubble - OFFSET;
      centerY = (position.percentage / 100) * viewportHeight;
      break;
    case 'top':
      centerX = (position.percentage / 100) * viewportWidth;
      centerY = halfBubble + OFFSET;
      break;
    case 'bottom':
      centerX = (position.percentage / 100) * viewportWidth;
      centerY = viewportHeight - halfBubble - OFFSET;
      break;
    case 'top-left':
      centerX = halfBubble + OFFSET;
      centerY = halfBubble + OFFSET;
      break;
    case 'top-right':
      centerX = viewportWidth - halfBubble - OFFSET;
      centerY = halfBubble + OFFSET;
      break;
    case 'bottom-left':
      centerX = halfBubble + OFFSET;
      centerY = viewportHeight - halfBubble - OFFSET;
      break;
    case 'bottom-right':
      centerX = viewportWidth - halfBubble - OFFSET;
      centerY = viewportHeight - halfBubble - OFFSET;
      break;
  }

  return {
    x: centerX - halfBubble,
    y: centerY - halfBubble,
  };
}

/**
 * Gets all possible snap points for the current viewport
 */
function getSnapPoints(
  viewportWidth: number,
  viewportHeight: number,
): SnapPoint[] {
  const halfBubble = BUBBLE_SIZE / 2;

  return [
    // Edges
    {
      x: halfBubble + OFFSET,
      y: viewportHeight / 2,
      edge: 'left',
    },
    {
      x: viewportWidth - halfBubble - OFFSET,
      y: viewportHeight / 2,
      edge: 'right',
    },
    {
      x: viewportWidth / 2,
      y: halfBubble + OFFSET,
      edge: 'top',
    },
    {
      x: viewportWidth / 2,
      y: viewportHeight - halfBubble - OFFSET,
      edge: 'bottom',
    },
    // Corners
    {
      x: halfBubble + OFFSET,
      y: halfBubble + OFFSET,
      edge: 'top-left',
    },
    {
      x: viewportWidth - halfBubble - OFFSET,
      y: halfBubble + OFFSET,
      edge: 'top-right',
    },
    {
      x: halfBubble + OFFSET,
      y: viewportHeight - halfBubble - OFFSET,
      edge: 'bottom-left',
    },
    {
      x: viewportWidth - halfBubble - OFFSET,
      y: viewportHeight - halfBubble - OFFSET,
      edge: 'bottom-right',
    },
  ];
}

/**
 * Finds the nearest snap point to a given position
 */
function findNearestSnap(
  centerX: number,
  centerY: number,
  viewportWidth: number,
  viewportHeight: number,
): SnapPoint {
  const snapPoints = getSnapPoints(viewportWidth, viewportHeight);
  let nearest = snapPoints[0];
  let minDistance = Infinity;

  for (const snap of snapPoints) {
    const distance = Math.sqrt(
      Math.pow(centerX - snap.x, 2) + Math.pow(centerY - snap.y, 2),
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = snap;
    }
  }

  return nearest;
}

/**
 * Converts pixel coordinates (center of bubble) to BubblePosition
 */
function pixelsToPosition(
  centerX: number,
  centerY: number,
  viewportWidth: number,
  viewportHeight: number,
): BubblePosition {
  const nearestSnap = findNearestSnap(
    centerX,
    centerY,
    viewportWidth,
    viewportHeight,
  );

  let percentage: number;

  switch (nearestSnap.edge) {
    case 'left':
    case 'right':
      // Percentage along vertical axis
      percentage = (centerY / viewportHeight) * 100;
      break;
    case 'top':
    case 'bottom':
      // Percentage along horizontal axis
      percentage = (centerX / viewportWidth) * 100;
      break;
    case 'top-left':
    case 'top-right':
    case 'bottom-left':
    case 'bottom-right':
      // For corners, percentage doesn't matter, but we can use 0
      percentage = 0;
      break;
  }

  // Clamp percentage to valid range
  percentage = Math.max(0, Math.min(100, percentage));

  return {
    edge: nearestSnap.edge,
    percentage,
  };
}

/**
 * Applies magnetic effect to a position during drag
 */
function applyMagneticEffect(
  centerX: number,
  centerY: number,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number } {
  const snapPoints = getSnapPoints(viewportWidth, viewportHeight);
  let finalX = centerX;
  let finalY = centerY;

  for (const snap of snapPoints) {
    const distance = Math.sqrt(
      Math.pow(centerX - snap.x, 2) + Math.pow(centerY - snap.y, 2),
    );

    if (distance < MAGNETIC_THRESHOLD) {
      // Closer = stronger attraction
      const attraction =
        (1 - distance / MAGNETIC_THRESHOLD) * MAGNETIC_STRENGTH;
      finalX += (snap.x - centerX) * attraction;
      finalY += (snap.y - centerY) * attraction;
    }
  }

  return { x: finalX, y: finalY };
}

export interface UseDraggableBubbleOptions {
  position: BubblePosition;
  onPositionChange: (position: BubblePosition) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onClick?: () => void;
  enabled?: boolean;
}

export interface UseDraggableBubbleReturn {
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
}

export function useDraggableBubble({
  position,
  onPositionChange,
  onDragStart,
  onDragEnd,
  onClick,
  enabled = true,
}: UseDraggableBubbleOptions): UseDraggableBubbleReturn {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startCenterX: number;
    startCenterY: number;
  } | null>(null);

  // Get viewport dimensions
  const getViewport = useCallback(() => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);

  // Initialize motion values
  const initialPixels = positionToPixels(
    position,
    getViewport().width,
    getViewport().height,
  );
  const x = useMotionValue(initialPixels.x);
  const y = useMotionValue(initialPixels.y);

  // Create springs for smooth animation
  const springX = useSpring(x, {
    stiffness: SPRING_STIFFNESS,
    damping: SPRING_DAMPING,
  });
  const springY = useSpring(y, {
    stiffness: SPRING_STIFFNESS,
    damping: SPRING_DAMPING,
  });

  // Update position when it changes externally (e.g., from storage)
  useEffect(() => {
    if (!isDragging) {
      const viewport = getViewport();
      const pixels = positionToPixels(
        position,
        viewport.width,
        viewport.height,
      );
      x.set(pixels.x);
      y.set(pixels.y);
    }
  }, [position, isDragging, x, y, getViewport]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!isDragging) {
        const viewport = getViewport();
        const pixels = positionToPixels(
          position,
          viewport.width,
          viewport.height,
        );
        x.set(pixels.x);
        y.set(pixels.y);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, isDragging, x, y, getViewport]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragRef.current || !enabled) return;

      const viewport = getViewport();
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      let centerX = dragRef.current.startCenterX + deltaX;
      let centerY = dragRef.current.startCenterY + deltaY;

      // Apply magnetic effect
      const magnetic = applyMagneticEffect(
        centerX,
        centerY,
        viewport.width,
        viewport.height,
      );
      centerX = magnetic.x;
      centerY = magnetic.y;

      // Constrain to viewport (keep bubble fully visible)
      const halfBubble = BUBBLE_SIZE / 2;
      centerX = Math.max(
        halfBubble,
        Math.min(viewport.width - halfBubble, centerX),
      );
      centerY = Math.max(
        halfBubble,
        Math.min(viewport.height - halfBubble, centerY),
      );

      // Update position directly (no spring during drag for immediate feedback)
      x.set(centerX - halfBubble);
      y.set(centerY - halfBubble);

      // Update stored position in real-time
      const newPosition = pixelsToPosition(
        centerX,
        centerY,
        viewport.width,
        viewport.height,
      );
      onPositionChange(newPosition);
    },
    [isDragging, enabled, x, y, onPositionChange, getViewport],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !dragRef.current || !enabled) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const viewport = getViewport();
      const deltaX = touch.clientX - dragRef.current.startX;
      const deltaY = touch.clientY - dragRef.current.startY;

      let centerX = dragRef.current.startCenterX + deltaX;
      let centerY = dragRef.current.startCenterY + deltaY;

      // Apply magnetic effect
      const magnetic = applyMagneticEffect(
        centerX,
        centerY,
        viewport.width,
        viewport.height,
      );
      centerX = magnetic.x;
      centerY = magnetic.y;

      // Constrain to viewport
      const halfBubble = BUBBLE_SIZE / 2;
      centerX = Math.max(
        halfBubble,
        Math.min(viewport.width - halfBubble, centerX),
      );
      centerY = Math.max(
        halfBubble,
        Math.min(viewport.height - halfBubble, centerY),
      );

      x.set(centerX - halfBubble);
      y.set(centerY - halfBubble);

      const newPosition = pixelsToPosition(
        centerX,
        centerY,
        viewport.width,
        viewport.height,
      );
      onPositionChange(newPosition);
    },
    [isDragging, enabled, x, y, onPositionChange, getViewport],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragRef.current) {
      setIsDragging(false);
      dragRef.current = null;
      return;
    }

    const viewport = getViewport();
    const rect = document
      .querySelector('[data-chat-bubble]')
      ?.getBoundingClientRect();

    if (!rect) {
      setIsDragging(false);
      dragRef.current = null;
      return;
    }

    const currentCenterX = rect.left + rect.width / 2;
    const currentCenterY = rect.top + rect.height / 2;

    // Check if it was a click (small movement)
    const deltaX = Math.abs(dragRef.current.startCenterX - currentCenterX);
    const deltaY = Math.abs(dragRef.current.startCenterY - currentCenterY);

    if (deltaX < 5 && deltaY < 5) {
      setIsDragging(false);
      dragRef.current = null;
      onDragEnd?.();
      onClick?.();
      return;
    }

    // Snap to nearest edge/corner
    const nearestSnap = findNearestSnap(
      currentCenterX,
      currentCenterY,
      viewport.width,
      viewport.height,
    );

    const finalPosition = pixelsToPosition(
      nearestSnap.x,
      nearestSnap.y,
      viewport.width,
      viewport.height,
    );

    onPositionChange(finalPosition);

    // Calculate final pixel position
    const snapX = nearestSnap.x - BUBBLE_SIZE / 2;
    const snapY = nearestSnap.y - BUBBLE_SIZE / 2;

    // Stop dragging first
    setIsDragging(false);

    // Update x and y to trigger spring animation to final position
    // The springs will smoothly animate from current position to snap position
    requestAnimationFrame(() => {
      x.set(snapX);
      y.set(snapY);
    });

    dragRef.current = null;
    onDragEnd?.();
  }, [isDragging, onPositionChange, onDragEnd, onClick, x, y, getViewport]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  // Set up event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      e.preventDefault();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startCenterX: centerX,
        startCenterY: centerY,
      };

      setIsDragging(true);
      onDragStart?.();
    },
    [enabled, onDragStart],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      dragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startCenterX: centerX,
        startCenterY: centerY,
      };

      setIsDragging(true);
      onDragStart?.();
    },
    [enabled, onDragStart],
  );

  return {
    springX,
    springY,
    isDragging,
    handleMouseDown,
    handleTouchStart,
  };
}
