import axios from "axios";
import "dotenv/config";

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

const main = async () => {
  let formations: BubbleFormation[] = [];
  let cursor = 0;
  let remaining = 0;

  do {
    console.log(`Fetching formations with cursor: ${cursor}`);

    const results = await axios.get<{
      response: {
        cursor: number;
        count: number;
        remaining: number;
        results: BubbleFormation[];
      };
    }>(
      `https://lavenirenmain.fr/api/1.1/obj/training?constraints=[ { "key": "[DataSource]", "constraint_type": "equals", "value": "Demande" }]&cursor=${cursor}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BUBBLE_API_TOKEN}`,
        },
      }
    );

    formations.push(
      ...results.data.response.results.filter(
        (formation) => formation.formation_for_libelle_text
      )
    );
    remaining = results.data.response.remaining;
    cursor += results.data.response.count;

    console.log(
      `Fetched ${results.data.response.count} formations, ${remaining} remaining`
    );
  } while (remaining > 0);

  for (const formation of formations) {
    console.log(
      "Pushing formation to Strapi:",
      formation.formation_for_libelle_text
    );

    await axios.post(
      `${process.env.STRAPI_API_URL}/formations`,
      {
        data: {
          titre: formation.formation_for_libelle_text,
          nomEtablissement: formation.lieu_denseignement_ens_libelle_text,
          alternance: formation.alternance_text === "Oui",
          siteWeb: formation.ens_site_web_text,
          contact: formation.demande_email_text,
          adresse: {
            adresseComplete: formation.geocode_geographic_address?.address,
            ville: formation.ens_commune_text,
            latitude: formation.geocode_geographic_address?.lat,
            longitude: formation.geocode_geographic_address?.lng,
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
