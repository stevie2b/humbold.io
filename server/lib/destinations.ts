import { db } from "@db";
import { destinations, type InsertDestination } from "@db/schema";
import { eq, or, ilike, sql } from "drizzle-orm";
import { MAJOR_CITIES } from "./cities-data";

let citiesInitialized = false;

async function initializeCities() {
  if (citiesInitialized) return;

  try {
    // Check if we already have cities in the database
    const existingCities = await db.query.destinations.findMany({
      limit: 1
    });

    if (existingCities.length === 0) {
      console.log("Initializing cities database...");
      await db.insert(destinations).values(MAJOR_CITIES.map(city => ({
        ...city,
        latitude: city.latitude.toString(),
        longitude: city.longitude.toString(),
      })));
    }

    citiesInitialized = true;
  } catch (error) {
    console.error("Failed to initialize cities:", error);
  }
}

export async function searchDestinations(query: string) {
  try {
    await initializeCities();

    // Do a single query that handles both country and city/region matches
    const results = await db.query.destinations.findMany({
      where: (destinations) => 
        or(
          ilike(destinations.name, `%${query}%`),
          ilike(destinations.cityName, `%${query}%`),
          ilike(destinations.countryName, `%${query}%`)
        ),
      columns: {
        id: true,
        name: true,
        countryName: true,
        description: true,
        seasonalRatings: true,
      },
      orderBy: [
        // Order by exact matches first, then partial matches
        sql`
          CASE 
            WHEN name ILIKE ${query} THEN 1
            WHEN country_name ILIKE ${query} AND name = country_name THEN 1
            WHEN city_name ILIKE ${query} THEN 2
            WHEN country_name ILIKE ${query} THEN 3
            ELSE 4
          END
        `,
        destinations.name
      ],
    });

    // Remove duplicates by using a Map with name as key
    const uniqueResults = Array.from(
      new Map(results.map(dest => [dest.name, dest])).values()
    );

    return uniqueResults.slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error("Error searching destinations:", error);
    throw error;
  }
}

interface OpenTripMapPlace {
  xid: string;
  name: string;
  rate: number;
  kinds: string;
  point: {
    lat: number;
    lon: number;
  };
}

interface OpenTripMapPlaceDetails {
  xid: string;
  name: string;
  address: {
    country_code: string;
  };
  wikipedia_extracts?: {
    text: string;
  };
  point: {
    lat: number;
    lon: number;
  };
  preview?: {
    source: string;
  };
}

function calculateSeasonalRating(place: OpenTripMapPlaceDetails): number {
  // Placeholder implementation - would be replaced with actual seasonal rating logic
  return Math.floor(Math.random() * 5) + 1;
}