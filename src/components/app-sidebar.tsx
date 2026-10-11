"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import { NAV_ITEMS, ADMIN_NAV_ITEM } from "@/components/navigation";
import { signOutAction } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/avatar";
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

export function AppSidebar({ user, isAdmin = false }: { user: SidebarUser | null; isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <Link href="/" className="text-foreground text-base font-semibold tracking-tight">
            Réseau
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={label}
                      aria-current={active ? "page" : undefined}
                    >
                      <Link href={href}>
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