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
- Supprimer après fusion : `git worktree remove ../reseau-social-<tache>` — le **worktree seulement**, ne **pas** supprimer la branche.

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
- respecte les rules de @.claude/rules 

## Brainstorming
Quand je dis "brainstorm ou je veux travailler sur une partie du projet ou ma phrase a un sens
qui se dirige vers une réflexion complexe" : aucun fichier de code modifié.
Procédure : docs/brainstorming.md.

## Agents (rôles)
Instructions détaillées dans docs/agents/ et dans @.claude/agents et @.opencode/agent:
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
- met a jour le fichier @AGENT.md tu doit mettre toute les instructuon d'utilisation des rules et des skills et des plugins et script et de la docs 
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
- Supprimer après fusion : `git worktree remove ../reseau-social-<tache>` — le **worktree seulement**, ne **pas** supprimer la branche.
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
- Supprimer après fusion : `git worktree remove ../reseau-social-<tache>` — le **worktree seulement**, ne **pas** supprimer la branche.

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
- Met à jour le `render.yaml` via le MCP Render (protéger la clé API dans `{file:.secrets/render-api-key}` ou `{env:RENDER_API_KEY}`).
- Met à jour `.env.local` et utilise les MCP Neon et Render pour obtenir les variables d'environnement manquantes.
- Retire la section model qui utilise les modèles de Claude (garde seulement la section modèle).
- Crée un hook/boucle de prompts : annonce le but, la raison, les ressources ; définis un objectif mesurable ; utilise les agents ; améliore les règles à chaque problème ; note les prédictions d'erreurs/réussites.
- Corrige les fichiers qui utilisent `pnpm` → `npm` (utiliser `npm install`, `npm run`, `npm test`, `npm run build`).
- Met à jour `.gitignore` régulièrement — jamais de secrets dans les fichiers suivis.
- Utilise les subagents au bon moment (backend, frontend, database, designer, devops, securite selon la tâche).
- Donne une réponse avec un emoji dans le chat.
- Tout ce qui concerne le hook de prompts ne doit pas être suivi par git/github.
- Donne des détails sur le fonctionnement des hooks d'après la doc (voir la procédure dans docs/brainstorming.md).
- Si V1 terminée : tests complets → déploiement Render dev + Neon dev → tester le déployé.
- Si session terminée : utilise le plugin de prompts.
- Le fichier `.env.local` est à jour, le lire, faire la migration et vérifier avec le MCP.
- Configure le service `reseau` sur Render, déploie `render.yaml` quand V1 terminée.
- Never deploy on `main` — déploie depuis `dev`.
- Supprime le service `srv-db46e4btqb8s73e8bsd0` — le dev se déploie sur `srv-db4ek92jnfac73b4uij0`.
- Retire la vérification anti-robot (Turnstile) — mets-la en attente dans la TODO.
- À chaque fois que tu lis ce fichier : dis « je viens de lire @AGENT.md » et ajoute un emoji sourire 😊.

### Utilisation des rules (.claude/rules et .opencode/rules)
- Chaque règle lue doit être appliquée concrètement ; ne jamais prétendre qu'une tâche est finie si une règle est violée.
- Avant toute intervention, lire le fichier de rules concerné (voir la liste en tête de AGENTS.md).
- Les règles sont opposables : un changement qui les enfreint n'est pas terminé, même si le code « fonctionne ».
- Les nouveaux fichiers de rules sont placés dans `.claude/rules/` (pour Claude) et `.opencode/rules/` (pour OpenCode).
- Vérifier la cohérence entre `.claude/rules/` et `.opencode/rules/` lors de toute refonte.

### Compétences (skills) : chargement et utilisation
- Les skills se chargent via l'outil `skill` avec l'id correspondant (ex: `skill { id: "database" }`).
- Une tâche donnée à un subagent doit toujours commencer par un appel `skill` pour activer le contexte adéquat.
- Si plusieurs skills sont pertinentes, les charger dans l'ordre : d'abord l'agent général, puis le skill spécialisé.
- Ne jamais invoquer de skill sans nécessité avérée ; préférer l'agent général lorsqu'un seul skill suffit.
- Après utilisation, vérifier que le contexte skill est toujours requis ; si non, le contexte redevient général.
- Les nouveaux skills sont découverts via `find-skills` et installés avec `npx shadcn@latest add <component>` ou via le MCP approprié.
- Les skills existants ne doivent pas être doublonnés ; vérifier la liste des skills disponibles avant d'en créer un nouveau.

