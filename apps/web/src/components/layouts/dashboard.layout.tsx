import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SpaceConsumer, SpaceProvider } from '@/contexts/space';

import { ChatBubble, ChatWindow } from '../chatbot';
import { AppSidebar } from '../sidebar/app-sidebar';

interface P {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: P) {
  return (
    <SpaceProvider>
      <SidebarProvider>
        <AppSidebar />
        <SpaceConsumer>
          <SidebarInset>{children}</SidebarInset>
          <ChatBubble />
          <ChatWindow />
        </SpaceConsumer>
      </SidebarProvider>
    </SpaceProvider>
  );
}
