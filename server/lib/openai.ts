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
      throw new Error("OpenAI API key is not configured");
    }

    console.log("Generating travel plan with preferences:", preferences);

    const prompt = `Generate a detailed ${preferences.numberOfDays}-day travel itinerary for ${preferences.destination}.

    Travel Details:
    - Number of Days: ${preferences.numberOfDays}
    - Traveler Type: ${preferences.travelerType}
    - Activities: ${preferences.activities.join(', ')}
    - Season: ${preferences.season}
    ${preferences.specificDate ? `- Specific Date: ${preferences.specificDate}` : ''}
    ${preferences.coordinates ? `- Location: ${JSON.stringify(preferences.coordinates)}` : ''}

    Requirements:
    1. Each day must have:
       - Accommodation details (if changing locations)
       - Transportation information (if traveling between locations)
       - 2-4 activities with specific times and durations
    2. Activities should match the selected preferences (${preferences.activities.join(', ')})
    3. Include coordinates for all locations
    4. Add price ranges ($ to $$$$$) for accommodations
    5. Include detailed descriptions for activities
    6. Consider ${preferences.travelerType} specific needs
    7. Account for seasonal activities (${preferences.season})

    Provide the response in this exact JSON format:
    {
      "itinerary": [
        {
          "day": 1,
          "accommodation": {
            "title": "Hotel name",
            "details": "Description",
            "coordinates": {"lat": number, "lng": number},
            "price_range": "$$",
            "booking_url": "URL"
          },
          "transportation": {
            "title": "Transport mode",
            "details": "Details",
            "route": {
              "from": {"lat": number, "lng": number},
              "to": {"lat": number, "lng": number}
            }
          },
          "activities": [
            {
              "time": "09:00",
              "duration": "2:00",
              "title": "Activity name",
              "location": {"lat": number, "lng": number},
              "category": "Type",
              "description": "Details"
            }
          ]
        }
      ],
      "recommendations": ["Tip 1", "Tip 2"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    if (!response.choices[0].message.content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(response.choices[0].message.content) as TravelPlan;

    // Validate and fix the number of days if needed
    if (result.itinerary.length !== preferences.numberOfDays) {
      console.log(`Adjusting itinerary length from ${result.itinerary.length} to ${preferences.numberOfDays} days`);

      while (result.itinerary.length < preferences.numberOfDays) {
        const lastDay = result.itinerary[result.itinerary.length - 1];
        result.itinerary.push({
          day: result.itinerary.length + 1,
          accommodation: lastDay.accommodation,
          transportation: {
            title: "Local Transport",
            details: "Local transit options and walking",
            route: preferences.coordinates ? {
              from: preferences.coordinates,
              to: preferences.coordinates
            } : undefined
          },
          activities: [
            {
              time: "10:00",
              duration: "2:00",
              title: `Local Exploration`,
              location: preferences.coordinates,
              category: preferences.activities[0],
              description: `Explore local attractions and activities in ${preferences.destination}`
            }
          ]
        });
      }

      if (result.itinerary.length > preferences.numberOfDays) {
        result.itinerary = result.itinerary.slice(0, preferences.numberOfDays);
      }
    }

    return result;
  } catch (error: any) {
    console.error("Error generating travel plan:", error);
    throw error;
  }
}

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