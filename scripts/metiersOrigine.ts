import { compileStrapi, createStrapi } from "@strapi/strapi";
import { metiers } from "../data/seed_metiers.json";

export async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = "info";

  const existingMetiers = await app
    .documents("api::metier.metier")
    .findMany({});
  let countAEM = 0;
  let countOrphee = 0;
  for (const item of existingMetiers) {
    const existingMetier = metiers.find(
      (metier) => metier.titre === item.titre
    );
    if (existingMetier) {
      countAEM++;
      await app.documents("api::metier.metier").update({
        documentId: item.documentId,
        data: {
          origine: "AEM",
        } as any,
        status: "published",
      });
    } else {
      countOrphee++;
      await app.documents("api::metier.metier").update({
        documentId: item.documentId,
        data: {
          origine: "Orph\u00E9e",
        } as any,
        status: "published",
      });
    }
  }
  console.log(`${countAEM} metiers AEM updatés`);
  console.log(`${countOrphee} metiers Orphée updatés`);
}

main();
