import axios from "axios";
import "dotenv/config";

type ONISEPFormation = {
  titre: string;
};

const main = async () => {
  let formations: ONISEPFormation[] = [];
  let from = 0;
  let total = 10;

  do {
    console.log(`Fetching formations with from: ${from}`);

    const results = await axios.get<{
      total: number;
      size: number;
      from: number;
      results: ONISEPFormation[];
    }>(
      `https://api.opendata.onisep.fr/api/1.0/dataset/5fa591127f501/search?from=${from}`,
      {
        headers: {
          "Application-ID": process.env.ONISEP_APPLICATION_ID,
        },
      }
    );

    formations.push(
      ...results.data.results.filter((formation) => formation.titre)
    );
    total = results.data.total;
    from += results.data.size;

    console.log(
      `Fetched ${results.data.size} formations, total fetched: ${from}`
    );
  } while (from < total);

  for (const formation of formations) {
    console.log("Pushing formation to Strapi:", formation.titre);
  }
};

main();
