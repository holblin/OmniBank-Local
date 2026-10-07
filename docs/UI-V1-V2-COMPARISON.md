# Comparaison V1 / V2

Audit du 6 octobre 2026. Base : `codex/ui-v2-dashboard` (ed54ee7), puis migration TypeScript sur `codex/v2-typescript-parity`. L’audit initial a identifié les écarts ci-dessous. Ils ont ensuite été implémentés dans la V2 TypeScript sur cette branche. V1 reste disponible pour comparaison ; les connexions bancaires et Ollama réels restent à valider dans l’environnement utilisateur.

[Ouvrir les captures côte à côte](ui-v2-comparison.html). Six paires montrent les pages financières à 1440 × 1000. Une septième paire compare le premier démarrage de V1 et le nouveau dialogue V2, avec une capture mobile supplémentaire. Les captures utilisent un backend temporaire et des données synthétiques ; elles ne contiennent aucune donnée personnelle de la sauvegarde.

## Fonctionnalités

« Partiel » signifie que la page existe mais ne remplace pas toutes les actions de V1. Les écarts ci-dessous proviennent de la lecture des interfaces et de leurs appels API ; la présence d'une page ne prouve pas sa parité.

| Domaine | V1 | V2 après migration | Vérification / limite |
| --- | --- | --- | --- |
| Premier démarrage | Assistant automatique en sept écrans : accueil, profil/PIN, comptes, paie, guide, IA, confirmation | Dialogue automatique en cinq étapes : accueil, espace/devise/langue/thème, création du premier compte et sélection comme principal, choix saisie/import/banque, confirmation ; démonstration sur confirmation | Mise en page desktop/mobile, six thèmes, clavier/Échap, retour, sauvegarde et reprise sans duplication après échec vérifiés. Le PIN, les réglages de paie et Ollama restent accessibles dans les paramètres et contrôles financiers, hors de ce dialogue. |
| Vue d'ensemble | Patrimoine, reste à vivre, projection, prochaine paie, moyennes/rythme, rapprochement, graphiques, sélection du compte | Indicateurs, projection de fin de mois, paie, moyennes/rythme, principales dépenses, chronologie et rapprochement groupé | Actions reliées aux API locales ; scénarios de chronologie vérifiés en navigateur. |
| Tableau de bord | Chronologie financière, contrôles de paie et actions rapides dans le contexte des opérations | Tableau de bord existant et panneau de contrôles financiers à ouvrir ; la vue d’ensemble ouvre ces contrôles directement | Régression des totaux, thèmes et dimensions mobiles. |
| Comptes | Gestion, couleurs, raccourcis d'import/synchronisation, informations financières | Gestion existante, couleur et raccourcis d’import/synchronisation | Prêts, intérêts et ajustement de solde conservés. |
| Historique | Table configurable, recherche/filtres, opérations et outils contextuels | Colonnes mémorisées, sélection de récurrence, indicateur de salaire, filtres et virements inter-profils | Filtre de catégorie appliqué côté serveur avant pagination ; virements dépendent des profils locaux disponibles. |
| Synthèse | Analyses par catégories, comptes et périodes, outils de détail | Sélection de plusieurs comptes, filtres existants et accès aux opérations d’une catégorie | CSV, impression et totaux vérifiés. |
| Budgets | Enveloppes et allocations, suggestions/analyse IA, découverte et workflows de récurrence | Suggestions IA éditables, affinement/recalcul/annulation, acceptation individuelle ou groupée, capacité mensuelle/annuelle et suppression par type | Création réelle d’enveloppes testée avec réponse IA déterministe ; qualité d’Ollama non évaluée. |
| Récurrences | Modèles, détails des instances, chronologie, assistant de préparation annuelle, propagation des modifications | Assistant annuel avec nouveaux modèles, détail des instances, propagation, fréquences supplémentaires et date de clôture | Renouvellement, génération et propagation testés contre SQLite. |
| Tendances | Périodes, alignement glissant/calendaire, superposition des années, modes solde/sorties/recettes/bilan, statistiques et zoom | Périodes, alignement glissant/calendaire, superposition des années, quatre modes, statistiques et intervalle de zoom | Contrôles et graphiques vérifiés en navigateur ; séries historiques fournies par le backend existant. |
| Simulateur | Scénarios, événements, presets, KPI, transparence du calcul, comparaison et tableau mensuel | Presets, réglage conservateur, comparaison baseline/optimiste/pessimiste, KPI, hypothèses et tableau mensuel | Exécution avec le moteur local existant ; extensions plus récentes de la sauvegarde exclues de cette migration UI. |
| Import/export | Assistant d'inspection, association des comptes, aperçu/revue, restauration du CSV natif et gestion des pièces jointes | Inspection et association, aperçu éditable/sélection, catégorisation IA locale, restauration native, résultats chiffrés et pièces jointes | Import natif et relevé édité vérifiés ; round-trip exact de 2 468 écritures externes. |
| Synchronisation bancaire | Connexions/coffre, 2FA, paramètres de synchronisation, revue avancée et actions groupées | Synchronisation automatique configurable, intervalle de relevé, réévaluation, édition/liaison manuelle, restauration des exclus, actions groupées et réinitialisation du coffre | SSE/2FA et contrat de revue couverts ; connexion à une banque réelle non exécutée. |
| Assistant local | Sessions, actions, affichage des outils, compression de contexte et restauration de contexte | Rôles, résumé modifiable, régénération, restauration du contexte complet, progression de compression, notification et snapshots d’outils | Contexte et transport local testés ; génération réelle nécessite Ollama. |
| Paramètres | Profils/PIN, sauvegardes, diagnostic, licence, organisation, règles/libellés, IA et préférences détaillées | Découverte du modèle Ollama, simulation de libellés, options des règles, recherche, sauvegardes et outils existants ; effacement confirmé des écritures | Taux de change manuels conservés. La récupération de taux sur Internet est exclue par la contrainte de confidentialité du projet. |
| Contrôles globaux | Confidentialité visuelle, annuler/rétablir dans l'en-tête | Confidentialité visuelle persistante et raccourcis annuler/rétablir ; gestion groupée des notifications et purge du journal | Masquage des graphiques/montants et annuler/rétablir vérifiés sur des écritures réelles. |

