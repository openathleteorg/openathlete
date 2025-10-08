import { ChatBubble, ChatWindow } from '@/components/chatbot';
import { Outlet } from 'react-router-dom';

/**
 * Wrapper layout qui ajoute le chatbot à toutes les pages
 */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <ChatBubble />
      <ChatWindow />
    </>
  );
}
