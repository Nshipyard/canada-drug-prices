# Data-fix entry: The Molecule Price Gap

EN:

- id: "drug-prices"
- name: "The Molecule Price Gap"
- tag: "Canada-US"
- dataset: "CMS Medicare Part D Spending by Drug 2024; Ontario Drug Benefit e-formulary (retrieved 2026-10-10); RxNorm; Bank of Canada FX"
- methods: ["normalization", "entity-resolution", "crosswalk", "unit-normalization", "currency-conversion", "quarantine"]
- What was wrong:
  - CMS repeats every drug once per manufacturer plus an Overall rollup; summing all rows double-counts dollars.
  - Generic names are truncated mid-word ("bictegrav + emtricit + tenofov ala") and carry strength suffixes, so brand and generic rows for one molecule never match without repair.
  - No molecule identity exists in the CMS file; identity must come from RxNorm per normalized name, and low-confidence matches must not be guessed.
  - Canadian prices live in a different unit system (per-DIN formulary rows, CAD) with no shared key to CMS molecules.
  - PMPRB publishes no machine-readable molecule-level price file at all (verified 2026-10-10); the Canadian column had to be built from the Ontario Drug Benefit e-formulary instead.
  - CMS dosage units are undefined per drug: per tablet for oral solids, per mL for multi-dose liquids, per container for single-dose injectables, per actuation or per inhaler for respiratory drugs, per mL for eye drops. Comparing without resolving this produces nonsense ratios (observed: 392.9x for ustekinumab from a per-vial vs per-mL mixup).
  - Naive name matching lets "latanoprost" match "latanoprostene" (substring) and lets salt suffixes ("-aabc") silently merge distinct products (Lyumjev vs Humalog).
- The fix:
  - Keep Overall rows only: 3,625 unique drugs for 2024, zero double-counted dollars.
  - Normalize to molecule keys: lowercase, collapsed spacing, strength suffixes stripped; 1,978 unique molecules, top 500 by spend kept.
  - Documented truncation-expansion map (19 token rules, scripts/build_molecules_us.py) restores full ingredient names before the RxNorm search; combos resolve to WHO ATC combo codes. 447 of 500 molecules resolved to an RxCUI with ATC.
  - ODB formulary queried per molecule with salt-stripped name variants (e.g. "dapagliflozin" for "dapagliflozin propanediol"); rows matched only when every ingredient token matches at word boundaries with identical ingredient counts (excludes combos like Soliqua from plain insulin glargine).
  - Form-family consistency enforced: injectables compare to injectables, inhaled to inhaled, oral preferred otherwise; eye drops normalized per mL against standard bottle volumes.
  - Comparator is the lowest per-unit Drug Benefit Price across surviving rows: the floor of what Ontario's public plan pays, documented as such.
  - Currency: Bank of Canada 2024 daily average, 1 USD = 1.3698 CAD (250 observations, fetched 2026-10-10).
  - 16 molecules quarantined with documented reasons (data/insights.json) instead of being ranked on mismatched units: clonidine (patch vs tablet), epinephrine (auto-injector vs ampule), ipratropium/tiotropium (mixed CMS dosage units), beclomethasone/budesonide (mixed forms), lanreotide (dose mix), insulin lispro-aabc (Lyumjev vs Humalog), semaglutide (tablets vs pens), risankizumab (dose mix), infliximab (IV vs subcutaneous), buprenorphine/buprenorphine hcl (form mismatch), ondansetron hcl (tablet vs injectable), enoxaparin (unit ambiguity), fluticasone propionate (unit ambiguity).
- Before/after examples:
  - ustekinumab: 392.9x (per-vial US vs per-mL Canada) -> 15.1x (per-vial both sides: $13,766 vs $911).
  - latanoprost: matched Vyzulta (wrong molecule, substring match) -> matched Apo-Latanoprost, ratio 0.9x.
  - insulin lispro-aabc: 19.6x vs Humalog (wrong product) -> quarantined with reason.
  - tocilizumab: 35.3x (per-vial vs per-mL) -> 3.5x (per-vial both sides).
  - pegfilgrastim: 17.2x (per-syringe vs per-mL) -> 28.7x (per-syringe: $10,307 vs $359).
- Result counts: 500 molecules attempted; 210 with a Canadian formulary price; 16 quarantined; 194 ranked. Median US-to-Canada ratio 4.4x; max 66.7x (rivaroxaban); $125.5B of 2024 Part D spending covered.
- Standing caveat: US amounts are gross of confidential manufacturer rebates and overstate net US prices by an unknown share; stated on every comparison.

---

FR:

