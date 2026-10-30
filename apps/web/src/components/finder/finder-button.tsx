import { useFinder } from '@/contexts/finder';
import { m } from '@/paraglide/messages';
import { Search } from 'lucide-react';

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar';

export function FinderButton() {
  const { openFinder } = useFinder();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleClick = () => {
    if (isMobile) setOpenMobile(false);
    openFinder();
  };

  return (
    <SidebarGroup className="pb-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={m.finder_open()}
            className="bg-sidebar-accent"
            data-finder-open
            onClick={handleClick}
          >
            <Search />
            <span>{m.finder_open()}</span>
            <kbd className="ml-auto hidden text-xs md:inline group-data-[collapsible=icon]:hidden">
              ⌘K
            </kbd>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
