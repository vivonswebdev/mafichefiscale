# Passation — mafiche.be

Document de reprise de contexte. Dernière mise à jour : **23 septembre 2026**.
Version de travail : **v46** (19 548 lignes, 1 149 Ko).

---

## 🎯 Objectif

Construire **mafiche.be**, outil interne de gestion de cabinet fiduciaire pour
**FiscoTeam** (Youssef Kaillani, Koekelberg, BCE 0766.868.934).

Contraintes fondatrices, à respecter dans toute suite :

- **Fichier HTML unique**, mono-utilisateur, stockage `localStorage` (`btxpro_db`),
  **aucun backend serveur**.
- Pas de facturation Peppol pour l'instant (volontairement exclu).
- **Une source unique par donnée.** Ne jamais créer un système parallèle à une
  structure existante (`DB.tasks`, `DB.notes`, `DB.rdv`, `DB.clients`, `DB.tarifs`,
  `DB.attTemplates`, `DB.echeancesDone`…). Cette règle a été violée plusieurs fois
  par le passé et c'est la cause principale des incohérences.

### Objectif déclaré à moyen terme

Mise en ligne avec backend : login, clés API, rate limiting, RLS, mots de passe
hachés, droits vérifiés côté serveur, HTTPS, sessions qui expirent, validation des
entrées, limites d'upload, CORS, erreurs non détaillées, webhooks signés,
e-mail confirmé, backups automatiques.

**15 de ces 17 points sont des exigences serveur** et ne peuvent pas exister dans
un fichier HTML unique. Voir « Prochaine étape ».

---

## ⚠️ Problématique

**Le plafond de mafiche.be n'est pas fonctionnel, il est architectural.**

Un benchmark (Silverfin, TaxDome, Karbon, Canopy, FID-Manager) a confirmé que les
différenciateurs du marché sont : portail client sécurisé, signature eIDAS,
notifications automatiques, intégrations API belges (Horus, Exact Online, WinBooks,
Yuki), boîte mail d'équipe. **Aucun n'est réalisable sans backend.**

D'où le projet frère anticipé, **FiduPilot Pro**.

En attendant, le développement porte sur ce qui est réellement faisable sans
serveur. C'est ce qui a été fait dans cette session.

### État actuel — 18 pages

`dashboard · client · agents · clients · annuaire · notes · taches · agenda ·
timesheet · legaldoc · formulaires · compta · fiches · paie · immo · optim ·
parametres · aide`

**Modules construits dans cette session :**

| Module | Contenu |
|---|---|
| **Agents IA** | 6 agents locaux à base de règles sur une couche de détection partagée (`detecterImpayes`, `detecterDocsManquants`, `detecterForfaitsDepasses`, `detecterDossiersDormants`, `detecterEcheances`, `detecterDossiersFragiles`). Aucun n'agit seul. |
| **Légal Doc** (ex-Attestations) | Catalogue de 22 modèles en 9 familles : contrats, mandats, PV, lettres, attestations. Les 4 générateurs jusque-là dispersés y sont regroupés. |
| **Formulaires** | Constructeur de questionnaires, 17 types de champs. Export **HTML autonome** que le client remplit hors ligne et renvoie en `.json` réimportable. Aller-retour testé de bout en bout. |
| **Comptabilité simplifiée** | ASBL et personnes physiques. Plan comptable repris de `FFF 2024.xlsx`, écriture en partie double automatique, bilan + résultat avec **contrôle d'équilibre bloquant**, rapport PDF. |
| **Suivi par étapes** (Tâches) | Matrice clients × étapes façon FID-Manager, 6 modèles (TVA, IPP, ISOC, listing, clôture, VA), échéance légale intégrée en colonne. |
| **Tarifs** (Timesheet) | 55 tarifs en 7 familles + calculateur d'honoraires branché sur la même grille. |
| **Sauvegarde OneDrive** | File System Access API, écriture dans un dossier choisi une fois, copies datées, **détection de conflit multi-postes**. |

**v44 — les 5 derniers boutons PDF passent par `genererPdf()`** (22 septembre 2026)

`downloadArchivedPdf` (fiche de sortie), `downloadArchivesPdf` (historique des
associés), `downloadLivrePartsPdf`, `exportRapportPDF` (timesheet) et
`downloadInvoicePDF` produisaient un **fichier `.html`** portant
`<body onload="window.print()">` : l'utilisateur devait l'ouvrir puis
Ctrl+P → « Enregistrer en PDF ». Ils appellent désormais `genererPdf()`, qui
conserve son repli vers l'impression quand la bibliothèque CDN manque.

