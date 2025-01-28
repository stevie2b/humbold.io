import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TravelDayCard from "./travel-day-card";

interface TravelItineraryProps {
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
}

export default function TravelItinerary({ itinerary }: TravelItineraryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!itinerary?.length) return null;

  return (
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
        <div className="flex gap-4">
          {itinerary.map((day) => (
            <div 
              key={day.day}
              style={{ 
                flex: '0 0 auto',
                minWidth: '300px',
                width: 'calc((100% - 32px) / 3)'
              }}
            >
              <TravelDayCard {...day} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}