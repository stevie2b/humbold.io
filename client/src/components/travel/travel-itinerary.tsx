import { useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Map, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import TravelDayCard from "./travel-day-card";
import { JourneyMap } from "./journey-map";
import { generateICS } from "@/lib/ics-generator";
import { useToast } from "@/hooks/use-toast";

interface ActivityItem {
  time: string;
  duration?: string;
  title: string;
  location?: {
    lat: number;
    lng: number;
  };
  category?: string;
  description?: string;
}

interface AccommodationDetails {
  title: string;
  details: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  price_range?: string;
  booking_url?: string;
  checkInTime?: string;
  checkOutTime?: string;
  startDay?: number;
  endDay?: number;
}

interface TransportationDetails {
  title: string;
  details: string;
  type?: 'continuous' | 'scheduled';
  transportMode?: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
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
}

interface DayPlan {
  day: number;
  accommodation?: AccommodationDetails;
  transportation?: TransportationDetails;
  activities: ActivityItem[];
}

export default function TravelItinerary({ itinerary }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps"
  });

  const { toast } = useToast();
  const [currentItinerary, setCurrentItinerary] = useState<DayPlan[]>(itinerary ?? []);
  const startDate = new Date();
  const [viewMode, setViewMode] = useState("cards");

  // Generate recommended activities for each day
  const generateRecommendations = (day: DayPlan): ActivityItem[] => {
    // Find the last scheduled activity time
    const lastActivityTime = day.activities.length > 0 
      ? day.activities.reduce((latest, activity) => {
          const [hours, minutes] = activity.time.split(':').map(Number);
          const [durationHours = 0, durationMinutes = 0] = (activity.duration || '00:00').split(':').map(Number);
          const endTime = hours * 60 + minutes + durationHours * 60 + durationMinutes;
          return Math.max(latest, endTime);
        }, 0)
      : 14 * 60; // Default to 2 PM if no activities

    // Convert minutes back to HH:mm format
    const baseHours = Math.floor(lastActivityTime / 60);
    const baseMinutes = lastActivityTime % 60;
    const baseTime = `${baseHours.toString().padStart(2, '0')}:${baseMinutes.toString().padStart(2, '0')}`;

    return [
      {
        time: baseTime,
        duration: "02:00",
        title: `Local Cultural Experience in ${day.accommodation?.title?.split(',')[0] || 'the Area'}`,
        category: "culture",
        description: "Immerse yourself in local traditions and customs"
      },
      {
        time: baseTime,
        duration: "02:00",
        title: `Hidden Gems Walking Tour`,
        category: "exploration",
        description: "Discover lesser-known spots and local favorites"
      },
      {
        time: baseTime,
        duration: "02:00",
        title: `Local Food Experience`,
        category: "culinary",
        description: "Taste authentic local cuisine and specialties"
      },
      {
        time: baseTime,
        duration: "02:00",
        title: "Your Own Idea",
        category: "custom",
        description: "Add your personal touch to the itinerary"
      }
    ];
  };

  // Edit handlers
  const handleEditAccommodation = (dayIndex: number, updatedAccommodation: AccommodationDetails) => {
    setCurrentItinerary(prev => {
      const newItinerary = [...prev];
      newItinerary[dayIndex] = {
        ...newItinerary[dayIndex],
        accommodation: updatedAccommodation
      };
      return newItinerary;
    });
    toast({ title: "Success", description: "Accommodation updated successfully" });
  };

  const handleEditTransportation = (dayIndex: number, updatedTransportation: TransportationDetails) => {
    setCurrentItinerary(prev => {
      const newItinerary = [...prev];
      newItinerary[dayIndex] = {
        ...newItinerary[dayIndex],
        transportation: updatedTransportation
      };
      return newItinerary;
    });
    toast({ title: "Success", description: "Transportation updated successfully" });
  };

  const handleEditActivity = (dayIndex: number, activityIndex: number, updatedActivity: ActivityItem) => {
    setCurrentItinerary(prev => {
      const newItinerary = [...prev];
      newItinerary[dayIndex].activities[activityIndex] = updatedActivity;
      return newItinerary;
    });
    toast({ title: "Success", description: "Activity updated successfully" });
  };

  const handleRemoveActivity = (dayIndex: number, activityIndex: number) => {
    setCurrentItinerary(prev => {
      const newItinerary = [...prev];
      newItinerary[dayIndex].activities = newItinerary[dayIndex].activities.filter((_, i) => i !== activityIndex);
      return newItinerary;
    });
    toast({ title: "Success", description: "Activity removed successfully" });
  };

  const handleAddActivity = (dayIndex: number, newActivity: ActivityItem) => {
    setCurrentItinerary(prev => {
      const newItinerary = [...prev];
      // Check if activity already exists to prevent duplicates
      const exists = newItinerary[dayIndex].activities.some(
        activity => activity.title === newActivity.title
      );

      if (!exists) {
        newItinerary[dayIndex].activities.push(newActivity);
        toast({ title: "Success", description: "Activity added successfully" });
      } else {
        toast({ 
          title: "Info", 
          description: "This activity is already in your itinerary",
          variant: "default"
        });
      }
      return newItinerary;
    });
  };

  // Extract all locations for the map
  const mapLocations = currentItinerary.flatMap(day => {
    const locations = [];

    if (day.accommodation?.coordinates) {
      locations.push({
        title: day.accommodation.title,
        coordinates: day.accommodation.coordinates,
        type: 'accommodation',
        day: day.day
      });
    }

    if (day.transportation?.route) {
      locations.push({
        title: `${day.transportation.title} (Departure)`,
        coordinates: day.transportation.route.from,
        type: 'transportation',
        day: day.day
      });
      locations.push({
        title: `${day.transportation.title} (Arrival)`,
        coordinates: day.transportation.route.to,
        type: 'transportation',
        day: day.day
      });
    }

    day.activities.forEach(activity => {
      if (activity.location) {
        locations.push({
          title: activity.title,
          coordinates: activity.location,
          type: 'activity',
          day: day.day
        });
      }
    });

    return locations;
  });

  if (!currentItinerary?.length) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button variant={viewMode === "cards" ? "default" : "outline"} onClick={() => setViewMode("cards")}>
            <Calendar className="h-4 w-4 mr-2" /> Calendar View
          </Button>
          <Button variant={viewMode === "map" ? "default" : "outline"} onClick={() => setViewMode("map")}>
            <Map className="h-4 w-4 mr-2" /> Map View
          </Button>
        </div>
      </div>

      {viewMode === "map" ? (
        <JourneyMap locations={mapLocations} className="h-[600px] mb-6" />
      ) : (
        <div className="relative w-full">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {currentItinerary.map((day, index) => (
                <div key={day.day} className="flex-[0_0_33.333%] min-w-[300px]">
                  <TravelDayCard
                    {...day}
                    startDate={startDate}
                    recommendations={generateRecommendations(day)}
                    onEditAccommodation={(updatedAccommodation) => handleEditAccommodation(index, updatedAccommodation)}
                    onEditTransportation={(updatedTransportation) => handleEditTransportation(index, updatedTransportation)}
                    onEditActivity={(activityIndex, updatedActivity) => handleEditActivity(index, activityIndex, updatedActivity)}
                    onRemoveActivity={(activityIndex) => handleRemoveActivity(index, activityIndex)}
                    onAddActivity={(newActivity) => handleAddActivity(index, newActivity)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button
          onClick={async () => {
            try {
              const url = await generateICS(currentItinerary);
              const link = document.createElement("a");
              link.href = url;
              link.download = "travel-itinerary.ics";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast({ title: "Success", description: "Your itinerary has been downloaded successfully." });
            } catch (error) {
              console.error("Failed to download itinerary:", error);
              toast({ title: "Error", description: "Failed to download itinerary. Please try again.", variant: "destructive" });
            }
          }}
          className="w-auto px-6"
        >
          Download Itinerary
        </Button>
      </div>
    </div>
  );
}