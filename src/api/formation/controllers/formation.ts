/**
 * formation controller
 */

import { Data, factories } from "@strapi/strapi";
import Fuse, { FuseResult } from "fuse.js";

const DEFAULT_RADIUS_KM = 20;
const TARGET_UID = "api::formation.formation";
type Formation = Data.ContentType<typeof TARGET_UID> & {
  score?: number;
  distance?: number;
};

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

      // @ts-expect-error pagination type
      const page = parseInt((otherQuery.pagination.page as string) || "1");
      const pageSize = parseInt(
        // @ts-expect-error pagination type
        (otherQuery.pagination.pageSize as string) || "25"
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
          threshold: 0.25,
          isCaseSensitive: false,
          includeScore: true,
        });

        const searchResults = fuse.search(
          fuzzy as string
        ) as FuseResult<Formation>[];
        lightFormations = searchResults.map((result) => ({
          ...result.item,
          score: result.score,
        }));
      }

      let filteredFormations = lightFormations;
      if (lat !== null && lng !== null) {
        filteredFormations = lightFormations
          .map((formation) => {
            if (!formation.adresse?.latitude || !formation.adresse?.longitude) {
              return null;
            }
            const distance = calculateDistance(
              lat,
              lng,
              formation.adresse.latitude,
              formation.adresse.longitude
            );
            return { ...formation, distance };
          })
          .filter(
            (formation) => formation !== null && formation.distance! <= radiusKm
          );
      }

      const total = filteredFormations.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedIds = filteredFormations
        .sort((a, b) => {
          if (a.score !== undefined && b.score !== undefined) {
            if (a.score !== b.score) {
              return a.score - b.score;
            }
          } else if (a.score !== undefined) {
            return -1;
          } else if (b.score !== undefined) {
            return 1;
          }
          if (a.distance !== undefined && b.distance !== undefined) {
            if (a.distance !== b.distance) {
              return a.distance - b.distance;
            }
          } else if (a.distance !== undefined) {
            return -1;
          } else if (b.distance !== undefined) {
            return 1;
          }
          return a.titre.localeCompare(b.titre);
        })
        .slice(start, end)
        .map((formation) => formation.id);

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
