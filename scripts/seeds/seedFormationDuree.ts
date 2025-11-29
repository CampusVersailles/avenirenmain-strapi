import type { Core, Data } from "@strapi/strapi";
import { insertDocuments } from "./seedUtils";
import { formation_durees } from "../../data/data.json";

const TARGET_UID = "api::formation-duree.formation-duree";
type TARGET_UID_TYPE = typeof TARGET_UID;

type FormationDureeFullType = Data.ContentType<TARGET_UID_TYPE>;
type FormationDureeSubset = Pick<FormationDureeFullType, "label">;

/**
 * Seed the `FormationDuree` content type.
 * @param strapi - The Strapi instance
 */
export async function seedFormationDuree(strapi: Core.Strapi) {
  const existingValues = await strapi.documents(TARGET_UID).findMany();
  await Promise.all(
    existingValues.map(async (formationDuree) =>
      strapi.documents(TARGET_UID).delete({
        documentId: formationDuree.documentId,
      })
    )
  );
  const seedData: FormationDureeSubset[] = [];
  for (const item of formation_durees) {
    seedData.push({ label: item.label });
  }
  await insertDocuments(strapi, seedData, TARGET_UID);
}
