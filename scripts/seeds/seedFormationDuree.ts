import type { Core, Data } from "@strapi/strapi";
import { insertDocuments } from "./seedUtils";
import { formation_durees } from "../../data/data.json";

const TARGET_UID = "api::formation-duree.formation-duree" as const;
type TARGET_UID_TYPE = typeof TARGET_UID;

type FormationDureeFullType = Data.ContentType<TARGET_UID_TYPE>;
type FormationDureeSubset = Pick<FormationDureeFullType, "label">;

/**
 * Seed the `FormationDuree` content type.
 * @param strapi - The Strapi instance
 * @returns Promise<void>
 */
export async function seedFormationDuree(strapi: Core.Strapi): Promise<void> {
  const seedData: FormationDureeSubset[] = [];
  for (const item of formation_durees) {
    seedData.push({ label: item.label });
  }
  await insertDocuments(strapi, seedData, TARGET_UID);
}
