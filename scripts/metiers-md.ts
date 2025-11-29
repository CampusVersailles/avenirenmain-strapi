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

    const parts = remaining.split(/(\*[^*]+\*)/g);

    for (const part of parts) {
      if (!part) continue;

      const italicMatch = part.match(/^\*([^*]+)\*$/);
      if (italicMatch) {
        children.push({
          type: "text",
          text: italicMatch[1],
          italic: true,
        });
      } else {
        children.push({
          type: "text",
          text: part,
        });
      }
    }

    return {
      type: "paragraph" as const,
      children,
    };
  });
}

const parseMarkdown = (content: string): MetierMarkdown | null => {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (!titleMatch) {
    return null;
  }
  const titre = titleMatch[1].split("-")[0].trim();

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
    /###\s+(?:\*\*)?Environnement de travail(?: et statuts)?(?:\*\*)?\s*\n\n(.+?)(?=\n###|\n##|$)/s
  );
  if (environnementMatch) {
    pourquoi.environnementTravail = environnementMatch[1].trim();
  }

  const statutsMatch = content.match(
    /###\s+(?:\*\*)?Statuts(?:\*\*)?\s*\n\n(.+?)(?=\n###|\n##|$)/s
  );
  if (statutsMatch) {
    pourquoi.statuts = statutsMatch[1].trim();
  }

  const opportunitesMatch = content.match(
    /###\s+(?:\*\*)?Opportunités(?:\*\*)?\s*\n\n(.+?)(?=\n###|\n##|$)/s
  );
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

