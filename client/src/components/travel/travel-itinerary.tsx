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
}

interface TravelItineraryProps {
  itinerary: Array<{
    day: number;
    accommodation: {
      title: string;
      details: string;
      checkInTime?: string;
      checkOutTime?: string;
    };
    transportation: {
      title: string;
      details: string;
      arrivalTime?: string;
      departureTime?: string;
    };
    activities: ActivityItem[];
  }>;
}

export default function TravelItinerary({ itinerary }: TravelItineraryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
    slidesToScroll: 1
  });

  const { toast } = useToast();

  // State for managing removed activities per day
  const [removedActivities, setRemovedActivities] = useState<{ [key: number]: ActivityItem[] }>({});

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleDownload = async () => {
    try {
      const url = await generateICS(itinerary);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'travel-itinerary.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download itinerary:', error);
      toast({
        title: "Error",
        description: "Failed to download itinerary. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveActivity = (dayIndex: number, activityIndex: number) => {
    const day = itinerary[dayIndex];
    const removedActivity = day.activities[activityIndex];

    // Add to removed activities
    setRemovedActivities(prev => ({
      ...prev,
      [dayIndex]: [...(prev[dayIndex] || []), removedActivity]
    }));

    // Remove from current activities (you'll need to implement this part)
    // This would typically involve updating the parent component's state
  };

  const handleAddActivity = (dayIndex: number, activity: ActivityItem) => {
    // Remove from recommendations
    setRemovedActivities(prev => ({
      ...prev,
      [dayIndex]: (prev[dayIndex] || []).filter(a => a.title !== activity.title)
    }));

    // Add to current activities (you'll need to implement this part)
    // This would typically involve updating the parent component's state
  };

  if (!itinerary?.length) return null;

  return (
    <div className="space-y-6">
      <div className="relative w-full">
        {/* Navigation Buttons */}
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

        {/* Mobile Navigation */}
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

        {/* Carousel Container */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {itinerary.map((day, index) => (
              <div 
                key={day.day}
                className={`flex-[0_0_33.333%] min-w-[300px]`}
              >
                <TravelDayCard 
                  {...day} 
                  onRemoveActivity={(activityIndex) => handleRemoveActivity(index, activityIndex)}
                  onAddActivity={(activity) => handleAddActivity(index, activity)}
                  recommendations={removedActivities[index] || []}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Button
          type="button"
          onClick={handleDownload}
          className="w-auto px-6"
        >
          Download Itinerary
        </Button>
      </div>
    </div>
  );
}