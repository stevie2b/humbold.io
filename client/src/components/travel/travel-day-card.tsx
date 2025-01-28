import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TravelDayCardProps {
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
  activities: Array<{
    time: string;
    title: string;
    duration?: string;
  }>;
  onRemoveActivity?: (index: number) => void;
  onAddActivity?: (activity: { time: string; title: string; duration?: string }) => void;
  recommendations?: Array<{
    time: string;
    title: string;
    duration?: string;
  }>;
}

function getTimeQuarters(time: string): number[] {
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + (minutes || 0);
  const quarters = [];

  // Each quarter represents 6 hours (360 minutes)
  if (timeInMinutes <= 360) quarters.push(0); // 00:00-06:00
  if (timeInMinutes > 360 && timeInMinutes <= 720) quarters.push(1); // 06:00-12:00
  if (timeInMinutes > 720 && timeInMinutes <= 1080) quarters.push(2); // 12:00-18:00
  if (timeInMinutes > 1080) quarters.push(3); // 18:00-24:00

  return quarters;
}

function extractTimeFromString(str: string): string {
  // Look for common time patterns (e.g., "14:00", "2pm", "14.00")
  const timePattern = /(\d{1,2})[:.]\d{2}|(\d{1,2})\s*(am|pm)/i;
  const match = str.match(timePattern);
  if (!match) return '';

  let time = match[0];
  // Convert to 24-hour format if needed
  if (time.toLowerCase().includes('pm')) {
    const hour = parseInt(time) + 12;
    time = `${hour}:00`;
  } else if (time.toLowerCase().includes('am')) {
    time = time.replace(/am/i, '');
    if (time.length === 1) time = `0${time}:00`;
    else time = `${time}:00`;
  }
  return time;
}

export default function TravelDayCard({ 
  day, 
  accommodation, 
  transportation, 
  activities,
  onRemoveActivity,
  onAddActivity,
  recommendations = []
}: TravelDayCardProps) {
  // Extract times
  const checkInTime = accommodation.checkInTime || "15:00"; // Default check-in time
  const checkOutTime = accommodation.checkOutTime || "11:00"; // Default check-out time
  const arrivalTime = transportation.arrivalTime || "09:00"; // Default arrival time
  const departureTime = transportation.departureTime || "10:00"; // Default departure time

  const accomQuarters = getTimeQuarters(checkInTime);
  const transQuarters = getTimeQuarters(arrivalTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Day {day}</h3>

          {/* Accommodation Section - Green */}
          <div>
            <h4 className="text-sm font-medium text-emerald-700 mb-2">Accommodation</h4>
            <div className="relative bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <div className="relative z-10">
                <div className="text-emerald-700 font-medium mb-1">
                  {accommodation.title}
                </div>
                <div className="text-sm text-emerald-600">
                  {accommodation.details}
                  <div className="mt-1">
                    <span className="font-medium">Check-in:</span> {checkInTime} |{" "}
                    <span className="font-medium">Check-out:</span> {checkOutTime}
                  </div>
                </div>
              </div>
              {/* Time indicator overlay */}
              <div className="absolute inset-0 flex rounded-lg overflow-hidden">
                {[0,1,2,3].map((quarter) => (
                  <div 
                    key={quarter}
                    className={`flex-1 ${accomQuarters.includes(quarter) ? 'bg-emerald-300/50' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Transportation Section - Yellow */}
          <div>
            <h4 className="text-sm font-medium text-amber-700 mb-2">Transportation</h4>
            <div className="relative bg-amber-50 rounded-lg p-3 border border-amber-200">
              <div className="relative z-10">
                <div className="text-amber-700 font-medium mb-1">
                  {transportation.title}
                </div>
                <div className="text-sm text-amber-600">
                  {transportation.details}
                  <div className="mt-1">
                    <span className="font-medium">Arrival:</span> {arrivalTime} |{" "}
                    <span className="font-medium">Departure:</span> {departureTime}
                  </div>
                </div>
              </div>
              {/* Time indicator overlay */}
              <div className="absolute inset-0 flex rounded-lg overflow-hidden">
                {[0,1,2,3].map((quarter) => (
                  <div 
                    key={quarter}
                    className={`flex-1 ${transQuarters.includes(quarter) ? 'bg-amber-300/50' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Activities Section - Blue */}
          <div>
            <h4 className="text-sm font-medium text-blue-700 mb-2">Activities</h4>
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <div 
                  key={index} 
                  className="bg-blue-50 rounded-lg p-3 border border-blue-200 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600 font-medium">
                        {activity.time}
                        {activity.duration && ` - ${activity.duration}`}
                      </span>
                      <span className="text-blue-700">
                        {activity.title}
                      </span>
                    </div>
                  </div>
                  {onRemoveActivity && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onRemoveActivity(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Activities</h4>
              <div className="space-y-2">
                {recommendations.map((activity, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-medium">
                          {activity.time}
                          {activity.duration && ` - ${activity.duration}`}
                        </span>
                        <span className="text-gray-700">
                          {activity.title}
                        </span>
                      </div>
                    </div>
                    {onAddActivity && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onAddActivity(activity)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}