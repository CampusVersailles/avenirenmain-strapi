import type { Core, Data } from "@strapi/strapi";
import { checkFileExistsBeforeUpload, insertDocuments } from "./seedUtils";
import { filieres } from "../../data/data.json";

const TARGET_UID = "api::filiere.filiere";
type TARGET_UID_TYPE = typeof TARGET_UID;

type FiliereFullType = Data.ContentType<TARGET_UID_TYPE>;
type FiliereSubset = Pick<
  FiliereFullType,
  | "nom"
  | "titre"
  | "description"
  | "photo"
  | "video"
  | "icone"
  | "romeCode_GrandDomaines"
> & {
  domainesPro: Pick<
    FiliereFullType["domainesPro"][number],
    "code" | "description"
  >[];
};

/**
 * Seed the `Filiere` content type.
 * @param strapi - The Strapi instance
 */
export async function seedFiliere(strapi: Core.Strapi) {
  const existingValues = await strapi.documents(TARGET_UID).findMany();
  await Promise.all(
    existingValues.map(async (filiere) =>
      strapi.documents(TARGET_UID).delete({
        documentId: filiere.documentId,
      })
    )
  );

  const seedData: FiliereSubset[] = [];
  for (const item of filieres) {
    const photo = await checkFileExistsBeforeUpload(
      item.photo.url,
      item.photo.name
    );
    const video = await checkFileExistsBeforeUpload(
      item.video.url,
      item.video.name
    );
    const icone = await checkFileExistsBeforeUpload(
      item.icone.url,
      item.icone.name
    );
    seedData.push({
      ...item,
      photo,
      video,
      icone,
      domainesPro: item.domaines_professionnels.map((domaine) => ({
        code: domaine.value,
        description: domaine.label,
      })),
    });
  }
  await insertDocuments(strapi, seedData, TARGET_UID);
}
