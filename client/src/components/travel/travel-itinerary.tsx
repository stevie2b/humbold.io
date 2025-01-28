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
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 1024px)": { slidesToScroll: 5 },
      "(min-width: 768px)": { slidesToScroll: 3 },
      "(max-width: 767px)": { slidesToScroll: 1 },
    }
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

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
        <div className="flex">
          {itinerary.map((day, index) => (
            <div 
              key={day.day}
              className="flex-[0_0_100%] min-w-0 pl-4 md:flex-[0_0_33.33%] lg:flex-[0_0_20%]"
            >
              <TravelDayCard {...day} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}