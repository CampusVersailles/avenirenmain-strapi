import type { Core, Data } from "@strapi/strapi";
import {
  checkFileExistsBeforeUpload,
  insertDocuments,
  uploadFromUrl,
} from "./seedUtils";
import { filieres } from "../../data/data.json";

const TARGET_UID = "api::filiere.filiere" as const;
type TARGET_UID_TYPE = typeof TARGET_UID;

type FiliereFullType = Data.ContentType<TARGET_UID_TYPE>;
type FiliereSubset = Pick<
  FiliereFullType,
  "nom" | "titre" | "description" | "photo" | "video" | "romeCode_GrandDomaines"
>;

/**
 * Seed the `Filiere` content type.
 * @param strapi - The Strapi instance
 * @returns Promise<void>
 */
export async function seedFiliere(strapi: Core.Strapi): Promise<void> {
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
    seedData.push({
      nom: item.nom,
      titre: item.titre,
      description: item.description,
      photo: photo,
      video: video,
      romeCode_GrandDomaines: item.romeCode_GrandDomaines,
    });
  }
  await insertDocuments(strapi, seedData, TARGET_UID);
}
