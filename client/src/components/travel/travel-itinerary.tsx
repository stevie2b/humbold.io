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
    loop: false,
    skipSnaps: false,
    dragFree: false,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!itinerary?.length) return null;

  // Debug log to check the itinerary data
  console.log("Rendering itinerary with length:", itinerary.length, "days:", itinerary);

  return (
    <div className="relative w-full px-4">
      {/* Navigation Buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10 bg-background shadow-lg hidden md:flex"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-background shadow-lg hidden md:flex"
        onClick={scrollNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

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
              className="w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-12px)] min-w-0 flex-shrink-0"
            >
              <TravelDayCard {...day} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}