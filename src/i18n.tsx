"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "fr";

const en = {
  banner: {
    badge: "Independent project",
    line: "US prices are gross of confidential manufacturer rebates, so they overstate net US prices by an unknown share.",
  },
  nav: {
    explorer: "Explorer",
    showcase: "Findings",
    charts: "Charts",
    methodology: "Methodology",
    developers: "Developers",
    data: "Data",
    back: "Open Nshipyard",
  },
  hero: {
    kicker: "US vs Canada, molecule by molecule",
    title: "What does one molecule cost in the US vs Canada?",
    body: "The same active molecule sells at two prices on two sides of the border. This ledger starts from 500 high-spending Medicare Part D molecules and matches each against Canadian price references, one molecule per row, so the gap is a number instead of an anecdote. 194 match. The rest are listed with US data only.",
    ctaExplorer: "Search the molecules",
    ctaShowcase: "See the findings",
    statMolecules: "molecules matched",
    statMaxGap: "largest US-to-Canada price ratio",
    statSpend: "Medicare Part D spent in 2024 on matched molecules",
    statMedianGap: "median US-to-Canada ratio across matched molecules",
  },
  explorer: {
    kicker: "Explorer",
    title: "Look up a molecule",
    body: "Type a molecule name, a brand, or an ATC code. Each row shows US per-unit cost from Medicare Part D 2024 beside the Canadian reference price, with the ratio between them.",
    searchPlaceholder: "apixaban, Rinvoq, B01AF02",
    searchLabel: "Search",
    columns: {
      molecule: "Molecule",
      atc: "ATC",
      us: "US per unit",
      ca: "Canada per unit",
      ratio: "US / Canada",
    },
    noResult: "No molecule matches that search.",
    noPrice: "No Canadian price found",
    unit: "per dosage unit",
    grossNote: "US figure is gross of rebates",
    viewAll: "Show the full gap ranking",
  },
  showcase: {
    kicker: "Findings",
    title: "The gaps, stated plainly",
    body: "Each finding below is computed from the ledger. The US column is Medicare Part D 2024, gross of confidential rebates, which overstates net US prices by an unknown share.",
    citeThis: "Cite this",
    copied: "Copied",
    shareX: "Share on X",
  },
  charts: {
    kicker: "Charts",
    title: "The gap, drawn",
    body: "Real values from the ledger, hand-drawn as SVG. Hover for exact numbers.",
    gapRanking: "Largest US-to-Canada price ratios",
    gapRankingBody: "Per-unit price ratios for the molecules with the widest gaps. US numbers are gross of rebates.",
    distribution: "How the gaps are distributed",
    distributionBody: "How many molecules fall into each ratio band. Most molecules sit in a narrow band, while a long tail pays far more in the US.",
    atcHeatmap: "Median gap by drug class",
    atcHeatmapBody: "Median US-to-Canada ratio per ATC level-1 class. Some classes are structurally cheaper in Canada than others.",
    axisUs: "US",
    axisCa: "Canada",
  },
  methodology: {
    kicker: "Methodology",
    title: "How the ledger is built",
    body: "Every rule below is the code in scripts/, not a description of intent. The pipeline is re-runnable.",
    steps: [
      {
        title: "Start from the Overall rows",
        body: "The CMS file repeats every drug once per manufacturer plus an Overall rollup row. Only Overall rows are used, so no dollar is counted twice. 3,625 unique drugs remain for 2024.",
      },
      {
        title: "Normalize to molecules",
        body: "Generic names are lowercased, spacing collapsed, and strength suffixes stripped, so brand Eliquis and generic apixaban become one molecule row. Dosage forms stay out of the key. A molecule is a molecule.",
      },
      {
        title: "Resolve identity through RxNorm",
        body: "Each normalized molecule is searched against the RxNorm REST API for an ingredient-level RxCUI, and the ATC code is read from its properties. Matches below the confidence bar are quarantined, never guessed.",
      },
      {
        title: "US price per dosage unit",
        body: "Total 2024 Part D spending divided by total 2024 dosage units per molecule, spending-weighted. This is gross of confidential manufacturer rebates, which CMS is prohibited from disclosing per drug, so it overstates the net US price by an unknown share.",
      },
      {
        title: "Canadian reference price",
        body: "PMPRB publishes no machine-readable molecule-level price file, so the Canadian column uses the Ontario Drug Benefit e-formulary: the lowest Drug Benefit Price per unit across matched formulary rows, converted at the 2024 Bank of Canada average USD/CAD rate. That is the price Ontario's public plan pays pharmacies, not a national list price. Molecules with no formulary listing are shown with US data only and labeled honestly.",
      },
      {
        title: "The GLOBE context",
        body: "On September 30, 2026 CMS finalized the GLOBE model, which ties Part B rebates to benchmarks from 19 countries including Canada. The gaps in this ledger are the reason that policy exists. The ledger does not attempt to model what GLOBE would do to them.",
      },
    ],
    limitsTitle: "What this does not do",
    limits: [
      "US prices are gross of confidential rebates. Treat every ratio as an upper bound on the true gap.",
      "Medicare Part D covers one population. Commercial insurance and Medicaid pay different prices.",
      "A dosage unit is not a treatment course. A cheap per-unit drug taken daily can cost more per year than an expensive one taken once.",
      "Molecules without a Canadian price match are not comparable rows. They are listed, not ranked.",
    ],
    unknownsTitle: "Honest unknowns",
    unknowns: [
      "PMPRB publishes no machine-readable molecule-level price file, so the Canadian column uses Ontario Drug Benefit formulary prices instead. ODB prices are what Ontario's public plan pays pharmacies, not a national list price.",
      "Whether each CMS dosage unit maps cleanly to the Canadian pack size for the same molecule. 16 molecules are excluded from the ranking on this basis, each with a documented reason in data/insights.json.",
    ],
  },
  developers: {
    kicker: "Developers",
    title: "Query the ledger",
    body: "REST with OpenAPI 3.1, a JSON-RPC MCP server for agents, and the full ledger as CSV. No key needed.",
    restTitle: "REST endpoints",
    openapiLink: "OpenAPI 3.1 spec",
    csvTitle: "Download the ledger",
    csvBody: "One row per molecule: US spending, per-unit costs, Canadian reference price, ratio, ATC class, RxCUI.",
    csvButton: "Download molecule-ledger.csv",
    mcpTools: "MCP tools",
  },
  data: {
    kicker: "Data",
    title: "Sources and provenance",
    body: "Two government sources, one standard crosswalk, one currency series. Nothing else enters the ledger.",
    rows: [
      {
        name: "Medicare Part D Spending by Drug, 2024",
        who: "Centers for Medicare & Medicaid Services (US)",
        detail: "Annual per-drug spending file: 3,625 unique drugs in the 2024 release, five years of history per row, manufacturer-level detail behind Overall rollups. Gross of confidential rebates.",
      },
      {
        name: "Ontario Drug Benefit e-formulary",
        who: "Ontario Ministry of Health",
        detail: "DIN-level Drug Benefit Prices. The ledger takes the lowest price per unit across matched formulary rows for each molecule, the price Ontario's public plan pays pharmacies. Retrieved October 10, 2026. PMPRB publishes no machine-readable molecule-level price file, which is why the formulary is the Canadian source.",
      },
      {
        name: "RxNorm ingredient mapping",
        who: "US National Library of Medicine",
        detail: "Ingredient-level RxCUI search plus ATC property lookup, one query per molecule, results cached in data/rxnorm_cache.json.",
      },
      {
        name: "USD/CAD annual average, 2024",
        who: "Bank of Canada",
        detail: "Daily exchange rate series averaged over 2024, used to express Canadian prices in USD for the ratio.",
      },
    ],
  },
  footer: {
    line: "An independent open-source project. Not affiliated with the US Centers for Medicare & Medicaid Services, the Patented Medicine Prices Review Board, or any government.",
    sources: "US source: CMS Medicare Part D Spending by Drug, 2024 release. Canadian source: Ontario Drug Benefit e-formulary, October 2026.",
    author: "Built by Richardson Dackam",
  },
  mcp: {
    kicker: "For AI agents",
    title: "Give your agent the ledger",
    body: "Three tools over streamable HTTP: look up one molecule, rank the gaps, break down by drug class.",
    tabs: {
      chatgpt: "ChatGPT",
      claude: "Claude",
      claudecode: "Claude Code",
      cli: "CLI",
      other: "Other",
    },
    cardTitle: "Setup prompt for {tab}",
    copy: "Copy setup prompt",
    copied: "Copied",
    chatgptNote: "Paste this into a ChatGPT custom GPT or project with the MCP endpoint configured.",
    otherTitle: "Direct endpoints",
    otherBody: "Any MCP-compatible client can point at these endpoints.",
    mcpEndpoint: "MCP endpoint",
    openapiSpec: "OpenAPI spec",
    restBase: "REST base",
    pChatgpt:
      "Connect to the MCP server {displayName} at {origin}/mcp. It has tools: molecule_lookup (one molecule's US vs Canada price), price_gap_ranking (molecules ranked by US-to-Canada ratio), atc_breakdown (median gap by drug class). {example}",
    pClaude:
      "Use the MCP server {displayName} at {origin}/mcp with tools molecule_lookup, price_gap_ranking, atc_breakdown. {example}",
    pClaudeCode:
      'Add this MCP server to Claude Code: {{"mcpServers": { "{slug}": { "url": "{origin}/mcp" } }}}. Then {exampleLower}.',
    pCli:
      "curl -s -X POST {origin}/mcp -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{{\"name\":\"price_gap_ranking\",\"arguments\":{{\"limit\":10}}}}}}'",
  },
  common: {
    usd: "USD",
    cad: "CAD",
  },
};

