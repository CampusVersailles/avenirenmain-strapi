import { compileStrapi, createStrapi } from "@strapi/strapi";
import axios from "axios";
import "dotenv/config";

type OnisepMetier = {
  libelle_metier: string;
  code_rome: string;
  "domainesous-domaine": string;
};

type OnisepFormation = {
  action_de_formation_af_identifiant_onisep: string;
  formation_for_libelle: string;
  for_url_et_id_onisep: string;
  for_indexation_domaine_web_onisep: string;
  for_type: string;
  for_nature_du_certificat: string;
  for_niveau_de_sortie: string;
  lieu_denseignement_ens_libelle: string;
  ens_url_et_id_onisep: string;
  ens_statut: string;
  ens_adresse: string;
  ens_code_postal: string;
  ens_commune: string;
  ens_departement: string;
  ens_region: string;
  ens_latitude: number;
  ens_longitude: number;
  ens_n_telephone: string;
  ens_site_web: string;
  af_duree_cycle_standard: string;
  af_modalites_scolarite: string;
  af_cout_scolarite: string;
  af_page_web: string;
};

const main = async () => {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = "info";

  try {
    console.log("Authenticating with Onisep API...");
    const formData = new URLSearchParams();
    formData.append("email", process.env.ONISEP_USERNAME);
    formData.append("password", process.env.ONISEP_PASSWORD);

    const authResponse = await axios.post<{ token: string }>(
      "https://api.opendata.onisep.fr/api/1.0/login",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const token = authResponse.data.token;
    console.log("✓ Authentication successful\n");

    console.log("Fetching filieres from Strapi...");
    const [filieres, durees, niveaux] = await Promise.all([
      strapi.documents("api::filiere.filiere").findMany({
        populate: ["metiers.codeRomeMetier"],
      }),
      strapi.documents("api::formation-duree.formation-duree").findMany(),
      strapi.documents("api::formation-niveau.formation-niveau").findMany(),
    ]);

    console.log(`Found ${filieres.length} filieres`);

    console.log("\nFetching metiers metadata from Onisep...");
    let metiersMetadata: OnisepMetier[] = [];
    let from = 0;
    let total = 0;

    do {
      const results = await axios.get<{
        total: number;
        size: number;
        from: number;
        results: OnisepMetier[];
      }>(
        `https://api.opendata.onisep.fr/api/1.0/dataset/5fa5949243f97/search?size=100&from=${from}`,
        {
          headers: {
            "Application-ID": process.env.ONISEP_APPLICATION_ID,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      metiersMetadata.push(...results.data.results);
      total = results.data.total;
      from += results.data.size;
      console.log(`  Fetched ${from}/${total} metiers metadata`);
    } while (from < total);

    const domaineToRomes = new Map<string, Set<string>>();
    for (const metier of metiersMetadata) {
      if (!metier["domainesous-domaine"] || !metier.code_rome) {
        continue;
      }

      const domaines = metier["domainesous-domaine"].split("|");
      const romeCodes = metier.code_rome.split("|");

      for (const domaine of domaines) {
        const trimmedDomaine = domaine.trim();
        if (!domaineToRomes.has(trimmedDomaine)) {
          domaineToRomes.set(trimmedDomaine, new Set());
        }
        for (const rome of romeCodes) {
          const trimmedRome = rome.trim();
          if (trimmedRome) {
            domaineToRomes.get(trimmedDomaine).add(trimmedRome);
          }
        }
      }
    }

    console.log(`Built mapping for ${domaineToRomes.size} domaines`);

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

    const levels: Record<string, string> = {
      "bac + 5": niveaux.find((niveau) => niveau.label === "BAC +5").documentId,
      "bac + 3": niveaux.find((niveau) => niveau.label === "BAC +3, BAC +4")
        .documentId,
      "bac + 4": niveaux.find((niveau) => niveau.label === "BAC +3, BAC +4")
        .documentId,
      "bac + 2": niveaux.find((niveau) => niveau.label === "BAC +2").documentId,
      "bac + 1": niveaux.find((niveau) => niveau.label === "BAC, BAC +1")
        .documentId,
      bac: niveaux.find((niveau) => niveau.label === "BAC, BAC +1").documentId,
      "CAP ou équivalent": niveaux.find(
        (niveau) => niveau.label === "CAP, BEP, Collège…"
      ).documentId,
    };

    console.log("\nFetching formations from Onisep...");
    from = 0;
    total = 0;
    let totalCreated = 0;
    let totalSkipped = 0;
    const formationsToCreate = new Set<string>();

    do {
      console.log(`  Fetching formations page from=${from}...`);
      const results = await axios.get<{
        total: number;
        size: number;
        from: number;
        results: OnisepFormation[];
      }>(
        `https://api.opendata.onisep.fr/api/1.0/dataset/605344579a7d7/search?size=100&from=${from}`,
        {
          headers: {
            "Application-ID": process.env.ONISEP_APPLICATION_ID,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      total = results.data.total;
      from += results.data.size;
      console.log(`  Fetched ${from}/${total} formations`);

      for (const formation of results.data.results) {
        const id = formation.action_de_formation_af_identifiant_onisep;

        const domaines = formation.for_indexation_domaine_web_onisep.split("|");
        const romeCodes = new Set<string>();
        const filiereIds = new Set<string>();

        for (const domaine of domaines) {
          const trimmedDomaine = domaine.trim();
          const romes = domaineToRomes.get(trimmedDomaine);
          if (romes) {
            romes.forEach((rome) => {
              romeCodes.add(rome);
              const filieres = romeToFilieres.get(rome);
              if (filieres) {
                filieres.forEach((f) => filiereIds.add(f));
              }
            });
          }
        }

        if (romeCodes.size === 0 || filiereIds.size === 0) {
          totalSkipped++;
          continue;
        }

        formationsToCreate.add(id);
        const existing = await strapi
          .documents("api::formation.formation")
          .findFirst({
            filters: {
              origine: "ONISEP",
              origineId: id,
            },
          });

        if (existing) {
          totalSkipped++;
          continue;
        }

        const durationMatch =
          formation.af_duree_cycle_standard.match(/(\d+)\s*ans?/);
        let dureeId = undefined;
        if (durationMatch) {
          const years = parseInt(durationMatch[1]);
          dureeId = durees.find(
            (d) => d.label === `${Math.min(years, 7)} an${years > 1 ? "s" : ""}`
          ).documentId;
        }

        totalCreated++;
        await strapi.documents("api::formation.formation").create({
          data: {
            titre: formation.formation_for_libelle,
            nomEtablissement: formation.lieu_denseignement_ens_libelle,
            alternance: false,
            siteWeb: formation.af_page_web || formation.ens_site_web,
            contact: formation.ens_n_telephone,
            filieres: Array.from(filiereIds),
            romeCodeMetiers: Array.from(romeCodes).map((code) => ({ code })),
            formationDuree: dureeId,
            formationNiveau: levels[formation.for_niveau_de_sortie],
            certificat: formation.for_type,
            adresse: {
              adresseComplete: formation.ens_adresse,
              codePostal: formation.ens_code_postal,
              pays: "France",
              ville: formation.ens_commune,
              longitude: formation.ens_longitude,
              latitude: formation.ens_latitude,
            },
            origine: "ONISEP",
            origineId: id,
          },
          status: "published",
        });
      }
      await new Promise((r) => setTimeout(r, 500)); // To avoid rate limiting
    } while (from < total);

    console.log("\nCleaning up old formations...");
    const toDelete = await strapi
      .documents("api::formation.formation")
      .findMany({
        filters: {
          origine: "ONISEP",
          origineId: { $notIn: Array.from(formationsToCreate) },
        },
      });

    for (const formationToDelete of toDelete) {
      await strapi.documents("api::formation.formation").delete({
        documentId: formationToDelete.documentId,
      });
    }

    console.log(`\n✓ ${totalCreated} formations created in total.`);
    console.log(
      `✓ ${totalSkipped} formations skipped because they already exist.`
    );
    console.log(`✓ ${toDelete.length} old formations deleted.`);
  } finally {
    await app.destroy();
  }
};

main();
