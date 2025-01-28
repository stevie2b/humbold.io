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
    containScroll: false,
    dragFree: true,
    loop: false,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Debug log to check itinerary length
  console.log("Itinerary length:", itinerary?.length);

  if (!itinerary?.length) return null;

  return (
    <div className="relative w-full">
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
              className="flex-[0_0_calc(100%-1rem)] sm:flex-[0_0_calc(50%-1rem)] lg:flex-[0_0_calc(33.333%-1rem)] xl:flex-[0_0_calc(25%-1rem)]"
            >
              <TravelDayCard {...day} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}