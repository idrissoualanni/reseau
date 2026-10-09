import { builder } from "@/server/graphql/builder";
// Les imports suivants enregistrent types, queries et mutations sur le builder.
import "@/server/graphql/types/connection";
import "@/server/graphql/types/profile";
import "@/server/graphql/types/skill";
import "@/server/graphql/types/project";

// Schéma exécutable construit à partir de tous les types enregistrés.
export const schema = builder.toSchema();