Plus aucun `window.print()` automatique dans le fichier. Les deux `print()`
restants sont volontaires : « Imprimer directement » de `modalFichePaie`
et `imprimerFormulaire()` (questionnaire vierge à remplir à la main).

**v45 — les chiffres affichés redeviennent vrais** (22 septembre 2026)

Audit sur la sauvegarde réelle (194 clients) : le tableau de bord annonçait
**−6 577,09 € de marge**, **384 échéances « ≤ 7 jours »** toutes passées, et
**2 vs 0 tâches en retard** sur le même écran. Trois causes, trois corrections,
toutes dans la couche de calcul partagée (`detecter*`) :

| Cause | Correction |
|---|---|
| Un chrono oublié → entrée de **5 448 min (90 h)** sur une journée, aucun contrôle | `dureeTempsValidee()` à la saisie manuelle **et** à l'arrêt du chrono : confirmation au-delà de la journée type (`DB.rh.maxDay`), correction obligatoire au-delà de 24 h |
| Les agrégats lisaient `DB.timeEntries` brut | `entreesTempsFiables()`, consommé par `calculerRentabiliteGlobale`, `getProfitabilityTable` et `detecterForfaitsDepasses`. **Rien n'est supprimé** : l'entrée est écartée des calculs, signalée dans le timesheet, et le KPI dit « 1 saisie de plus de 24 h écartée » |
| `e.date <= today+7j` **sans borne basse** | `echeancesAVenir(n)` / `echeancesPassees()`. Le bloc affiche « 0 » et, en sous-titre, « + 384 passée(s) non pointée(s) » |
| KPI et bloc « Aujourd'hui » comptaient chacun de leur côté | `tachesEnRetard(membre)` / `tachesDuJour(membre)`, source unique. Chaque compteur affiche son périmètre (`perimetreMembre()`) : « tout le cabinet » vs « youssef kaillani » |

Résultat mesuré sur les mêmes données : marge **+232,91 €**, échéances ≤ 7 j
**0**, et le Veilleur fiscal (qui, lui, avait toujours raison) dit désormais la
même chose que le tableau de bord.

**v46 — plus aucune injection HTML** (22 septembre 2026)

Un client nommé `<img src=x onerror=…>` exécutait du code sur 3 des 10 pages
testées. Deux méthodes croisées, parce qu'aucune des deux ne suffit :

- **Analyse statique** (`scan_injection.py`, jeté après usage) : 108
  interpolations `${…}` posées dans du HTML sans `escX()`. Beaucoup de faux
  positifs — libellés de constantes (`cfg.label`, `STATUT_LABELS[…]`), ternaires
  rendant du HTML littéral, paramètres locaux. Elle voit les vues jamais
  ouvertes pendant un test.
- **Test d'injection au navigateur** : charge utile **inerte et comptable**
  (`<b data-xss="1">`) posée dans tous les champs de saisie, puis balayage des
  18 pages en comptant `document.querySelectorAll('[data-xss]')`. Pas un
  `onerror` — qui dépend du réseau et se déclenche une fois par nœud.

Corrigé : `renderSidebar` (le vecteur principal, la liste clients est présente
sur toutes les pages), `renderActionnaires`, `renderArchives`, `renderUBO`,
`renderLivreParts`, `renderFiches`, `renderClientsPage`, `renderFicheClientChips`,
`renderDirSelectorChips`, `renderDirSidebar`, `renderGlobalFichesProgress`,
`renderClientRelations`, `renderWhoAreYouList`, `renderSuiviEtapes`,
`taskRowHtml`, `proposerTransfert`, `updateXferPreview`, `useTemplate`,
`openAttestation`, `renderAnnuaire` (`href="tel:"` → `encodeURIComponent`).

`initials()` échappe désormais **en interne** plutôt qu'à chacun de ses 7
appels : l'initiale d'un nom commençant par `<` suffisait à casser le balisage.
Vérifié que ses 7 sites sont bien des gabarits HTML, pas des `textContent`.

Résultat mesuré : **0 nœud injecté sur les 18 pages**, et **243 occurrences de
la charge utile rendues en texte échappé** — la donnée s'affiche toujours, elle
est seulement neutralisée. Aucun double échappement : 0 entité visible, et les
noms réels à apostrophe ou accent (`L'Olivo`, `M&K AGENCY`, `CLARTÉ SANTÉ`)
s'affichent tels quels.

