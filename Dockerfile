# syntax=docker/dockerfile:1

# ===================================================================
#  Réseau social — image de l'application Next.js
#  Cible : Render, service web en runtime Docker
#  Références : docs/architecture.md, docs/deploiement.md
#
#  PRÉREQUIS (encore absents du dépôt) :
#    - package.json : scripts "build" et "start"
#    - une application Next.js (app/ ou pages/)
#  Tant qu'ils manquent, l'étape "build" échoue : c'est attendu.
#
#  ÉTAT : non validé (aucun daemon Docker disponible sur ce poste,
#         et l'application n'existe pas encore — voir le rapport).
# ===================================================================

ARG NODE_VERSION=24

# --- Étape 1 : dépendances ---------------------------------------------
FROM node:${NODE_VERSION}-slim AS deps
WORKDIR /app

# package.json + lock uniquement : les couches de node_modules ne se
# rejouent que si les dépendances changent.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund


# --- Étape 2 : build ----------------------------------------------------
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Les secrets ne sont PAS dans l'image (voir .dockerignore) : les
# variables d'environnement viennent de Render, jamais du dépôt.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# "public/" est optionnel chez Next.js, mais l'étape suivante le copie
# systématiquement : il doit exister, même vide.
RUN mkdir -p public


# --- Étape 3 : exécution ------------------------------------------------
FROM node:${NODE_VERSION}-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Dépendances de production uniquement (next, react, …).
# L'image officielle node fournit déjà l'utilisateur "node" (uid 1001) :
# on ne crée pas de second compte, ce qui éviterait un conflit de GID.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
 && chown -R node:node /app

COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public

USER node

# Render fournit son propre PORT ; 3000 ne vaut qu'en local.
EXPOSE 3000

CMD ["npm", "start"]
