import { useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TravelDayCard from "./travel-day-card";
import { generateICS } from "@/lib/ics-generator";
import { useToast } from "@/hooks/use-toast";

interface ActivityItem {
  time: string;
  title: string;
  duration?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface AccommodationDetails {
  title: string;
  details: string;
  checkInTime: string;
  checkOutTime: string;
  startDay: number;
  endDay: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface TransportationDetails {
  type: 'continuous' | 'scheduled';
  title: string;
  details: string;
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

interface TravelDayCardProps {
  day: number;
  accommodation: AccommodationDetails;
  transportation: TransportationDetails;
  activities: ActivityItem[];
}

export default function TravelItinerary({ itinerary }: { itinerary: TravelDayCardProps[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
    slidesToScroll: 1
  });

  const { toast } = useToast();
  const [currentItinerary, setCurrentItinerary] = useState(itinerary);
  const [removedActivities, setRemovedActivities] = useState<{ [key: number]: ActivityItem[] }>({});

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleEditActivity = (dayIndex: number, activityIndex: number, updatedActivity: ActivityItem) => {
    setCurrentItinerary(prev => {
      const newItinerary = [...prev];
      newItinerary[dayIndex] = {
        ...newItinerary[dayIndex],
        activities: [
          ...newItinerary[dayIndex].activities.slice(0, activityIndex),
          updatedActivity,
          ...newItinerary[dayIndex].activities.slice(activityIndex + 1)
        ]
      };
      return newItinerary;
    });

    toast({
      title: "Activity Updated",
      description: "The activity has been successfully updated.",
    });
  };

  const handleRemoveActivity = (dayIndex: number, activityIndex: number) => {
    const removedActivity = currentItinerary[dayIndex].activities[activityIndex];

    setCurrentItinerary(prev => {
      const newItinerary = [...prev];
      newItinerary[dayIndex] = {
        ...newItinerary[dayIndex],
        activities: newItinerary[dayIndex].activities.filter((_, i) => i !== activityIndex)
      };
      return newItinerary;
    });

    setRemovedActivities(prev => ({
      ...prev,
      [dayIndex]: [...(prev[dayIndex] || []), removedActivity]
    }));

    toast({
      title: "Activity Removed",
      description: "The activity has been moved to recommendations.",
    });
  };

  const handleAddActivity = (dayIndex: number, activity: ActivityItem) => {
    setCurrentItinerary(prev => {
      const newItinerary = [...prev];
      newItinerary[dayIndex] = {
        ...newItinerary[dayIndex],
        activities: [...newItinerary[dayIndex].activities, activity]
      };
      return newItinerary;
    });

    // Remove the activity from recommendations
    setRemovedActivities(prev => ({
      ...prev,
      [dayIndex]: prev[dayIndex]?.filter(a => 
        !(a.time === activity.time && a.title === activity.title)
      ) || []
    }));

    toast({
      title: "Activity Added",
      description: "The activity has been added to your itinerary.",
    });
  };

  const handleEditAccommodation = (dayIndex: number, updatedAccommodation: AccommodationDetails) => {
    setCurrentItinerary(prev => {
      const newItinerary = [...prev];
      newItinerary[dayIndex] = {
        ...newItinerary[dayIndex],
        accommodation: updatedAccommodation
      };
      return newItinerary;
    });

    toast({
      title: "Accommodation Updated",
      description: "The accommodation details have been updated.",
    });
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

    toast({
      title: "Transportation Updated",
      description: "The transportation details have been updated.",
    });
  };

  if (!currentItinerary?.length) return null;

  return (
    <div className="space-y-6">
      <div className="relative w-full">
        <div className="hidden md:block">
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 bg-background shadow-lg"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-background shadow-lg"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-between mb-4 md:hidden">
          <Button variant="outline" size="sm" onClick={scrollPrev}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Day
          </Button>
          <Button variant="outline" size="sm" onClick={scrollNext}>
            Next Day
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {currentItinerary.map((day, index) => (
              <div 
                key={day.day}
                className="flex-[0_0_33.333%] min-w-[300px]"
              >
                <TravelDayCard 
                  {...day} 
                  onRemoveActivity={(activityIndex) => handleRemoveActivity(index, activityIndex)}
                  onAddActivity={(activity) => handleAddActivity(index, activity)}
                  onEditActivity={(activityIndex, updatedActivity) => 
                    handleEditActivity(index, activityIndex, updatedActivity)}
                  onEditAccommodation={(updatedAccommodation) => 
                    handleEditAccommodation(index, updatedAccommodation)}
                  onEditTransportation={(updatedTransportation) => 
                    handleEditTransportation(index, updatedTransportation)}
                  recommendations={[
                    ...(removedActivities[index] || []).slice(0, 3), 
                    ...((removedActivities[index]?.length || 0) < 3 ? [
                      {
                        time: "09:00",
                        duration: "12:00",
                        title: "Local Museum Visit"
                      },
                      {
                        time: "14:00",
                        duration: "17:00",
                        title: "City Walking Tour"
                      }
                    ].slice(0, 3 - (removedActivities[index]?.length || 0)) : [])
                  ]}
                  isFirstCard={index === 0}
                  isLastCard={index === currentItinerary.length - 1}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={async () => {
            try {
              const url = await generateICS(currentItinerary);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'travel-itinerary.ics';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              toast({
                title: "Success",
                description: "Your itinerary has been downloaded successfully.",
              });
            } catch (error) {
              console.error('Failed to download itinerary:', error);
              toast({
                title: "Error",
                description: "Failed to download itinerary. Please try again.",
                variant: "destructive",
              });
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