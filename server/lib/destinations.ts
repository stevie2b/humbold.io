import { db } from "@db";
import { destinations, type InsertDestination } from "@db/schema";
import { eq, or, ilike } from "drizzle-orm";
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

    // First, try to find exact country matches (where name equals country name)
    const countryResults = await db.query.destinations.findMany({
      where: (destinations) => 
        eq(destinations.name, destinations.countryName) &&
        ilike(destinations.countryName, `%${query}%`),
      columns: {
        id: true,
        name: true,
        countryName: true,
        description: true,
      },
    });

    // If we found exact country matches, return those first
    if (countryResults.length > 0) {
      return countryResults;
    }

    // Otherwise, perform the regular search
    const results = await db.query.destinations.findMany({
      where: (destinations, { or, ilike }) => or(
        ilike(destinations.name, `%${query}%`),
        ilike(destinations.cityName, `%${query}%`),
        ilike(destinations.countryName, `%${query}%`)
      ),
      columns: {
        id: true,
        name: true,
        countryName: true,
        description: true,
      },
      limit: 10,
    });

    return results;
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