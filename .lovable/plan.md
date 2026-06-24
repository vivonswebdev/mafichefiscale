
# Audit général mafiche.be

Aucun changement de code. Sources : lecture des routes, `supabase--linter`, `security--run_security_scan`, vérification RLS / GRANTs / policies, console et runtime (vides au moment du scan).

---

## 1) Erreurs console / runtime

À l'instant du scan : **aucune erreur console, aucune erreur runtime, aucune requête réseau en échec** capturée.
Sans erreur live, la suite vient d'une lecture statique du code.

---

## 2) Bugs fonctionnels — par gravité

### CRITIQUE

1. **`/app` masque la navigation — utilisateur piégé**
   `src/routes/_authenticated/app.tsx` rend un `<iframe>` `position: fixed; inset: 0; z-index: 100;` qui recouvre `SiteHeader`. Plus aucun lien pour revenir au dashboard, aux factures, à l'admin, ou se déconnecter. Le seul recours est le bouton "Précédent" du navigateur.

2. **Pricing : 3 CTA totalement morts**
   `src/routes/pricing.tsx` lignes 80-97 — les boutons `Commencer`, `Choisir Cabinet`, `Contacter` n'ont **ni `onClick` ni `Link`**. Cliquer ne fait rien. Sur une page tarifs, c'est le point de conversion principal.

3. **Footer : 3 liens morts**
   `SiteFooter` (`site-header.tsx` 135-137) — `Confidentialité`, `Conditions`, `Contact` pointent vers `href="#"`. Outre l'UX, ça affaiblit la conformité (CGU/RGPD attendus en pied de page d'un outil pro).

4. **Aucun parcours "Mot de passe oublié"**
   `src/routes/auth.tsx` n'expose ni lien "mot de passe oublié", ni route `/reset-password`. Un utilisateur qui perd son mot de passe est bloqué.

### HAUTE

5. **Navigation mobile invisible**
   `SiteHeader` (ligne 59) : `<nav className="hidden md:flex …">`. En dessous de 768 px, **aucune navigation, aucun menu hamburger**. Sur mobile l'utilisateur n'a que le logo et le bouton Déconnexion.

6. **`signOut` ne purge pas le cache React Query**
   `SiteHeader.signOut` ne fait que `supabase.auth.signOut()` + `navigate('/auth')`. Il manque `queryClient.cancelQueries()` puis `queryClient.clear()` (règle "Sign-Out Hygiene"). Conséquence : les queries protégées en vol rendent un 401 storm, et un retour-arrière peut afficher brièvement des données privées en cache.

7. **Command palette (Ctrl/Cmd+K) active partout, y compris pages publiques**
   `CommandPalette` est monté dans `__root.tsx`. Sur `/`, `/pricing`, `/about`, `/auth`, le raccourci ouvre la palette qui interroge ensuite Supabase sans session — résultats vides, expérience "cassée". À gater par authentification.

8. **Stats du hero hard-codées et invérifiables**
   `routes/index.tsx` 63-74 : « 12 400+ fiches », « 850 cabinets actifs ». Trompeur pour une app jeune ; risque réglementaire (pratiques commerciales déloyales) et crédibilité.

9. **Synchronisation iframe ↔ Supabase sans debounce**
   `app.tsx` déclenche `syncDb` à chaque message `MAFICHE_SYNC`/`DB_SYNC`. L'HTML poste un message à **chaque** `save()`, qui est appelé sur la moindre saisie. En cas de saisies rapides, plusieurs ronds de `select * + insert/update` s'enchevêtrent → race conditions, possibilité d'écraser une valeur fraîche par une plus ancienne.

10. **Confirmation `confirm()` native pour la suppression d'utilisateur** (`admin.tsx` 328)
    Bloquant, non stylé, ignoré par certains navigateurs. À remplacer par `AlertDialog` shadcn (déjà installé).

### MOYENNE

11. **Greeting genré "Maître {full_name}"** (`dashboard.tsx` 61) — exclut implicitement la moitié des utilisatrices.

