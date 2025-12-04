import { compileStrapi, createStrapi } from "@strapi/strapi";
import axios from "axios";
import "dotenv/config";

type AlternanceFormation = {
  identifiant: {
    cle_ministere_educatif: string;
  };
  formateur: {
    organisme: {
      etablissement: { enseigne: string };
      unite_legale: { raison_sociale: string };
    };
  };
  lieu: {
    adresse: {
      label: "string";
      code_postal: "string";
      commune: { nom: string };
    };
    geolocalisation: { coordinates: [number, number] };
  };
  contact: { telephone: string; email: string };
  modalite: { duree_indicative: number };
  certification: {
    valeur: {
      intitule: {
        cfd: { long: string };
        niveau: { cfd: { sigle: string; europeen: string } };
      };
      domaines: { rome: { rncp: { code: string }[] } };
    };
  };
  onisep: { url: string };
};

const main = async () => {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = "info";

  try {
    console.log("Fetching filieres from Strapi...");
    const [filieres, durees, niveaux] = await Promise.all([
      strapi.documents("api::filiere.filiere").findMany({
        populate: ["metiers.codeRomeMetier"],
      }),
      strapi.documents("api::formation-duree.formation-duree").findMany(),
      strapi.documents("api::formation-niveau.formation-niveau").findMany(),
    ]);

    console.log(`Found ${filieres.length} filieres`);

    const romeToFilieres = new Map<string, string[]>();

    for (const filiere of filieres) {
      for (const metiers of filiere.metiers) {
        if (!romeToFilieres.has(metiers.codeRomeMetier.code)) {
          romeToFilieres.set(metiers.codeRomeMetier.code, []);
        }
        romeToFilieres
          .get(metiers.codeRomeMetier.code)
          .push(filiere.documentId);
      }
    }

    console.log(`Found ${romeToFilieres.size} unique domaine pro\n`);
    const levels: Record<string, string> = {
      "6": niveaux.find((niveau) => niveau.label === "BAC +3, BAC +4")
        .documentId,
      "7": niveaux.find((niveau) => niveau.label === "BAC +5").documentId,
      "4": niveaux.find((niveau) => niveau.label === "BAC, BAC +1").documentId,
      "5": niveaux.find((niveau) => niveau.label === "BAC +2").documentId,
      "3": niveaux.find((niveau) => niveau.label === "CAP, BEP, Collège…")
        .documentId,
    };

    let total = 0;
    let skipped = 0;
    let count = 1;
    const formationsToCreate = new Set<string>();
    for (const [rome, filiereIds] of romeToFilieres.entries()) {
      console.log(
        `Fetching formations for rome: ${rome} (${count++}/${
          romeToFilieres.size
        })`
      );

      let page = 0;
      let hasMore = true;
      const allFormations: AlternanceFormation[] = [];

      while (hasMore) {
        console.log(`  Fetching page ${page}...`);
        const results = await axios.get<{
          data: AlternanceFormation[];
          pagination: {
            page_count: number;
            page_size: number;
            page_index: number;
          };
        }>(
          `https://api.apprentissage.beta.gouv.fr/api/formation/v1/search?romes=${rome}&page_index=${page}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.ALTERNANCE_TOKEN_ID}`,
            },
          }
        );

        allFormations.push(...results.data.data);
        hasMore =
          results.data.pagination.page_index <
          results.data.pagination.page_count - 1;
        page++;

        const formations = allFormations;
        console.log(`  Found ${formations.length} formations total`);

        for (const formation of formations) {
          const id = formation.identifiant.cle_ministere_educatif;
          formationsToCreate.add(id);
          const existing = await app
            .documents("api::formation.formation")
            .findFirst({
              filters: {
                origine: "Alternance",
                origineId: id,
              },
            });

          if (existing) {
            skipped++;
            continue;
          }

          total++;
          await app.documents("api::formation.formation").create({
            data: {
              titre: formation.certification.valeur.intitule.cfd.long,
              nomEtablissement:
                formation.formateur.organisme.etablissement.enseigne ||
                formation.formateur.organisme.unite_legale.raison_sociale,
              alternance: true,
              siteWeb: formation.onisep.url,
              contact: formation.contact.email || formation.contact.telephone,
              filieres: filiereIds,
              romeCodeMetiers:
                formation.certification.valeur.domaines.rome.rncp.map(
                  (rome) => ({ code: rome.code })
                ) || [],
              formationDuree: durees.find(
                (d) =>
                  d.label ===
                  `${Math.min(formation.modalite.duree_indicative, 7)} an${
                    formation.modalite.duree_indicative > 1 ? "s" : ""
                  }`
              ).documentId,
              formationNiveau:
                levels[
                  formation.certification.valeur.intitule.niveau.cfd.europeen
                ],
              certificat:
                formation.certification.valeur.intitule.niveau.cfd.sigle,
              adresse: {
                adresseComplete: formation.lieu.adresse.label,
                codePostal: formation.lieu.adresse.code_postal,
                pays: "France",
                ville: formation.lieu.adresse.commune.nom,
                longitude: formation.lieu.geolocalisation.coordinates[0],
                latitude: formation.lieu.geolocalisation.coordinates[1],
              },
              origine: "Alternance",
              origineId: id,
            },
            status: "published",
          });
        }
        console.log(` ✓ Created in strapi.`);
        await new Promise((r) => setTimeout(r, 500)); // To avoid rate limiting
      }
    }

    console.log("Cleaning up old formations...");
    const toDelete = await app.documents("api::formation.formation").findMany({
      filters: {
        origine: "Alternance",
        origineId: { $notIn: Array.from(formationsToCreate) },
      },
    });

    for (const formationToDelete of toDelete) {
      await app.documents("api::formation.formation").delete({
        documentId: formationToDelete.documentId,
      });
    }

    console.log(`\n✓ ${total} formations created in total.`);
    console.log(
      `\n✓ ${skipped} formations skipped because they already exist.`
    );
    console.log(`\n✓ ${toDelete.length} old formations deleted.`);
  } finally {
    await app.destroy();
  }
};

main();
