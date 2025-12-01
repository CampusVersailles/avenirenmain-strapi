import { compileStrapi, createStrapi } from "@strapi/strapi";
import fs from "fs/promises";
import path from "path";
import "dotenv/config";
import Fuse from "fuse.js";
import { uploadFile } from "./seeds/seedUtils";

async function checkAndUploadLocalFile(
  filePath: string,
  fileName: string
): Promise<any> {
  const existingFile = await strapi.query("plugin::upload.file").findOne({
    where: { name: fileName },
  });

  if (existingFile) {
    return existingFile;
  }

  const fileStats = await fs.stat(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  const mimetype = mimeTypes[ext] || "image/jpeg";

  return uploadFile(
    {
      filepath: filePath,
      originalFileName: fileName,
      mimetype: mimetype,
      size: fileStats.size,
    },
    fileName
  );
}

interface MetierMarkdown {
  titre: string;
  description: string;
  tachesQuotidiennes: Array<{ titre: string; description: string }>;
  centresInterets: Array<{ titre: string; description: string }>;
  pourquoi: {
    environnementTravail?: string;
    opportunites?: string;
    statuts?: string;
    bonASavoir?: string;
  };
  metiersProches: string[];
  processusCreatifs: string[];
  sujetsInteret: string[];
  videoUrl?: string;
  imagePaths: string[];
}

function markdownToBlocks(text: string) {
  if (!text) {
    return [];
  }

  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((para) => {
    const children: any[] = [];
    let remaining = para.trim();

    // Split by *italic* and ~~strikethrough~~, keeping delimiters
    const parts = remaining.split(/(\*[^*]+\*|~~[^~]+~~)/g);

    for (const part of parts) {
      if (!part) {
        continue;
      }

      const italicMatch = part.match(/^\*([^*]+)\*$/);
      if (italicMatch) {
        children.push({
          type: "text",
          text: italicMatch[1],
          italic: true,
        });
        continue;
      }

      const strikeMatch = part.match(/^~~([^~]+)~~$/);
      if (strikeMatch) {
        continue;
      }

      children.push({
        type: "text",
        text: part,
      });
    }

    return {
      type: "paragraph" as const,
      children,
    };
  });
}

const parseMarkdown = (content: string): MetierMarkdown | null => {
  const titleMatches = content.match(/^#\s+(.+)$/gm);
  if (!titleMatches || titleMatches.length === 0) {
    return null;
  }
  const titre = titleMatches[titleMatches.length - 1]
    .replace(/^#\s+/, "")
    .replace(/\*\*/g, "")
    .split(" - ")[0]
    .trim();

  const descMatch = content.match(
    /## (?:\*\*)?Le Métier en un clin d’oeil(?:\*\*)?\s*\n\s*\n(.+?)(?=\n##)/s
  );
  const description = descMatch ? descMatch[1].trim() : "";
  const tachesQuotidiennes: Array<{ titre: string; description: string }> = [];
  const tachesSection = content.match(
    /## (?:\*\*)?Ce que tu fais au quotidien(?:\*\*)?\s*\n([\s\S]+?)(?=\n## )/
  );
  if (tachesSection) {
    const tacheMatches = tachesSection[1].matchAll(
      /###\s+(?:\*\*)?(.+?)(?:\*\*)?\n\n(.+?)(?=\n##|###|$)/gs
    );
    for (const match of tacheMatches) {
      tachesQuotidiennes.push({
        titre: match[1].trim(),
        description: match[2].trim(),
      });
    }
  }

  const centresInterets: Array<{ titre: string; description: string }> = [];
  const centresSection = content.match(
    /## (?:\*\*)?Ce qu’il faut aimer(?:\*\*)?\s*\n([\s\S]+?)(?=\n## )/
  );
  if (centresSection) {
    const centreMatches = centresSection[1].matchAll(
      /###\s+(?:\*\*)?(.+?)(?:\*\*)?\n\n(.+?)(?=\n##|###|$)/gs
    );
    for (const match of centreMatches) {
      centresInterets.push({
        titre: match[1].trim(),
        description: match[2].trim(),
      });
    }
  }

  const pourquoi: {
    environnementTravail?: string;
    opportunites?: string;
    statuts?: string;
    bonASavoir?: string;
  } = {};

  const environnementMatch = content.match(
    /###\s+(?:\*\*)?Environnement[^#\n]*(?:\*\*)?\s*\n\n(.+?)(?=\n###|\n##|$)/s
  );
  if (environnementMatch) {
    pourquoi.environnementTravail = environnementMatch[1].trim();
  }

  let statutsMatch = content.match(
    /###\s+(?:\*\*)?Statuts(?:\*\*)?\s*\n\n(.+?)(?=\n###|\n##|$)/s
  );
  if (!statutsMatch) {
    statutsMatch = content.match(
      /###\s+(?:\*\*)?Statut et environnement(?:\*\*)?\s*\n\n(.+?)(?=\n###|\n##|$)/s
    );
  }

  if (statutsMatch) {
    pourquoi.statuts = statutsMatch[1].trim();
  }

  let opportunitesMatch = content.match(
    /###\s+(?:\*\*)?Opportunités[^#\n]*(?:\*\*)?\s*\n\n(.+?)(?=\n###|\n##|$)/s
  );
  if (!opportunitesMatch) {
    opportunitesMatch = content.match(
      /###\s+(?:\*\*)?Statuts et opportunités(?:\*\*)?\s*\n\n(.+?)(?=\n###|\n##|$)/s
    );
  }

  if (!opportunitesMatch) {
    opportunitesMatch = content.match(
      /###\s+(?:\*\*)?Insertion professionnelle(?:\*\*)?\s*\n\n(.+?)(?=\n###|\n##|$)/s
    );
  }
  if (opportunitesMatch) {
    pourquoi.opportunites = opportunitesMatch[1].trim();
  }

  const bonASavoirMatch = content.match(
    /###\s+(?:\*\*)?Bon à savoir(?:\*\*)?\s*\n\n(.+?)(?=\n###|\n##|$)/s
  );
  if (bonASavoirMatch) {
    pourquoi.bonASavoir = bonASavoirMatch[1].trim();
  }

  const metiersProches: string[] = [];
  const metiersSection = content.match(
    /## (?:\*\*)?Métiers proches(?:\*\*)?\s*\n([\s\S]+?)(?=\n##|###)/
  );
  if (metiersSection) {
    const metierMatches = metiersSection[1].matchAll(/- (.+?)(?:\s*✨)?$/gm);
    for (const match of metierMatches) {
      metiersProches.push(match[1].trim());
    }
  }

  const processusCreatifs: string[] = [];
  const processusSection = content.match(
    /### (?:\*\*)?Processus créatifs(?:\*\*)?[\s\S]+?\n([\s\S]+?)(?=\n##)/
  );
  if (processusSection) {
    const processusMatches = processusSection[1].matchAll(/- (.+)$/gm);
    for (const match of processusMatches) {
      processusCreatifs.push(match[1].trim());
    }
  }
  const sujetsInteret: string[] = [];
  const sujetsSection = content.match(
    /- Sujets d'intérêt[\s\S]+?\n\s*\n([\s\S]+?)(?=\n-|\n##|$)/
  );
  if (sujetsSection) {
    const subjects = sujetsSection[1]
      .split(/\n/)
      .filter((s) => s.trim() && !s.includes("["));
    sujetsInteret.push(...subjects.map((s) => s.trim()));
  }

  const videoMatch = content.match(
    /## Lien vers une vidéo YouTube\s*\n\s*\n-?\s*\[?(https:\/\/[^\]\s)]+)\]?/
  );
  const videoUrl = videoMatch ? videoMatch[1].trim() : undefined;

  const imagePaths: string[] = [];
  const imageMatches = content.matchAll(/!\[.+?\]\((.+?\.png)\)/gi);
  for (const match of imageMatches) {
    imagePaths.push(match[1]);
  }

  return {
    titre,
    description,
    tachesQuotidiennes,
    centresInterets,
    pourquoi,
    metiersProches,
    processusCreatifs,
    sujetsInteret,
    videoUrl,
    imagePaths,
  };
};

const metiers = new Set([
  "bijoutier / bijoutière",
  "brodeur / brodeuse",
  "fabricant/restaurateur / fabricante/restauratrice de véhicules de collection",
  "céramiste",
  "charpentier / charpentière",
  "charpentier",
  "costumier / costumière",
  "couturier / couturière",
  "creative technologist ou codeur créatif / codeuse créative",
  "ébéniste",
  "fabmanager / fabmanageuse",
  "graveur / graveuse",
  "horloger / horlogère",
  "joaillier / joaillière",
  "maroquinier / maroquinière",
  "menuisier / menuisière",
  "menuisier",
  "métallier / métallière",
  "modeleur / modeleuse",
  "photographe technicien / technicienne",
  "relieur / relieuse",
  "sculpteur / sculptrice sur bois",
  "valoriste",
  "vannier / vannière",
]);

const metierToRome: Record<string, string> = {
  "apprêteur / apprêteuse": "B1603",
  "archetier / archetière": "B1501",
  "ardoisier / ardoisière": "F1619",
  "argenteur et/ou doreur sur métal / argenteuse et/ou doreuse sur métal":
    "B1302",
  "armurier / armurière d'art": "B1601",
  "artisan surcycleur / artisane surcycleuse": "K2304",
  "âtrier / âtrière": "F1703",
  "bijoutier / bijoutière": "B1605",
  "bijoutier / bijoutière en métaux précieux": "B1605",
  "bijoutier / bijoutière fantaisie": "B1605",
  bombeur: "B1602",
  "bottier main / bottière main": "B1802",
  "boutonnier / boutonnière": "B1804",
  "briquetier / briquetière": "F1703",
  "bronzier / bronzière": "B1601",
  "brodeur / brodeuse": "B1804",
  "brodeur / brodeuse à l'aiguille": "B1804",
  "brodeur / brodeuse crochet (lunéville)": "B1804",
  "brodeur / brodeuse sur machine guidée main": "B1804",
  "brossier / brossière": "B1804",
  calligraphe: "B1101",
  campaniste: "B1601",
  "canneur rempailleur / canneuse rempailleuse": "B1401",
  "cartonnier / cartonnière": "B1101",
  "fabricant/restaurateur / fabricante/restauratrice de véhicules de collection":
    "L1604",
  "carrossier / carrossière de véhicules de collection": "L1604",
  "charron / charronne": "B1601",
  céramiste: "B1201",
  chaîniste: "B1603",
  "chapelier / chapelière et modiste": "B1801",
  "charpentier / charpentière": "F1503",
  charpentier: "F1503",
  "charpentier de marine / charpentière de marine": "F1503",
  "chaumier / chaumière": "F1619",
  "chef / cheffe de projet en valorisation des matériaux": "M1402",
  "cirier / cirière": "B1302",
  "ciseleur / ciseleuse": "B1303",
  cornier: "B1302",
  "corsetier / corsetière": "B1803",
  "costumier / costumière": "L1502",
  "coupeur / coupeuse": "B1803",
  "coutelier / coutelière": "B1601",
  "couturier / couturière": "B1803",
  "couturier / couturière flou": "B1803",
  "couvreur du patrimoine bâti / couvreuse du patrimoine bâti": "F1619",
  "couvreur ornemaniste / couvreuse ornemaniste": "F1619",
  "creative technologist ou codeur créatif / codeuse créative": "E1104",
  "décorateur / décoratrice en résine": "B1603",
  "décorateur sur céramique / décoratrice sur céramique": "B1201",
  "dentellier / dentellière": "B1804",
  "dentellier / dentellière au fuseau": "B1804",
  "dentellier / dentellière à l'aiguille": "B1804",
  diamantaire: "B1607",
  "dinandier / dinandière": "B1601",
  "dominotier / dominotière": "B1302",
  "doreur / doreuse": "B1302",
  "doreur sur cuir / doreuse sur cuir": "B1302",
  "doreur / doreuse sur tranche": "B1302",
  ébéniste: "H2207",
  écailliste: "H2208",
  "émailleur sur cadrans / émailleuse sur cadrans": "B1604",
  "émailleur sur lave / émailleuse sur lave": "B1302",
  "émailleur sur métal / émailleuse sur métal": "B1302",
  "émailleur sur terre / émailleuse sur terre": "B1201",
  "encadreur / encadreuse": "H2208",
  "enlumineur / enlumineuse": "B1101",
  "ennoblisseur / ennoblisseuse textile": "H1408",
  "escaliéteur / escaliéteuse": "F1503",
  eventailliste: "B1804",
  "fabricant / fabricante d'accessoires de spectacle": "H2206",
  "fabricant / fabricante de décors de spectacle": "H2206",
  "fabricant / fabricante d'anches": "B1501",
  "fabricant / fabricante de luminaires": "B1302",
  "fabricant / fabricante d'abat-jour": "B1302",
  "fabricant / fabricante d'automates": "B1604",
  "fabmanager / fabmanageuse": "M1305",
  "fabricant de chaussures / fabricante de chaussures": "B1802",
  "fabricant d'objets en papier et/ou carton / fabricante d'objets en papier et/ou carton":
    "B1101",
  "fabricant / fabricante d'objets en textiles": "B1101",
  "fabricant de bardeaux et de lattes / fabricante de bardeaux et de lattes":
    "F1503",
  "fabricant de carreaux / fabricante de carreaux": "F1608",
  "fabricant / fabricantes de coiffes": "B1801",
  "fabricant de compositions et décors végétaux stables et durables / fabricante de compositions et décors végétaux stables et durables":
    "B1101",
  "fabricant de girouettes et d'éléments de faîtage / fabricante de girouettes et d'éléments de faîtage":
    "F1619",
  "fabricant de papier / fabricante de papier": "B1402",
  "fabricant de papier peint / fabricante de papier peint": "B1302",
  "fabricant / fabricante de parapluies, parasols, ombrelles et cannes":
    "B1805",
  "fabricant de serrures / fabricante de serrures": "B1601",
  "fabricant / fabricante de tapis et/ou tapisserie": "B1806",
  "fabricant de tapis et/ou tapisserie / fabricante de tapis et/ou tapisserie":
    "B1806",
  "fabricant / fabricante de jeux": "H2208",
  "fabricant / fabricante de jouets": "H2208",
  "fabricant / fabricante de poupées ou de peluches de collection": "B1101",
  "fabricant / fabricante de figurines": "B1101",
  "fabricant / fabricante de manèges": "H2201",
  "fabricant / fabricante de maquettes": "B1101",
  "fabricant / fabricante de marionnettes": "L1503",
  "fabricant / fabricante de masques": "L1503",
  "facteur / factrice d'instruments à vent": "B1501",
  "facteur / factrice d'instruments à vent-bois": "B1501",
  "facteur et/ou restaurateur d'instruments à vent en métal / factrice et/ou restauratrice d'instruments à vent en métal":
    "B1501",
  "facteur et/ou restaurateur de percussions / factrice et/ou restauratrice de percussions":
    "B1501",
  "facteur et/ou restaurateur de pianos / factrice et/ou restauratrice de pianos":
    "B1501",
  "facteur et/ou restaurateur d'accordéons / factrice et/ou restauratrice d'accordéons":
    "B1501",
  "facteur et/ou restaurateur de harpes / factrice et/ou restauratrice de harpes":
    "B1501",
  "facteur et/ou restaurateur d'harmoniums / factrice et/ou restauratrice d'harmoniums":
    "B1501",
  "facteur et/ou restaurateur d'instruments à claviers / factrice et/ou restauratrice d'instruments à claviers":
    "B1501",
  "facteur et/ou restaurateur d'instruments de musique mécanique / factrice et/ou restauratrice d'instruments de musique mécanique":
    "B1501",
  "facteur et/ou restaurateur d'orgues / factrice et/ou restauratrice d'orgues":
    "B1501",
  "facteur et/ou restaurateur de clavecins et épinettes / factrice et/ou restauratrice de clavecins et épinettes":
    "B1501",
  "facteur et/ou restaurateur d'instruments traditionnels / factrice et/ou restauratrice d'instruments traditionnels":
    "B1501",
  féron: "B1601",
  "ferronnier-forgeron / ferronnière-forgeronne": "B1601",
  "feutrier / feutrière": "B1804",
  "fondeur / fondeuse": "B1601",
  "fondeur d'étain / fondeuse d'étain": "B1601",
  "fondeur / fondeuse de caractères": "B1303",
  "fondeur / fondeuse de cloches et sonnailles": "B1601",
  "fontainier / fontainière": "F1612",
  "fourreur / fourreuse": "B1803",
  "formier / formière": "H2208",
  "gainier / gainière": "B1802",
  "gantier / gantière": "B1802",
  fresquiste: "B1101",
  "gaufreur sur cuir / gaufreuse sur cuir": "B1802",
  "gaufreur sur textile / gaufreuse sur textile": "B1804",
  "glypticien / glypticienne": "B1603",
  "graveur / graveuse": "B1303",
  "graveur et imprimeur / graveur et imprimeuse en gaufrage": "B1303",
  "graveur de poinçons / graveure de poinçons": "B1303",
  "graveur héraldiste / graveuse héraldiste": "B1303",
  "graveur médailleur / graveuse médailleuse": "B1303",
  "graveur / graveuse sur pierre": "B1303",
  "graveur / graveuse sur verre": "B1303",
  "graveur / graveuse sur ivoire et autres matériaux d'origine animale":
    "B1303",
  "ivoirier / ivoirière": "H2208",
  "guillocheur / guillocheuse": "B1303",
  "horloger / horlogère": "B1604",
  "imagier / imagière en pochoir": "B1302",
  "imprimeur / imprimeuse": "E1301",
  "imprimeur / imprimeuse en héliogravure": "E1301",
  "imprimeur / imprimeuse en lithographie": "E1301",
  "imprimeur en risographie / imprimeuse en risographie": "E1301",
  "imprimeur en sérigraphie / imprimeuse en sérigraphie": "E1301",
  "imprimeur / imprimeuse en typographie": "E1301",
  "imprimeur-graveur / imprimeuse-graveuse en taille-douce": "B1303",
  "jardinier du patrimoine / jardinière du patrimoine": "A1203",
  "joaillier / joaillière": "B1606",
  lapidaire: "B1607",
  "lapidaire tourneur sur pierres dures et fines / lapidaire tourneuse sur pierres dures et fines":
    "B1607",
  "laqueur / laqueuse": "B1302",
  "lauzier / lauzière ou lavier / lavière": "F1610",
  "lissier basse-lice / lissière basse-lice": "B1804",
  "lissier haute-lice / lissière haute-lice": "B1804",
  "lissier savonnerie / lissière savonnerie": "B1804",
  "luthier / luthière en guitare et/ou restaurateur / restauratrice de guitares":
    "B1501",
  "luthier en guitare et/ou restaurateur de guitares / luthière en guitare et/ou restauratrice de guitares":
    "B1501",
  "luthier et/ou restaurateur d'instruments à cordes frottées / luthière et/ou restauratrice d'instruments à cordes frottées":
    "B1501",
  "maçon du patrimoine bâti / maçonne du patrimoine bâti": "F1703",
  "maître verrier / vitrailliste": "B1602",
  "malletier / malletière et layetier / layetière": "B1802",
  "marbreur sur papier / marbreuse sur papier": "B1101",
  "marbrier / marbrière": "F1612",
  "maroquinier / maroquinière": "B1802",
  "marqueteur / marqueteuse de pierres dures": "F1612",
  "marqueteur / marqueteuse": "H2208",
  "marqueteur de pailles / marqueteuse de pailles": "H2208",
  "menuisier / menuisière": "H2206",
  menuisier: "H2206",
  "menuisier en sièges / menuisière en sièges": "H2207",
  "métallier / métallière": "B1601",
  "modeleur / modeleuse": "H2908",
  "modeleur-mouleur / modeleuse-mouleuse (métal)": "H2908",
  modéliste: "B1803",
  "miroitier-argenteur / miroitière-argenteuse": "B1302",
  "monnayeur de monnaies ou de médailles / monnayeuse de monnaies ou de médailles":
    "B1603",
  mosaïste: "B1101",
  "murailler / muraillère": "F1703",
  "mouleur / mouleuse": "H2908",
  "nacrier / nacrière": "H2208",
  orfèvre: "B1603",
  "parcheminier / parcheminière": "B1802",
  "pareur / pareuse": "B1802",
  "parqueteur / parqueteuse": "F1608",
  "parurier / parurière floral": "B1804",
  "passementier / passementière": "B1804",
  "patineur / patineuse": "B1302",
  "peintre en décor": "B1302",
  "peintre décorateur / décoratrice sur tissu": "B1302",
  "paveur-dalleur / paveuse-dalleuse": "F1608",
  "peintre fileur-doreur / peintre fileuse-doreuse": "B1302",
  "peintre sur mobilier": "H2207",
  "perruquier-posticheur / perruquière-posticheuse": "L1501",
  "photographe technicien / technicienne": "E1201",
  "restaurateur / restauratrice de photographies": "E1201",
  "pipier / pipière": "H2208",
  "plisseur / plisseuse": "B1804",
  "plumassier / plumassière": "B1804",
  "poêlier / poêlière": "B1601",
  "polisseur / polisseuse": "B1603",
  "polisseur de verre / polisseuse de verre": "B1602",
  "potier / potière d'étain": "B1601",
  "relieur / relieuse": "B1402",
  "préparateur presse-papier / préparatrice presse-papier": "B1602",
  "restaurateur / restauratrice d'objets scientifiques, techniques, industriels":
    "B1302",
  "restaurateur / restauratrice de céramiques": "B1201",
  "restaurateur / restauratrice de cuirs": "B1802",
  "restaurateur / restauratrice de documents graphiques et imprimés": "B1402",
  "restaurateur / restauratrice de métal": "B1601",
  "restaurateur / restauratrice de meubles": "H2207",
  "restaurateur / restauratrice de mosaïques": "F1612",
  "restaurateur / restauratrice de peintures": "B1302",
  "restaurateur / restauratrice de sculptures": "B1101",
  "restaurateur / restauratrice de textiles": "B1804",
  "restaurateur / restauratrice de vitraux": "B1602",
  rocailleur: "F1703",
  "sabreur / sabreuse de velours": "B1804",
  "santonnier / santonnière": "B1201",
  "sculpteur sur pierre / sculptrice sur pierre": "F1612",
  "sculpteur / sculptrice sur bois": "H2208",
  "sculpteur sur métal / sculptrice sur métal": "B1101",
  "sculpteur sur terre / sculptrice sur terre": "B1101",
  "sellier / sellière": "B1802",
  "sellier-garnisseur / sellière-garnisseuse": "B1802",
  "sellier-harnacheur / sellière-harnacheuse": "B1802",
  "sellier d'ameublement / sellière d'ameublement": "B1802",
  "sellier-maroquinier / sellière-maroquinière": "B1802",
  "sérigraphe textile": "B1804",
  "sertisseur / sertisseuse": "B1610",
  "staffeur-stucateur / staffeuse-stucatrice": "F1601",
  "tabletier / tabletière": "B1302",
  "tailleur / tailleuse": "B1803",
  "tailleur / tailleuse de pierre": "F1612",
  "taillandier / tallandière": "H2911",
  "tailleur de verre / tailleuse de verre": "B1602",
  "tanneur / tanneuse et mégissier / mégissière": "B1802",
  "tapissier d'ameublement et/ou tapissier décorateur / tapissière d'ameublement et/ou tapissière décoratrice":
    "B1806",
  "tourneur / tourneuse sur bois": "H2208",
  taxidemiste: "B1802",
  "teinturier / teinturière": "B1804",
  "tisserand / tisserande": "B1804",
  "tisserand / tisserande à bras": "B1804",
  "tourneur sur métal / tourneuse sur métal": "B1601",
  "treillageur / treillageuse": "F1701",
  "tresseur / tresseuse": "B1804",
  "tufteur / tufteuse": "B1804",
  "tuilier / tuilière": "F1619",
  tulliste: "B1804",
  valoriste: "K2304",
  "vannier / vannière": "B1401",
  "veloutier / veloutière": "B1804",
  "vernisseur / vernisseuse": "B1302",
  "verrier / verrière à la main": "B1602",
  "verrier au chalumeau / verrière au chalumeau": "B1602",
  "verrier fondeur / verrière fondeuse": "B1602",
  "verrier décorateur / verrière décoratrice": "B1602",
  "restaurateur / restauratrice de verre et de cristal": "B1302",
  "lunetier / lunetière": "B1805",
  "moireur / moireuse": "B1804",
};

const main = async () => {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = "info";

  const fuseOptions = {
    threshold: 0.2,
    keys: ["name"],
    caseSensitive: false,
  };

  const metiersList = Object.keys(metierToRome).map((name) => ({
    name,
  }));
  const fuse = new Fuse(metiersList, fuseOptions);

  try {
    const mdFolder = process.argv[2];
    if (!mdFolder) {
      console.error("Please provide the folder path containing markdown files");
      console.error(
        "Usage: strapi console --run scripts/metiers-md.ts <folder-path>"
      );
      process.exit(1);
    }

    console.log(`Reading markdown files from: ${mdFolder}\n`);

    console.log("Loading filieres from Strapi...");
    const filieres = await strapi.documents("api::filiere.filiere").findMany({
      populate: ["domainesPro"],
    });
    console.log(`Found ${filieres.length} filieres\n`);

    const files = await fs.readdir(mdFolder);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    console.log(`Found ${mdFiles.length} markdown files\n`);

    let totalCreated = 0;
    let totalErrors = 0;

    for (const file of mdFiles) {
      const filePath = path.join(mdFolder, file);
      console.log(`Processing: ${file}`);

      try {
        const content = await fs.readFile(filePath, "utf-8");
        const parsed = parseMarkdown(content);

        if (!parsed) {
          console.log(`  ✗ Could not parse file, skipping\n`);
          totalErrors++;
          continue;
        }

        const existing = await strapi.documents("api::metier.metier").findMany({
          filters: { titre: parsed.titre },
          populate: ["mediaPrincipal"],
        });

        let mediaPrincipal;
        let mediaSecondaire;
        if (existing.length > 0) {
          mediaPrincipal = existing.find(
            (metier) => metier.mediaPrincipal
          )?.mediaPrincipal;
          await Promise.all(
            existing.map((metier) =>
              strapi
                .documents("api::metier.metier")
                .delete({ documentId: metier.documentId })
            )
          );
        }
        const searchResult = fuse.search(parsed.titre);

        const codeRome =
          searchResult.length > 0
            ? metierToRome[searchResult[0].item.name]
            : undefined;
        const matchingFilieres = codeRome
          ? filieres.filter((filiere) =>
              filiere.domainesPro?.some((dp) => codeRome.startsWith(dp.code))
            )
          : [];
        if (parsed.imagePaths.length > 0) {
          const folderName = file.replace(/\s+[a-f0-9]{32}\.md$/, "");
          const imageFolderPath = path.join(
            process.cwd(),
            mdFolder,
            folderName
          );

          const imageFileName = path.basename(parsed.imagePaths[0]);
          const imageFullPath = path.join(imageFolderPath, imageFileName);

          await fs.access(imageFullPath);

          mediaPrincipal = await checkAndUploadLocalFile(
            imageFullPath,
            imageFileName
          );

          if (parsed.imagePaths.length > 1) {
            const imageFileName = path.basename(
              parsed.imagePaths[parsed.imagePaths.length - 1]
            );
            const imageFullPath = path.join(imageFolderPath, imageFileName);

            await fs.access(imageFullPath);

            mediaSecondaire = await checkAndUploadLocalFile(
              imageFullPath,
              imageFileName
            );
          }
        }

        await strapi.documents("api::metier.metier").create({
          data: {
            titre: parsed.titre,
            description: markdownToBlocks(parsed.description),
            appellation: !metiers.has(parsed.titre.toLowerCase()),
            codeRomeMetier: codeRome ? { code: codeRome } : undefined,
            filieres: matchingFilieres.map((filiere) => filiere.documentId),
            mediaPrincipal: mediaPrincipal,
            mediaSecondaire: mediaSecondaire,
            videoUrl: parsed.videoUrl,
            tachesQuotidiennes: parsed.tachesQuotidiennes.map((t) => ({
              titre: t.titre,
              description: markdownToBlocks(t.description),
            })),
            centresInterets: parsed.centresInterets.map((c) => ({
              titre: c.titre,
              description: markdownToBlocks(c.description),
            })),
            pourquoi: {
              environnementTravail: parsed.pourquoi.environnementTravail
                ? markdownToBlocks(parsed.pourquoi.environnementTravail)
                : undefined,
              opportunites: parsed.pourquoi.opportunites
                ? markdownToBlocks(parsed.pourquoi.opportunites)
                : undefined,
              statuts: parsed.pourquoi.statuts
                ? markdownToBlocks(parsed.pourquoi.statuts)
                : undefined,
              notes: parsed.pourquoi.bonASavoir
                ? markdownToBlocks(parsed.pourquoi.bonASavoir)
                : undefined,
            },
          },
          status: "published",
        });

        console.log(`  ✓ Created successfully\n`);
        totalCreated++;
      } catch (error) {
        console.error(`  ✗ Error processing file:`, error);
        totalErrors++;
      }
    }

    console.log("\n═══════════════════════════════════════");
    console.log(`✓ ${totalCreated} métiers created`);
    console.log(`✗ ${totalErrors} errors`);
    console.log("═══════════════════════════════════════");
  } finally {
    await app.destroy();
  }
};

main();
