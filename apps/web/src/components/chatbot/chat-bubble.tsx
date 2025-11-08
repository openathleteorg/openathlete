import { useGetUserThreadsQuery as useGetMessageThreadsQuery } from '@/api/messages';
import { useGetMeQuery } from '@/api/user';
import { UnreadBadge } from '@/components/ui/unread-badge';
import { useChatbot } from '@/contexts/chatbot';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { calculateTotalUnreadCount } from '@/utils/messages';
import { cn } from '@/utils/shadcn';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const BUBBLE_SIZE = 56; // 14 * 4 (h-14 w-14)
const OFFSET = 10; // Décollage de 10px du bord de l'écran
const MAGNETIC_THRESHOLD = 50; // Distance en pixels pour activer l'effet magnétique
const MAGNETIC_STRENGTH = 0.3; // Force de l'attraction magnétique (0-1)

type SnapPosition = {
  x: number;
  y: number;
  type:
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
};

export function ChatBubble() {
  const { bubblePosition, setBubblePosition, openChat, isOpen } = useChatbot();
  const [isDragging, setIsDragging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const { pathname } = useLocation();
  const { data: messageThreads } = useGetMessageThreadsQuery();
  const { data: currentUser } = useGetMeQuery();

  const unreadCount =
    messageThreads && currentUser
      ? calculateTotalUnreadCount(messageThreads, currentUser.userId)
      : 0;

  // Convertit la position en pourcentage en pixels absolus
  const getPositionInPixels = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const centerX = (bubblePosition.x / 100) * viewportWidth;
    const centerY = (bubblePosition.y / 100) * viewportHeight;

    // Centre la bulle sur la position
    return {
      x: centerX - BUBBLE_SIZE / 2,
      y: centerY - BUBBLE_SIZE / 2,
    };
  }, [bubblePosition]);

  // Initialise les motion values directement avec la position sauvegardée
  // pour éviter l'animation au refresh
  const initialPosition = getPositionInPixels();
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);
  // Springs avec des paramètres optimisés pour une animation visible et fluide
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  // Pendant le drag, on utilise directement x et y (sans spring)
  // Après le drag, on utilise springX et springY pour un mouvement smooth

  // Calcule les positions de snap possibles
  // Les positions sont calculées pour le centre de la bulle
  // Pour que la bulle soit décollée de OFFSET pixels du bord :
  // - Bord gauche : centre à BUBBLE_SIZE/2 + OFFSET
  // - Bord droit : centre à viewportWidth - BUBBLE_SIZE/2 - OFFSET
  const getSnapPositions = useCallback((): SnapPosition[] => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const halfBubble = BUBBLE_SIZE / 2;

    return [
      // Bords
      {
        x: halfBubble + OFFSET,
        y: viewportHeight / 2,
        type: 'left',
      },
      {
        x: viewportWidth - halfBubble - OFFSET,
        y: viewportHeight / 2,
        type: 'right',
      },
      {
        x: viewportWidth / 2,
        y: halfBubble + OFFSET,
        type: 'top',
      },
      {
        x: viewportWidth / 2,
        y: viewportHeight - halfBubble - OFFSET,
        type: 'bottom',
      },
      // Coins
      {
        x: halfBubble + OFFSET,
        y: halfBubble + OFFSET,
        type: 'top-left',
      },
      {
        x: viewportWidth - halfBubble - OFFSET,
        y: halfBubble + OFFSET,
        type: 'top-right',
      },
      {
        x: halfBubble + OFFSET,
        y: viewportHeight - halfBubble - OFFSET,
        type: 'bottom-left',
      },
      {
        x: viewportWidth - halfBubble - OFFSET,
        y: viewportHeight - halfBubble - OFFSET,
        type: 'bottom-right',
      },
    ];
  }, []);

  // Trouve la position de snap la plus proche
  const findNearestSnap = useCallback(
    (x: number, y: number): SnapPosition => {
      const snapPositions = getSnapPositions();
      let nearest = snapPositions[0];
      let minDistance = Infinity;

      for (const snap of snapPositions) {
        const distance = Math.sqrt(
          Math.pow(x - snap.x, 2) + Math.pow(y - snap.y, 2),
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearest = snap;
        }
      }

      return nearest;
    },
    [getSnapPositions],
  );

  // Applique l'effet magnétique pendant le drag
  const applyMagneticEffect = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      const snapPositions = getSnapPositions();
      let finalX = x;
      let finalY = y;

      for (const snap of snapPositions) {
        const distance = Math.sqrt(
          Math.pow(x - snap.x, 2) + Math.pow(y - snap.y, 2),
        );

        if (distance < MAGNETIC_THRESHOLD) {
          // Plus on est proche, plus l'attraction est forte
          const attraction =
            (1 - distance / MAGNETIC_THRESHOLD) * MAGNETIC_STRENGTH;
          finalX += (snap.x - x) * attraction;
          finalY += (snap.y - y) * attraction;
        }
      }

      return { x: finalX, y: finalY };
    },
    [getSnapPositions],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const currentX = rect.left + rect.width / 2;
    const currentY = rect.top + rect.height / 2;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: currentX,
      startPosY: currentY,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      let newX = dragRef.current.startPosX + deltaX;
      let newY = dragRef.current.startPosY + deltaY;

      // Applique l'effet magnétique
      const magnetic = applyMagneticEffect(newX, newY);
      newX = magnetic.x;
      newY = magnetic.y;

      // Contraintes pour garder la bulle entièrement visible
      // Le centre doit être entre BUBBLE_SIZE/2 et viewportWidth - BUBBLE_SIZE/2
      const halfBubble = BUBBLE_SIZE / 2;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      newX = Math.max(halfBubble, Math.min(viewportWidth - halfBubble, newX));
      newY = Math.max(halfBubble, Math.min(viewportHeight - halfBubble, newY));

      // Met à jour directement les motion values pour un feedback immédiat
      x.set(newX - halfBubble);
      y.set(newY - halfBubble);

      // Convertit en pourcentage pour le stockage
      const percentX = (newX / viewportWidth) * 100;
      const percentY = (newY / viewportHeight) * 100;

      setBubblePosition({ x: percentX, y: percentY });
    },
    [isDragging, setBubblePosition, applyMagneticEffect, x, y],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragRef.current) {
      const rect = document
        .querySelector('[data-chat-bubble]')
        ?.getBoundingClientRect();
      if (!rect) {
        setIsDragging(false);
        dragRef.current = null;
        return;
      }

      const currentX = rect.left + rect.width / 2;
      const currentY = rect.top + rect.height / 2;

      const deltaX = Math.abs(dragRef.current.startPosX - currentX);
      const deltaY = Math.abs(dragRef.current.startPosY - currentY);

      // Small movement: treat as click
      if (deltaX < 5 && deltaY < 5) {
        openChat();
        setIsDragging(false);
        dragRef.current = null;
        return;
      }

      // Toujours faire un snap vers le bord/corner le plus proche
      const nearestSnap = findNearestSnap(currentX, currentY);
      const percentX = (nearestSnap.x / window.innerWidth) * 100;
      const percentY = (nearestSnap.y / window.innerHeight) * 100;

      setBubblePosition({ x: percentX, y: percentY });

      // Calcule la position de snap finale
      const snapX = nearestSnap.x - BUBBLE_SIZE / 2;
      const snapY = nearestSnap.y - BUBBLE_SIZE / 2;

      // On arrête le drag d'abord pour passer au mode spring
      // Cela permet aux springs d'animer depuis la position actuelle
      setIsDragging(false);

      // Utilise requestAnimationFrame pour s'assurer que le changement de mode
      // est pris en compte avant de mettre à jour les valeurs
      requestAnimationFrame(() => {
        // Met à jour x et y vers la position de snap
        // Les springs animeront automatiquement vers cette position
        // Cela crée une belle animation fluide visible
        x.set(snapX);
        y.set(snapY);
      });
    } else {
      // Si ce n'était pas un drag (juste un clic), on arrête simplement
      setIsDragging(false);
    }
    dragRef.current = null;
  }, [
    isDragging,
    openChat,
    setBubblePosition,
    findNearestSnap,
    x,
    y,
    springX,
    springY,
  ]);

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

  // Met à jour les motion values avec la position actuelle (sauf pendant le drag)
  // Les springs suivront automatiquement
  useEffect(() => {
    if (!isDragging && isInitialized) {
      const position = getPositionInPixels();
      x.set(position.x);
      y.set(position.y);
    }
  }, [bubblePosition, getPositionInPixels, isDragging, isInitialized, x, y]);

  // Marque comme initialisé après le premier rendu pour éviter l'animation au refresh
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Ne pas afficher la bulle si le chat est ouvert ou si on est sur la page messages
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
      style={{
        position: 'fixed',
        zIndex: 100,
        cursor: isDragging ? 'grabbing' : 'grab',
        // Pendant le drag, on utilise directement x et y pour un contrôle immédiat
        // Après le drag, on utilise springX et springY pour un mouvement smooth
        left: isDragging ? x : springX,
        top: isDragging ? y : springY,
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
