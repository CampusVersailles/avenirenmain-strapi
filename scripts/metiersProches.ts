import { compileStrapi, createStrapi } from "@strapi/strapi";

const main = async () => {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = "info";

  try {
    console.log("Fetching all métiers...\n");

    const metiers = await strapi.documents("api::metier.metier").findMany({
      populate: ["metiersProches"],
    });

    console.log(`Found ${metiers.length} métiers\n`);

    console.log("═══════════════════════════════════════\n");

    for (const metier of metiers) {
      console.log(`\n📋 ${metier.titre}`);
      const metiersProches = metier.metiersProches.map((metier) => {
        const matchingMetier = metiers.find(
          (m) => m.titre.toLowerCase() === metier.nom.toLowerCase()
        );
        return {
          nom: metier.nom,
          metier: matchingMetier ? matchingMetier.documentId : null,
        };
      });
      if (metiersProches.length > 0) {
        await strapi.documents("api::metier.metier").update({
          documentId: metier.documentId,
          data: {
            metiersProches,
          } as any,
          status: "published",
        });

        console.log(
          `   ✓ Updated ${metiersProches.length} metiers proches to ${metier.titre}`
        );
      } else {
        console.log(`   - No metiers proches found`);
      }
    }

    console.log("\n═══════════════════════════════════════");
    console.log(`\nTotal: ${metiers.length} métiers processed`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await strapi.destroy();
  }
};

main();
