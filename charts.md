# Chart insight specs: The Molecule Price Gap

EN:

## 1. Largest US-to-Canada price ratios (bar ranking)
- **What it shows:** the 12 molecules with the widest per-unit price gaps, bars scaled by ratio. Each row prints the ratio (e.g. 66.7x) plus the underlying per-unit prices (US $17.30 vs CA $0.26 for rivaroxaban).
- **Data:** data/molecules.json, top 12 of 194 matched molecules sorted by ratio_us_to_ca descending.
- **How to read it:** bar length is the ratio, not dollars. Absolute per-unit prices differ by 1000x across molecules (a $10,307 syringe vs a $0.26 tablet), so a dollar scale would hide every bar but the largest. Exact dollar figures are in the row labels and tooltips.
- **Insight it carries:** the widest gaps cluster in oral generics with cheap Canadian supply (rivaroxaban 66.7x, dapagliflozin 47.8x, apixaban 32.3x) and branded eye drops (latanoprostene bunod 64.5x, bimatoprost 41.5x). Four of the top 12 exceed 40x.
- **Caveat printed under it:** US numbers are gross of confidential rebates.

## 2. How the gaps are distributed (histogram)
- **What it shows:** count of molecules per ratio band: 1-2x (54), 2-4x (38), 4-6x (28), 6-8x (13), 8-10x (17), 10x+ (44).
- **Data:** all 194 matched molecules from data/molecules.json.
- **How to read it:** most molecules sit in a narrow band under 6x (120 of 194), while a long tail of 44 molecules pays 10x or more in the US. The 8x+ bands are drawn in Canadian red.
- **Insight it carries:** the gap is structural across the formulary, not a handful of outliers: the median is 4.4x, and more molecules sit above 10x (44) than between 6x and 10x (30).

## 3. Median gap by drug class (ATC heatmap)
- **What it shows:** median US-to-Canada ratio per ATC level-1 class, for classes with at least 3 matched molecules. Darker red means a wider median gap.
- **Data:** data/atc.json (l1 array). Top cells: Sensory organs (S) 41.5x (n=4), Blood and blood forming organs (B) 32.3x (n=3), Genito urinary system and sex hormones (G) 19.5x (n=4), Systemic hormonal preparations (H) 8.9x (n=3).
- **How to read it:** each cell is a median across the molecules in that class, so one extreme molecule cannot dominate it. The n count is printed in the data file.
- **Insight it carries:** some classes are structurally cheaper in Canada than others. Sensory organs (eye drops) and blood agents (anticoagulants) are where the Canada discount concentrates, which is where negotiation leverage would concentrate too.

---

FR:

## 1. Plus grands ratios de prix États-Unis / Canada (classement en barres)
- **Contenu :** les 12 molécules aux écarts de prix unitaires les plus larges, barres proportionnelles au ratio. Chaque ligne affiche le ratio (p. ex. 66,7x) et les prix unitaires sous-jacents (17,30 $ É.-U. contre 0,26 $ CA pour le rivaroxaban).
- **Données :** data/molecules.json, 12 premières des 194 molécules appariées triées par ratio_us_to_ca décroissant.
- **Lecture :** la longueur des barres représente le ratio, pas les dollars. Les prix unitaires absolus varient d'un facteur 1000 entre molécules (une seringue à 10 307 $ contre un comprimé à 0,26 $), donc une échelle en dollars masquerait toutes les barres sauf la plus grande. Les montants exacts figurent dans les étiquettes et les infobulles.
- **Enseignement :** les écarts les plus larges se concentrent dans les génériques oraux à offre canadienne bon marché (rivaroxaban 66,7x, dapagliflozine 47,8x, apixaban 32,3x) et les collyres de marque (latanoprostène bunod 64,5x, bimatoprost 41,5x). Quatre des douze premiers dépassent 40x.
- **Mise en garde affichée :** les chiffres américains sont bruts des rabais confidentiels.

## 2. Répartition des écarts (histogramme)
- **Contenu :** nombre de molécules par tranche de ratio : 1-2x (54), 2-4x (38), 4-6x (28), 6-8x (13), 8-10x (17), 10x et plus (44).
- **Données :** les 194 molécules appariées de data/molecules.json.
- **Lecture :** la plupart des molécules se situent dans une bande étroite sous 6x (120 sur 194), tandis qu'une longue traîne de 44 molécules coûte 10 fois plus cher aux États-Unis. Les bandes à 8x et plus sont en rouge canadien.
- **Enseignement :** l'écart est structurel dans tout le formulaire, pas une poignée d'exceptions : la médiane est de 4,4x, et plus de molécules dépassent 10x (44) qu'entre 6x et 10x (30).

## 3. Écart médian par classe thérapeutique (carte de chaleur ATC)
- **Contenu :** ratio médian États-Unis / Canada par classe ATC de niveau 1, pour les classes d'au moins 3 molécules appariées. Un rouge plus foncé signifie un écart médian plus large.
- **Données :** data/atc.json (tableau l1). Premières cases : organes sensoriels (S) 41,5x (n=4), sang et organes hématopoïétiques (B) 32,3x (n=3), système génito-urinaire et hormones sexuelles (G) 19,5x (n=4), préparations hormonales systémiques (H) 8,9x (n=3).
- **Lecture :** chaque case est une médiane sur les molécules de la classe, donc une molécule extrême ne peut pas la dominer. Le n figure dans le fichier de données.
- **Enseignement :** certaines classes sont structurellement moins chères au Canada que d'autres. Les organes sensoriels (collyres) et les agents du sang (anticoagulants) concentrent la décote canadienne, et donc le levier de négociation potentiel.
