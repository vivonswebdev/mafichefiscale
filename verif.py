# -*- coding: utf-8 -*-
"""
Routine de vérification de mafiche.html — remplace la routine de la passation
(qui dépendait de `node --check`, indisponible sur cette machine).

Usage :  python verif.py
Sortie :  code 0 si tout est vert, 1 si au moins une anomalie bloquante.
"""
import re
import sys
import collections

FICHIER = 'mafiche.html'

# Fonctions référencées mais fournies par les librairies CDN ou le navigateur
EXTERNES = {
    'html2pdf', 'XLSX', 'Chart', 'alert', 'confirm', 'prompt', 'print',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'fetch',
    'parseInt', 'parseFloat', 'isNaN', 'encodeURIComponent', 'decodeURIComponent',
    'String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'Math', 'JSON',
    'RegExp', 'Error', 'Promise', 'Set', 'Map', 'Blob', 'URL', 'FileReader',
    'require', 'atob', 'btoa', 'structuredClone', 'queueMicrotask',
    'getComputedStyle', 'matchMedia', 'scrollTo', 'open', 'close', 'focus', 'blur',
}

# Faux positifs confirmés à la main : l'analyseur ne tokenise pas le JS.
# Chacun a été tracé jusqu'à son occurrence réelle — ne rien ajouter ici
# sans avoir vérifié la ligne concernée.
FAUX_POSITIFS = {
    # fonctions CSS à l'intérieur de gabarits `...${}...`
    'rgba', 'var', 'repeat', 'min', 'max', 'gradient', 'saturate', 'blur',
    'translateY', 'translateX', 'scale', 'rotate', 'calc', 'url', 'clamp',
    # capturés dans un littéral /regex/ (ex. /(\d+)\s*h(?:eure[s]?)?/)
    'h',
    # déclarés dans un `const a=…,b=…` multiple, que la regex de déclaration rate
    'toRad',
    # mots français suivis d'une parenthèse dans un message utilisateur
    'employeur', 'nature', 'temps', 'anomalie', 'bloquante', 'autre',
    # méthode abrégée dans un objet littéral : `analyser(){…}` (objet AGENTS)
    'analyser',
    # paramètres de `new Promise((ok, ko) => …)` : l'analyseur ne suit pas les
    # paramètres de fonction, seulement les déclarations de premier niveau
    'ok', 'ko',
}

MOTS_CLES = {'if', 'for', 'while', 'switch', 'catch', 'return', 'function',
             'typeof', 'new', 'delete', 'void', 'in', 'of', 'do', 'else',
             'try', 'await', 'yield', 'throw', 'case', 'this', 'super'}

# IDs connus comme morts mais protégés par une garde (legacy, non bloquant)
MORTS_TOLERES = {
    'hdrExpBadge', 'ts_man_task', 'ts_timer_display',
    'lt_var_date_echeance', 'lt_var_date_limite', 'lt_var_facture',
    'lt_var_liste_documents', 'lt_var_montant',
}


def extraire_js(contenu):
    """Le gros bloc applicatif est le dernier <script> sans attribut src."""
    blocs = re.findall(r'<script>(.*?)</script>', contenu, re.S)
    return blocs[-1] if blocs else ''


def sans_litteraux(js):
    """Neutralise chaînes, gabarits et commentaires.

    Sans ça, chaque mot français suivi d'une parenthèse dans un message
    utilisateur ('la facture (n°…)') est compté comme un appel de fonction.
    """
    sortie = []
    i, n = 0, len(js)
    while i < n:
        ch = js[i]
        # Les commentaires PASSENT AVANT les guillemets : sinon l'apostrophe
        # d'un commentaire français ouvre une fausse chaîne et désynchronise
        # tout le reste du fichier.
        if ch == '/' and i + 1 < n and js[i + 1] == '/':
            while i < n and js[i] != '\n':
                i += 1
        elif ch == '/' and i + 1 < n and js[i + 1] == '*':
            i = js.find('*/', i + 2)
            i = n if i == -1 else i + 2
        elif ch in '"\'`':
            quote = ch
            i += 1
            while i < n and js[i] != quote:
                i += 2 if js[i] == '\\' else 1
            i += 1
            sortie.append('""')
        else:
            sortie.append(ch)
            i += 1
    return ''.join(sortie)


# `function nom(` et `async function nom(`
RE_FONCTION = r'^\s*(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\('


def titre(t):
    print('\n' + '=' * 62)
    print('  ' + t)
    print('=' * 62)


