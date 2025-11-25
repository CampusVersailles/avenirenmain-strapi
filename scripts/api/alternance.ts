import axios from "axios";
import "dotenv/config";

type AlternanceFormation = {
  ideaType?: string;
  title?: string;
  contact?: {
    phone?: string;
  };
  place?: {
    distance?: number | null;
    fullAddress?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    address?: string;
    cedex?: string | null;
    zipCode?: string;
    insee?: string;
    departementNumber?: string;
    region?: string;
    remoteOnly?: boolean;
  };
  company?: {
    name?: string;
    siret?: string;
    id?: string;
    uai?: string;
    place?: {
      city?: string;
    };
    headquarter?: {
      siret?: string;
      id?: string;
      uai?: string;
      type?: string | null;
      hasConvention?: boolean | null;
      place?: {
        city?: string;
        address?: string;
        cedex?: string | null;
        zipCode?: string;
      };
      name?: string;
    };
  };
  longTitle?: string;
  id?: string;
  idRco?: string;
  idRcoFormation?: string;
  cleMinistereEducatif?: string;
  target_diploma_level?: string;
  diploma?: string;
  cfd?: string;
  rncpCode?: string;
  rncpLabel?: string;
  rncpEligibleApprentissage?: boolean;
  period?: string | null;
  capacity?: number | null;
  onisepUrl?: string | null;
  romes?: Array<{
    code: string;
  }>;
  training?: {
    description?: string | null;
    objectif?: string | null;
    sessions?: Array<{
      startDate: string;
      endDate: string;
      isPermanentEntry: boolean;
    }>;
    duration?: number;
  };
};
const main = async () => {
  console.log("Fetching filieres from Strapi...");
  const filieresResponse = await axios.get<{
    data: {
      documentId: string;
      nom: string;
      romeCode_GrandDomaines: string[];
    }[];
  }>(`${process.env.STRAPI_API_URL}/filieres`, {
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_WRITE_API_TOKEN}`,
    },
  });

  const filieres = filieresResponse.data.data;
  console.log(`Found ${filieres.length} filieres`);

  const romeDomainToFilieres = new Map<string, string[]>();

  for (const filiere of filieres) {
    for (const romeDomain of filiere.romeCode_GrandDomaines) {
      if (!romeDomainToFilieres.has(romeDomain)) {
        romeDomainToFilieres.set(romeDomain, []);
      }
      romeDomainToFilieres.get(romeDomain).push(filiere.documentId);
    }
  }

  console.log(`Found ${romeDomainToFilieres.size} unique rome domains\n`);

  let total = 0;
  for (const [romeDomain, filiereIds] of romeDomainToFilieres.entries()) {
    console.log(
      `Fetching formations for romeDomain: ${romeDomain} (linked to ${filiereIds.length} filieres)`
    );

    const results = await axios.get<{
      results: AlternanceFormation[];
    }>(
      `https://labonnealternance.apprentissage.beta.gouv.fr/api/v1/formations?romeDomain=${romeDomain}&caller=aem`,
      {
        headers: {
          "Application-ID": process.env.ONISEP_APPLICATION_ID,
        },
      }
    );

    const formations = results.data.results;
    console.log(`  Found ${formations.length} formations`);
    total += formations.length;

    for (const formation of formations) {
      await axios.post(
        `${process.env.STRAPI_API_URL}/formations`,
        {
          data: {
            titre: formation.title,
            nomEtablissement: formation.company?.name,
            alternance: true,
            siteWeb: formation.onisepUrl,
            contact: formation.contact?.phone,
            filieres: filiereIds,
            adresse: {
              adresseComplete: formation.place?.fullAddress,
              codePostal: formation.place?.zipCode,
              pays: "France",
              ville: formation.place?.city,
              latitude: formation.place?.latitude,
              longitude: formation.place?.longitude,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.STRAPI_WRITE_API_TOKEN}`,
          },
        }
      );
    }
    console.log(` ✓ Created in strapi.`);
  }
  console.log(`\n✓ ${total} formations created in total.`);
};

main();
