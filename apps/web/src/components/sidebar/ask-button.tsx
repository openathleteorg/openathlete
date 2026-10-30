import { useChatbot } from '@/contexts/chatbot';
import { m } from '@/paraglide/messages';
import { Search } from 'lucide-react';
import { useEffect } from 'react';

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';

/** The way into the assistant from any page, by mouse or with ⌘K */
export function AskButton() {
  const { openChat } = useChatbot();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        openChat();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openChat]);

  return (
    <SidebarGroup className="pb-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={m.sidebar_ask()}
            className="bg-sidebar-accent"
            onClick={openChat}
          >
            <Search />
            <span>{m.sidebar_ask()}</span>
            <kbd className="ml-auto hidden text-xs md:inline group-data-[collapsible=icon]:hidden">
              ⌘K
            </kbd>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
