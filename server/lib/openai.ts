import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TravelPlan {
  itinerary: Array<{
    day: number;
    accommodation: {
      title: string;
      details: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
      price_range?: string;
      booking_url?: string;
    };
    transportation: {
      title: string;
      details: string;
      route?: {
        from: {
          lat: number;
          lng: number;
        };
        to: {
          lat: number;
          lng: number;
        };
      };
    };
    activities: Array<{
      time: string;
      duration: string;
      title: string;
      location?: {
        lat: number;
        lng: number;
      };
      category?: string;
      description?: string;
    }>;
  }>;
  recommendations: string[];
}

export async function generateTravelPlan(preferences: {
  season: string;
  specificDate?: Date;
  destination: string;
  travelerType: string;
  activities: string[];
  numberOfDays: number;
  coordinates?: { lat: number; lng: number };
}): Promise<TravelPlan> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log("OpenAI API key not found, using fallback");
      return generateBasicItinerary(preferences);
    }

    const prompt = `Generate a detailed ${preferences.numberOfDays}-day travel itinerary based on these preferences:
      Season: ${preferences.season}
      ${preferences.specificDate ? `Specific Date: ${preferences.specificDate}` : ''}
      Destination: ${preferences.destination}
      Traveler Type: ${preferences.travelerType}
      Activities: ${preferences.activities.join(', ')}
      Number of Days: ${preferences.numberOfDays}
      ${preferences.coordinates ? `Location Coordinates: ${JSON.stringify(preferences.coordinates)}` : ''}

      IMPORTANT REQUIREMENTS:
      1. The itinerary MUST be exactly ${preferences.numberOfDays} days long
      2. Each activity MUST have a start time and duration
      3. Include realistic coordinate data for mapping
      4. Add booking URLs for accommodations where applicable
      5. Categorize activities for better organization
      6. Include price ranges for accommodations ($ to $$$$$)
      7. Add detailed descriptions for activities
      8. Consider local transportation options and walking distances
      9. Account for opening hours and seasonal availability
      10. Include local cultural experiences and hidden gems

      Please provide the response in this JSON format:
      {
        "itinerary": [
          {
            "day": 1,
            "accommodation": {
              "title": "Hotel name",
              "details": "Details about the accommodation",
              "coordinates": {"lat": number, "lng": number},
              "price_range": "$$",
              "booking_url": "URL"
            },
            "transportation": {
              "title": "Transport type",
              "details": "Transport details",
              "route": {
                "from": {"lat": number, "lng": number},
                "to": {"lat": number, "lng": number}
              }
            },
            "activities": [
              {
                "time": "HH:MM",
                "duration": "HH:MM",
                "title": "Activity name",
                "location": {"lat": number, "lng": number},
                "category": "Activity type",
                "description": "Detailed description"
              }
            ]
          }
        ],
        "recommendations": ["Recommendation 1", "Recommendation 2"]
      }`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4", // Using the correct model name
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      if (!response.choices[0].message.content) {
        console.log("No OpenAI response content, using fallback");
        return generateBasicItinerary(preferences);
      }

      const result = JSON.parse(response.choices[0].message.content) as TravelPlan;

      // Ensure we have the correct number of days
      if (result.itinerary.length !== preferences.numberOfDays) {
        console.log(`Incorrect number of days in response (${result.itinerary.length}), adjusting to ${preferences.numberOfDays}`);

        while (result.itinerary.length < preferences.numberOfDays) {
          const lastDay = result.itinerary[result.itinerary.length - 1];
          const day = result.itinerary.length + 1;
          result.itinerary.push({
            day,
            accommodation: lastDay.accommodation,
            transportation: {
              title: "Local Transport",
              details: "Local transit and walking",
              route: preferences.coordinates ? {
                from: preferences.coordinates,
                to: preferences.coordinates
              } : undefined
            },
            activities: [
              {
                time: "10:00",
                duration: "2:00",
                title: `Day ${day} Exploration`,
                location: preferences.coordinates,
                category: "Exploration",
                description: `Discover more hidden gems of ${preferences.destination}`
              },
              {
                time: "14:00",
                duration: "2:00",
                title: "Local Experience",
                category: "Culture",
                description: "Immerse yourself in local culture and traditions"
              },
              {
                time: "16:00",
                duration: "2:00",
                title: "Evening Activities",
                location: preferences.coordinates,
                category: "Entertainment",
                description: "Enjoy local entertainment and nightlife"
              }
            ]
          });
        }

        if (result.itinerary.length > preferences.numberOfDays) {
          result.itinerary = result.itinerary.slice(0, preferences.numberOfDays);
        }
      }

      return result;
    } catch (apiError: any) {
      console.error("OpenAI API error:", apiError);
      // If there's an API error, fall back to basic itinerary
      return generateBasicItinerary(preferences);
    }
  } catch (error: any) {
    console.error("Error generating travel plan:", error);
    console.log("Using fallback due to error");
    return generateBasicItinerary(preferences);
  }
}

