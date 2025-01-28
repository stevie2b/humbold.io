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
      console.log("Cities initialized successfully");
    }

    citiesInitialized = true;
  } catch (error) {
    console.error("Failed to initialize cities:", error);
    // Return a default set of cities if database fails
    return MAJOR_CITIES.slice(0, 10);
  }
}

export async function searchDestinations(query: string) {
  try {
    await initializeCities();

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
        imageUrl: true,
      },
      orderBy: [
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

    // Remove duplicates and ensure proper format
    const uniqueResults = Array.from(
      new Map(results.map(dest => [dest.name, {
        ...dest,
        seasonalRatings: dest.seasonalRatings || {
          spring: 0,
          summer: 0,
          autumn: 0,
          winter: 0
        }
      }])).values()
    );

    return uniqueResults.slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error("Error searching destinations:", error);
    // Return a subset of default cities that match the query
    return MAJOR_CITIES.filter(city => 
      city.name.toLowerCase().includes(query.toLowerCase()) ||
      city.countryName.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10).map(city => ({
      id: city.id,
      name: city.name,
      countryName: city.countryName,
      description: city.description,
      seasonalRatings: city.seasonalRatings,
      imageUrl: city.imageUrl
    }));
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