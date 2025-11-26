/**
 * formation controller
 */

import { Data, factories } from "@strapi/strapi";
import Fuse, { FuseResult } from "fuse.js";

const DEFAULT_RADIUS_KM = 20;
const TARGET_UID = "api::formation.formation";
type Formation = Data.ContentType<typeof TARGET_UID>;

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default factories.createCoreController(
  "api::formation.formation",
  ({ strapi }) => ({
    async find(ctx) {
      const { latitude, longitude, radius, fuzzy, ...otherQuery } = ctx.query;

      if (!latitude && !longitude && !fuzzy) {
        return super.find(ctx);
      }

      const lat = latitude ? parseFloat(latitude as string) : null;
      const lng = longitude ? parseFloat(longitude as string) : null;
      const radiusKm = radius
        ? parseFloat(radius as string)
        : DEFAULT_RADIUS_KM;

      const page = parseInt((otherQuery["pagination[page]"] as string) || "1");
      const pageSize = parseInt(
        (otherQuery["pagination[pageSize]"] as string) || "25"
      );

      const baseFilters = otherQuery.filters || {};

      let lightFormations = (await strapi.entityService.findMany(TARGET_UID, {
        filters: baseFilters,
        fields: ["id", "titre"],
        populate:
          lat !== null && lng !== null
            ? {
                adresse: {
                  fields: ["latitude", "longitude"],
                },
              }
            : undefined,
      })) as Formation[];

      if (fuzzy) {
        const fuse = new Fuse(lightFormations, {
          keys: ["titre"],
          threshold: 0.4,
        });

        const searchResults = fuse.search(
          fuzzy as string
        ) as FuseResult<Formation>[];
        lightFormations = searchResults.map((result) => result.item);
      }

      let filteredFormations = lightFormations;
      if (lat !== null && lng !== null) {
        filteredFormations = lightFormations.filter((formation) => {
          if (!formation.adresse?.latitude || !formation.adresse?.longitude) {
            return false;
          }
          const distance = calculateDistance(
            lat,
            lng,
            formation.adresse.latitude,
            formation.adresse.longitude
          );
          return distance <= radiusKm;
        });
      }

      const total = filteredFormations.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedIds = filteredFormations
        .slice(start, end)
        .map((f: any) => f.id);

      const fullFormations = await strapi.entityService.findMany(
        "api::formation.formation",
        {
          filters: {
            id: { $in: paginatedIds },
          },
          populate: otherQuery.populate,
          sort: otherQuery.sort,
        }
      );

      return {
        data: paginatedIds.map((id) =>
          fullFormations.find((f: any) => f.id === id)
        ),
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(total / pageSize),
            total,
          },
        },
      };
    },
  })
);
