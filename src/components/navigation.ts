import { Compass, Layers, MessageSquare, Shield, UserRound, Users, type LucideIcon } from "lucide-react";

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
  { href: "/spaces", label: "Espaces", icon: Users },
  { href: "/search", label: "Recherche", icon: Compass },
  { href: "/me/profile", label: "Mon profil", icon: UserRound },
];

// Entrée réservée aux admins plateforme (F17) : affichée seulement si le
// membre porte le rôle applicatif.
export const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin",
  label: "Administration",
  icon: Shield,
};
