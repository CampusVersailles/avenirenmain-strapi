import type { Core } from "@strapi/strapi";
import { checkFileExistsBeforeUpload, insertDocuments } from "./seedUtils";
import { metiers } from "../../data/seed_metiers.json";

const TARGET_UID = "api::metier.metier";

/**
 * Seed the `Metier` content type.
 * @param strapi - The Strapi instance
 */
export async function seedMetier(strapi: Core.Strapi) {
  const existingValues = await strapi.documents(TARGET_UID).findMany();
  for (const metier of existingValues) {
    await strapi.documents(TARGET_UID).delete({
      documentId: metier.documentId,
    });
  }
  const filieres = await strapi.documents("api::filiere.filiere").findMany({
    filters: {
      nom: {
        $in: metiers.flatMap((metier) => metier.filieres),
      },
    },
  });

  const seedData = [];
  for (const item of metiers) {
    const mediaPrincipal = item.photo
      ? await checkFileExistsBeforeUpload(item.photo.url, item.photo.name)
      : null;
    seedData.push({
      titre: item.titre,
      appellation: false,
      description: [
        {
          type: "paragraph",
          children: [{ type: "text", text: item.description }],
        },
      ],
      centresInterets: item.centresInterets.map((centre) => ({
        titre: centre.titre,
        description: [
          {
            type: "paragraph",
            children: [{ type: "text", text: centre.description }],
          },
        ],
      })),
      tachesQuotidiennes: item.tachesQuotidiennes.map((tache) => ({
        titre: tache.titre,
        description: [
          {
            type: "paragraph",
            children: [{ type: "text", text: tache.description }],
          },
        ],
      })),
      pourquoi: {
        environnementTravail: [
          {
            type: "paragraph",
            children: [
              { type: "text", text: item.pourquoi.environnementTravail },
            ],
          },
        ],
        statuts: [
          {
            type: "paragraph",
            children: [{ type: "text", text: item.pourquoi.statuts }],
          },
        ],
        opportunites: [
          {
            type: "paragraph",
            children: [{ type: "text", text: item.pourquoi.opportunites }],
          },
        ],
        notes: [
          {
            type: "paragraph",
            children: [{ type: "text", text: item.pourquoi.notes }],
          },
        ],
      },
      metiersProches: [],
      salaire: null,
      codeRomeMetier: {
        code: item.codeRomeMetier,
      },
      mediaPrincipal: mediaPrincipal,
      mediaSecondaire: [],
      filieres: filieres
        .filter((filiere) => item.filieres.includes(filiere.nom))
        .map((filiere) => ({
          id: filiere.id,
        })),
    });
  }
  await insertDocuments(strapi, seedData, TARGET_UID);
}