### Plugins et scripts
- Les plugins sont installés via le MCP Render/Neon ou le CLI dédié (ex: `render deploys`, `neon auth`).
- Les scripts de projet vivent dans `.opencode/scripts/` et s'exécutent avec `sh .opencode/scripts/<nom>.sh`.
- Ne jamais modifier `package.json` pour passer de `pnpm` à `npm` sans vérification — utiliser `npm install`, `npm run`, `npm test` et `npm run build`.
- Les scripts de nettoyage disque/mémoire sont dans `.opencode/scripts/cleanup-disk.sh` ; exécuter lorsque la RAM < 2 Go ou le disque < 5 Go libres.
- Tout script qui devient obsolète doit être supprimé en demandant l'autorisation, en suivant la règle « supprimer les fichiers qui deviennent obsolètes en demandant l'autorisation ».

### Documentation (docs/)
- La source unique des règles du projet est `AGENTS.md` (lu par OpenCode) et `CLAUDE.md` (importé pour Claude Code).
- Tous les fichiers `docs/` doivent rester synchronisés avec le code livré : tout nouveau parcours utilisateur s'accompagne d'une fiche dans `docs/features/` ou `docs/ux/` et d'une mise à jour de `docs/TODO.md`.
- La TODO (`docs/TODO.md`) doit toujours être à jour : y mettre les tâches à prendre en charge par l'utilisateur et celles qui nécessitent son intervention.
- Les décisions architecturales sont consignées dans `docs/history/` (ARCHITECTURE.md, API.md, DECISIONS.md).
- Les tokens designer et les règles de style sont définies dans `AGENTS.md` et doivent être appliquées dans tous les composants UI.
- Ne pas créer de nouvelles pages ou composants sans avoir au préalable créé la fiche UX correspondante (`ux-brief` skill). 
voici les parametre de neon auth '
- il faut que tous les worktree que tu creer se place ici @.opencode/worktrees
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
- pour la side bare ajoute une icone de replie et un dropdown 
[Browse the Blocks Library](/blocks).

- travaille dans le worktree de V1-vision et fait appele au agent pour le developper ment il doivent travailler dans leur worktree 
- quant tu lie une rules mentionne la rule que tu as lu et tu doit utilise agent pour les tache si - tu remarque qu'une tache correspons a l'intervention d'in agent fait appel a lui
- installe le skill de schadcn que le disgner utilisera npx skills add shadcn/ui
- le layout ne doit pas etre sur la page de connection retire le et verifie le parcour d'inscription 
- verifie les diff et analise le worktree de render et supprime le puise merger sa branche a dev 
- l'authentification ne fonctionne pas encore correctement les , ajout un eyes dans l'ecriture de mot de passe et met a jour les rules et docs authentification 
creer un worktree pour ces correction
- assuse toi que la verification de mail se fait avec le mail de neon pour le moment meme pour le dev 
termine avec les taches de la v1 
- respecte le token design 
- si tu pense qu'une rules doit etre creer creer la 
- fait des petit commit de chaque worktree
- utilise les skill dans chaque worktree et pour shadcn 
- merge chaque branche de chaque worktree sur le dev 
- configure npx drizzle-kit studio
- mettre a jour la todo 
- assure toi qu'aucun cles est du cote client 
- pour les post assure toi de pouvoir ajouter des commentaire et de pouvoir ajouter un commentaire a un commentaire met ajoure les fichier de feature dans la docs 
- tout les fontionnalité qui ne sont pas preciser dans le dossier de @docs/features doivent etre dans le @docs/backlog.md pour etre examiner apres 
- utilise le mcp de neon pour verifie le storage verifie l'upload des images de projet et dit moi ou en sont les les fontionnaliter de publication et le feed 
- donne moi la commande pour lancer drizzle studion 
- utilise ce fichier pour la suite des fonctionnalite @docs/engineering-principles.md
- pour les posts au format video @open-decisions.md lie la partie de fil libre 
- assure toi que graphql est utiliser pour les posts 
- assure toi que le fil libre est developper si tu as des question pose le moi 
- dit moi comment avoir le env restant 
- voici le code de configuration du storage neon : import "dotenv/config";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ forcePathStyle: true });
const bucket = "assets";
const key = "uploads/file.txt";

await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: "Hello World!" }));

const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });
console.log(`[view] ${url}`);


npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner dotenv

- termine avec la todo de storage 
- ne touche pas encore a la V1.5
- explique moi ca et corrige l'erreur creer un rules WIP utilisateur
- utilise le bucket profile pour les images de profile , et le bucket projet pour les images de projet 
- la page des post ne s'affiche pas et le feed aussi 
- verifie aussi URL de requête
- corrige le neon storage et les poste j'ai deja mis a jour le env render met a jour le env local 
- il faut developper la page de feed de post 
- utilise le mcp de neon pour le storage 