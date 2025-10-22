'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useSpaceContext } from '@/contexts/space';
import { SIDEBAR_OPEN_STATES, getItem, setItem } from '@/utils/local-storage';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { UserRole } from '@openathlete/shared';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url?: string;
    icon?: LucideIcon;
    isActive?: boolean;
    spaces?: UserRole[];
    items?: {
      title: string;
      url: string;
      icon?: LucideIcon;
    }[];
  }[];
}) {
  const { space } = useSpaceContext();
  const { pathname } = useLocation();

  const [openStates, setOpenStates] = useState<Record<string, boolean>>(() => {
    const stored = getItem(SIDEBAR_OPEN_STATES);
    return stored ? JSON.parse(stored) : {};
  });

  const handleOpenChange = (itemTitle: string, isOpen: boolean) => {
    const newStates = { ...openStates, [itemTitle]: isOpen };
    setOpenStates(newStates);
    setItem(SIDEBAR_OPEN_STATES, JSON.stringify(newStates));
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items
          .filter((item) => !item.spaces || item.spaces.includes(space))
          .map((item) =>
            item.items ? (
              <Collapsible
                key={item.title}
                asChild
                open={openStates[item.title] ?? true}
                onOpenChange={(isOpen) => handleOpenChange(item.title, isOpen)}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={item.isActive ? 'active-class' : ''}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a
                              href={subItem.url}
                              className={
                                pathname === subItem.url ? 'font-bold' : ''
                              }
                            >
                              {subItem.icon && <subItem.icon />}
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a
                    href={item.url}
                    className={`flex items-center gap-2 ${
                      pathname === item.url ? 'font-bold' : ''
                    }`}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ),
          )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
