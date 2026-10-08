---
description: Mettre à jour CHANGELOG.md à partir des commits fusionnés
---
1. Liste les commits depuis le dernier tag : `git log <dernier-tag>..dev --pretty=format:'%s'`.
2. Classe par catégorie Keep a Changelog : Ajouté (`feat`), Modifié, Corrigé (`fix`), Sécurité, Supprimé. Ignore `chore`/`docs` sans effet utilisateur.
3. Rédige en **français**, du point de vue utilisateur, une ligne par changement, avec la référence de fonctionnalité (`F06`).
4. Insère une section `## [version] - AAAA-MM-JJ` sous `[Non publié]` (version = argument, sinon propose-la selon SemVer : majeur/mineur/correctif) et vide `[Non publié]`.
5. Montre-moi le diff avant de committer.