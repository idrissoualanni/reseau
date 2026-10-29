"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsUpDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
} from "lucide-react";
import { NAV_ITEMS, ADMIN_NAV_ITEM } from "@/components/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SidebarUser = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  email?: string;
};

// Repli/dépli de la sidebar (icône explicite demandée en revue UI).
function SidebarCollapseButton() {
  const { state, toggleSidebar, isMobile, openMobile } = useSidebar();
  const collapsed = isMobile ? !openMobile : state === "collapsed";
  const label = collapsed ? "Déplier le menu" : "Replier le menu";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground"
      onClick={toggleSidebar}
      aria-label={label}
      title={label}
    >
      {collapsed ? (
        <PanelLeftOpen className="size-4" aria-hidden="true" />
      ) : (
        <PanelLeftClose className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}

export function AppSidebar({ user, isAdmin = false }: { user: SidebarUser | null; isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link
            href="/"
            className="text-foreground text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden"
          >
            Réseau
          </Link>
          <div className="ml-auto group-data-[collapsible=icon]:ml-0">
            <SidebarCollapseButton />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const target =
                  href === "/me/profile" && user ? `/u/${user.username}` : href;
                const active =
                  target === "/" ? pathname === "/" : pathname.startsWith(target);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={label}
                      aria-current={active ? "page" : undefined}
                    >
                      <Link href={target}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(ADMIN_NAV_ITEM.href)}
                    tooltip={ADMIN_NAV_ITEM.label}
                    aria-current={pathname.startsWith(ADMIN_NAV_ITEM.href) ? "page" : undefined}
                  >
                    <Link href={ADMIN_NAV_ITEM.href}>
                      <ADMIN_NAV_ITEM.icon />
                      <span>{ADMIN_NAV_ITEM.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip={user?.displayName ?? "Membre"} className="data-[state=open]:bg-sidebar-accent">
                  <Avatar name={user?.displayName ?? "Membre"} src={user?.avatarUrl ?? null} size="md" className="size-7 text-xs" />
                  <span className="flex min-w-0 flex-1 flex-col text-left">
                    <span className="truncate text-sm font-medium">{user?.displayName ?? "Membre"}</span>
                    {user?.email ? (
                      <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                    ) : null}
                  </span>
                  <ChevronsUpDown className="text-muted-foreground ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
                <DropdownMenuLabel className="truncate">{user?.email ?? user?.displayName ?? "Membre"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={user ? `/u/${user.username}` : "/me/profile"}>
                    <UserRound />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" asChild>
                  <form action={signOutAction}>
                    <button type="submit" className="flex w-full items-center gap-2">
                      <LogOut />
                      Se déconnecter
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}