const fr: typeof en = {
  banner: {
    badge: "Projet indépendant",
    line: "Les prix américains sont bruts des rabais confidentiels des fabricants et surestiment donc les prix nets américains d'une part inconnue.",
  },
  nav: {
    explorer: "Explorateur",
    showcase: "Constats",
    charts: "Graphiques",
    methodology: "Méthodologie",
    developers: "Développeurs",
    data: "Données",
    back: "Open Nshipyard",
  },
  hero: {
    kicker: "États-Unis contre Canada, molécule par molécule",
    title: "Combien coûte une molécule aux États-Unis par rapport au Canada ?",
    body: "La même molécule active se vend à deux prix de part et d'autre de la frontière. Ce registre part de 500 molécules à forte dépense de Medicare Part D et apparie chacune à des prix de référence canadiens, une molécule par ligne, pour que l'écart devienne un chiffre plutôt qu'une anecdote. 194 sont appariées. Les autres figurent avec leurs données américaines seulement.",
    ctaExplorer: "Chercher les molécules",
    ctaShowcase: "Voir les constats",
    statMolecules: "molécules appariées",
    statMaxGap: "plus grand ratio de prix États-Unis / Canada",
    statSpend: "dépensés par Medicare Part D en 2024 sur les molécules appariées",
    statMedianGap: "ratio médian États-Unis / Canada sur les molécules appariées",
  },
  explorer: {
    kicker: "Explorateur",
    title: "Chercher une molécule",
    body: "Tapez un nom de molécule, une marque ou un code ATC. Chaque ligne montre le coût unitaire américain de Medicare Part D 2024 à côté du prix de référence canadien, avec le ratio entre les deux.",
    searchPlaceholder: "apixaban, Rinvoq, B01AF02",
    searchLabel: "Chercher",
    columns: {
      molecule: "Molécule",
      atc: "ATC",
      us: "États-Unis par unité",
      ca: "Canada par unité",
      ratio: "É.-U. / Canada",
    },
    noResult: "Aucune molécule ne correspond à cette recherche.",
    noPrice: "Aucun prix canadien trouvé",
    unit: "par unité posologique",
    grossNote: "Chiffre américain brut des rabais",
    viewAll: "Voir tout le classement des écarts",
  },
  showcase: {
    kicker: "Constats",
    title: "Les écarts, énoncés simplement",
    body: "Chaque constat ci-dessous est calculé à partir du registre. La colonne américaine est Medicare Part D 2024, brute des rabais confidentiels, ce qui surestime les prix nets américains d'une part inconnue.",
    citeThis: "Citer",
    copied: "Copié",
    shareX: "Partager sur X",
  },
  charts: {
    kicker: "Graphiques",
    title: "L'écart, dessiné",
    body: "Valeurs réelles du registre, dessinées à la main en SVG. Survolez pour les chiffres exacts.",
    gapRanking: "Plus grands ratios de prix États-Unis / Canada",
    gapRankingBody: "Ratios de prix unitaires pour les molécules aux écarts les plus larges. Chiffres américains bruts des rabais.",
    distribution: "Comment les écarts se répartissent",
    distributionBody: "Combien de molécules tombent dans chaque tranche de ratio. La plupart se tiennent dans une bande étroite, tandis qu'une longue traîne paie bien plus cher aux États-Unis.",
    atcHeatmap: "Écart médian par classe de médicaments",
    atcHeatmapBody: "Ratio médian États-Unis / Canada par classe ATC de niveau 1. Certaines classes sont structurellement moins chères au Canada que d'autres.",
    axisUs: "É.-U.",
    axisCa: "Canada",
  },
  methodology: {
    kicker: "Méthodologie",
    title: "Comment le registre est construit",
    body: "Chaque règle ci-dessous est le code dans scripts/, pas une description d'intention. La chaîne est réexécutable.",
    steps: [
      {
        title: "Partir des lignes Overall",
        body: "Le fichier CMS répète chaque médicament une fois par fabricant plus une ligne de synthèse Overall. Seules les lignes Overall sont utilisées, pour ne compter aucun dollar deux fois. Il reste 3 625 médicaments uniques pour 2024.",
      },
      {
        title: "Normaliser en molécules",
        body: "Les noms génériques sont mis en minuscules, les espaces resserrés et les dosages retirés, pour que la marque Eliquis et le générique apixaban deviennent une seule ligne de molécule. Les formes galéniques restent hors de la clé. Une molécule est une molécule.",
      },
      {
        title: "Résoudre l'identité via RxNorm",
        body: "Chaque molécule normalisée est cherchée dans l'API REST RxNorm pour un RxCUI de niveau ingrédient, et le code ATC est lu dans ses propriétés. Les appariements sous le seuil de confiance sont mis en quarantaine, jamais devinés.",
      },
      {
        title: "Prix américain par unité posologique",
        body: "Dépenses totales Part D 2024 divisées par les unités posologiques totales 2024 par molécule, pondérées par la dépense. C'est brut des rabais confidentiels des fabricants, que le CMS ne peut pas divulguer par médicament, donc cela surestime le prix net américain d'une part inconnue.",
      },
      {
        title: "Prix de référence canadien",
        body: "Le CEPMB ne publie aucun fichier de prix par molécule lisible par machine. La colonne canadienne utilise donc le formulaire électronique de l'Ontario : le plus bas prix de médicament par unité parmi les lignes appariées, converti au taux moyen USD/CAD 2024 de la Banque du Canada. C'est le prix que le régime public ontarien paie aux pharmacies, pas un prix national affiché. Les molécules sans inscription au formulaire sont montrées avec les seules données américaines et étiquetées honnêtement.",
      },
      {
        title: "Le contexte GLOBE",
        body: "Le 30 septembre 2026, le CMS a finalisé le modèle GLOBE, qui lie les rabais de la Part B à des repères de 19 pays dont le Canada. Les écarts de ce registre sont la raison d'être de cette politique. Le registre ne tente pas de modéliser ce que GLOBE y changerait.",
      },
    ],
    limitsTitle: "Ce que ceci ne fait pas",
    limits: [
      "Les prix américains sont bruts des rabais confidentiels. Considérez chaque ratio comme une borne haute de l'écart réel.",
      "Medicare Part D couvre une population. Les assurances commerciales et Medicaid paient des prix différents.",
      "Une unité posologique n'est pas un traitement complet. Un médicament bon marché par unité pris chaque jour peut coûter plus cher par an qu'un médicament onéreux pris une fois.",
      "Les molécules sans prix canadien apparié ne sont pas des lignes comparables. Elles sont listées, pas classées.",
    ],
    unknownsTitle: "Inconnues honnêtes",
    unknowns: [
      "Le CEPMB ne publie aucun fichier de prix par molécule lisible par machine. La colonne canadienne utilise donc les prix du formulaire de l'Ontario. Ce sont les prix que le régime public ontarien paie aux pharmacies, pas un prix national affiché.",
      "Chaque unité posologique du CMS correspond-elle proprement au format canadien de la même molécule. 16 molécules sont exclues du classement pour ce motif, chacune avec une raison documentée dans data/insights.json.",
    ],
  },
  developers: {
    kicker: "Développeurs",
    title: "Interroger le registre",
    body: "REST avec OpenAPI 3.1, serveur MCP JSON-RPC pour les agents, et le registre complet en CSV. Aucune clé requise.",
    restTitle: "Points d'accès REST",
    openapiLink: "Spécification OpenAPI 3.1",
    csvTitle: "Télécharger le registre",
    csvBody: "Une ligne par molécule : dépenses américaines, coûts unitaires, prix de référence canadien, ratio, classe ATC, RxCUI.",
    csvButton: "Télécharger molecule-ledger.csv",
    mcpTools: "Outils MCP",
  },
  data: {
    kicker: "Données",
    title: "Sources et provenance",
    body: "Deux sources gouvernementales, un croisement standard, une série de change. Rien d'autre n'entre dans le registre.",
    rows: [
      {
        name: "Medicare Part D Spending by Drug, 2024",
        who: "Centers for Medicare & Medicaid Services (É.-U.)",
        detail: "Fichier annuel des dépenses par médicament : 3 625 médicaments uniques dans l'édition 2024, cinq ans d'historique par ligne, détail par fabricant derrière les synthèses Overall. Brut des rabais confidentiels.",
      },
      {
        name: "Formulaire électronique de l'Ontario",
        who: "Ministère de la Santé de l'Ontario",
        detail: "Prix des médicaments par DIN. Le registre prend le plus bas prix par unité parmi les lignes appariées pour chaque molécule, soit le prix que le régime public ontarien paie aux pharmacies. Récupéré le 10 octobre 2026. Le CEPMB ne publiant aucun fichier de prix par molécule lisible par machine, le formulaire est la source canadienne.",
      },
      {
        name: "Correspondance d'ingrédients RxNorm",
        who: "National Library of Medicine (É.-U.)",
        detail: "Recherche de RxCUI au niveau ingrédient plus lecture de la propriété ATC, une requête par molécule, résultats en cache dans data/rxnorm_cache.json.",
      },
      {
        name: "Moyenne annuelle USD/CAD, 2024",
        who: "Banque du Canada",
        detail: "Série quotidienne du taux de change moyennée sur 2024, utilisée pour exprimer les prix canadiens en USD dans le ratio.",
      },
    ],
  },
  footer: {
    line: "Un projet open-source indépendant. Non affilié aux Centers for Medicare & Medicaid Services américains, au Conseil d'examen du prix des médicaments brevetés, ni à aucun gouvernement.",
    sources: "Source américaine : CMS Medicare Part D Spending by Drug, édition 2024. Source canadienne : formulaire électronique de l'Ontario, octobre 2026.",
    author: "Construit par Richardson Dackam",
  },
  mcp: {
    kicker: "Pour les agents IA",
    title: "Donnez le registre à votre agent",
    body: "Trois outils en HTTP continu : chercher une molécule, classer les écarts, ventiler par classe de médicaments.",
    tabs: {
      chatgpt: "ChatGPT",
      claude: "Claude",
      claudecode: "Claude Code",
      cli: "CLI",
      other: "Autre",
    },
    cardTitle: "Invite de configuration pour {tab}",
    copy: "Copier l'invite",
    copied: "Copié",
    chatgptNote: "Collez ceci dans un GPT personnalisé ou un projet ChatGPT avec le point MCP configuré.",
    otherTitle: "Points d'accès directs",
    otherBody: "Tout client compatible MCP peut pointer vers ces points.",
    mcpEndpoint: "Point MCP",
    openapiSpec: "Spécification OpenAPI",
    restBase: "Base REST",
    pChatgpt:
      "Connectez-vous au serveur MCP {displayName} à {origin}/mcp. Outils : molecule_lookup (prix É.-U. contre Canada d'une molécule), price_gap_ranking (molécules classées par ratio É.-U. / Canada), atc_breakdown (écart médian par classe). {example}",
    pClaude:
      "Utilisez le serveur MCP {displayName} à {origin}/mcp avec les outils molecule_lookup, price_gap_ranking, atc_breakdown. {example}",
    pClaudeCode:
      'Ajoutez ce serveur MCP à Claude Code : {{"mcpServers": { "{slug}": { "url": "{origin}/mcp" } }}}. Puis {exampleLower}.',
    pCli:
      "curl -s -X POST {origin}/mcp -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{{\"name\":\"price_gap_ranking\",\"arguments\":{{\"limit\":10}}}}}}'",
  },
  common: {
    usd: "USD",
    cad: "CAD",
  },
};

const dicts: Record<Lang, typeof en> = { en, fr };

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: typeof en }>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = window.localStorage.getItem("mol-gap-lang");
      return saved === "fr" ? "fr" : "en";
    } catch {
      return "en";
    }
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("mol-gap-lang", l);
    } catch {}
  };
  return <LangContext.Provider value={{ lang, setLang, t: dicts[lang] }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