const METIER_TO_ROME: Record<string, string> = {
  "Apprêteur / Apprêteuse": "B1603",
  "Archetier / Archetière": "B1501",
  "Ardoisier / Ardoisière": "F1619",
  "Argenteur et/ou Doreur sur métal / Argenteuse et/ou Doreuse sur métal":
    "B1302",
  "Armurier / Armurière d'art": "B1601",
  "Artisan surcycleur / Artisane surcycleuse": "K2304",
  "Âtrier / Âtrière": "F1703",
  "Bijoutier / Bijoutière": "B1605",
  "Bijoutier / Bijoutière en métaux précieux": "B1605",
  "Bijoutier / Bijoutière fantaisie": "B1605",
  Bombeur: "B1602",
  "Bottier main / Bottière main": "B1802",
  "Boutonnier / Boutonnière": "B1804",
  "Briquetier / Briquetière": "F1703",
  "Bronzier / Bronzière": "B1601",
  "Brodeur / Brodeuse": "B1804",
  "Brodeur / Brodeuse à l'aiguille": "B1804",
  "Brodeur / Brodeuse crochet (Lunéville)": "B1804",
  "Brodeur / brodeuse sur machine guidée main": "B1804",
  "Brossier / Brossière": "B1804",
  Calligraphe: "B1101",
  Campaniste: "B1601",
  "Canneur rempailleur / Canneuse rempailleuse": "B1401",
  "Cartonnier / Cartonnière": "B1101",
  "Fabricant/Restaurateur / Fabricante/Restauratrice de véhicules de collection":
    "L1604",
  "Carrossier / Carrossière de véhicules de collection": "L1604",
  "Charron / Charronne": "B1601",
  Céramiste: "B1201",
  Chaîniste: "B1603",
  "Chapelier / Chapelière et Modiste": "B1801",
  "Charpentier / Charpentière": "F1503",
  "Charpentier de marine / Charpentière de marine": "F1503",
  "Chaumier / Chaumière": "F1619",
  "Chef / Cheffe de projet en valorisation des matériaux": "M1402",
  "Cirier / Cirière": "B1302",
  "Ciseleur / Ciseleuse": "B1303",
  Cornier: "B1302",
  "Corsetier / Corsetière": "B1803",
  "Costumier / Costumière": "L1502",
  "Coupeur / Coupeuse": "B1803",
  "Coutelier / Coutelière": "B1601",
  "Couturier / Couturière": "B1803",
  "Couturier / Couturière flou": "B1803",
  "Couvreur du patrimoine bâti / Couvreuse du patrimoine bâti": "F1619",
  "Couvreur ornemaniste / Couvreuse ornemaniste": "F1619",
  "Creative Technologist ou Codeur créatif / Codeuse créative": "E1104",
  "Décorateur / Décoratrice en résine": "B1603",
  "Décorateur sur céramique / Décoratrice sur céramique": "B1201",
  "Dentellier / Dentellière": "B1804",
  "Dentellier / Dentellière au fuseau": "B1804",
  "Dentellier / Dentellière à l'aiguille": "B1804",
  Diamantaire: "B1607",
  "Dinandier / Dinandière": "B1601",
  "Dominotier / Dominotière": "B1302",
  "Doreur / Doreuse": "B1302",
  "Doreur sur cuir / Doreuse sur cuir": "B1302",
  "Doreur / Doreuse sur tranche": "B1302",
  Ébéniste: "H2207",
  Écailliste: "H2208",
  "Émailleur sur cadrans / Émailleuse sur cadrans": "B1604",
  "Émailleur sur lave / Émailleuse sur lave": "B1302",
  "Émailleur sur métal / Émailleuse sur métal": "B1302",
  "Émailleur sur terre / Émailleuse sur terre": "B1201",
  "Encadreur / Encadreuse": "H2208",
  "Enlumineur / Enlumineuse": "B1101",
  "Ennoblisseur / Ennoblisseuse textile": "H1408",
  "Escaliéteur / Escaliéteuse": "F1503",
  Eventailliste: "B1804",
  "Fabricant / Fabricante d'accessoires de spectacle": "H2206",
  "Fabricant / Fabricante de décors de spectacle": "H2206",
  "Fabricant / Fabricante d'anches": "B1501",
  "Fabricant / Fabricante de luminaires": "B1302",
  "Fabricant / Fabricante d'abat-jour": "B1302",
  "Fabricant / fabricante d'automates": "B1604",
  "Fabmanager / Fabmanageuse": "M1305",
  "Fabricant de chaussures / Fabricante de chaussures": "B1802",
  "Fabricant d'objets en papier et/ou carton / Fabricante d'objets en papier et/ou carton":
    "B1101",
  "Fabricant / Fabricante d'objets en textiles": "B1101",
  "Fabricant de bardeaux et de lattes / Fabricante de bardeaux et de lattes":
    "F1503",
  "Fabricant de carreaux / Fabricante de carreaux": "F1608",
  "Fabricant / Fabricantes de coiffes": "B1801",
  "Fabricant de compositions et décors végétaux stables et durables / Fabricante de compositions et décors végétaux stables et durables":
    "B1101",
  "Fabricant de girouettes et d'éléments de faîtage / Fabricante de girouettes et d'éléments de faîtage":
    "F1619",
  "Fabricant de papier / Fabricante de papier": "B1402",
  "Fabricant de papier peint / Fabricante de papier peint": "B1302",
  "Fabricant / Fabricante de parapluies, parasols, ombrelles et cannes":
    "B1805",
  "Fabricant de serrures / Fabricante de serrures": "B1601",
  "Fabricant de tapis et/ou tapisserie / Fabricante de tapis et/ou tapisserie":
    "B1806",
  "Fabricant / Fabricante de jeux": "H2208",
  "Fabricant / Fabricante de jouets": "H2208",
  "Fabricant / Fabricante de poupées ou de peluches de collection": "B1101",
  "Fabricant / Fabricante de figurines": "B1101",
  "Fabricant / Fabricante de manèges": "H2201",
  "Fabricant / Fabricante de maquettes": "B1101",
  "Fabricant / Fabricante de marionnettes": "L1503",
  "Fabricant / Fabricante de masques": "L1503",
  "Facteur / Factrice d'instruments à vent": "B1501",
  "Facteur / Factrice d'instruments à vent-bois": "B1501",
  "Facteur et/ou restaurateur d'instruments à vent en métal / Factrice et/ou restauratrice d'instruments à vent en métal":
    "B1501",
  "Facteur et/ou restaurateur de percussions / Factrice et/ou restauratrice de percussions":
    "B1501",
  "Facteur et/ou restaurateur de pianos / Factrice et/ou restauratrice de pianos":
    "B1501",
  "Facteur et/ou restaurateur d'accordéons / Factrice et/ou restauratrice d'accordéons":
    "B1501",
  "Facteur et/ou restaurateur de harpes / Factrice et/ou restauratrice de harpes":
    "B1501",
  "Facteur et/ou restaurateur d'harmoniums / Factrice et/ou restauratrice d'harmoniums":
    "B1501",
  "Facteur et/ou restaurateur d'instruments à claviers / Factrice et/ou restauratrice d'instruments à claviers":
    "B1501",
  "Facteur et/ou restaurateur d'instruments de musique mécanique / Factrice et/ou restauratrice d'instruments de musique mécanique":
    "B1501",
  "Facteur et/ou restaurateur d'orgues / Factrice et/ou restauratrice d'orgues":
    "B1501",
  "Facteur et/ou restaurateur de clavecins et épinettes / Factrice et/ou restauratrice de clavecins et épinettes":
    "B1501",
  "Facteur et/ou restaurateur d'instruments traditionnels / Factrice et/ou restauratrice d'instruments traditionnels":
    "B1501",
  Féron: "B1601",
  "Ferronnier-forgeron / Ferronnière-forgeronne": "B1601",
  "Feutrier / Feutrière": "B1804",
  "Fondeur / Fondeuse": "B1601",
  "Fondeur d'étain / Fondeuse d'étain": "B1601",
  "Fondeur / Fondeuse de caractères": "B1303",
  "Fondeur / Fondeuse de cloches et sonnailles": "B1601",
  "Fontainier / Fontainière": "F1612",
  "Fourreur / Fourreuse": "B1803",
  "Formier / Formière": "H2208",
  "Gainier / Gainière": "B1802",
  "Gantier / Gantière": "B1802",
  Fresquiste: "B1101",
  "Gaufreur sur cuir / Gaufreuse sur cuir": "B1802",
  "Gaufreur sur textile / Gaufreuse sur textile": "B1804",
  "Glypticien / Glypticienne": "B1603",
  "Graveur / Graveuse": "B1303",
  "Graveur et imprimeur / graveur et imprimeuse en gaufrage": "B1303",
  "Graveur de poinçons / Graveure de poinçons": "B1303",
  "Graveur héraldiste / Graveuse héraldiste": "B1303",
  "Graveur médailleur / Graveuse médailleuse": "B1303",
  "Graveur / Graveuse sur pierre": "B1303",
  "Graveur / Graveuse sur verre": "B1303",
  "Graveur / Graveuse sur ivoire et autres matériaux d'origine animale":
    "B1303",
  "Ivoirier / Ivoirière": "H2208",
  "Guillocheur / Guillocheuse": "B1303",
  "Horloger / Horlogère": "B1604",
  "Imagier / Imagière en pochoir": "B1302",
  "Imprimeur / Imprimeuse": "E1301",
  "Imprimeur / Imprimeuse en héliogravure": "E1301",
  "Imprimeur / Imprimeuse en lithographie": "E1301",
  "Imprimeur en risographie / Imprimeuse en risographie": "E1301",
  "Imprimeur en sérigraphie / Imprimeuse en sérigraphie": "E1301",
  "Imprimeur / Imprimeuse en typographie": "E1301",
  "Imprimeur-graveur / Imprimeuse-graveuse en taille-douce": "B1303",
  "Jardinier du patrimoine / Jardinière du patrimoine": "A1203",
  "Joaillier / Joaillière": "B1606",
  Lapidaire: "B1607",
  "Lapidaire tourneur sur pierres dures et fines / Lapidaire tourneuse sur pierres dures et fines":
    "B1607",
  "Laqueur / Laqueuse": "B1302",
  "Lauzier / Lauzière ou Lavier / Lavière": "F1610",
  "Lissier basse-lice / Lissière basse-lice": "B1804",
  "Lissier haute-lice / Lissière haute-lice": "B1804",
  "Lissier savonnerie / Lissière savonnerie": "B1804",
  "Luthier en guitare et/ou restaurateur de guitares / Luthière en guitare et/ou restauratrice de guitares":
    "B1501",
  "Luthier et/ou restaurateur d'instruments à cordes frottées / Luthière et/ou restauratrice d'instruments à cordes frottées":
    "B1501",
  "Maçon du patrimoine bâti / Maçonne du patrimoine bâti": "F1703",
  "Maître verrier / Vitrailliste": "B1602",
  "Malletier / Malletière et Layetier / Layetière": "B1802",
  "Marbreur sur papier / Marbreuse sur papier": "B1101",
  "Marbrier / Marbrière": "F1612",
  "Maroquinier / Maroquinière": "B1802",
  "Marqueteur / Marqueteuse de pierres dures": "F1612",
  "Marqueteur / Marqueteuse": "H2208",
  "Marqueteur de pailles / Marqueteuse de pailles": "H2208",
  "Menuisier / Menuisière": "H2206",
  "Menuisier en sièges / Menuisière en sièges": "H2207",
  "Métallier / Métallière": "B1601",
  "Modeleur / Modeleuse": "H2908",
  "Modeleur-Mouleur / Modeleuse-Mouleuse (métal)": "H2908",
  Modéliste: "B1803",
  "Miroitier-argenteur / Miroitière-argenteuse": "B1302",
  "Monnayeur de monnaies ou de médailles / Monnayeuse de monnaies ou de médailles":
    "B1603",
  Mosaïste: "B1101",
  "Murailler / Muraillère": "F1703",
  "Mouleur / Mouleuse": "H2908",
  "Nacrier / Nacrière": "H2208",
  Orfèvre: "B1603",
  "Parcheminier / Parcheminière": "B1802",
  "Pareur / Pareuse": "B1802",
  "Parqueteur / Parqueteuse": "F1608",
  "Parurier / Parurière floral": "B1804",
  "Passementier / Passementière": "B1804",
  "Patineur / Patineuse": "B1302",
  "Peintre en décor": "B1302",
  "Peintre décorateur / décoratrice sur tissu": "B1302",
  "Paveur-dalleur / Paveuse-dalleuse": "F1608",
  "Peintre fileur-doreur / Peintre fileuse-doreuse": "B1302",
  "Peintre sur mobilier": "H2207",
  "Perruquier-posticheur / Perruquière-posticheuse": "L1501",
  "Photographe technicien / technicienne": "E1201",
  "Restaurateur / Restauratrice de photographies": "E1201",
  "Pipier / Pipière": "H2208",
  "Plisseur / Plisseuse": "B1804",
  "Plumassier / Plumassière": "B1804",
  "Poêlier / Poêlière": "B1601",
  "Polisseur / Polisseuse": "B1603",
  "Polisseur de verre / Polisseuse de verre": "B1602",
  "Potier / Potière d'étain": "B1601",
  "Relieur / Relieuse": "B1402",
  "Préparateur presse-papier / Préparatrice presse-papier": "B1602",
  "Restaurateur / restauratrice d'objets scientifiques, techniques, industriels":
    "B1302",
  "Restaurateur / restauratrice de céramiques": "B1201",
  "Restaurateur / restauratrice de cuirs": "B1802",
  "Restaurateur / restauratrice de documents graphiques et imprimés": "B1402",
  "Restaurateur / restauratrice de métal": "B1601",
  "Restaurateur / restauratrice de meubles": "H2207",
  "Restaurateur / restauratrice de mosaïques": "F1612",
  "Restaurateur / restauratrice de peintures": "B1302",
  "Restaurateur / restauratrice de sculptures": "B1101",
  "Restaurateur / restauratrice de textiles": "B1804",
  "Restaurateur / restauratrice de vitraux": "B1602",
  Rocailleur: "F1703",
  "Sabreur / Sabreuse de velours": "B1804",
  "Santonnier / Santonnière": "B1201",
  "Sculpteur sur pierre / Sculptrice sur pierre": "F1612",
  "Sculpteur / Sculptrice sur bois": "H2208",
  "Sculpteur sur métal / Sculptrice sur métal": "B1101",
  "Sculpteur sur terre / Sculptrice sur terre": "B1101",
  "Sellier / Sellière": "B1802",
  "Sellier-garnisseur / Sellière-garnisseuse": "B1802",
  "Sellier-harnacheur / Sellière-harnacheuse": "B1802",
  "Sellier d'ameublement / Sellière d'ameublement": "B1802",
  "Sellier-maroquinier / Sellière-maroquinière": "B1802",
  "Sérigraphe textile": "B1804",
  "Sertisseur / Sertisseuse": "B1610",
  "Staffeur-stucateur / Staffeuse-stucatrice": "F1601",
  "Tabletier / Tabletière": "B1302",
  "Tailleur / Tailleuse": "B1803",
  "Tailleur / Tailleuse de pierre": "F1612",
  "Taillandier / Tallandière": "H2911",
  "Tailleur de verre / Tailleuse de verre": "B1602",
  "Tanneur / Tanneuse et Mégissier / Mégissière": "B1802",
  "Tapissier d'ameublement et/ou tapissier décorateur / Tapissière d'ameublement et/ou tapissière décoratrice":
    "B1806",
  "Tourneur / Tourneuse sur bois": "H2208",
  Taxidemiste: "B1802",
  "Teinturier / Teinturière": "B1804",
  "Tisserand / Tisserande": "B1804",
  "Tisserand / Tisserande à bras": "B1804",
  "Tourneur sur métal / Tourneuse sur métal": "B1601",
  "Treillageur / Treillageuse": "F1701",
  "Tresseur / Tresseuse": "B1804",
  "Tufteur / Tufteuse": "B1804",
  "Tuilier / Tuilière": "F1619",
  Tulliste: "B1804",
  Valoriste: "K2304",
  "Vannier / Vannière": "B1401",
  "Veloutier / Veloutière": "B1804",
  "Vernisseur / Vernisseuse": "B1302",
  "Verrier / Verrière à la main": "B1602",
  "Verrier au chalumeau / Verrière au chalumeau": "B1602",
  "Verrier fondeur / Verrière fondeuse": "B1602",
  "Verrier décorateur / Verrière décoratrice": "B1602",
  "Restaurateur / restauratrice de verre et de cristal": "B1302",
  "Lunetier / Lunetière": "B1805",
  "Moireur / Moireuse": "B1804",
};

