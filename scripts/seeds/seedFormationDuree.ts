import type { Core, Data } from "@strapi/strapi";
import { insertDocuments } from "./seedUtils";

const TARGET_UID = "api::formation-duree.formation-duree" as const;
type TARGET_UID_TYPE = typeof TARGET_UID;

type FormationDureeFullType = Data.ContentType<TARGET_UID_TYPE>;
type FormationDureeSubset = Pick<FormationDureeFullType, "label">;

const seedData: FormationDureeSubset[] = [
  { label: "Moins d'1 an" },
  { label: "1 an" },
  { label: "2 ans" },
  { label: "3 ans" },
  { label: "4 ans" },
  { label: "5 ans" },
  { label: "6 ans" },
  { label: "7 ans" },
];

/**
 * Seed the `FormationDuree` content type.
 * @param strapi - The Strapi instance
 * @returns Promise<void>
 */
export async function seedFormationDuree(strapi: Core.Strapi): Promise<void> {
  await insertDocuments(strapi, seedData, TARGET_UID);
}
