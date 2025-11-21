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

const domains = ["A"];

const main = async () => {
  let formations: AlternanceFormation[] = [];

  for (const romeDomain of domains) {
    console.log(`Fetching formations with romeDomain: ${romeDomain}`);

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

    formations.push(...results.data.results);

    console.log(
      `Fetched ${results.data.results.length} formations, total fetched: ${formations.length}`
    );
  }

  for (const formation of formations) {
    console.log("Pushing formation to Strapi:", formation.title);
    await axios.post(
      `${process.env.STRAPI_API_URL}/formations`,
      {
        data: {
          titre: formation.title,
          nomEtablissement: formation.company?.name,
          alternance: true,
          siteWeb: formation.onisepUrl,
          contact: formation.contact?.phone,
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
};

main();
