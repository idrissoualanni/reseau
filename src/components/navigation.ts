import { Compass, Layers, MessageSquare, UserRound, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Navigation V1 commune (design system §6) : identique en haut sur desktop et
// en bas sur mobile, pour un parcours cohérent entre les tailles d'écran.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Projets", icon: Layers },
  { href: "/posts", label: "Posts", icon: MessageSquare },
  { href: "/search", label: "Recherche", icon: Compass },
  { href: "/me/profile", label: "Mon profil", icon: UserRound },
];
