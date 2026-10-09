# Réseau social modulable

Réseau social ouvert à une communauté curieuse. Premier profil ciblé : étudiant
(évolution de CampusConnect). Le profil déduit des activités publiées sert à générer
un CV et à être recruté sur ce que la personne sait réellement faire.
D'autres profils suivront (entrepreneurs, etc.) : le cœur doit rester générique.

> Ce fichier est la source unique des règles du projet. Il est lu par OpenCode,
> et importé par CLAUDE.md pour Claude Code.

## Stack
Next.js · GraphQL · Neon (Postgres) · Render · WebRTC · chiffrement de bout en bout.
Détails : docs/architecture.md, docs/base-de-donnees.md, docs/deploiement.md.

## Commandes
- Installer : `npm install`
- Dev : `npm run dev`
- Tests : `npm test`
- Lint : `npm run lint`
- Build : `npm run build`
(Adapter si la stack change.)

## Règles détaillées (à lire selon la tâche)
- GraphQL : .claude/rules/graphql.md
- Chiffrement E2E : .claude/rules/chiffrement-e2e.md
- WebRTC : .claude/rules/webrtc.md
- Profils modulaires : .claude/rules/profils-modulaires.md
- Données personnelles : .claude/rules/donnees-personnelles.md
- Base de données (Neon) : .claude/rules/base-de-donnees.md

## Workflow git
- 1 tâche = 1 branche = 1 worktree.
- Jamais de travail direct sur `main` depuis un worktree de tâche.
- Petits commits ; le projet doit fonctionner à chaque commit.
- Ne jamais fusionner dans `main` sans mon accord. Ne jamais déployer depuis un worktree de tâche.
- Créer un worktree à la main : `git worktree add ../reseau-social-<tache> -b <tache>`
- Supprimer après fusion : `git worktree remove ../reseau-social-<tache>` puis `git branch -d <tache>`

## Définition de "terminé"
Tests, lint et build passent, tout est commité, les règles de sécurité sont respectées.
Si une vérification échoue, le dire clairement : ne jamais prétendre que c'est fini.

## Règles non négociables
- Messages privés chiffrés de bout en bout : le serveur ne voit jamais de contenu en clair
  ni de clé privée.
- Le cœur ne contient rien de spécifique au profil étudiant.
- Pas de fonctionnalité hors de la phase en cours (docs/phases.md). Une idée utile se note
  dans docs/phases.md au lieu d'être codée.
- Les agents de développement n'accèdent qu'à la base Neon de développement, jamais à la production.
- Aucun secret dans le code, les logs, les commits ou les conversations.
- Supprimer les fichiers qui deviennent obsolètes en demandant l'autorisation.
- Quand la mémoire est pleine : supprimer les caches et vider le temp, garder la commande
  de suppression dans un script sh dans `.opencode/scripts/`. Ne rien nettoyer d'autre.
- N'écrire pas de commentaires longs, juste des commentaires courts et concis.

## Brainstorming
Quand je dis "brainstorm ou je veux travailler sur une partie du projet ou ma phrase a un sens
qui se dirige vers une réflexion complexe" : aucun fichier de code modifié.
Procédure : docs/brainstorming.md.

## Agents (rôles)
Instructions détaillées dans docs/agents/ :
architecte, backend, frontend, securite, devops.

## Instructions à vérifier et prompts à exécuter
- Mettre à jour le `render.yaml` en utilisant le MCP Render (protéger la clé).
- Mettre à jour `.env.local` et utiliser les MCP Neon et Render.
- Retirer la section model qui utilise les modèles de Claude (garder seulement la section modèle).
- Créer un hook/boucle de prompts : annoncer but, raison, ressources ; objectif mesurable ;
  utiliser les agents ; améliorer les règles à chaque problème ; prédictions erreurs/réussites.
