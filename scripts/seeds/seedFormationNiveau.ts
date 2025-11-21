import type { Core, Data, UID } from "@strapi/strapi";
import { insertDocuments } from "./seedUtils";
import { formation_niveaux } from "../../data/data.json";

const TARGET_UID = "api::formation-niveau.formation-niveau" as const;
type TARGET_UID_TYPE = typeof TARGET_UID;

type FormationNiveauFullType = Data.ContentType<TARGET_UID_TYPE>;
type FormationNiveauSubset = Pick<FormationNiveauFullType, "label">;

/**
 * Seed the `FormationNiveau` content type.
 * @param strapi - The Strapi instance
 * @returns Promise<void>
 */
export async function seedFormationNiveau(strapi: Core.Strapi): Promise<void> {
  const seedData: FormationNiveauSubset[] = [];
  for (const item of formation_niveaux) {
    seedData.push({ label: item.label });
  }
  await insertDocuments(strapi, seedData, TARGET_UID);
}
