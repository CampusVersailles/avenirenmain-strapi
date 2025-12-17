import axios from "axios";
import "dotenv/config";
import { compileStrapi, createStrapi } from "@strapi/strapi";

type BubbleFormation = {
  formation_for_libelle_text?: string;
  for_type_text?: string;
  list_fili_res_list_text?: string[];
  ___certificats_dipl_mes__custom_certificats_dipl_mes?: string;
  "Modified Date"?: string;
  geocode_geographic_address?: {
    address: string;
    lat: number;
    lng: number;
  };
  alternance_text?: string;
  _os_fili_re__list_option_os_fili_re?: string[];
  _code_rome__list_custom_code_rome?: string[];
  ens_longitude_text?: string;
  ens_site_web_text?: string;
  demande_email_text?: string;
  demande_nom_text?: string;
  ens_latitude_text?: string;
  _os_duration__option_os_duration?: string;
  _datasource__option_os_datasource?: string;
  ens_commune_text?: string;
  "Created Date"?: string;
  "Created By"?: string;
  ens_n_telephone_text?: string;
  _os_niveau__list_option_os_type?: string[];
  niveau_text?: string;
  lieu_denseignement_ens_libelle_text?: string;
  _id?: string;
  ens_adresse_text?: string;
  demande_prenom_text?: string;
};

const dataSources = ["Formation Campus", "Demande", "Formation Autre"];

