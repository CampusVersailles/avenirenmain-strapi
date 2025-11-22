import axios from "axios";
import "dotenv/config";

const main = async () => {
  const contentType = process.argv[2];

  if (!contentType) {
    console.error("Usage: tsx scripts/clean.ts <content-type>");
    console.error("Example: tsx scripts/clean.ts formations");
    process.exit(1);
  }

  console.log(`Cleaning all ${contentType}...`);

  try {
    let page = 1;
    let totalDeleted = 0;
    let hasMore = true;
    const toDelete = [] as string[];

    while (hasMore) {
      console.log(`Fetching page ${page}...`);

      const response = await axios.get<{
        data: { documentId: string }[];
        meta: {
          pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
          };
        };
      }>(
        `${process.env.STRAPI_API_URL}/${contentType}?pagination[page]=${page}&pagination[pageSize]=100`,
        {
          headers: {
            Authorization: `Bearer ${process.env.STRAPI_WRITE_API_TOKEN}`,
          },
        }
      );

      const items = response.data.data;
      toDelete.push(...items.map((item) => item.documentId));
      page++;

      if (items.length === 0) {
        hasMore = false;
      }
    }

    console.log(`Total ${contentType} to delete: ${toDelete.length}`);
    for (const item of toDelete) {
      console.log(`Deleting ${contentType} ${item}...`);
      await axios.delete(
        `${process.env.STRAPI_API_URL}/${contentType}/${item}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.STRAPI_WRITE_API_TOKEN}`,
          },
        }
      );
      totalDeleted++;
    }

    console.log(`✓ Successfully deleted ${totalDeleted} ${contentType}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error:", error.response?.data || error.message);
    } else {
      console.error("Error:", error);
    }
    process.exit(1);
  }
};

main();
