import type { Core, UID } from "@strapi/strapi";
import axios from "axios";
import path from "node:path";
import fs from "node:fs/promises";
import { extension } from "mime-types";
import { PluginUploadFile } from "../../types/generated/contentTypes";

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
) {
  for (const item of data) {
    await strapi.documents(targetUid).create({
      data: item,
      status: "published",
    });
  }
  strapi.log.info(`${targetUid} data successfully seeded.`);
}

/**
 * Check if a file exists in Strapi and upload it if it doesn't.
 * @param fileName the name of the file to check and upload
 * @returns the file if it exists, otherwise the uploaded file
 */
export async function checkFileExistsBeforeUpload(
  url: string,
  name: string
): Promise<PluginUploadFile> {
  // Check if the file already exists in Strapi
  const fileWhereName = await strapi.query("plugin::upload.file").findOne({
    where: {
      name: name,
    },
  });

  if (fileWhereName) {
    // File exists, return it
    return fileWhereName;
  } else {
    // File doesn't exist, upload it
    return await uploadFromUrl(url, name);
  }
}

/**
 * Download a file from a URL and upload it to Strapi.
 * @param url - The URL of the file to upload
 * @param name - The name of the file
 * @returns the uploaded file
 */
export async function uploadFromUrl(url: string, name: string) {
  const downloaded = await downloadFromUrl(url, name);
  return await uploadFile(downloaded, name);
}

/**
 * Download a file from a URL and return the details of the file.
 * @param url - The URL of the file to download
 * @param name - The name of the file
 * @returns the details of the file
 */
async function downloadFromUrl(url: string, name: string): Promise<FileData> {
  // Download the file as a binary buffer
  const response = await axios.get(url, { responseType: "arraybuffer" });

  const buffer = Buffer.from(response.data);

  const mimeType =
    response.headers["content-type"] || "application/octet-stream";
  const extFromMime = extension(mimeType) || "bin";
  const fileName = `${name}.${extFromMime}`;

  // Create the directory if it doesn't exist
  await fs.mkdir(path.join("data", "downloads"), { recursive: true });

  // Write the file to the temporary directory
  const tmpPath = path.join("data", "downloads", fileName);
  await fs.writeFile(tmpPath, buffer);

  return {
    filepath: tmpPath,
    originalFileName: name,
    size: buffer.length,
    mimetype: mimeType,
  };
}

/**
 * Upload a file to Strapi.
 * @param file - The details of the file to upload
 * @param name - The name of the file
 * @returns the uploaded file
 */
export async function uploadFile(file: FileData, name: string) {
  return strapi
    .plugin("upload")
    .service("upload")
    .upload({
      files: file,
      data: {
        fileInfo: {
          alternativeText: `An image uploaded to Strapi called ${name}`,
          caption: name,
          name,
        },
      },
    });
}

type FileData = {
  filepath: string;
  originalFileName: string;
  size: number;
  mimetype: string;
};
