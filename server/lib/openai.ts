import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TravelPlan {
  itinerary: Array<{
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location?: string;
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
}): TravelPlan {
  const startDate = preferences.specificDate || new Date();

  // Generate a basic 3-day itinerary
  const itinerary = [
    {
      title: "Arrival and City Exploration",
      description: `Start your journey in ${preferences.destination} with a relaxed exploration of the city center.`,
      startTime: new Date(startDate).toISOString(),
      endTime: new Date(startDate.setHours(startDate.getHours() + 8)).toISOString(),
      location: preferences.destination
    },
    {
      title: `${preferences.activities[0] || 'Local'} Experience`,
      description: `Immerse yourself in ${preferences.destination}'s culture and attractions.`,
      startTime: new Date(startDate.setDate(startDate.getDate() + 1)).toISOString(),
      endTime: new Date(startDate.setHours(startDate.getHours() + 8)).toISOString(),
      location: preferences.destination
    },
    {
      title: "Departure Day Activities",
      description: "Final day to explore and prepare for departure.",
      startTime: new Date(startDate.setDate(startDate.getDate() + 1)).toISOString(),
      endTime: new Date(startDate.setHours(startDate.getHours() + 8)).toISOString(),
      location: preferences.destination
    }
  ];

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
}): Promise<TravelPlan> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log("OpenAI API key not found, using fallback");
      return generateBasicItinerary(preferences);
    }

    const prompt = `Generate a detailed travel itinerary based on these preferences:
      Season: ${preferences.season}
      ${preferences.specificDate ? `Specific Date: ${preferences.specificDate}` : ''}
      Destination: ${preferences.destination}
      Traveler Type: ${preferences.travelerType}
      Activities: ${preferences.activities.join(', ')}

      Please provide the response in this JSON format:
      {
        "itinerary": [
          {
            "title": "Activity title",
            "description": "Detailed description",
            "startTime": "ISO date string",
            "endTime": "ISO date string",
            "location": "Location name"
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

    // If we hit API limits or other OpenAI errors, use the fallback
    console.log("Using fallback due to OpenAI error");
    return generateBasicItinerary(preferences);
  }
}