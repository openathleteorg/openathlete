import { useGetUserThreadsQuery as useGetMessageThreadsQuery } from '@/api/messages';
import { useGetMeQuery } from '@/api/user';
import { UnreadBadge } from '@/components/ui/unread-badge';
import { useChatbot } from '@/contexts/chatbot';
import { useDraggableBubble } from '@/hooks/useDraggableBubble';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { calculateTotalUnreadCount } from '@/utils/messages';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function ChatBubble() {
  const { bubblePosition, setBubblePosition, openChat, isOpen } = useChatbot();
  const { pathname } = useLocation();
  const { data: messageThreads } = useGetMessageThreadsQuery();
  const { data: currentUser } = useGetMeQuery();

  const unreadCount =
    messageThreads && currentUser
      ? calculateTotalUnreadCount(messageThreads, currentUser.userId)
      : 0;

  const { springX, springY, isDragging, handleMouseDown, handleTouchStart } =
    useDraggableBubble({
      position: bubblePosition,
      onPositionChange: setBubblePosition,
      onClick: openChat,
      enabled: !isOpen && pathname !== getPath(['dashboard', 'messages']),
    });

  // Don't show bubble if chat is open or on messages page
  if (isOpen || pathname === getPath(['dashboard', 'messages'])) {
    return null;
  }

  return (
    <motion.button
      data-chat-bubble
      initial={false}
      animate={{ scale: 1 }}
      whileHover={{ scale: isDragging ? 1 : 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'fixed',
        zIndex: 100,
        cursor: isDragging ? 'grabbing' : 'grab',
        // Always use springs for smooth transitions
        // During drag, x and y are updated directly and springs follow
        left: springX,
        top: springY,
        x: 0,
        y: 0,
      }}
      className={cn(
        'relative flex items-center justify-center',
        'h-14 w-14 rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg hover:shadow-xl',
        'transition-shadow duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'touch-none', // Prevent touch scrolling on mobile
        isDragging && 'shadow-2xl',
      )}
      aria-label={m.chatbot_open()}
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <UnreadBadge count={unreadCount} className="absolute -top-1 -right-1" />
      )}
    </motion.button>
  );
}
