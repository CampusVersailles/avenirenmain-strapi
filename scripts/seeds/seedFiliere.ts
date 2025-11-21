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
>;

/**
 * Seed the `Filiere` content type.
 * @param strapi - The Strapi instance
 */
export async function seedFiliere(strapi: Core.Strapi) {
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
    });
  }
  await insertDocuments(strapi, seedData, TARGET_UID);
}
