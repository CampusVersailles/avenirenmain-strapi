import { createStrapi, compileStrapi } from "@strapi/strapi";
import { seedFormationDuree } from "./seedFormationDuree";
import { seedFormationNiveau } from "./seedFormationNiveau";
import { seedFiliere } from "./seedFiliere";
import { seedMetier } from "./seedMetier";

/**
 * Seed the database with the data from the seed files.
 */
async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = "info";

  await seedFiliere(app);
  await seedFormationDuree(app);
  await seedFormationNiveau(app);
  await seedMetier(app);
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
