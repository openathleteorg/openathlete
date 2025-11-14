import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SpaceConsumer, SpaceProvider } from '@/contexts/space';
import { isCapacitor } from '@/utils/capacitor';

import { ChatBubble, ChatWindow } from '../chatbot';
import { MobileLayout } from '../mobile/mobile-layout';
import { AppSidebar } from '../sidebar/app-sidebar';

interface P {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: P) {
  if (isCapacitor()) {
    return (
      <SpaceProvider>
        <SpaceConsumer>
          <MobileLayout>{children}</MobileLayout>
        </SpaceConsumer>
      </SpaceProvider>
    );
  }

  // Desktop layout
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
