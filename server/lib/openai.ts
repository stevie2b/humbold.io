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

export async function generateTravelPlan(preferences: {
  season: string;
  specificDate?: Date;
  destination: string;
  travelerType: string;
  activities: string[];
}): Promise<TravelPlan> {
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
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content) as TravelPlan;
}