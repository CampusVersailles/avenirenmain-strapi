import { compileStrapi, createStrapi, UID } from "@strapi/strapi";
import "dotenv/config";

const main = async () => {
  const contentType = process.argv[2];

  if (!contentType) {
    console.error("Usage: tsx scripts/clean.ts <content-type>");
    console.error("Example: tsx scripts/clean.ts formation");
    process.exit(1);
  }
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = "info";
  try {
    console.log(`Cleaning all ${contentType}...`);
    const type = `api::${contentType}.${contentType}` as UID.ContentType;
    const results = await app.db.query(type).deleteMany({});

    console.log(`${results.count} ${contentType} cleaned.`);
  } finally {
    await app.destroy();
  }
};

main();