- Corriger les fichiers qui utilisent `pnpm` → `npm`.
- Mettre à jour `.gitignore`.
- Utiliser les subagents au bon moment.
- Donner une réponse avec un emoji dans le chat.
- Tout ce qui concerne le hook de prompts ne doit pas être suivi par git/github.
- Donner des détails sur le fonctionnement des hooks d'après la doc.
- Si V1 terminée : tests complets → déploiement Render dev + Neon dev → tester le déployé.
- Si session terminée : utiliser le plugin de prompts.
- Le fichier `.env.local` est à jour, le lire, faire la migration et vérifier avec le MCP.
- Configurer le service `reseau` sur Render, déployer `render.yaml` quand V1 terminée.
- Ne jamais déployer sur `main` — déployer depuis `dev`.
- Supprimer le service `srv-db46e4btqb8s73e8bsd0` — c'est sur `srv-db4ek92jnfac73b4uij0` qu'on déploie le dev.
- Retirer la vérification anti-robot (Turnstile) — la mettre en attente dans la TODO.
- À chaque fois que tu lis ce fichier : dire « je viens de lire @AGENT.md » et ajouter un emoji sourire.

## Paramètres Neon Auth

| Champ | Valeur |
|---|---|
| Application Name | `reseau` |
| Auth URL | `https://ep-small-field-b5l5ovc7.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth` |
| JWKS URL | `https://ep-small-field-b5l5ovc7.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json` |
| Verification method | Verification code |
| Email provider | Shared, `auth@mail.myneon.app` |
| Limit | 10 per user, 100 per org |

## Clés à obtenir

| Variable | Comment |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL publique du service Render dev |
| `NEXT_PUBLIC_GRAPHQL_URL` | `${NEXT_PUBLIC_APP_URL}/api/graphql` (Lot 3+) |
| `NEXT_PUBLIC_SIGNALING_URL` | WebRTC V1.5+ |
| `NEXT_PUBLIC_STUN_URL` | WebRTC V1.5+ |
| `TURN_URL` | Fournisseur TURN (Metered, Twilio, Cloudflare Calls) |
| `TURN_USERNAME` | `turnuser` |
| `TURN_CREDENTIAL` | Secret TURN |
| Stockage | Utiliser les clés de stockage dans `.env` (Neon Object Storage, `AWS_*`) |

## Render dev

- Service web `reseau` (`srv-db4ek92jnfac73b4uij0`), branche `dev`.
- URL : `https://reseau-3tuk.onrender.com`.
- S'assurer que Turnstile n'empêche pas l'utilisation de l'app pour le moment (retiré).
- Le frontend sera documenté dans `docs/architecture.md` et `docs/deploiement.md`.

## TODO

La TODO (`docs/TODO.md`) doit toujours être à jour. Y mettre les tâches à prendre en charge
par l'utilisateur et celles qui nécessitent son intervention.

## Remarques designer

- Retirer la top bar créée sur les pages `sign-in` et `sign-up` — la navigation doit être
  un sidebar shadcn/ui.
- Modifier le designer pour qu'il soit plus moderne et utilise ces tokens design :

| Token | Valeur |
|---|---|
| `color.primary` | `#2F66DB` |
| `color.accent` | `#12A594` |
| `color.surface` | `#F6F8FC` |
| `color.text` | `#10203F` |
| `color.success` / `color.danger` | `#2E9E5B` / `#D64545` |
| `radius` | `14px` |
| `font` | Sans arrondie (Inter, system-ui) |
| `space` | `8px` (échelle 4 / 8 / 16 / 24) |
| `shadow` | `shadow.card` = douce, diffuse |
| `motion` | `180ms ease-out` |

## Sidebar shadcn/ui

Le designer utilisera le composant Sidebar de shadcn/ui (`npx shadcn@latest add sidebar`).
Le sidebar remplace la top bar sur les pages d'auth et les pages protégées.

## Worktree

- Travailler dans le worktree de `v1-vision`.
- Les agents doivent travailler dans leur propre worktree.
- Créer un worktree : `git worktree add ../reseau-social-<tache> -b <tache>`
- Supprimer après fusion : `git worktree remove ../reseau-social-<tache>` puis `git branch -d <tache>`
# Réseau social modulable

Réseau social ouvert à une communauté curieuse. Premier profil ciblé : étudiant
(évolution de CampusConnect). Le profil déduit des activités publiées sert à générer
un CV et à être recruté sur ce que la personne sait réellement faire.
D'autres profils suivront (entrepreneurs, etc.) : le cœur doit rester générique.