- id: "drug-prices"
- name: "The Molecule Price Gap"
- tag: "Canada-US"
- dataset: "CMS Medicare Part D Spending by Drug 2024 ; formulaire électronique de l'Ontario Drug Benefit (consulté le 2026-10-10) ; RxNorm ; taux de change de la Banque du Canada"
- methods: ["normalization", "entity-resolution", "crosswalk", "unit-normalization", "currency-conversion", "quarantine"]
- Ce qui n'allait pas :
  - Le CMS répète chaque médicament une fois par fabricant plus une ligne de cumul Overall ; sommer toutes les lignes compte les dollars deux fois.
  - Les noms génériques sont tronqués en milieu de mot (« bictegrav + emtricit + tenofov ala ») et portent des suffixes de dosage, donc les lignes de marque et de générique d'une même molécule ne se rejoignent jamais sans réparation.
  - Aucune identité de molécule n'existe dans le fichier du CMS ; elle doit venir de RxNorm pour chaque nom normalisé, et les appariements peu sûrs ne doivent pas être devinés.
  - Les prix canadiens vivent dans un autre système d'unités (lignes de formulaire par DIN, en dollars canadiens) sans clé commune avec les molécules du CMS.
  - Le CEPMB ne publie aucun fichier de prix lisible par machine au niveau des molécules (vérifié le 2026-10-10) ; la colonne canadienne a donc été construite depuis le formulaire électronique de l'Ontario Drug Benefit.
  - Les unités posologiques du CMS ne sont pas définies par médicament : par comprimé pour les solides oraux, par mL pour les liquides multidose, par contenant pour les injectables unidose, par bouffée ou par inhalateur pour les respiratoires, par mL pour les collyres. Comparer sans résoudre ce point produit des ratios absurdes (observé : 392,9x pour l'ustekinumab, confusion flacon contre mL).
  - L'appariement naïf des noms laisse « latanoprost » correspondre à « latanoprostene » (sous-chaîne) et laisse les suffixes de sels (« -aabc ») fusionner silencieusement des produits distincts (Lyumjev contre Humalog).
- La correction :
  - Lignes Overall uniquement : 3 625 médicaments uniques pour 2024, zéro dollar compté deux fois.
  - Normalisation en clés de molécules : minuscules, espaces normalisés, suffixes de dosage retirés ; 1 978 molécules uniques, les 500 premières par dépense conservées.
  - Table documentée d'expansion des troncations (19 règles, scripts/build_molecules_us.py) restaurant les noms complets d'ingrédients avant la recherche RxNorm ; les combinaisons obtiennent les codes ATC combinés de l'OMS. 447 molécules sur 500 résolues vers un RxCUI avec ATC.
  - Formulaire ODB interrogé par molécule avec variantes de noms sans sels (p. ex. « dapagliflozin » pour « dapagliflozin propanediol ») ; lignes retenues seulement si chaque ingrédient correspond en mot entier avec un nombre d'ingrédients identique (exclut les combinaisons comme Soliqua de l'insuline glargine simple).
  - Cohérence des formes galéniques imposée : injectables contre injectables, inhalés contre inhalés, oral préféré sinon ; collyres normalisés par mL selon les volumes standards des flacons.
  - Le comparateur est le plus bas prix Benefit par unité parmi les lignes retenues : le plancher de ce que paie le régime public ontarien, documenté comme tel.
  - Devise : moyenne quotidienne 2024 de la Banque du Canada, 1 USD = 1,3698 CAD (250 observations, récupérée le 2026-10-10).
  - 16 molécules mises en quarantaine avec raisons documentées (data/insights.json) au lieu d'être classées sur des unités incompatibles : clonidine (timbre contre comprimé), épinéphrine (auto-injecteur contre ampoule), ipratropium/tiotropium (unités posologiques mixtes du CMS), béclométhasone/budésonide (formes mixtes), lanréotide (mélange de doses), insuline lispro-aabc (Lyumjev contre Humalog), sémaglutide (comprimés contre stylos), risankizumab (mélange de doses), infliximab (IV contre sous-cutané), buprénorphine/buprénorphine hcl (formes incompatibles), ondansétron hcl (comprimé contre injectable), énoxaparine (unité ambiguë), fluticasone propionate (unité ambiguë).
- Exemples avant/après :
  - ustekinumab : 392,9x (É.-U. par flacon contre Canada par mL) -> 15,1x (par flacon des deux côtés : 13 766 $ contre 911 $).
  - latanoprost : apparié à Vyzulta (mauvaise molécule, correspondance de sous-chaîne) -> apparié à Apo-Latanoprost, ratio 0,9x.
  - insuline lispro-aabc : 19,6x contre Humalog (mauvais produit) -> mise en quarantaine avec raison.
  - tocilizumab : 35,3x (par flacon contre par mL) -> 3,5x (par flacon des deux côtés).
  - pegfilgrastim : 17,2x (par seringue contre par mL) -> 28,7x (par seringue : 10 307 $ contre 359 $).
- Comptes de résultats : 500 molécules tentées ; 210 avec un prix canadien au formulaire ; 16 en quarantaine ; 194 classées. Ratio médian États-Unis / Canada 4,4x ; max 66,7x (rivaroxaban) ; 125,5 G$ de dépenses Part D 2024 couvertes.
- Mise en garde permanente : les montants américains sont bruts des rabais confidentiels des fabricants et surestiment les prix nets américains d'une part inconnue ; rappelé à chaque comparaison.
