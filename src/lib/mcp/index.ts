import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listClients from "./tools/list-clients";
import listFiches from "./tools/list-fiches";
import listDirigeants from "./tools/list-dirigeants";
import createFiche from "./tools/create-fiche";

// Managed Cloud Auth publishes the issuer on the direct supabase.co host.
// VITE_SUPABASE_PROJECT_ID is inlined at build time by Vite.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "mafiche-mcp",
  title: "mafiche.be",
  version: "0.1.0",
  instructions:
    "Outils mafiche.be pour consulter, via un assistant IA, les clients, dirigeants et fiches 281.20 du cabinet connecté. Les données restent privées à l'utilisateur authentifié (RLS).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listClients, listFiches, listDirigeants],
});
