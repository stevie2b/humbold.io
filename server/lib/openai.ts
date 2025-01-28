import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TravelPlan {
  itinerary: Array<{
    day: number;
    accommodation: {
      title: string;
      details: string;
    };
    transportation: {
      title: string;
      details: string;
    };
    activities: Array<{
      time: string;
      title: string;
    }>;
  }>;
  recommendations: string[];
}

// Fallback function to generate a basic itinerary when OpenAI is unavailable
function generateBasicItinerary(preferences: {
  season: string;
  specificDate?: Date;
  destination: string;
  travelerType: string;
  activities: string[];
  numberOfDays: number;
}): TravelPlan {
  const startDate = preferences.specificDate || new Date();
  const numDays = preferences.numberOfDays || 3;

  // Generate a basic itinerary for the specified number of days
  const itinerary = Array.from({ length: numDays }, (_, i) => ({
    day: i + 1,
    accommodation: {
      title: "Hotel Check-in/Stay",
      details: `Comfortable accommodation in ${preferences.destination}`
    },
    transportation: {
      title: i === 0 ? "Arrival" : i === numDays - 1 ? "Departure" : "Local Transport",
      details: i === 0 ? "Airport Transfer" : i === numDays - 1 ? "Airport Transfer" : "Walking and local transit"
    },
    activities: [
      {
        time: "10:00",
        title: i === 0 ? "City Orientation" : `${preferences.activities[0] || 'Local'} Experience`
      },
      {
        time: "14:00",
        title: "Lunch and Rest"
      },
      {
        time: "16:00",
        title: i === numDays - 1 ? "Prepare for Departure" : "Explore Local Attractions"
      }
    ]
  }));

  return {
    itinerary,
    recommendations: [
      `Best time to visit ${preferences.destination} is during ${preferences.season}`,
      `Perfect for ${preferences.travelerType} travelers`,
      `Don't miss the local attractions and ${preferences.activities.join(', ')}`
    ]
  };
}

export async function generateTravelPlan(preferences: {
  season: string;
  specificDate?: Date;
  destination: string;
  travelerType: string;
  activities: string[];
  numberOfDays: number;
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

      Please provide the response in this JSON format:
      {
        "itinerary": [
          {
            "day": 1,
            "accommodation": {
              "title": "Hotel name or type",
              "details": "Check-in details and location"
            },
            "transportation": {
              "title": "Transportation type",
              "details": "Transportation details"
            },
            "activities": [
              {
                "time": "HH:MM",
                "title": "Activity description"
              }
            ]
          }
        ],
        "recommendations": ["Additional recommendation 1", "Additional recommendation 2"]
      }`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    if (!response.choices[0].message.content) {
      console.log("No OpenAI response content, using fallback");
      return generateBasicItinerary(preferences);
    }

    return JSON.parse(response.choices[0].message.content) as TravelPlan;
  } catch (error: any) {
    console.error("Error generating travel plan:", error);
    console.log("Using fallback due to OpenAI error");
    return generateBasicItinerary(preferences);
  }
}