`.gitignore` écrit, mais **git n'est pas installé sur la machine** — décision
en attente.

---

## 📁 Fichiers importants

Tout est dans `C:\Users\fisco\Documents\mafiche.be\`.

| Fichier | Rôle |
|---|---|
| `mafiche.html` | **Fichier de travail.** 19 548 lignes. |
| `verif.py` | Routine de vérification. `python verif.py` |
| `normaliser_echelles.py` | Normalisation typo/espacements, rejouable |
| `migrer_blocs.py` | Déplacement de blocs HTML entre pages, avec verrous |
| `versions/` | 17 points de sauvegarde, de v36 à v46 |
| `.gitignore` | Prêt. **`backups/` et `*.json` exclus** : 194 dossiers réels, un commit ne s'efface pas |
| `backups/` | Les 3 sauvegardes JSON réelles (194 clients) |
| `_import/FFF-2024.xlsx` | Copie du classeur ASBL source |
| `.claude/launch.json` | Serveur local pour le navigateur |

### Routine de vérification — IMPORTANT

`node` **n'est pas installé** sur cette machine. La routine de l'ancienne passation
(`node --check`) est inapplicable. Elle est remplacée par :

```bash
python verif.py
```

Contrôle : balises, fonctions dupliquées, IDs dupliqués, IDs orphelins, handlers
morts, cohérence de navigation.

**`verif.py` ne détecte PAS les erreurs de syntaxe JavaScript.** Il n'est pas un
analyseur JS : il ne tokenise ni les `/regex/`, ni les gabarits, ni les paramètres
de fonction. Ses faux positifs connus sont documentés en tête de fichier.

**Le seul vrai contrôle de syntaxe est le chargement navigateur :**

```bash
python -m http.server 8777
# puis ouvrir http://localhost:8777/mafiche.html et lire la console
```

Ne jamais conclure sans ce chargement.

---

## ❌ Ce qui a raté

Incidents réels de cette session. Tous corrigés, mais les causes se répètent.

### Bugs préexistants découverts

1. **`hm()` et `clientNom()` n'existaient pas.** Appelées 26 fois, jamais définies —
   restes d'un renommage inachevé vers `minutesToHM()` et `getClientName()`.
   **Quatre fonctionnalités plantaient** avec `ReferenceError` dès qu'il y avait des
   données : rapport Timesheet, exports CSV/XLSX/PDF, facturation, Assistant IA.
   Invisible parce que `timeEntries` et `invoices` étaient vides dans les sauvegardes.

2. **`toISO()` décalait toutes les dates d'un jour.** Il passait par `toISOString()`,
   qui convertit en UTC : à Bruxelles, une date créée à minuit local reculait d'un
   jour. L'échéance TVA du 20 octobre devenait le 19 ; **le 1er janvier 2026 devenait
   le 31 décembre 2025**. 113 appels concernés.

3. **Le graphique de Rentabilité plantait.** Il lisait `r.nom` alors que
   `getProfitabilityTable` renvoie le client sous `r.c`. Avec un taux horaire
   configuré (165 €) et des clients au forfait, tout l'onglet était cassé.

4. **Le plancher tarifaire était du code mort.** Le calculateur ajoutait
   « Forfait de base = tarif minimum » comme première ligne : le total ne pouvait
   jamais lui être inférieur, l'alerte ne pouvait jamais se déclencher.

5. **Débordement mobile de 74px**, toutes pages. Trois causes distinctes :
   en-tête rigide, grilles en `1fr` (= `minmax(auto,1fr)`, qui refuse de comprimer
   un `<select>` aux options longues), `.alert` en flex sans `wrap`.

6. **`overflow-x:hidden` sur `body` et `overflow-y:auto` sur `.main`** neutralisaient
   tout `position:sticky`. `.main` ne défilait jamais mais captait quand même le
   référentiel du sticky.

7. **Le bouton « 📄 PDF » de la fenêtre d'édition de facture produisait un
   document vide.** Il appelait `downloadInvoicePDF()` **sans argument** ;
   `inv=inv||{}` faisait le reste. La facture en cours de saisie n'étant pas
   encore dans `DB.invoices`, il n'y avait rien à imprimer. Corrigé en extrayant
   `invoiceDepuisFormulaire()`, seule lecture du formulaire, partagée par
   `saveInvoice()` et par le nouveau `downloadInvoiceFormPDF()`.

### Erreurs commises pendant le développement

8. **Erreur de syntaxe JS ayant tué toute l'app.** Un `\\'` dans une interpolation
   `${...}` : le double antislash fermait la chaîne. `verif.py` n'a rien vu, seul le
   chargement navigateur l'a révélé.