12. **`emailRedirectTo: window.location.origin`** dans `auth.tsx` (ligne 42) — après confirmation email, l'utilisateur atterrit sur la landing publique au lieu de `/dashboard` ou `/auth`. Confusant.

13. **Items "Clients" et "Dirigeants" de la palette redirigent tous vers `/clients`** (`command-palette.tsx`). Aucune pré-sélection / focus → la recherche n'amène pas à l'élément trouvé.

14. **Dashboard et navigation : "Tableau de bord" + "Application" sont deux entrées séparées** dans le header alors qu'elles couvrent fortement le même domaine. Source de confusion permanente (deux sources de vérité, deux UX différentes).

15. **`postMessage(..., '*')`** dans `app.tsx` et `index.html`. Ciblage origine étoile : tolérable en same-origin mais à durcir vers `window.location.origin` pour éviter qu'un tiers iframé puisse intercepter.

16. **Pas de `errorComponent` / `notFoundComponent`** sur les routes enfants (`dashboard`, `clients`, `invoices`, `admin`, `app`). Les règles TanStack recommandent les deux pour toute route avec loader/data ; ici toute erreur Supabase remonte au root et masque la page.

17. **`dashboard.tsx` : pas de gestion d'erreur visuelle** — si la query échoue, on tombe sur un état vide silencieux ; l'utilisateur croit n'avoir aucune donnée.

### BASSE

18. **`fiscal_year_end` stocké en `text` (`"31/12"`)** : ni validable ni triable. À normaliser plus tard (`smallint` mois + jour, ou `interval`).

19. **`fiches.year` créée comme `integer`** côté Supabase mais formulaire `clients.tsx` envoie aussi `montant_brut: 0` par défaut — fiche brouillon à 0 € créable, pas de validation min.

20. **"Live" badge décoratif** sur le dashboard (ligne 104-109) — pas de WebSocket / realtime réel, juste un label.

---

## 3) Sécurité

### CRITIQUE
*(aucun bloquant détecté)*

### HAUTE

S1. **Provider Google non garanti activé**
`lovable.auth.signInWithOAuth("google", …)` est appelé sans vérification. Si Google n'est pas activé dans l'auth backend, la connexion renvoie "Unsupported provider" — à confirmer côté Backend (tool `supabase--configure_social_auth`).

S2. **Pas de protection HIBP / fuite mots de passe**
`auth.tsx` n'impose que `minLength={8}`. La protection "Leaked Password" (HIBP) n'est pas activée côté backend. À activer via `configure_auth(password_hibp_enabled: true)`.

S3. **Pas de captcha / pas de rate-limit visible**
Énumération d'emails possible via les messages d'erreur de `signInWithPassword`. À mitiger via Supabase Auth rate limit + message générique.

### MOYENNE

S4. **`anon` a `SELECT` au niveau table sur 8 tables** (`audit_logs`, `user_roles`, `app_data`, `clients`, `dirigeants`, `fiches`, `invoices`, `profiles`).
RLS empêche la lecture effective des lignes (toutes les policies scopées `auth.uid()`), donc pas de fuite **aujourd'hui**. Mais c'est plus large que nécessaire : `audit_logs` et `user_roles` ne devraient pas être atteignables au PostgREST par `anon`. Recommandation : `REVOKE SELECT ON public.audit_logs, public.user_roles FROM anon;` et idem pour les tables strictement utilisateur (`fiches`, `dirigeants`, `clients`, `invoices`, `app_data`, `profiles`) tant qu'aucune policy `TO anon` n'existe.

S5. **Linter Supabase : 2 WARN "Signed-In Users Can Execute SECURITY DEFINER Function"**
Concernent vraisemblablement `has_role` et `log_admin_action`. Les deux sont *intentionnels* et corrects (le pattern security-definer est même la bonne pratique anti-récursion RLS, et `log_admin_action` re-vérifie `has_role` en interne). On peut considérer les deux WARN comme **acceptés**, à documenter dans la security memory pour ne pas réapparaître.

