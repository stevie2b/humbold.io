import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TravelDayCard from "./travel-day-card";
import { generateICS } from "@/lib/ics-generator";
import { useToast } from "@/hooks/use-toast";

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
    dragFree: true,
    containScroll: "trimSnaps",
    slidesToScroll: 1
  });

  const { toast } = useToast();

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

  if (!itinerary?.length) return null;

  return (
    <div className="space-y-6">
      <div className="relative w-full px-4">
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