// Helper function to generate a basic itinerary when OpenAI is not available
function generateBasicItinerary(preferences: {
  season: string;
  specificDate?: Date;
  destination: string;
  travelerType: string;
  activities: string[];
  numberOfDays: number;
  coordinates?: { lat: number; lng: number };
}): TravelPlan {
  const numDays = Math.max(1, Math.min(30, preferences.numberOfDays));
  console.log(`Generating basic itinerary for ${numDays} days`, preferences);

  const defaultActivities = preferences.activities.filter(a => a !== 'custom');
  const activityTypes = [
    ...defaultActivities,
    'Local Exploration',
    'Cultural Visit',
    'Relaxation Time',
    'Local Cuisine'
  ];

  const itinerary = Array.from({ length: numDays }, (_, i) => ({
    day: i + 1,
    accommodation: {
      title: i === 0 ? "Hotel Check-in" : "Hotel Stay",
      details: `Comfortable accommodation in ${preferences.destination}`,
      coordinates: preferences.coordinates,
      price_range: "$$",
      booking_url: "https://www.booking.com"
    },
    transportation: {
      title: i === 0 ? "Arrival" : i === numDays - 1 ? "Departure" : "Local Transport",
      details: i === 0 ? "Airport Transfer" : i === numDays - 1 ? "Airport Transfer" : "Local transit and walking",
      route: preferences.coordinates ? {
        from: preferences.coordinates,
        to: preferences.coordinates
      } : undefined
    },
    activities: [
      {
        time: "09:00",
        duration: "3:00",
        title: i === 0
          ? "Welcome Orientation"
          : `${activityTypes[i % activityTypes.length]} Activity`,
        location: preferences.coordinates,
        category: activityTypes[i % activityTypes.length],
        description: `Explore the best of ${preferences.destination}`
      },
      {
        time: "13:00",
        duration: "1:00",
        title: "Lunch Break and Rest",
        category: "Dining",
        description: "Enjoy local cuisine"
      },
      {
        time: "15:00",
        duration: "3:00",
        title: i === numDays - 1
          ? "Prepare for Departure"
          : `${activityTypes[(i + 2) % activityTypes.length]} Experience`,
        location: preferences.coordinates,
        category: activityTypes[(i + 2) % activityTypes.length],
        description: `Experience ${preferences.destination} like a local`
      }
    ]
  }));

  return {
    itinerary,
    recommendations: [
      `Best time to visit ${preferences.destination} is during ${preferences.season}`,
      `This itinerary is designed for ${preferences.travelerType} travelers`,
      `Don't miss the local attractions and activities: ${preferences.activities.join(', ')}`,
      `Pack appropriate clothing for ${preferences.season} weather`,
      `Consider local transportation options for easy access to attractions`
    ]
  };
}