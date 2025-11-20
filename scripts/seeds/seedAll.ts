import type { Core, Data, UID } from "@strapi/strapi";
import { createStrapi, compileStrapi } from "@strapi/strapi";
import { seedFormationDuree } from "./seedFormationDuree";
import { seedFormationNiveau } from "./seedFormationNiveau";

/**
 * Seed the database with the data from the seed files.
 * @returns Promise<void>
 */
async function main() {
  const appContext = await compileStrapi();
  const app: Core.Strapi = await createStrapi(appContext).load();

  app.log.level = "info";

  await seedFormationDuree(app);
  await seedFormationNiveau(app);
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
