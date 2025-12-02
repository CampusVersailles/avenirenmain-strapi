import { compileStrapi, createStrapi } from "@strapi/strapi";
import seedMetiers from "../data/rome_to_fap.json";
import axios from "axios";
import { env } from "process";
import "dotenv/config";
import { DOMParser as XmldomParser } from "@xmldom/xmldom";
import xpath from "xpath";

export function parseSalairesPerCode(
  xml: string
): Record<string, [number, number]> {
  const doc = new XmldomParser().parseFromString(xml, "text/xml");
  const salairePerCode: Record<string, [number, number]> = {};

  const periodes = xpath.select("//valeursParPeriode", doc) as Node[];
  for (const periode of periodes) {
    const codeNode = xpath.select1("codeActivite", periode) as Node;
    const codeActivite = codeNode.textContent?.trim();
    if (codeActivite) {
      const salaireMin = parseSalaire(periode, "SAL1");
      const salaireMax = parseSalaire(periode, "SAL3");
      if (!Number.isNaN(salaireMin) && !Number.isNaN(salaireMax)) {
        salairePerCode[codeActivite] = [salaireMin, salaireMax];
      }
    }
  }
  return salairePerCode;
}

export function parseSalaire(node: Node, codeNomenclature: string): number {
  const salaireNode = xpath.select1(
    `salaireValeurMontant[codeNomenclature='${codeNomenclature}']/valeurPrincipaleMontant`,
    node
  ) as Node;
  const salaireText = salaireNode.textContent?.trim();
  const salaire = parseInt(salaireText);
  return salaire;
}

const main = async () => {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = "info";

  try {
    console.log("Fetching all métiers...\n");

    const metiers = await strapi.documents("api::metier.metier").findMany({
      populate: ["codeRomeMetier", "salaire"],
    });

    console.log(`Found ${metiers.length} métiers in Strapi\n`);

    console.log("Authenticating with France Travail API...");
    const formData = new URLSearchParams();
    formData.append;
    formData.set("grant_type", "client_credentials");
    formData.set("client_id", env.FRANCE_TRAVAIL_CLIENT_ID);
    formData.set("client_secret", env.FRANCE_TRAVAIL_CLIENT_SECRET);
    formData.set(
      "scope",
      "api_rome-fiches-metiersv1 nomenclatureRome api_rome-metiersv1 nomenclatureRome api_stats-offres-demandes-emploiv1 offresetdemandesemploi"
    );

    const authResponse = await axios.post<{
      access_token: string;
      expires_in: number;
    }>(env.FRANCE_TRAVAIL_TOKEN_URL, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const token = authResponse.data.access_token;
    console.log("✓ Authentication successful\n");

    console.log("Fetching salaries from France Travail API...");
    const response = await axios.get(
      "https://api.francetravail.io/partenaire/stats-offres-demandes-emploi/v1/indicateur/salaire-rome-fap/NAT/FR",
      {
        responseType: "text",
        headers: {
          Accept: "application/xml",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const xml = response.data as string;

    const salairePerCode = parseSalairesPerCode(xml);

    console.log(
      "Nombre de codes activités avec salaire:",
      Object.keys(salairePerCode).length
    );

    let nFound = 0;
    let nNotFound = 0;

    for (const metier of metiers) {
      const fapCode = seedMetiers[metier.codeRomeMetier.code];
      if (!fapCode) {
        nNotFound++;
        continue;
      }

      const salaire = salairePerCode[fapCode];
      if (!salaire) {
        nNotFound++;
        continue;
      }

      await strapi.documents("api::metier.metier").update({
        documentId: metier.documentId,
        data: {
          salaire: {
            valeur_basse: salaire[0],
            valeur_haute: salaire[1],
          },
        } as any,
        status: "published",
      });

      console.log(
        `  ✓ ${metier.titre} salary updated to min:${salaire[0]} max:${salaire[1]}`
      );
      nFound++;
    }
    console.log(`  ✅ ${nFound} Salaries found`);
    console.log(`  ✗ ${nNotFound} Salaries not found`);

    console.log("\n═══════════════════════════════════════");
    console.log(`\nTotal: ${metiers.length} métiers processed`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await strapi.destroy();
  }
};

main();
