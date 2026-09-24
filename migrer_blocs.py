# -*- coding: utf-8 -*-
"""
Étape 3 — le Dashboard redevient une page d'accueil de synthèse.

Avant : 23 blocs configurables empilés sur une seule page, plus les graphiques,
la routine, les notes internes. Tout y était, donc rien ne s'en détachait.

Après : le Dashboard ne garde que ce qui répond à « où en suis-je ce matin ? ».
Les 15 autres blocs rejoignent la page métier à laquelle ils appartiennent.
Rien n'est supprimé.

Le déplacement est sûr : les pages sont masquées par une classe CSS, jamais
retirées du DOM. Les fonctions de rendu ciblent des IDs et continuent donc de
fonctionner quelle que soit la page hôte.

Usage :  python migrer_blocs.py [--dry-run]
"""
import re
import sys

FICHIER = 'mafiche.html'

# bloc -> page métier de destination
MIGRATIONS = [
    # Production : tout ce qui concerne l'avancement du travail
    ('blk_progression',          'taches'),
    ('blk_kanban',               'taches'),
    ('blk_recurring',            'taches'),
    # Temps & argent : la page Timesheet est déjà le centre de gravité
    ('blk_rentabilite',          'timesheet'),
    ('blk_prestations',          'timesheet'),
    ('blk_prestation_templates', 'timesheet'),
    ('blk_rapports',             'timesheet'),
    ('blk_stats',                'timesheet'),
    # Portefeuille clients
    ('blk_contrats',             'clients'),
    ('blk_pipeline',             'clients'),
    ('blk_suivi_documents',      'clients'),
    # Rendez-vous et rappels
    ('blk_appels',               'agenda'),
    # Notes
    ('blk_notes_internes',       'notes'),
    # Administration
    ('blk_sauvegarde',           'parametres'),
]

OUVRANTES = re.compile(r'<(div|details|section)\b', re.I)
FERMANTES = re.compile(r'</(div|details|section)>', re.I)


def bornes_element(contenu, position):
    """Fin de l'élément ouvert à `position` (appariement des balises)."""
    i = contenu.index('>', position) + 1
    profondeur = 1
    while i < len(contenu) and profondeur > 0:
        o = OUVRANTES.search(contenu, i)
        f = FERMANTES.search(contenu, i)
        if f is None:
            raise ValueError('balise fermante introuvable')
        if o and o.start() < f.start():
            profondeur += 1
            i = o.end()
        else:
            profondeur -= 1
            i = f.end()
    return i


def extraire_bloc(contenu, bloc_id):
    """Retire le bloc et renvoie (contenu_restant, texte_du_bloc)."""
    m = re.search(r'<(?:div|details|section)[^>]*\sid="%s"' % re.escape(bloc_id), contenu)
    if not m:
        raise ValueError('bloc introuvable : %s' % bloc_id)
    debut = m.start()
    # on remonte à la marge du début de ligne pour garder l'indentation
    ligne = contenu.rfind('\n', 0, debut) + 1
    fin = bornes_element(contenu, debut)
    texte = contenu[ligne:fin]
    # on absorbe la ligne blanche qui suit, si elle existe
    apres = fin
    while apres < len(contenu) and contenu[apres] in ' \t':
        apres += 1
    if apres < len(contenu) and contenu[apres] == '\n':
        apres += 1
        if contenu[apres:apres + 1] == '\n':
            apres += 1
    return contenu[:ligne] + contenu[apres:], texte.rstrip()


def fin_de_page(contenu, page_id):
    """Position juste avant le </div> qui ferme #page-<id>."""
    m = re.search(r'<div class="page[^"]*" id="page-%s"' % re.escape(page_id), contenu)
    if not m:
        raise ValueError('page introuvable : %s' % page_id)
    fin = bornes_element(contenu, m.start())
    # remonter au début de la ligne du </div> final
    return contenu.rfind('\n', 0, fin - len('</div>')) + 1


def main():
    essai = '--dry-run' in sys.argv
    contenu = open(FICHIER, encoding='utf-8').read()
    origine = len(contenu)

    deplaces = []
    for bloc_id, page in MIGRATIONS:
        contenu, texte = extraire_bloc(contenu, bloc_id)
        point = fin_de_page(contenu, page)
        bloc = '\n' + texte + '\n\n'
        contenu = contenu[:point] + bloc.lstrip('\n') + contenu[point:]
        deplaces.append((bloc_id, page, texte.count('\n') + 1))
        print('  %-26s -> page-%-12s (%d lignes)' % (bloc_id, page, texte.count('\n') + 1))

    print()
    print('%d blocs déplacés. Delta caractères : %+d (doit être proche de 0)'
          % (len(deplaces), len(contenu) - origine))

    # contrôle : chaque bloc existe encore, une seule fois
    for bloc_id, _, _ in deplaces:
        n = len(re.findall(r'\sid="%s"' % re.escape(bloc_id), contenu))
        if n != 1:
            print('  ERREUR : %s apparaît %d fois' % (bloc_id, n))
            return 1

    if essai:
        print('\n[--dry-run] rien écrit.')
        return 0

    open(FICHIER, 'w', encoding='utf-8').write(contenu)
    print('\nÉcrit dans %s' % FICHIER)
    return 0


if __name__ == '__main__':
    sys.exit(main())
