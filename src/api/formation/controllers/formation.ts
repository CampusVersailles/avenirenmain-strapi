/**
 * formation controller
 */

import { Data, factories } from "@strapi/strapi";
import MiniSearch from "minisearch";

const DEFAULT_RADIUS_KM = 20;
const TARGET_UID = "api::formation.formation";

type Formation = Data.ContentType<typeof TARGET_UID> & {
  score?: number;
  distance?: number;
};

let formationCache: {
  lightFormations: Formation[];
  miniSearch: MiniSearch<Formation> | null;
  timestamp: number;
} = {
  lightFormations: [],
  miniSearch: null,
  timestamp: 0,
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const isCacheValid = () => {
  const now = Date.now();
  const cacheAge = now - formationCache.timestamp;
  return cacheAge < ONE_DAY_MS && formationCache.lightFormations.length > 0;
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

const removeAccents = (term: string) =>
  term
    .normalize("NFD")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/[\u0300-\u036f]/g, "");

export default factories.createCoreController(
  "api::formation.formation",
  ({ strapi }) => ({
    async find(ctx) {
      const {
        latitude,
        longitude,
        radius,
        fuzzy,
        withCoordinates,
        ...otherQuery
      } = ctx.query;

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
      const filterFiliere = (baseFilters as any).filieres?.documentId?.$eq as
        | string
        | undefined;
      const filterFormationNiveau = (baseFilters as any).formationNiveau
        ?.documentId?.$eq as string | undefined;
      const filterAlternance = (baseFilters as any).alternance?.$eq as
        | string
        | boolean
        | undefined;
      const filterDuree = (baseFilters as any).formationDuree?.documentId
        ?.$eq as string | undefined;
      const filterRomeCodeMetier = (baseFilters as any).romeCodeMetiers?.code
        ?.$eq as string | undefined;

      let filteredFormations: Formation[];

      if (isCacheValid()) {
        filteredFormations = formationCache.lightFormations;
      } else {
        filteredFormations = (await strapi
          .documents("api::formation.formation")
          .findMany({
            filters: baseFilters,
            fields: ["documentId", "id", "titre", "alternance"],
            populate: {
              adresse: {
                fields: ["latitude", "longitude"],
              },
              formationNiveau: { fields: ["documentId"] },
              formationDuree: { fields: ["documentId"] },
              filieres: { fields: ["documentId"] },
              romeCodeMetiers: { fields: ["code"] },
            },
          })) as Formation[];

        formationCache.lightFormations = filteredFormations;
        formationCache.timestamp = Date.now();

        formationCache.miniSearch = new MiniSearch({
          fields: ["titre"],
          idField: "id",
          processTerm: (term, _fieldName) => removeAccents(term.toLowerCase()),
          searchOptions: {
            fuzzy: 0.3,
            prefix: true,
          },
        });

        formationCache.miniSearch.addAll(filteredFormations);
      }

      if (fuzzy) {
        filteredFormations = formationCache.miniSearch
          .search(fuzzy as string)
          .map((result) => ({
            ...formationCache.lightFormations.find((f) => f.id === result.id),
            score: result.score,
          }));
      }

      if (
        filterFiliere ||
        filterFormationNiveau ||
        filterAlternance !== undefined ||
        filterDuree ||
        filterRomeCodeMetier
      ) {
        filteredFormations = filteredFormations.filter((f) => {
          if (
            filterFiliere &&
            !f.filieres.find((filiere) => filiere.documentId === filterFiliere)
          ) {
            return false;
          }
          if (
            filterFormationNiveau &&
            f.formationNiveau?.documentId !== filterFormationNiveau
          ) {
            return false;
          }
          if (filterAlternance !== undefined) {
            const expected =
              typeof filterAlternance === "string"
                ? filterAlternance.toLowerCase() === "true"
                : !!filterAlternance;
            if (f.alternance !== expected) {
              return false;
            }
          }
          if (filterDuree && f.formationDuree?.documentId !== filterDuree) {
            return false;
          }
          if (
            filterRomeCodeMetier &&
            !f.romeCodeMetiers.find(
              (rome) => rome.code === filterRomeCodeMetier
            )
          ) {
            return false;
          }
          return true;
        });
      }

      if (lat !== null && lng !== null) {
        filteredFormations = filteredFormations
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
              return b.score - a.score;
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
          return 0;
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
        data: {
          formations: paginatedIds.map((id) =>
            fullFormations.find((formation) => formation.id === id)
          ),
          coordinates: withCoordinates
            ? filteredFormations.map((formation) => ({
                documentId: formation.documentId,
                latitude: formation.adresse.latitude,
                longitude: formation.adresse.longitude,
              }))
            : [],
        },
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
