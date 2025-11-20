import type { Core, Data, UID } from "@strapi/strapi";

/**
 * Insert documents into the database in published state.
 * @param strapi - The Strapi instance
 * @param data - The data to insert
 * @param targetUid - The target UID (content type)
 * @returns Promise<void>
 */
export async function insertDocuments<T>(
  strapi: Core.Strapi,
  data: T[],
  targetUid: UID.ContentType
): Promise<void> {
  for (const item of data) {
    await strapi.documents(targetUid).create({
      data: item,
      status: "published",
    });
  }
  strapi.log.info(`${targetUid} data successfully seeded.`);
}