> Ce fichier est la source unique des règles du projet. Il est lu par OpenCode,
> et importé par CLAUDE.md pour Claude Code.

## Stack
Next.js · GraphQL · Neon (Postgres) · Render · WebRTC · chiffrement de bout en bout.
Détails : docs/architecture.md, docs/base-de-donnees.md, docs/deploiement.md.

## Commandes
- Installer : `npm install`
- Dev : `npm run dev`
- Tests : `npm test`
- Lint : `npm run lint`
- Build : `npm run build`
(Adapter si la stack change.)

## Règles détaillées (à lire selon la tâche)
- GraphQL : .claude/rules/graphql.md
- Chiffrement E2E : .claude/rules/chiffrement-e2e.md
- WebRTC : .claude/rules/webrtc.md
- Profils modulaires : .claude/rules/profils-modulaires.md
- Données personnelles : .claude/rules/donnees-personnelles.md
- Base de données (Neon) : .claude/rules/base-de-donnees.md

## Workflow git
- 1 tâche = 1 branche = 1 worktree.
- Jamais de travail direct sur `main` depuis un worktree de tâche.
- Petits commits ; le projet doit fonctionner à chaque commit.
- Ne jamais fusionner dans `main` sans mon accord. Ne jamais déployer depuis un worktree de tâche.
- Créer un worktree à la main : `git worktree add ../reseau-social-<tache> -b <tache>`
- Supprimer après fusion : `git worktree remove ../reseau-social-<tache>` puis `git branch -d <tache>`

## Définition de "terminé"
Tests, lint et build passent, tout est commité, les règles de sécurité sont respectées.
Si une vérification échoue, le dire clairement : ne jamais prétendre que c'est fini.

## Règles non négociables
- Messages privés chiffrés de bout en bout : le serveur ne voit jamais de contenu en clair
  ni de clé privée.
- Le cœur ne contient rien de spécifique au profil étudiant.
- Pas de fonctionnalité hors de la phase en cours (docs/phases.md). Une idée utile se note
  dans docs/phases.md au lieu d'être codée.
- Les agents de développement n'accèdent qu'à la base Neon de développement, jamais à la production.
- Aucun secret dans le code, les logs, les commits ou les conversations.
- supprime les fichiers qui deviennent obsolete en me demandant l'autorisation 
-quand la memoire est plein supprime des cache et vide le temp et garde la commande de suppression dans un script sh dans @.opencode/scripts tu ne doit rien nettoyer d'autre 
- n'ecrit pas des commentaire long juste des commentaire court et concis 

## Brainstorming
Quand je dis "brainstorm ou je veux travailler sur une partie du projet ou ma phrase a un sens qui se dirige vers un reflexion complexe" : aucun fichier de code modifié. Procédure : docs/brainstorming.md.

## Agents (rôles)
Instructions détaillées dans docs/agents/ :
architecte, backend, frontend, securite, devops.

## instruction a verifier et les prompt a excecuter  
- met a jour le @render.yaml en utilisant le mcp de render tu as la clès et protege cette clès 
- met a jour le env local et tu peux utilise le mcp de neon et de render 
- retire la section model qui utilise les model de claude juste la section de modele 
- creer un hook ou une boucle ou tu ecrit les prompt que tu doit respecter dans ce prompt du doit annonce ce que tu veux faire pourquoi et quelle ressource donc tu dispose tu veut utiliser cette boucle tu doit definir un objectif a atteindre et tous faire pour y arriger et tu doit utiliser les agents que tu disposte et chaque agent doit etre améliore tu doit aussi améliorer les rule a chaque fois que tu rencontre un problème met les dans un fichier ou tu ecrira les problème rencontrer si tu le resous tu creer un rules si c'est un problème tres compliqué que tu a rencontrer a chaque prompt tu doit d'amémiorer dans la prédiction des erreur et des reussite pour mieux ecrire tes prompt 
- corrige les fichier qui on du pnpm et met le npm 
- met a jour le gitignore 
- uitlise les subagent au bon moment pour tes prompt 
- donne moi un reponse avec un emogie  dans le chat
- tous le qui concerne le hook de prompt ne doit par est suivie par git et github 
- donne moi des detail sur comment les hook fonction d'apres la docs 
-  si tu termi,e la V1 tu doit, faire des test et tous verifie puis tu deploie sur render dev , et neon dev et tu fera les test de ce qui est deploier 
- si tu termine un session utilise le plugin de prompt 
- le fichier env est a jour tu peux le lire tu peux faire la migration et verifie avec le mcp si tu as un probleme fait moi signe et passe en prompt loop 
- il faut configurer le service reseau dev sur render il faut deploy render.yaml quand tu aura terminer la V1; 
voici les parametre de neon auth '
General
Postgres
Networking
Credentials
Better Auth
Functions
HIPAA compliance
Project permissions
Project Info
Application Name
reseau
This name appears in verification emails and auth communications.
Auth URL
https://ep-small-field-b5l5ovc7.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth

JWKS URL
https://ep-small-field-b5l5ovc7.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json

Domains
Enter trusted domains for authentication redirects (e.g., SSO). Your app will only redirect to domains on this list. All others will be blocked.
Add new domain
Add new domain (e.g. https://www.example.com)

Add domain
Authentication
Verification method
Select the method to use for email verification

Verification code

Verification link
OAuth providers
Select the OAuth sign-in methods you want available in your app
GoogleShared keys


Add OAuth provider
Email provider
Set up the email provider and sender address for system emails and invites
Server
Shared
Sender address
auth@mail.myneon.app

Configure email provider
Webhooks
Organizations
Limit
10


per user
Limit the number of organizations a user can create.
Membership Limit
100


per org
Maximum number of members per organization.
Creator Role

Owner

Owner
When enabled, invited users receive an email and must accept it to join. When disabled, no email is sent and you handle invitations in your app.
Magic Link
Phone Authentication
Disable Auth
Disables the Neon Auth for this branch. Disabling Neon Auth will delete all users and associated data. This action is irreversible.

Disable Auth'

dit moi comment avoir les clès suivante ; NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_GRAPHQL_URL=
NEXT_PUBLIC_SIGNALING_URL=
NEXT_PUBLIC_STUN_URL=
TURN_URL=
TURN_USERNAME=turnuser
TURN_CREDENTIAL=
; pour le stockage nous allons utilise les cles de stockage dans env 

-sur render-dev nous allons utilise le service de web site 
-assur toi que le turnstile n'empeche pas l'utilisation de l'app pour le moment 
- dit moi le frontend sera ou dans la doc 
met a jour les cookie dans le @env.local
dans le dossier .opencode tu n'a pas ecrit le dossier rules tu doit le mettre et le respecter 
fait toujours une vu sur la todo pour continuer dans la todo tu doit metre les tache qui doite etre prise en charge par moi et qui en besoin de mon intervention 
creer une branche dev qui sera utiliser pour neon-dev et render-dev 
 j'ai supprimer le service reseau-web-dev il faut juste travailler dans le projet reseau 
- supprime ce sercice srv-db46e4btqb8s73e8bsd0 , c'est sur ce service srv-db4ek92jnfac73b4uij0 que nous allons deploier le dev mance analise render 
retire la virification anti robot met la dans la todo elle sera faite apres met le en attente dans la todo 
- a chaque foi que tu lis ce fichier 'dit je vient de lire @AGENT.md et tu ajout un emogie sourire'
## remarque designer
retire a top base que tu as creer sur la page sign et sgin up la top bar doit tres un sidebase de schadcn en utilisant ceci 
il faut modifier le designer pour qui soit plus moderne et utilise ce token design 

color.primary
#2F66DB
color.accent
#12A594
color.surface
#F6F8FC
color.text
#10203F
color.success / danger
#2E9E5B / #D64545
radius
14px
font
Sans arrondie (Inter, system-ui)
space
8px (échelle 4 / 8 / 16 / 24)
shadow
shadow.card = douce, diffuse
motion
180ms ease-out


---
title: Sidebar
description: A composable, themeable and customizable sidebar component.
base: base
component: true
---

import { ExternalLinkIcon } from "lucide-react"

<figure className="flex flex-col gap-4">
  <ComponentPreview
    styleName="base-nova"
    name="sidebar-demo"
    type="block"
    className="w-full"
  />
  <figcaption className="text-center text-sm text-gray-500">
    A sidebar that collapses to icons.
  </figcaption>
</figure>

Sidebars are one of the most complex components to build. They are central
to any application and often contain a lot of moving parts.

We now have a solid foundation to build on top of. Composable. Themeable.
Customizable.

[Browse the Blocks Library](/blocks).

## Installation

<CodeTabs>

<TabsList>
  <TabsTrigger value="cli">Command</TabsTrigger>
  <TabsTrigger value="manual">Manual</TabsTrigger>
</TabsList>
<TabsContent value="cli">

```bash
npx shadcn@latest add sidebar
```

</TabsContent>

<TabsContent value="manual">

<ComponentSource
  name="sidebar"
  title="components/ui/sidebar.tsx"
  styleName="base-nova"
/>

</TabsContent>

</CodeTabs>

## Usage

```tsx showLineNumbers title="app/layout.tsx"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
```

```tsx showLineNumbers title="components/app-sidebar.tsx"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
```

## Composition

Use the following composition to build a `Sidebar` layout:

```text
SidebarProvider
├── Sidebar
│   ├── SidebarHeader
│   ├── SidebarContent
│   │   ├── SidebarGroup
│   │   │   ├── SidebarGroupLabel
│   │   │   ├── SidebarGroupAction
│   │   │   ├── SidebarGroupContent
│   │   │   └── SidebarMenu
│   │   │       ├── SidebarMenuItem
│   │   │       │   ├── SidebarMenuButton
│   │   │       │   ├── SidebarMenuAction
│   │   │       │   └── SidebarMenuBadge
│   │   │       └── SidebarMenuItem
│   │   │           ├── SidebarMenuButton
│   │   │           └── SidebarMenuSub
│   │   │               ├── SidebarMenuSubItem
│   │   │               └── SidebarMenuSubItem
│   │   └── SidebarGroup
│   │       └── SidebarMenu
│   │           ├── SidebarMenuItem
│   │           └── SidebarMenuItem
│   ├── SidebarFooter
│   └── SidebarRail
├── SidebarInset
└── SidebarTrigger
```

## Structure

- **SidebarProvider** — Handles collapsible state and provides sidebar context to child components.
- **Sidebar** — The main collapsible sidebar panel.
- **SidebarHeader** — Sticky at the top; use for branding, titles, or workspace switchers.
- **SidebarFooter** — Sticky at the bottom; use for user menus, settings, or actions.
- **SidebarContent** — Scrollable region between the header and footer.
- **SidebarGroup** — Groups related navigation with optional label, action, and content areas.
- **SidebarMenu** / **SidebarMenuItem** — Menu structure for links, badges, actions, and nested submenus.
- **SidebarRail** — Resize handle for adjusting sidebar width when applicable.
- **SidebarInset** — Wraps main content when using the `inset` variant.
- **SidebarTrigger** — Control that toggles the sidebar open or collapsed.

<Image
  src="/images/sidebar-structure.png"
  width="716"
  height="420"
  alt="Sidebar Structure"
  className="mt-6 w-full overflow-hidden rounded-2xl border dark:hidden"
/>
<Image
  src="/images/sidebar-structure-dark.png"
  width="716"
  height="420"
  alt="Sidebar Structure"
  className="mt-6 hidden w-full overflow-hidden rounded-2xl border dark:block"
/>

## SidebarProvider

The `SidebarProvider` component is used to provide the sidebar context to the `Sidebar` component. You should always wrap your application in a `SidebarProvider` component.

### Props

| Name           | Type                      | Description                                  |
| -------------- | ------------------------- | -------------------------------------------- |
| `defaultOpen`  | `boolean`                 | Default open state of the sidebar.           |
| `open`         | `boolean`                 | Open state of the sidebar (controlled).      |
| `onOpenChange` | `(open: boolean) => void` | Sets open state of the sidebar (controlled). |

### Width

If you have a single sidebar in your application, you can use the `SIDEBAR_WIDTH` and `SIDEBAR_WIDTH_MOBILE` variables in `sidebar.tsx` to set the width of the sidebar.

```tsx showLineNumbers title="components/ui/sidebar.tsx"
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
```

For multiple sidebars in your application, you can use the `--sidebar-width` and `--sidebar-width-mobile` CSS variables in the `style` prop.

```tsx showLineNumbers
<SidebarProvider
  style={
    {
      "--sidebar-width": "20rem",
      "--sidebar-width-mobile": "20rem",
    } as React.CSSProperties
  }
>
  <Sidebar />
</SidebarProvider>
```

### Keyboard Shortcut

To trigger the sidebar, you use the `cmd+b` keyboard shortcut on Mac and `ctrl+b` on Windows.

```tsx showLineNumbers title="components/ui/sidebar.tsx"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
```

## Sidebar

The main `Sidebar` component used to render a collapsible sidebar.

### Props

| Property      | Type                              | Description                       |
| ------------- | --------------------------------- | --------------------------------- |
| `side`        | `left` or `right`                 | The side of the sidebar.          |
| `variant`     | `sidebar`, `floating`, or `inset` | The variant of the sidebar.       |
| `collapsible` | `offcanvas`, `icon`, or `none`    | Collapsible state of the sidebar. |

| Prop        | Description                                                  |
| ----------- | ------------------------------------------------------------ |
| `offcanvas` | A collapsible sidebar that slides in from the left or right. |
| `icon`      | A sidebar that collapses to icons.                           |
| `none`      | A non-collapsible sidebar.                                   |

<Callout>
  **Note:** If you use the `inset` variant, remember to wrap your main content
  in a `SidebarInset` component.
</Callout>

```tsx showLineNumbers
<SidebarProvider>
  <Sidebar variant="inset" />
  <SidebarInset>
    <main>{children}</main>
  </SidebarInset>
</SidebarProvider>
```

## useSidebar

The `useSidebar` hook is used to control the sidebar.

```tsx showLineNumbers
import { useSidebar } from "@/components/ui/sidebar"

export function AppSidebar() {
  const {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  } = useSidebar()
}
```

| Property        | Type                      | Description                                   |
| --------------- | ------------------------- | --------------------------------------------- |
| `state`         | `expanded` or `collapsed` | The current state of the sidebar.             |
| `open`          | `boolean`                 | Whether the sidebar is open.                  |
| `setOpen`       | `(open: boolean) => void` | Sets the open state of the sidebar.           |
| `openMobile`    | `boolean`                 | Whether the sidebar is open on mobile.        |
| `setOpenMobile` | `(open: boolean) => void` | Sets the open state of the sidebar on mobile. |
| `isMobile`      | `boolean`                 | Whether the sidebar is on mobile.             |
| `toggleSidebar` | `() => void`              | Toggles the sidebar. Desktop and mobile.      |

## SidebarHeader

Use the `SidebarHeader` component to add a sticky header to the sidebar.

```tsx showLineNumbers title="components/app-sidebar.tsx"
<Sidebar>
  <SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton />}>
            Select Workspace
            <ChevronDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <span>Acme Inc</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>
</Sidebar>
```

## SidebarFooter

Use the `SidebarFooter` component to add a sticky footer to the sidebar.

```tsx showLineNumbers
<Sidebar>
  <SidebarFooter>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton>
          <User2 /> Username
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarFooter>
</Sidebar>
```

## SidebarContent

The `SidebarContent` component is used to wrap the content of the sidebar. This is where you add your `SidebarGroup` components. It is scrollable.

```tsx showLineNumbers
<Sidebar>
  <SidebarContent>
    <SidebarGroup />
    <SidebarGroup />
  </SidebarContent>
</Sidebar>
```

## SidebarGroup

Use the `SidebarGroup` component to create a section within the sidebar.

A `SidebarGroup` has a `SidebarGroupLabel`, a `SidebarGroupContent` and an optional `SidebarGroupAction`.

```tsx showLineNumbers
<SidebarGroup>
  <SidebarGroupLabel>Application</SidebarGroupLabel>
  <SidebarGroupAction>
    <Plus /> <span className="sr-only">Add Project</span>
  </SidebarGroupAction>
  <SidebarGroupContent></SidebarGroupContent>
</SidebarGroup>
```

To make a `SidebarGroup` collapsible, wrap it in a `Collapsible`.

```tsx showLineNumbers
<Collapsible defaultOpen className="group/collapsible">
  <SidebarGroup>
    <SidebarGroupLabel render={<CollapsibleTrigger />}>
      Help
      <ChevronDown className="ml-auto transition-transform group-data-open/collapsible:rotate-180" />
    </SidebarGroupLabel>
    <CollapsibleContent>
      <SidebarGroupContent />
    </CollapsibleContent>
  </SidebarGroup>
</Collapsible>
```

## SidebarMenu

The `SidebarMenu` component is used for building a menu within a `SidebarGroup`.

<Image
  src="/images/sidebar-menu.png"
  width="716"
  height="420"
  alt="Sidebar Menu"
  className="mt-6 w-full overflow-hidden rounded-2xl border dark:hidden"
/>
<Image
  src="/images/sidebar-menu-dark.png"
  width="716"
  height="420"
  alt="Sidebar Menu"
  className="mt-6 hidden w-full overflow-hidden rounded-2xl border dark:block"
/>

```tsx showLineNumbers
<SidebarMenu>
  {projects.map((project) => (
    <SidebarMenuItem key={project.name}>
      <SidebarMenuButton render={<a href={project.url} />}>
        <project.icon />
        <span>{project.name}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ))}
</SidebarMenu>
```

## SidebarMenuButton

The `SidebarMenuButton` component is used to render a menu button within a `SidebarMenuItem`.

By default, the `SidebarMenuButton` renders a button but you can use the `render` prop to render a different component such as a `Link` or an `a` tag.

Use the `isActive` prop to mark a menu item as active.

```tsx showLineNumbers
<SidebarMenuButton render={<a href="#" />} isActive>
  Home
</SidebarMenuButton>
```

## SidebarMenuAction

The `SidebarMenuAction` component is used to render a menu action within a `SidebarMenuItem`.

```tsx showLineNumbers
<SidebarMenuItem>
  <SidebarMenuButton render={<a href="#" />}>
    <Home />
    <span>Home</span>
  </SidebarMenuButton>
  <SidebarMenuAction>
    <Plus /> <span className="sr-only">Add Project</span>
  </SidebarMenuAction>
</SidebarMenuItem>
```

## SidebarMenuSub

The `SidebarMenuSub` component is used to render a submenu within a `SidebarMenu`.

```tsx showLineNumbers
<SidebarMenuItem>
  <SidebarMenuButton />
  <SidebarMenuSub>
    <SidebarMenuSubItem>
      <SidebarMenuSubButton />
    </SidebarMenuSubItem>
  </SidebarMenuSub>
</SidebarMenuItem>
```

## SidebarMenuBadge

The `SidebarMenuBadge` component is used to render a badge within a `SidebarMenuItem`.

```tsx showLineNumbers
<SidebarMenuItem>
  <SidebarMenuButton />
  <SidebarMenuBadge>24</SidebarMenuBadge>
</SidebarMenuItem>
```

## SidebarMenuSkeleton

The `SidebarMenuSkeleton` component is used to render a skeleton for a `SidebarMenu`.

```tsx showLineNumbers
<SidebarMenu>
  {Array.from({ length: 5 }).map((_, index) => (
    <SidebarMenuItem key={index}>
      <SidebarMenuSkeleton />
    </SidebarMenuItem>
  ))}
</SidebarMenu>
```

## SidebarTrigger

Use the `SidebarTrigger` component to render a button that toggles the sidebar.

```tsx showLineNumbers
import { useSidebar } from "@/components/ui/sidebar"

export function CustomTrigger() {
  const { toggleSidebar } = useSidebar()

  return <button onClick={toggleSidebar}>Toggle Sidebar</button>
}
```

## SidebarRail

The `SidebarRail` component is used to render a rail within a `Sidebar`. This rail can be used to toggle the sidebar.

```tsx showLineNumbers
<Sidebar>
  <SidebarHeader />
  <SidebarContent>
    <SidebarGroup />
  </SidebarContent>
  <SidebarFooter />
  <SidebarRail />
</Sidebar>
```

## Controlled Sidebar

Use the `open` and `onOpenChange` props to control the sidebar.

```tsx showLineNumbers
export function AppSidebar() {
  const [open, setOpen] = React.useState(false)

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <Sidebar />
    </SidebarProvider>
  )
}
```

## Theming

We use the following CSS variables to theme the sidebar.

```css
@layer base {
  :root {
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 0 0% 98%;
    --sidebar-primary-foreground: 240 5.9% 10%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}
```

## Styling

Here are some tips for styling the sidebar based on different states.

```tsx
<Sidebar collapsible="icon">
  <SidebarContent>
    <SidebarGroup className="group-data-[collapsible=icon]:hidden" />
  </SidebarContent>
</Sidebar>
```

```tsx
<SidebarMenuItem>
  <SidebarMenuButton />
  <SidebarMenuAction className="peer-data-[active=true]/menu-button:opacity-100" />
</SidebarMenuItem>
```

## RTL

To enable RTL support in shadcn/ui, see the [RTL configuration guide](/docs/rtl).

{/* prettier-ignore */}
<Button asChild size="sm" className="mt-6">
  <a href="/view/base-nova/sidebar-rtl" target="_blank">View RTL Sidebar <ExternalLinkIcon /></a>
</Button>

## Changelog

### RTL Support

If you're upgrading from a previous version of the `Sidebar` component, you'll need to apply the following updates to add RTL support:

<Steps>

<Step>Add `dir` prop to Sidebar component.</Step>

Add `dir` to the destructured props and pass it to `SheetContent` for mobile:

```diff
  function Sidebar({
    side = "left",
    variant = "sidebar",
    collapsible = "offcanvas",
    className,
    children,
+   dir,
    ...props
  }: React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }) {
```

Then pass it to `SheetContent` in the mobile view:

```diff
  <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
    <SheetContent
+     dir={dir}
      data-sidebar="sidebar"
      data-slot="sidebar"
      data-mobile="true"
```

<Step>Add `data-side` attribute to sidebar container.</Step>

Add `data-side={side}` to the sidebar container element:

```diff
  <div
    data-slot="sidebar-container"
+   data-side={side}
    className={cn(
```

<Step>Update sidebar container positioning classes.</Step>

Replace JavaScript ternary conditional classes with CSS data attribute selectors:

```diff
  className={cn(
-   "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
-   side === "left"
-     ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
-     : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
+   "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex data-[side=left]:left-0 data-[side=right]:right-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
```

<Step>Update SidebarRail positioning classes.</Step>

Update the `SidebarRail` component to use physical positioning for the rail:

```diff
  className={cn(
-   "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-end-4 group-data-[side=right]:start-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] sm:flex",
+   "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 ltr:-translate-x-1/2 rtl:-translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] sm:flex",
```

<Step>Add RTL flip to SidebarTrigger icon.</Step>

Add `className="rtl:rotate-180"` to the icon in `SidebarTrigger` to flip it in RTL mode:

```diff
  <Button ...>
-   <PanelLeftIcon />
+   <PanelLeftIcon className="rtl:rotate-180" />
    <span className="sr-only">Toggle Sidebar</span>
  </Button>
```

</Steps>

After applying these changes, you can use the `dir` prop to set the direction:

```tsx
<Sidebar dir="rtl" side="right">
  {/* ... */}
</Sidebar>
```

The sidebar will correctly position itself and handle interactions in both LTR and RTL layouts.

- travaille dans le worktree de V1-vision et fait appele au agent pour le developper ment il doivent travailler dans leur worktree 
- quant tu lie une rules mentionne la rule que tu as lu et tu doit utilise agent pour les tache si - tu remarque qu'une tache correspons a l'intervention d'in agent fait appel a lui
- installe le skill de schadcn que le disgner utilisera npx skills add shadcn/ui