9. **Premiers PDF entièrement blancs.** Le document était rendu hors écran
   (`left:-10000px`) : html2canvas produit alors un canvas de hauteur nulle.
   `genererPdf()` renvoyait `true`, notification de succès, PDF de 3 Ko vides.
   **Détecté seulement en comptant les pixels d'encre du canvas.** Le rendu doit
   rester dans le flux, dans une enveloppe `height:0;overflow:hidden`.

10. **Collision de classe CSS.** `.client-card` existait déjà pour la barre latérale :
    le nouveau style s'appliquait à ses 192 entrées. Renommé `.client-tile`.

11. **Migration de tarifs conditionnée à l'ouverture d'un onglet** — une base
    existante restait aux anciennes clés et les calculs renvoyaient `NaN`. Toute
    migration doit être dans `load()`.

12. **Mesures faussées à plusieurs reprises** : panneau navigateur masqué
    (`innerWidth: 0`), iframes servant une version en cache, interception mal
    chaînée. Ne jamais conclure sur une mesure sans vérifier qu'elle porte bien sur
    la version courante, dans un viewport réel.

### Leçon transversale

Un code de retour `true` et une notification de succès **ne prouvent rien**.
Vérifier le résultat observable : pixels d'encre, nombre de lignes, solde recalculé,
contraste mesuré, nœuds injectés comptés.

**Une absence ne se prouve pas toute seule.** « 0 injection » ne vaut que si on
montre en même temps que la charge utile *est* passée par les écrans — d'où les
243 occurrences échappées mesurées en v46, et les longueurs de HTML relevées
pour chaque sous-vue afin de prouver qu'elle avait bien rendu quelque chose.
Une vue qui ne s'affiche pas donne le même « 0 » qu'une vue sûre.

---

## ➡️ Prochaine étape

### Audit du 22/09/2026 — ce qui reste après v46

Mesuré sur la sauvegarde réelle (194 clients), dans le navigateur. Les volets
« chiffres faux » (v45) et « injection HTML » (v46) sont traités. Reste :

**1. Contrôle de version — bloqué.** `git` **n'est pas installé** sur la
machine ; `winget` l'est (v1.29.290). Le `.gitignore` est écrit et prêt.
Décision en attente de l'utilisateur : installer via
`winget install Git.Git`, ou installer à la main, ou rester sur `versions/`.
Tant que ce point n'est pas réglé, un fichier de 1,15 Mo se modifie **sans
`git diff`** — toute reprise se fait à l'aveugle.

