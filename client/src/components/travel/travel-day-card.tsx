import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface TravelDayCardProps {
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
}

export default function TravelDayCard({ 
  day, 
  accommodation, 
  transportation, 
  activities 
}: TravelDayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Day {day}</h3>
          
          {/* Accommodation Section - Green */}
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
            <div className="text-emerald-700 font-medium mb-1">
              {accommodation.title}
            </div>
            <div className="text-sm text-emerald-600">
              {accommodation.details}
            </div>
          </div>

          {/* Transportation Section - Yellow */}
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="text-amber-700 font-medium mb-1">
              {transportation.title}
            </div>
            <div className="text-sm text-amber-600">
              {transportation.details}
            </div>
          </div>

          {/* Activities Section - Blue */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-blue-700 font-medium mb-2">Activities</div>
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <div key={index} className="flex text-sm">
                  <span className="text-blue-600 font-medium w-20">
                    {activity.time}
                  </span>
                  <span className="text-blue-700">
                    {activity.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
