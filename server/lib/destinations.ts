import { db } from "@db";
import { destinations, type InsertDestination } from "@db/schema";
import { eq, like } from "drizzle-orm";

const OPENTRIPMAP_API_KEY = process.env.OPENTRIPMAP_API_KEY;
const BASE_URL = "https://api.opentripmap.com/0.1";

// Default coordinates for a central point (roughly center of world map)
const DEFAULT_LAT = 0;
const DEFAULT_LON = 0;
const DEFAULT_RADIUS = 20000000; // 20000km in meters, basically worldwide

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

    if (!OPENTRIPMAP_API_KEY) {
      throw new Error("OpenTripMap API key is not configured");
    }

    // If not in database, fetch from OpenTripMap
    const searchUrl = `${BASE_URL}/en/places/radius?radius=${DEFAULT_RADIUS}&lon=${DEFAULT_LON}&lat=${DEFAULT_LAT}&name=${encodeURIComponent(query)}&format=json&apikey=${OPENTRIPMAP_API_KEY}`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenTripMap API error:", response.status, errorText);
      throw new Error(`Failed to search destinations: ${errorText}`);
    }

    const places: OpenTripMapPlace[] = await response.json();
    console.log("Found places:", places.length);

    if (places.length === 0) {
      return [];
    }

    // Take only top 5 results to avoid too many API calls
    const topPlaces = places.slice(0, 5);

    // Fetch details for each place
    const detailedPlaces = await Promise.allSettled(
      topPlaces.map(async (place) => {
        const detailsUrl = `${BASE_URL}/en/places/xid/${place.xid}?apikey=${OPENTRIPMAP_API_KEY}`;
        const response = await fetch(detailsUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch details for ${place.name}`);
        }

        return response.json();
      })
    );

    // Filter successful results and transform to our schema
    const validPlaces = detailedPlaces
      .filter((result): result is PromiseFulfilledResult<OpenTripMapPlaceDetails> =>
        result.status === "fulfilled"
      )
      .map(result => result.value);

    if (validPlaces.length === 0) {
      return [];
    }

    // Transform to our database schema
    const destinationsToInsert: InsertDestination[] = validPlaces.map((place) => ({
      name: place.name,
      countryCode: place.address.country_code,
      description: place.wikipedia_extracts?.text || "",
      latitude: String(place.point?.lat || 0),
      longitude: String(place.point?.lon || 0),
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
  // Placeholder implementation - would be replaced with actual seasonal rating logic
  return Math.floor(Math.random() * 5) + 1;
}