Sources : `static/js/views/overview.js`, `all_operations.js`, `accounts_manager.js`, `import_wizard.js`, `trends.js`, `simulator.js`, `bank_sync*.js`, `chat.js`, `recurrences/`, `budgets/`, `config/`, et leurs homologues dans `ui-v2/src/pages/`.

Les soldes rapprochés et les séries incluant les opérations en attente ont des sens différents. Par exemple, dans les captures synthétiques, le compte courant rapproché vaut 5 780,83 € ; la tendance incluant la dépense non rapprochée de 68,40 € affiche 5 712,43 €. Ces valeurs ne doivent pas être comparées comme deux calculs identiques.

## Sauvegarde inspectée

Chemin externe : `C:\Users\holblin-mercury\Projects\aschefr\backup-omniBank`. Les originaux ont été lus sans modification ; aucune base de profil ni pièce jointe personnelle n'a été copiée dans le dépôt.

| Ensemble | Contenu utile | Utilisation |
| --- | --- | --- |
| `sample_data/Bank Data Example to Import as is.csv` | 2 468 opérations, transferts et rapprochements | Test réel d'import → export → import dans une base SQLite vide, comparaison des montants, dates, comptes et soldes. |
| `sample_data/Comptes soldes initials.csv`, `Livrets soldes initials.csv`, `Categories.csv` | État initial des comptes et catégories | Soldes initiaux utilisés pour le calcul indépendant en `Decimal`. |
| `sample_data/Bank Data Example synthesis (true end-of-chain calculs).jpg` | Image de référence comptable | Comparaison manuelle avec les totaux du CSV ; incohérence détaillée ci-dessous. |
| Autres CSV/XLSX de `sample_data/`, `tests_imports/releve_test_demonstration_aout_2026.csv` | Formats de relevés, exports natifs, opérations CSE | Fixtures complémentaires disponibles ; tous ces formats n’ont pas été exécutés dans cet audit. |
| Archives ZIP, bases et pièces jointes dans `data/` | Sauvegardes complètes et profils | Inventoriés ; restauration d'une base personnelle non effectuée. |