const main = async () => {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = "info";

  const fuseOptions = {
    threshold: 0.3,
    keys: ["name"],
  };

  const metiersList = Object.keys(METIER_TO_ROME).map((name) => ({
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

    // Load filieres with domaines professionnels
    console.log("Loading filieres from Strapi...");
    const filieres = await strapi.documents("api::filiere.filiere").findMany({
      populate: ["domainesPro"],
    });
    console.log(`Found ${filieres.length} filieres\n`);

    const files = await fs.readdir(mdFolder);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    console.log(`Found ${mdFiles.length} markdown files\n`);

    let totalCreated = 0;
    let totalSkipped = 0;
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

        const existing = await strapi
          .documents("api::metier.metier")
          .findFirst({
            filters: { titre: parsed.titre },
          });

        if (existing) {
          console.log(`  ⊘ Metier already exists, skipping\n`);
          totalSkipped++;
          continue;
        }
        const searchResult = fuse.search(parsed.titre);

        const codeRome =
          searchResult.length > 0
            ? METIER_TO_ROME[searchResult[0].item.name]
            : undefined;
        const matchingFilieres = codeRome
          ? filieres.filter((filiere) =>
              filiere.domainesPro?.some((dp) => codeRome.startsWith(dp.code))
            )
          : [];

        const folderName = file.replace(/\s+[a-f0-9]{32}\.md$/, "");
        const imageFolderPath = path.join(process.cwd(), mdFolder, folderName);

        const imageFileName = path.basename(parsed.imagePaths[0]);
        const imageFullPath = path.join(imageFolderPath, imageFileName);

        await fs.access(imageFullPath);

        const mediaPrincipal = await checkAndUploadLocalFile(
          imageFullPath,
          imageFileName
        );

        console.log(`  ✓ Image uploaded: ${imageFileName}`);

        await strapi.documents("api::metier.metier").create({
          data: {
            titre: parsed.titre,
            description: markdownToBlocks(parsed.description),
            codeRomeMetier: codeRome ? { code: codeRome } : undefined,
            filieres: matchingFilieres.map((filiere) => filiere.documentId),
            mediaPrincipal: mediaPrincipal,
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
    console.log(`⊘ ${totalSkipped} métiers skipped (already exist)`);
    console.log(`✗ ${totalErrors} errors`);
    console.log("═══════════════════════════════════════");
  } finally {
    await app.destroy();
  }
};

main();