def main():
    contenu = open(FICHIER, encoding='utf-8').read()
    js = extraire_js(contenu)
    open('extracted.js', 'w', encoding='utf-8').write(js)

    anomalies = []
    avertissements = []

    print('Fichier   : %s' % FICHIER)
    print('Taille    : %d lignes, %d Ko' % (contenu.count('\n') + 1, len(contenu) // 1024))
    print('Bloc JS   : %d lignes' % (js.count('\n') + 1))

    # ---------------------------------------------------------------- balises
    titre('1. Équilibre des balises (HTML statique, hors <script>)')
    # Les <script> contiennent des gabarits HTML volontairement partiels et des
    # commentaires citant des balises : les inclure fausse le comptage.
    html_statique = re.sub(r'<script.*?</script>', '', contenu, flags=re.S)
    for balise in ('div', 'span', 'button', 'section', 'details', 'table', 'aside'):
        ouv = len(re.findall(r'<%s[\s>]' % balise, html_statique))
        fer = len(re.findall(r'</%s>' % balise, html_statique))
        etat = 'OK' if ouv == fer else 'ECART %+d' % (ouv - fer)
        if ouv != fer:
            anomalies.append('Balises <%s> déséquilibrées (%+d)' % (balise, ouv - fer))
        print('  <%-8s %5d ouvertes / %5d fermées   %s' % (balise + '>', ouv, fer, etat))

    # ------------------------------------------------------- fonctions dupliquées
    titre('2. Fonctions dupliquées')
    fonctions = re.findall(RE_FONCTION, js, re.M)
    doublons = [(n, c) for n, c in collections.Counter(fonctions).items() if c > 1]
    print('  %d fonctions déclarées, %d uniques' % (len(fonctions), len(set(fonctions))))
    if doublons:
        for nom, nb in sorted(doublons):
            print('  DOUBLON : %s x%d' % (nom, nb))
            anomalies.append('Fonction dupliquée : %s (x%d)' % (nom, nb))
    else:
        print('  Aucun doublon.')

    # ------------------------------------------------------------ IDs dupliqués
    titre('3. IDs HTML dupliqués (HTML statique, hors <script>)')
    # Les gabarits JS contiennent des branches alternatives qui réutilisent les
    # mêmes ids (un seul rendu à la fois) : les compter donnerait de faux doublons.
    ids = re.findall(r'\sid="([^"]+)"', html_statique)
    doublons_id = [(n, c) for n, c in collections.Counter(ids).items() if c > 1]
    print('  %d IDs, %d uniques' % (len(ids), len(set(ids))))
    if doublons_id:
        for nom, nb in sorted(doublons_id):
            print('  DOUBLON : %s x%d' % (nom, nb))
            anomalies.append('ID dupliqué : %s (x%d)' % (nom, nb))
    else:
        print('  Aucun doublon.')

    # ----------------------------------------------------- IDs référencés absents
    titre('4. IDs référencés en JS mais absents du HTML')
    references = set(re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", js))
    # Un id interpolé (`kts_${t.id}`) n'est connu qu'à l'exécution : l'élément
    # est créé dans le même gabarit, il n'y a rien à vérifier statiquement.
    references = {r for r in references if '${' not in r}
    # un ID peut être créé dynamiquement dans un template JS
    crees_dynamiquement = set(re.findall(r"""id=['"\\`]?([A-Za-z0-9_-]+)""", js))
    absents = sorted(references - set(ids) - crees_dynamiquement)
    nouveaux = [i for i in absents if i not in MORTS_TOLERES]
    print('  %d absents au total (%d tolérés comme legacy)' % (len(absents), len(absents) - len(nouveaux)))
    for i in nouveaux:
        print('  NOUVEAU MORT : %s' % i)
        anomalies.append('ID référencé mais jamais créé : %s' % i)
    if not nouveaux:
        print('  Aucun nouvel ID mort.')

    # ------------------------------------------------- appels vers fonctions absentes
    titre('5. Appels vers des fonctions inexistantes')
    js_code = sans_litteraux(js)
    declarees = set(fonctions)
    declarees |= set(re.findall(r'(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:function|\()', js_code))
    declarees |= set(re.findall(r'(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*[A-Za-z0-9_$]*\s*=>', js_code))
    appelees = set(re.findall(r'(?<![.\w$])([A-Za-z_$][A-Za-z0-9_$]*)\s*\(', js_code))
    manquantes = sorted(appelees - declarees - EXTERNES - MOTS_CLES - FAUX_POSITIFS)
    manquantes = [f for f in manquantes if not f[0].isupper()]
    if manquantes:
        print('  %d appels non résolus (vérifier manuellement) :' % len(manquantes))
        for f in manquantes:
            print('    - %s' % f)
            avertissements.append('Appel non résolu : %s' % f)
    else:
        print('  Aucun appel non résolu.')

    # --------------------------------------------------------- handlers onclick
    titre('6. Handlers HTML pointant vers une fonction absente')
    handlers = set(re.findall(r'on(?:click|change|input|submit|focus|blur)="([A-Za-z0-9_$]+)\(', contenu))
    orphelins = sorted(handlers - declarees - EXTERNES - MOTS_CLES)
    if orphelins:
        for f in orphelins:
            print('  ORPHELIN : %s()' % f)
            anomalies.append('Handler HTML vers fonction absente : %s()' % f)
    else:
        print('  Tous les handlers pointent vers une fonction déclarée.')

    # ------------------------------------------------------------ cohérence nav
    titre('7. Cohérence navigation')
    pages = re.findall(r'<div class="page[^"]*" id="page-([a-z0-9_-]+)"', contenu)
    cibles = set(re.findall(r"showMain\('([a-z0-9_-]+)'\)", contenu))
    cibles |= set(re.findall(r"showMain\('([a-z0-9_-]+)'\)", js))
    print('  %d pages : %s' % (len(pages), ', '.join(pages)))
    orphelines = sorted(set(pages) - cibles)
    fantomes = sorted(cibles - set(pages))
    if orphelines:
        print('  PAGE SANS LIEN : %s' % ', '.join(orphelines))
        avertissements.append('Page sans lien de navigation : %s' % ', '.join(orphelines))
    if fantomes:
        print('  LIEN VERS PAGE INEXISTANTE : %s' % ', '.join(fantomes))
        anomalies.append('Navigation vers page inexistante : %s' % ', '.join(fantomes))
    if not orphelines and not fantomes:
        print('  Navigation cohérente.')

    # ------------------------------------------------------------------ verdict
    titre('VERDICT')
    if anomalies:
        print('  %d ANOMALIE(S) BLOQUANTE(S) :' % len(anomalies))
        for a in anomalies:
            print('    x %s' % a)
    else:
        print('  Aucune anomalie bloquante.')
    if avertissements:
        print('  %d avertissement(s) à vérifier à la main.' % len(avertissements))
    print()
    return 1 if anomalies else 0


if __name__ == '__main__':
    sys.exit(main())