La sauvegarde contient également une version du **code** plus avancée que cette branche : contrôleur Auto-Pilote (`app/routers/autopilot.py`), synchronisation autonome, détection historique et appariement inter-lots, ajustement EMA des enveloppes, conservation `raw_description`, saisonnalité/sensibilité aux valeurs extrêmes du simulateur, cônes de confiance et mode Cockpit de la vue d'ensemble. Ces ajouts sont visibles dans son code et son changelog. Ils demandent une récupération et une validation du backend, puis une interface V2 ; ajouter seulement des boutons ne suffira pas. La sauvegarde n'a pas été fusionnée automatiquement.

### Écart entre l'image et les fixtures

| Compte | Image | CSV + soldes initiaux | Écart |
| --- | ---: | ---: | ---: |
| CA Centre-Est | 3 942,28 € | 3 942,28 € | 0,00 € |
| CA Ile-de-France | 0,00 € | 0,00 € | 0,00 € |
| Livret A | 12 592,78 € | 12 723,78 € | +131,00 € |
| Livret LDD | 45,79 € | 47,13 € | +1,34 € |
| Total | 16 580,85 € | 16 713,19 € | +132,34 € |

Les chiffres du CSV sont calculés indépendamment à partir des soldes initiaux et des opérations rapprochées. L'import/export conserve ces chiffres exactement au centime. Le benchmark complet **contre l'image** ne peut donc pas être déclaré réussi : la paire image/fixtures doit être réconciliée avant d'en faire un critère de livraison. Les données n'ont pas été ajustées pour masquer cet écart.

## TypeScript et vérification

- Tout le code V2, les modules StyleX, les configurations et les tests/captures sont désormais en `.ts` ou `.tsx`. `tsconfig.json` inclut tout le frontend en mode strict. Le build exécute le contrôle des types avant Vite.
- Modèles des réponses locales, contextes, formulaires, actions, refs, colonnes et routes typés. V1 conserve ses assets JS pour la comparaison et la compatibilité.
- AGENTS.md autorise cette migration et confirme la suppression de GSD ; aucun contournement ou artefact GSD requis.
- Production : contrôle TypeScript et build Vite réussis. Le bundler signale des directives `use client` de bibliothèques Astryx ; compilation réussie.
- Navigateur : 47 tests sur Chrome, dont les six paires de captures, pages desktop/mobile, thèmes, dialogues, verrouillage, workflows financiers et tables virtualisées. Les services Ollama et banques réels ne sont pas couverts par ce résultat.
- Après le dernier ajustement de l’import : workflows de parité relancés, y compris restauration de pièce jointe et échec de transfert avant écriture. Aucun import financier n’est créé si ce transfert échoue.
- Backend : 32 tests réussis (contrats V2, références CSV, import multi-compte, transferts inter-profils, simulateur et statut bancaire 2FA), dont le round-trip des 2 468 opérations externes.

Pour reproduire le test externe : définir `OMNIBANK_BACKUP_SAMPLE_DIR` vers `backup-omniBank/sample_data`, utiliser un répertoire `OMNIBANK_DATA_DIR` temporaire, puis exécuter `pytest tests/test_backup_reference.py -q`. Sans le chemin externe, ce test est explicitement ignoré. Pour les captures : build V2, puis `pnpm --dir ui-v2 test comparison.spec.ts` avec `OMNIBANK_TEST_PYTHON` configuré si nécessaire.

## Implémentation et périmètre

Les actions V1 de cet audit sont maintenant disponibles nativement dans V2. Les imports restaurent aussi les références de documents depuis des fichiers ou un dossier ; le transfert des documents précède les nouvelles écritures, afin qu’un échec de transfert ne laisse pas d’import financier partiel. Le code de la sauvegarde apporte des évolutions supplémentaires du backend (Auto-Pilote, EMA, saisonnalité) qui ne sont pas les fonctionnalités V1 manquantes de cette branche. Les originaux externes restent inchangés.

Les mutations destructives restent déclenchées par une action utilisateur et une confirmation visible (suppression groupée, coffre, effacement du profil, archives et journal). Aucun de ces contrôles n’a été exécuté sur des données personnelles.

Corrections backend ciblées : date de chaque ligne dans l’aperçu heuristique ; filtre de catégorie avant pagination. Les calculs financiers existants restent la source des soldes et des simulations.