**2. Mobile (375 px) — inutilisable.** Le débordement de 74 px est bien corrigé,
mais l'en-tête passe à deux lignes (83 px) alors que la barre latérale se
positionne comme s'il en faisait une : **9 collisions mesurées** entre les
boutons de l'en-tête et l'en-tête de la barre latérale. Et **240 des 254 cibles
tactiles font moins de 44×44 px** (26×26 dans l'en-tête).

**3. Largeur contre profondeur.** Sur **56 structures de données, 30 sont vides**,
une douzaine ne contiennent que les modèles livrés avec l'app, **12 portent des
données réelles** — et `clients` (194) + `historique` (192) pèsent 99 % du
volume. Sept modules n'ont aucune donnée : Fiches XML, Paie & OD,
Immobilisations, Compta simplifiée, Formulaires, Agenda, Facturation. La page
Tâches affiche 1 536 cases à cocher vides sans action groupée, et les 194
clients n'existent qu'en cartes — pas de vue tableau triable.

**4. Contraste.** **30,6 % des 807 textes** sous le seuil AA en thème sombre (pire cas
3,22:1 sur des libellés de 10 px). Le thème clair, lui, est correct — un premier
diagnostic « thème clair cassé » venait d'une capture réduite, invalidé à
l'échelle 1:1 (cf. incident 12).

### Décisions en attente

1. **Calculateur de fiscoteam.be** — demandé, mais le site n'était pas joignable
   depuis le panneau. Le calculateur actuel est construit sur le moteur interne.
   Il faut les entrées/sorties du vrai, ou son code.

### Comptabilité simplifiée — reste à faire

Le cahier des charges comptait 27 sections ; le socle fonctionnel est en place.
Non construit :

- Import du classeur Excel (assistant de correspondance)
- Import bancaire CSV et rapprochement
- Comptage de caisse billet par billet
- Écritures récurrentes
- Verrouillage d'exercice et extournes
- Onglet dans la fiche client
- Justificatifs comme fichiers (aujourd'hui seul le nom est stocké)

**Limite réglementaire assumée :** le module ne vérifie pas les seuils d'éligibilité
à la comptabilité simplifiée (travailleurs, recettes, avoirs, dettes). Cette
qualification engage une responsabilité juridique que le logiciel ne porte pas.
L'avertissement est affiché sur chaque écran et repris dans le PDF.

### Durcissement possible sans backend

- Validation systématique des entrées (partielle aujourd'hui : NISS, BCE, formulaires)
- Vérification du type réel et de la taille des fichiers importés (absente)

Déjà satisfaits : `console.log` propre (1 seul, aucune donnée sensible journalisée),
messages d'erreur sans détail technique.

### Feuille de route backend — FiduPilot Pro

**Phase 1** : portail client sécurisé, signature eIDAS, notifications, multi-utilisateur.
**Phase 2** : intégrations API belges, conformité Peppol (obligatoire depuis le
1er janvier 2026).
**Phase 3** : IA sur données réelles.

**Supabase** couvre nativement une grande partie de la liste sécurité (RLS, hachage,
JWT expirants, e-mail confirmé, backups, clé publique côté client), ce qui laisse à
traiter : rate limiting sur le login, validation, taille/type d'upload, webhooks
signés, dépendances.

---

## 🔧 Conventions à respecter

- **Une source unique par donnée.** Avant d'ajouter une structure, chercher si elle
  existe déjà. Les quatre générateurs de documents et les deux systèmes d'échéances
  venaient de cette règle non respectée.
- **Séparer calcul et rendu.** Les fonctions `detecter*()` et `bilanDu()` ne rendent
  rien : widgets et agents les consomment toutes les deux.
- **Toute migration va dans `load()`**, jamais dans une fonction de rendu.
- **Dates : jamais `toISOString()`** pour une date locale. Utiliser `toISO()`.
- **CSS d'un document PDF : toujours préfixé.** `genererPdf()` injecte le contenu
  **dans le document principal** le temps du rendu (html2canvas ne capture rien
  d'un élément hors écran — voir incident 9). Un `<style>` contenant `td{…}` ou
  `h1{…}` restylerait donc toute l'application. Chaque sélecteur porte le préfixe
  du document : `.pdf-sortie`, `.pdf-histo`, `.pdf-livre`, `.pdf-rapport`,
  `.pdf-facture`. Le format de page ne vient plus de `@page` mais des options
  (`paysage`, `marges`).
- **Grilles CSS : `minmax(0,1fr)`**, jamais `1fr` nu.
- **Confirmer toute suppression** en nommant ce qui disparaît.
- **Un compteur filtré affiche son périmètre.** Deux chiffres portant le même
  libellé avec des filtres différents, c'est un bug, pas une nuance.
- **Toute donnée saisie qui part dans `innerHTML` passe par `escX()`.** Y compris
  une initiale, un `title=`, un `href=` (là c'est `encodeURIComponent`). La règle
  vaut pour les valeurs venant de `DB`, jamais pour les constantes de l'app
  (`cfg.label`, `STATUT_LABELS[…]`) ni pour du HTML déjà assemblé (`corps`,
  `introPhrase`) — les échapper afficherait des balises à l'écran.
- **Une fonction dont la sortie ne va que dans du HTML échappe en interne**
  (`initials()`). Vérifier d'abord qu'aucun appelant ne l'utilise en
  `textContent`, sinon l'utilisateur verra des entités.
- **Une saisie invraisemblable n'est jamais supprimée** : elle est écartée des
  agrégats (`entreesTempsFiables()`), signalée là où l'utilisateur peut la
  corriger, et le compteur dit qu'il l'a écartée.
- **État vide** : utiliser `etatVide()`, qui nomme ce qui manque et propose l'action.
- Contraste ≥ 4,5:1, vérifié **dans les deux thèmes** (`body.theme-light` existe).
