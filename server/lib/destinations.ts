import { db } from "@db";
import { destinations, type InsertDestination } from "@db/schema";
import { eq, like } from "drizzle-orm";

const OPENTRIPMAP_API_KEY = process.env.OPENTRIPMAP_API_KEY;
const BASE_URL = "https://api.opentripmap.com/0.1";

interface OpenTripMapPlace {
  xid: string;
  name: string;
  country: string;
  point: {
    lat: number;
    lon: number;
  };
  preview?: {
    source: string;
  };
}

interface OpenTripMapPlaceDetails {
  xid: string;
  name: string;
  address: {
    country_code: string;
  };
  preview?: {
    source: string;
  };
  wikipedia_extracts?: {
    text: string;
  };
  point: {
    lat: number;
    lon: number;
  };
}

export async function searchDestinations(query: string) {
  try {
    console.log("Searching for destinations with query:", query);

    // First check our database
    const cachedResults = await db.query.destinations.findMany({
      where: (destinations, { like }) =>
        like(destinations.name, `%${query}%`),
      limit: 10,
    });

    if (cachedResults.length > 0) {
      console.log("Found cached results:", cachedResults.length);
      return cachedResults;
    }

    // If not in database, fetch from OpenTripMap
    const response = await fetch(
      `${BASE_URL}/en/places/autosuggest?name=${encodeURIComponent(query)}&apikey=${OPENTRIPMAP_API_KEY}`
    );

    if (!response.ok) {
      console.error("OpenTripMap API error:", response.status, await response.text());
      throw new Error("Failed to fetch destinations");
    }

    const places: OpenTripMapPlace[] = await response.json();
    console.log("Fetched places from API:", places.length);

    if (!places.length) {
      return [];
    }

    // Fetch detailed information for each place
    const detailedPlaces = await Promise.all(
      places.slice(0, 5).map(async (place) => {
        const detailsResponse = await fetch(
          `${BASE_URL}/en/places/xid/${place.xid}?apikey=${OPENTRIPMAP_API_KEY}`
        );
        return detailsResponse.json() as Promise<OpenTripMapPlaceDetails>;
      })
    );

    // Transform and store in our database
    const destinationsToInsert: InsertDestination[] = detailedPlaces.map((place) => ({
      name: place.name,
      countryCode: place.address.country_code,
      description: place.wikipedia_extracts?.text || "",
      latitude: place.point.lat.toString(),
      longitude: place.point.lon.toString(),
      imageUrl: place.preview?.source || "",
      seasonalRatings: {
        spring: calculateSeasonalRating(place),
        summer: calculateSeasonalRating(place),
        autumn: calculateSeasonalRating(place),
        winter: calculateSeasonalRating(place),
      },
    }));

    // Insert into database
    if (destinationsToInsert.length > 0) {
      console.log("Inserting new destinations:", destinationsToInsert.length);
      await db.insert(destinations).values(destinationsToInsert);
    }

    return destinationsToInsert;
  } catch (error) {
    console.error("Error searching destinations:", error);
    throw error;
  }
}

function calculateSeasonalRating(place: OpenTripMapPlaceDetails): number {
  // This is a simplified rating calculation
  // In a real application, you would consider factors like:
  // - Historical weather data
  // - Tourist season information
  // - Local events and festivals
  // - Current season's typical activities
  return Math.random() * 5; // Placeholder implementation
}