S6. **Route `/admin` : double gate redondant** (sain mais inutile)
`_authenticated/route.tsx` valide déjà la session. `admin.tsx` re-appelle `supabase.auth.getUser()` puis `rpc('has_role')`. La 2e étape (role check) reste indispensable, le `getUser()` est superflu. Pas un bug de sécurité, mais bruit réseau.

S7. **`postMessage('*')`** déjà cité ci-dessus — aussi un point sécurité.

### BASSE

S8. **`audit_logs.details`** stocke `meta.bce` et autres données client. Pas un secret mais à mémoriser pour RGPD : journal d'audit conservé indéfiniment, prévoir politique de rétention.

S9. **Service-role key** non exposée (`client.server.ts` chargé via `await import()` dans `.functions.ts`). OK.

---

## 4) Responsive / affichage

R1. **Mobile : navigation absente** — déjà cité (#5). Le plus visible.
R2. **`/app` iframe plein écran** — déjà cité (#1).
R3. **Tables dashboard / admin / invoices** : `overflow-x-auto` présent, scroll horizontal OK sur mobile, mais sans indicateur visuel → utilisateur ne sait pas qu'il peut scroller.
R4. **Formulaire `Nouveau client`** (`clients.tsx`) : sous `lg` (1024 px), passe en colonne pleine sous la liste — long scroll. Acceptable, pas bloquant.
R5. **Hero index** : `text-5xl md:text-7xl` + 4 stats en `grid-cols-2 md:grid-cols-4` — OK.
R6. **Command palette** sur mobile : couvre tout l'écran avec input large. OK shadcn par défaut, à tester avec un device réel.
R7. **Header sticky + backdrop blur** : peut être lent sur Safari mobile ancien — mineur.

---

## Liste priorisée à plat (top → bas)

| # | Gravité | Sujet | Effort |
|---|---|---|---|
| 1 | Critique | `/app` masque la nav — ajouter un header / bouton retour persistant | S |
| 2 | Critique | 3 CTA `pricing` morts | S |
| 3 | Critique | 3 liens footer morts (Confidentialité / Conditions / Contact) | S→M |
| 4 | Critique | Aucun parcours "mot de passe oublié" + page `/reset-password` | M |
| 5 | Haute | Pas de menu mobile (header en `hidden md:flex`) | S |
| 6 | Haute | `signOut` ne purge pas React Query | S |
| 7 | Haute | Ctrl/Cmd+K actif sur routes publiques | S |
| 8 | Haute | Stats hero invérifiables (12 400+ etc.) | S |
| 9 | Haute | Debounce sur la sync iframe → Supabase | S |
| 10 | Haute | `confirm()` natif pour delete user → AlertDialog | S |
| 11 | Haute | Sécurité : activer HIBP, vérifier Google provider, durcir rate-limit | S |
| 12 | Haute | Sécurité : `REVOKE SELECT … FROM anon` sur les tables non publiques | S |
| 13 | Moyenne | Greeting genré "Maître …" | S |
| 14 | Moyenne | `emailRedirectTo` → renvoyer vers `/dashboard` | S |
| 15 | Moyenne | Palette : pré-filtrer la page cible (client précis, fiche précise) | M |
| 16 | Moyenne | Fusionner ou clarifier "Tableau de bord" vs "Application" | M |
| 17 | Moyenne | Restreindre `postMessage` à `window.location.origin` | S |
| 18 | Moyenne | Ajouter `errorComponent` aux routes enfant | S |
| 19 | Basse | Validation `fiscal_year_end` / `montant_brut` | S |
| 20 | Basse | Documenter dans security memory les WARN linter acceptés | S |

S = < 30 min ; M = < 2 h.

---

## Recommandation d'ordre d'attaque

Phase 1 (UX cassée, visible immédiatement) — items 1, 2, 3, 5, 7.
Phase 2 (auth & sécurité) — items 4, 6, 11, 12.
Phase 3 (qualité produit) — items 8, 9, 10, 13–18.
Phase 4 (durcissement) — items 19, 20 + revue régulière du linter.

Aucune modification n'a été appliquée. Validez la phase à attaquer (ou un sous-ensemble), et je passe en mode build.
