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
  // Ensure we use the exact number of days specified
  const numDays = Math.max(1, Math.min(30, preferences.numberOfDays));
  console.log(`Generating basic itinerary for ${numDays} days`, preferences);

  // Generate activities based on preferences
  const defaultActivities = preferences.activities.filter(a => a !== 'custom');
  const activityTypes = [
    ...defaultActivities,
    'Local Exploration',
    'Cultural Visit',
    'Relaxation Time',
    'Local Cuisine'
  ];

  // Generate a basic itinerary for the specified number of days
  const itinerary = Array.from({ length: numDays }, (_, i) => ({
    day: i + 1,
    accommodation: {
      title: i === 0 ? "Hotel Check-in" : "Hotel Stay",
      details: `Comfortable accommodation in ${preferences.destination}`
    },
    transportation: {
      title: i === 0 ? "Arrival" : i === numDays - 1 ? "Departure" : "Local Transport",
      details: i === 0 ? "Airport Transfer" : i === numDays - 1 ? "Airport Transfer" : "Local transit and walking"
    },
    activities: [
      {
        time: "09:00",
        title: i === 0 
          ? "Welcome Orientation" 
          : `${activityTypes[i % activityTypes.length]} Activity`
      },
      {
        time: "13:00",
        title: "Lunch Break and Rest"
      },
      {
        time: "15:00",
        title: i === numDays - 1 
          ? "Prepare for Departure" 
          : `${activityTypes[(i + 2) % activityTypes.length]} Experience`
      }
    ]
  }));

  // Debug log the generated itinerary
  console.log("Generated itinerary length:", itinerary.length);

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

      IMPORTANT: The itinerary MUST be exactly ${preferences.numberOfDays} days long, no more and no less.

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

      // If we have too few days, add more
      while (result.itinerary.length < preferences.numberOfDays) {
        const day = result.itinerary.length + 1;
        result.itinerary.push({
          day,
          accommodation: {
            title: "Hotel Stay",
            details: `Continued stay in ${preferences.destination}`
          },
          transportation: {
            title: "Local Transport",
            details: "Local transit and walking"
          },
          activities: [
            {
              time: "10:00",
              title: `Day ${day} Exploration`
            },
            {
              time: "14:00",
              title: "Local Cuisine Experience"
            },
            {
              time: "16:00",
              title: "Cultural Activities"
            }
          ]
        });
      }

      // If we have too many days, truncate
      if (result.itinerary.length > preferences.numberOfDays) {
        result.itinerary = result.itinerary.slice(0, preferences.numberOfDays);
      }
    }

    return result;
  } catch (error: any) {
    console.error("Error generating travel plan:", error);
    console.log("Using fallback due to OpenAI error");
    return generateBasicItinerary(preferences);
  }
}