const main = async () => {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = "info";

  try {
    console.log("Fetching filieres, niveaux, durees from Strapi...");
    const [filieres, durees, niveaux] = await Promise.all([
      strapi.documents("api::filiere.filiere").findMany({
        populate: ["metiers.codeRomeMetier"],
      }),
      strapi.documents("api::formation-duree.formation-duree").findMany(),
      strapi.documents("api::formation-niveau.formation-niveau").findMany(),
    ]);

    const filiereTitleToId = new Map<string, string>();
    for (const f of filieres) {
      if (f.nom) {
        filiereTitleToId.set(f.nom.trim(), f.documentId);
      }
    }

    const romeToFilieres = new Map<string, string[]>();
    for (const f of filieres) {
      for (const m of f.metiers || []) {
        const code = m?.codeRomeMetier?.code;
        if (!code) continue;
        const c = code.trim();
        if (!romeToFilieres.has(c)) romeToFilieres.set(c, []);
        romeToFilieres.get(c)!.push(f.documentId);
      }
    }

    let cursor = 0;
    let remaining = 0;
    let totalCreated = 0;
    let totalSkipped = 0;
    const createdIds = new Set<string>();

    do {
      console.log(`Fetching formations with cursor: ${cursor}`);

      const results = await axios.get<{
        response: {
          cursor: number;
          count: number;
          remaining: number;
          results: BubbleFormation[];
        };
      }>(`https://lavenirenmain.fr/api/1.1/obj/training?cursor=${cursor}`, {
        headers: { Authorization: `Bearer ${process.env.BUBBLE_API_TOKEN}` },
      });

      const formations = results.data.response.results
        .filter((formation) =>
          dataSources.includes(formation._datasource__option_os_datasource)
        )
        .filter((formation) => formation.formation_for_libelle_text);

      remaining = results.data.response.remaining;
      cursor += results.data.response.count;

      console.log(
        `Fetched ${results.data.response.count} formations, ${remaining} remaining`
      );

      // Process formations immediately
      for (const f of formations) {
        const origineId =
          f._id ||
          f.ens_site_web_text ||
          f.demande_email_text ||
          f.formation_for_libelle_text;

        if (!origineId) {
          totalSkipped++;
          continue;
        }

        const existing = await app
          .documents("api::formation.formation")
          .findFirst({
            filters: { origine: "AEM", origineId },
          });
        if (existing) {
          totalSkipped++;
          continue;
        }

        const romeCodes = (f._code_rome__list_custom_code_rome || [])
          .map((c) => c.trim())
          .filter(Boolean);
        const filiereIds = new Set<string>();
        for (const code of romeCodes) {
          const ids = romeToFilieres.get(code);
          if (ids) {
            ids.forEach((id) => filiereIds.add(id));
          }
        }

        (f._os_fili_re__list_option_os_fili_re || []).forEach((title) => {
          console.log(filiereTitleToId);
          console.log(title);
          const id = filiereTitleToId.get(title.replace("’", "'").trim());
          if (id) {
            filiereIds.add(id);
          }
        });

        let dureeId: string | undefined = undefined;
        const durationSrc = f._os_duration__option_os_duration || "";
        const durMatch = durationSrc.match(/(\d+)\s*ans?/i);
        if (durMatch) {
          const years = Math.min(parseInt(durMatch[1]), 7);
          const label = `${years} an${years > 1 ? "s" : ""}`;
          const duree = durees.find((d: any) => d.label === label);
          dureeId = duree?.documentId;
        }

        const niveauKeyRaw = (
          f._os_niveau__list_option_os_type[0] || ""
        ).toLowerCase();
        const niveauKey = niveauKeyRaw.replace(/\s+/g, " ");
        const formationNiveau = niveaux.find((n) => {
          return n.label.toLowerCase() === niveauKey;
        })?.documentId;

        const lat =
          f.geocode_geographic_address?.lat ??
          parseFloat(f.ens_latitude_text || "NaN");
        const lng =
          f.geocode_geographic_address?.lng ??
          parseFloat(f.ens_longitude_text || "NaN");

        const titre = f.formation_for_libelle_text?.trim();
        const nomEtablissement = f.lieu_denseignement_ens_libelle_text?.trim();
        const siteWeb = f.ens_site_web_text || undefined;
        const contact = f.ens_n_telephone_text || undefined;
        const alternance = (f.alternance_text || "")
          .toLowerCase()
          .includes("oui");

        if (filiereIds.size === 0) {
          console.log(
            `  Skipping formation ${origineId}, ${f._os_fili_re__list_option_os_fili_re} - no filiere found`
          );
          return;
        }

        if (!lat || !lng) {
          console.log(
            `  Skipping formation ${origineId} ${f.geocode_geographic_address}, no coordinates`
          );
          return;
        }

        if (!formationNiveau) {
          console.log(
            `  Skipping formation ${origineId}, niveau "${niveauKey}" not mapped`
          );
          return;
        }

        if (!dureeId) {
          console.log(
            `  Skipping formation ${origineId}, durée "${durationSrc}" not mapped`
          );
          return;
        }

        await app.documents("api::formation.formation").create({
          data: {
            titre,
            nomEtablissement,
            alternance,
            siteWeb,
            contact,
            filieres: Array.from(filiereIds),
            romeCodeMetiers: romeCodes.map((code) => ({ code })),
            formationDuree: dureeId,
            formationNiveau,
            certificat:
              f.___certificats_dipl_mes__custom_certificats_dipl_mes ||
              f.for_type_text,
            adresse: {
              adresseComplete:
                f.ens_adresse_text || f.geocode_geographic_address?.address,
              codePostal: undefined,
              pays: "France",
              ville: f.ens_commune_text,
              longitude: isFinite(lng) ? lng : undefined,
              latitude: isFinite(lat) ? lat : undefined,
            },
            origine: "AEM",
            origineId,
          },
          status: "published",
        });

        createdIds.add(origineId);
        totalCreated++;
      }
    } while (remaining > 0);

    console.log("\nCleaning up old Bubble formations...");
    const toDelete = await app.documents("api::formation.formation").findMany({
      filters: {
        origine: "AEM",
        origineId: { $notIn: Array.from(createdIds) },
      },
    });
    for (const doc of toDelete) {
      await app
        .documents("api::formation.formation")
        .delete({ documentId: doc.documentId });
    }

    console.log(`\n✓ ${totalCreated} formations created.`);
    console.log(`✓ ${totalSkipped} formations skipped.`);
    console.log(`✓ ${toDelete.length} old formations deleted.`);
  } finally {
    await app.destroy();
  }
};

main();
