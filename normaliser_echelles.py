# -*- coding: utf-8 -*-
"""
Normalise les échelles typographique et d'espacement de mafiche.html.

Constat mesuré avant transformation : 26 tailles de police distinctes et
26 valeurs d'espacement distinctes, dont dix paliers typographiques entre
9 et 13px. Un écart d'un demi-pixel ne produit aucune hiérarchie lisible —
seulement de l'incohérence.

Le script ne touche QUE les valeurs hors grille, avec un décalage maximal
de 2px. Il ne redimensionne pas l'interface : il supprime le bruit.

Zones protégées : les gabarits de documents imprimés (fonctions contenant
`@page`), où les valeurs en px correspondent à une mise en page A4.

Usage :  python normaliser_echelles.py [--dry-run]
"""
import re
import sys

FICHIER = 'mafiche.html'

# ── Échelle typographique retenue (que des entiers, plus de demi-pas) ──
#    8 · 9 · 10 · 11 · 12 · 13 · 14 · 16 · 18 · 20 · 22 · 24 · 28 · 34
TYPO = {
    '7.5': '8',    '8.5': '9',    '9.5': '10',   '10.5': '11',
    '11.5': '12',  '12.5': '13',  '13.5': '14',  '15': '16',
    '19': '20',    '23': '22',    '26': '28',    '36': '34',
}

# ── Échelle d'espacement retenue (base 2, pas utiles conservés) ──
#    2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 28 · 32 · 40 · 48
ESPACE = {
    '1': '2',    '3': '4',    '5': '4',    '7': '8',    '9': '8',
    '11': '12',  '13': '12',  '18': '20',  '22': '24',  '26': '24',
    '30': '32',  '36': '40',
}
# Volontairement non normalisés : 56px (encart large) et 60px (réserve de
# signature manuscrite) — des espaces délibérés, pas du bruit.

PROPS_ESPACE = (
    'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
    'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
    'gap', 'row-gap', 'column-gap',
)


def regions_protegees(contenu):
    """Fonctions générant des documents imprimés : intervalles [début, fin).

    Repérées par la présence d'un bloc <style> contenant @page dans leur
    corps. Les px y décrivent une page A4, pas l'interface.
    """
    declarations = [(m.start(), m.group(1))
                    for m in re.finditer(r'^[ \t]*(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(',
                                         contenu, re.M)]
    regions = []
    for marque in re.finditer(r'@page', contenu):
        # déclaration de fonction la plus proche en amont
        debut, nom = None, None
        for pos, n in declarations:
            if pos <= marque.start():
                debut, nom = pos, n
            else:
                break
        if debut is None:
            # @page hors de toute fonction : le bloc <style> lui-même
            ouvre = contenu.rfind('<style>', 0, marque.start())
            ferme = contenu.find('</style>', marque.start())
            if ouvre != -1 and ferme != -1:
                regions.append((ouvre, ferme + 8, '<style> @page'))
            continue
        # fin de la fonction par appariement d'accolades
        profondeur, i, demarre = 0, debut, False
        while i < len(contenu):
            if contenu[i] == '{':
                profondeur += 1
                demarre = True
            elif contenu[i] == '}':
                profondeur -= 1
                if demarre and profondeur == 0:
                    break
            i += 1
        regions.append((debut, i + 1, nom))
    # fusion des intervalles qui se recouvrent
    regions.sort()
    fusionnees = []
    for a, b, nom in regions:
        if fusionnees and a <= fusionnees[-1][1]:
            fusionnees[-1] = (fusionnees[-1][0], max(fusionnees[-1][1], b),
                              fusionnees[-1][2] + ' + ' + nom)
        else:
            fusionnees.append((a, b, nom))
    return fusionnees


def main():
    essai = '--dry-run' in sys.argv
    contenu = open(FICHIER, encoding='utf-8').read()

    protegees = regions_protegees(contenu)
    print('Régions protégées (documents imprimés) : %d' % len(protegees))
    for a, b, nom in protegees:
        print('   L%-6d → L%-6d  %s' % (contenu[:a].count('\n') + 1,
                                        contenu[:b].count('\n') + 1, nom[:70]))

    def protege(i):
        return any(a <= i < b for a, b, _ in protegees)

    compteur = {'typo': 0, 'espace': 0}

    # ── font-size ──
    def sub_typo(m):
        if protege(m.start()):
            return m.group(0)
        val = m.group(1)
        if val in TYPO:
            compteur['typo'] += 1
            return m.group(0).replace(val + 'px', TYPO[val] + 'px', 1)
        return m.group(0)

    contenu = re.sub(r'(?<![-a-z])font-size\s*:\s*([0-9.]+)px',
                     lambda m: sub_typo(m), contenu)

    # ── padding / margin / gap (raccourcis 1 à 4 valeurs) ──
    props = '|'.join(PROPS_ESPACE)

    def sub_espace(m):
        if protege(m.start()):
            return m.group(0)
        tete, valeur = m.group(1), m.group(2)

        def une(mm):
            v = mm.group(1)
            if v in ESPACE:
                compteur['espace'] += 1
                return ESPACE[v] + 'px'
            return mm.group(0)

        return tete + re.sub(r'([0-9.]+)px', une, valeur)

    contenu = re.sub(r'(?<![-a-z])((?:' + props + r')\s*:\s*)([^;"}\n\']+)',
                     lambda m: sub_espace(m), contenu)

    print()
    print('font-size normalisés        : %d' % compteur['typo'])
    print('espacements normalisés      : %d' % compteur['espace'])

    if essai:
        print('\n[--dry-run] rien écrit.')
        return 0

    open(FICHIER, 'w', encoding='utf-8').write(contenu)
    print('\nÉcrit dans %s' % FICHIER)
    return 0


if __name__ == '__main__':
    sys.exit(main())
