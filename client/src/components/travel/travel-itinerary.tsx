import { motion } from "framer-motion";
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
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {itinerary.map((day, index) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <TravelDayCard {...day} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
