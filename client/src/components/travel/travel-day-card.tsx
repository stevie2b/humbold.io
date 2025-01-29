import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Plus, Pencil } from "lucide-react";
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
  onEditActivity?: (index: number) => void;
  onEditAccommodation?: () => void;
  onEditTransportation?: () => void;
  recommendations?: Array<{
    time: string;
    title: string;
    duration?: string;
  }>;
  isFirstCard?: boolean;
  isLastCard?: boolean;
}

function getTimeQuarters(startTime: string, endTime?: string): number[] {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const startTimeInMinutes = startHours * 60 + (startMinutes || 0);

  const endTimeInMinutes = endTime ? (() => {
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    return endHours * 60 + (endMinutes || 0);
  })() : startTimeInMinutes + 60;  // Default 1 hour duration

  const quarters = [];
  for (let i = 0; i < 4; i++) {
    const quarterStart = i * 360;  // 360 minutes = 6 hours
    const quarterEnd = (i + 1) * 360;

    if (startTimeInMinutes <= quarterEnd && endTimeInMinutes >= quarterStart) {
      quarters.push(i);
    }
  }

  return quarters;
}

export default function TravelDayCard({ 
  day, 
  accommodation, 
  transportation, 
  activities,
  onRemoveActivity,
  onAddActivity,
  onEditActivity,
  onEditAccommodation,
  onEditTransportation,
  recommendations = [],
  isFirstCard = false,
  isLastCard = false
}: TravelDayCardProps) {
  const checkInTime = accommodation.checkInTime || "15:00";
  const checkOutTime = accommodation.checkOutTime || "11:00";
  const arrivalTime = transportation.arrivalTime || "09:00";
  const departureTime = transportation.departureTime || "10:00";

  const accomQuarters = getTimeQuarters(checkInTime, checkOutTime);
  const transQuarters = getTimeQuarters(arrivalTime, departureTime);

  const containerClasses = `
    h-full
    ${isFirstCard ? 'pr-0' : isLastCard ? 'pl-0' : 'px-0'}
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={containerClasses}
    >
      <Card className="h-full">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Day {day}</h3>

          {/* Accommodation Section - Green */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-emerald-700">Accommodation</h4>
              {onEditAccommodation && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={onEditAccommodation}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
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
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-amber-700">Transportation</h4>
              {onEditTransportation && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={onEditTransportation}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
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
                  <div className="flex items-center space-x-1">
                    {onEditActivity && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEditActivity(index)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
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
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations Section */}
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
                        {activity.time} - {activity.duration}
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
        </CardContent>
      </Card>
    </motion.div>
  );
}