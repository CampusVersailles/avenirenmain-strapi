import type { Core, Data, UID } from "@strapi/strapi";
import { insertDocuments } from "./seedUtils";

const TARGET_UID = "api::formation-niveau.formation-niveau" as const;
type TARGET_UID_TYPE = typeof TARGET_UID;

type FormationNiveauFullType = Data.ContentType<TARGET_UID_TYPE>;
type FormationNiveauSubset = Pick<FormationNiveauFullType, "label">;

const seedData: FormationNiveauSubset[] = [
  { label: "CAP, BEP, Collège…" },
  { label: "BAC, BAC +1" },
  { label: "BAC +2" },
  { label: "BAC +3, BAC +4" },
  { label: "BAC +5" },
  { label: "BAC +6, BAC +7" },
];

/**
 * Seed the `FormationNiveau` content type.
 * @param strapi - The Strapi instance
 * @returns Promise<void>
 */
export async function seedFormationNiveau(strapi: Core.Strapi): Promise<void> {
  await insertDocuments(strapi, seedData, TARGET_UID);
}
