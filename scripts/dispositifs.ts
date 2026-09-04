import { compileStrapi, createStrapi } from "@strapi/strapi";
import fs from "fs/promises";
import path from "path";
import "dotenv/config";

const DISPOSITIF_UID = "api::dispositif.dispositif";

type CsvRecord = {
  dispositif: string;
  structure: string;
  type: string;
  echelle: string;
  presentation: string;
  lien: string;
  acteur: string;
  objectif: string;
  besoin: string;
};

const ACTEUR_ENUM_MAP: Record<string, string> = {
  "etat ou collectivite": "état ou collectivité",
  "professionnel des metiers d art": "professionnel des métiers d'art",
  association: "association",
  entreprise: "entreprise",
  "etablissement culturel": "établissement culturel",
};

const OBJECTIF_ENUM_MAP: Record<string, string> = {
  impulser: "impulser",
  structurer: "structurer",
  perenisser: "pérenisser",
  rayonner: "rayonner ",
};

const BESOIN_ENUM_MAP: Record<string, string> = {
  interlocuteur: "interlocuteur",
  formation: "formation",
  expertise: "expertise",
  financement: "financement",
  reseau: "réseau",
  accompagnement: "accompagnement",
  label: "label",
};

function normalizeForLookup(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toBlocks(text: string) {
  const paragraphs = text
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph) => ({
    type: "paragraph" as const,
    children: [
      {
        type: "text" as const,
        text: paragraph,
      },
    ],
  }));
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentField += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }

      currentRow.push(currentField);
      currentField = "";

      if (currentRow.some((field) => field.trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((field) => field.trim() !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function splitMultiValues(value: string): string[] {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapEnumValues(
  values: string[],
  enumMap: Record<string, string>,
  fieldLabel: string,
  rowLabel: string,
) {
  const mapped: string[] = [];

  for (const value of values) {
    const key = normalizeForLookup(value);
    const normalized = enumMap[key];

    if (!normalized) {
      console.warn(
        `[WARN] ${fieldLabel} inconnu pour "${rowLabel}": "${value}" (ignoré)`,
      );
      continue;
    }

    if (!mapped.includes(normalized)) {
      mapped.push(normalized);
    }
  }

  return mapped;
}

function getValueByColumn(
  row: string[],
  headerIndex: Map<string, number>,
  aliases: string[],
) {
  for (const alias of aliases) {
    const idx = headerIndex.get(alias);
    if (idx !== undefined) {
      return (row[idx] ?? "").trim();
    }
  }

  return "";
}

function rowsToRecords(rows: string[][]): CsvRecord[] {
  if (rows.length < 2) {
    return [];
  }

  const header = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim());
  const headerIndex = new Map<string, number>();

  header.forEach((col, idx) => {
    headerIndex.set(normalizeForLookup(col).replace(/ /g, ""), idx);
  });

  const dataRows = rows.slice(1);

  return dataRows
    .map((row) => {
      const record: CsvRecord = {
        dispositif: getValueByColumn(row, headerIndex, ["dispositif"]),
        structure: getValueByColumn(row, headerIndex, ["structure"]),
        type: getValueByColumn(row, headerIndex, ["type"]),
        echelle: getValueByColumn(row, headerIndex, [
          "echelledintervention",
          "echelle",
        ]),
        presentation: getValueByColumn(row, headerIndex, ["presentation"]),
        lien: getValueByColumn(row, headerIndex, ["ensavoirplus", "lien"]),
        acteur: getValueByColumn(row, headerIndex, ["acteur", "acteurs"]),
        objectif: getValueByColumn(row, headerIndex, ["objectif", "objectifs"]),
        besoin: getValueByColumn(row, headerIndex, ["besoin", "besoins"]),
      };

      return record;
    })
    .filter((record) => record.dispositif);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const pathArg = process.argv
    .slice(2)
    .find((arg) => arg !== "--dry-run" && !arg.startsWith("--"));
  const csvPath = path.resolve(process.cwd(), pathArg ?? "dispositifs.csv");

  const csvRaw = await fs.readFile(csvPath, "utf8");
  const rows = parseCsv(csvRaw);
  const records = rowsToRecords(rows);

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    for (const record of records) {
      const titre = record.dispositif.trim();
      if (!titre) {
        skipped += 1;
        continue;
      }

      const acteurs = mapEnumValues(
        splitMultiValues(record.acteur),
        ACTEUR_ENUM_MAP,
        "acteur",
        titre,
      ).map((acteur) => ({ acteur }));

      const objectifs = mapEnumValues(
        splitMultiValues(record.objectif),
        OBJECTIF_ENUM_MAP,
        "objectif",
        titre,
      ).map((objectif) => ({ objectif }));

      const besoins = mapEnumValues(
        splitMultiValues(record.besoin),
        BESOIN_ENUM_MAP,
        "besoin",
        titre,
      ).map((besoin) => ({ besoin }));

      const payload = {
        titre,
        sousTitre: record.structure,
        type: record.type,
        echelle: record.echelle,
        lien: record.lien,
        description: toBlocks(record.presentation),
        acteurs,
        objectifs,
        besoins,
      };

      const existing = await app.documents(DISPOSITIF_UID).findFirst({
        filters: { titre },
      });

      if (dryRun) {
        console.log(`[DRY-RUN] ${existing ? "UPDATE" : "CREATE"} -> ${titre}`);
        if (existing) {
          updated += 1;
        } else {
          created += 1;
        }
        continue;
      }

      if (existing) {
        await app.documents(DISPOSITIF_UID).update({
          documentId: existing.documentId,
          data: payload as any,
          status: "published",
        });
        updated += 1;
        console.log(`[UPDATE] ${titre}`);
      } else {
        await app.documents(DISPOSITIF_UID).create({
          data: payload as any,
          status: "published",
        });
        created += 1;
        console.log(`[CREATE] ${titre}`);
      }
    }

    console.log("\nImport terminé");
    console.log(`- Lignes CSV: ${records.length}`);
    console.log(`- Créés: ${created}`);
    console.log(`- Mis à jour: ${updated}`);
    console.log(`- Ignorés: ${skipped}`);
    console.log(`- Mode: ${dryRun ? "dry-run" : "write"}`);
  } finally {
    await app.destroy();
  }
}

main().catch((error) => {
  console.error("Erreur import dispositifs:", error);
  process.exit(1);
});
