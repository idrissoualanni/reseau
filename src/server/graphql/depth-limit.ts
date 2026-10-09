import {
  GraphQLError,
  Kind,
  type ASTVisitor,
  type FragmentDefinitionNode,
  type SelectionSetNode,
  type ValidationContext,
} from "graphql";

// Limite de profondeur de requête (api-graphql §9) sans dépendance externe :
// on parcourt l'AST en résolvant les fragments, avec garde anti-boucle.
function selectionDepth(
  set: SelectionSetNode,
  fragments: Map<string, FragmentDefinitionNode>,
  seen: Set<string>,
): number {
  let max = 0;
  for (const selection of set.selections) {
    let depth = 0;
    if (selection.kind === Kind.FIELD) {
      depth = 1 + (selection.selectionSet ? selectionDepth(selection.selectionSet, fragments, seen) : 0);
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      depth = selection.selectionSet ? selectionDepth(selection.selectionSet, fragments, seen) : 0;
    } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
      const name = selection.name.value;
      if (!seen.has(name)) {
        seen.add(name);
        const fragment = fragments.get(name);
        if (fragment) depth = selectionDepth(fragment.selectionSet, fragments, seen);
        seen.delete(name);
      }
    }
    if (depth > max) max = depth;
  }
  return max;
}

export function depthLimitRule(maxDepth: number) {
  return (context: ValidationContext): ASTVisitor => {
    const fragments = new Map<string, FragmentDefinitionNode>();
    return {
      Document: {
        enter(node) {
          for (const definition of node.definitions) {
            if (definition.kind === Kind.FRAGMENT_DEFINITION) {
              fragments.set(definition.name.value, definition);
            }
          }
        },
      },
      OperationDefinition(node) {
        const depth = selectionDepth(node.selectionSet, fragments, new Set());
        if (depth > maxDepth) {
          context.reportError(
            new GraphQLError(`Requête trop profonde (maximum ${maxDepth} niveaux).`),
          );
        }
      },
    };
  };
}
