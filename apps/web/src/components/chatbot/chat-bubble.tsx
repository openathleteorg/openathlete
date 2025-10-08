import { useChatbot } from '@/contexts/chatbot';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export function ChatBubble() {
  const { bubblePosition, setBubblePosition, openChat, isOpen } = useChatbot();
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: bubblePosition.x,
        startPosY: bubblePosition.y,
      };
    },
    [bubblePosition],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      const percentDeltaX = (deltaX / window.innerWidth) * 100;
      const percentDeltaY = (deltaY / window.innerHeight) * 100;

      let newX = dragRef.current.startPosX + percentDeltaX;
      let newY = dragRef.current.startPosY + percentDeltaY;

      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      setBubblePosition({ x: newX, y: newY });
    },
    [isDragging, setBubblePosition],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragRef.current) {
      const deltaX = Math.abs(dragRef.current.startPosX - bubblePosition.x);
      const deltaY = Math.abs(dragRef.current.startPosY - bubblePosition.y);

      // Small movement: treat as click
      if (deltaX < 0.5 && deltaY < 0.5) {
        openChat();
      } else {
        // Snap to nearest edge
        const distanceToLeft = bubblePosition.x;
        const distanceToRight = 100 - bubblePosition.x;
        const distanceToTop = bubblePosition.y;
        const distanceToBottom = 100 - bubblePosition.y;

        const minDistance = Math.min(
          distanceToLeft,
          distanceToRight,
          distanceToTop,
          distanceToBottom,
        );

        let newX = bubblePosition.x;
        let newY = bubblePosition.y;

        if (minDistance === distanceToLeft) {
          newX = 0;
        } else if (minDistance === distanceToRight) {
          newX = 100;
        } else if (minDistance === distanceToTop) {
          newY = 0;
        } else if (minDistance === distanceToBottom) {
          newY = 100;
        }

        setBubblePosition({ x: newX, y: newY });
      }
    }
    setIsDragging(false);
    dragRef.current = null;
  }, [isDragging, bubblePosition, openChat, setBubblePosition]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (isOpen) return null;

  const getPosition = () => {
    const margin = 16;
    const bubbleSize = 56;

    let left: string;
    let top: string;

    if (bubblePosition.x === 0) {
      left = `${margin}px`;
    } else if (bubblePosition.x === 100) {
      left = `calc(100% - ${margin + bubbleSize}px)`;
    } else {
      left = `calc(${bubblePosition.x}% - ${bubbleSize / 2}px)`;
    }

    if (bubblePosition.y === 0) {
      top = `${margin}px`;
    } else if (bubblePosition.y === 100) {
      top = `calc(100% - ${margin + bubbleSize}px)`;
    } else {
      top = `calc(${bubblePosition.y}% - ${bubbleSize / 2}px)`;
    }

    return { left, top };
  };

  const position = getPosition();

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{
        scale: 1,
        left: position.left,
        top: position.top,
      }}
      whileHover={{ scale: isDragging ? 1 : 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        left: { type: 'spring', stiffness: 300, damping: 30 },
        top: { type: 'spring', stiffness: 300, damping: 30 },
      }}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        zIndex: 9998,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={cn(
        'flex items-center justify-center',
        'h-14 w-14 rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg hover:shadow-xl',
        'transition-shadow duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isDragging && 'shadow-2xl',
      )}
      aria-label={m.chatbot_open()}
    >
      <MessageCircle className="h-6 w-6" />
    </motion.button>
  );
}
