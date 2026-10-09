# Hooks OpenCode — fonctionnement

> Référence pour les agents et les développeurs du projet. Source : documentation
> OpenCode (plugin API, session hooks, event subscription).

## Cycle de vie d'un plugin

Un plugin vit dans `.opencode/plugins/<nom>/index.ts` et exporte un défaut créé par
`Plugin.define({ id, setup(ctx) })`. Le `setup` est appelé au démarrage d'OpenCode
et retourne une fonction de cleanup (appelée à l'arrêt ou au rechargement).

```ts
export default Plugin.define({
  id: "reseau.prompt-loop",
  setup(ctx) {
    // … enregistrement des hooks et abonnements …
    return () => { /* cleanup */ };
  },
});
```

## Hooks de session (`ctx.session.hook`)

Les hooks de session interceptent les événements du cycle de vie d'une session
(agent loop, subagents inclus). Ils reçoivent un `event` et peuvent le modifier.

| Hook | Quand | Usage typique |
|---|---|---|
| `context` | Avant chaque requête modèle | Injecter un rappel système (`event.system.push`) |
| `tool.execute` | Avant/après un outil | Valider, transformer ou bloquer un appel d'outil |
| `session.created` | Création d'une session | Journaliser, initialiser un état |

Exemple (injection d'un rappel dans le system prompt) :

```ts
const hook = ctx.session.hook("context", (event) => {
  event.system.push({ type: "text", text: "Rappel important…" })
})
// Cleanup : void hook.then((r) => r.dispose())
```

## Abonnement aux événements (`ctx.event.subscribe`)

`ctx.event.subscribe({ signal })` retourne un itérable asynchrone d'événements
globaux (session.created, tool.executed, etc.). Utile pour la journalisation
ou la synchronisation d'état. Toujours utiliser un `AbortController` pour
l'arrêter dans le cleanup.

```ts
const controller = new AbortController()
void (async () => {
  for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
    if (event.type === "session.created") { /* … */ }
  }
})()
// Cleanup : controller.abort()
```

## Bonnes pratiques

1. **Cleanup obligatoire** : tout hook ou abonnement doit être disposé dans le
   retour du `setup`, sinon fuite mémoire et comportement fantôme.
2. **Async dans les hooks** : un handler de hook peut être `async` (ex. vérifier
   un fichier `.enabled` avant d'agir). L'event n'est pas bloquant.
3. **Autorisation explicite** : un plugin qui modifie le comportement doit
   vérifier une autorisation (fichier `.enabled`, variable d'environnement)
   avant d'agir, et rester totalement inactif sinon.
4. **Projet courant** : filtrer les événements par `ctx.location.project?.id`
   pour éviter les effets de bord sur d'autres projets.
5. **Jamais de secret** : un plugin ne lit ni n'affiche jamais un secret (§4 AGENTS).
