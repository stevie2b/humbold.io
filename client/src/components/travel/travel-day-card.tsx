import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface ActivityItem {
  time: string;
  title: string;
  duration?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface AccommodationDetails {
  title: string;
  details: string;
  checkInTime: string;
  checkOutTime: string;
  startDay: number;
  endDay: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface TransportationDetails {
  type: 'continuous' | 'scheduled';
  title: string;
  details: string;
  transportMode?: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  route?: {
    from: {
      lat: number;
      lng: number;
    };
    to: {
      lat: number;
      lng: number;
    };
  };
}

interface TravelDayCardProps {
  day: number;
  accommodation: AccommodationDetails;
  transportation: TransportationDetails;
  activities: ActivityItem[];
  onRemoveActivity?: (index: number) => void;
  onAddActivity?: (activity: ActivityItem) => void;
  onEditActivity?: (index: number, updatedActivity: ActivityItem) => void;
  onEditAccommodation?: (updatedAccommodation: AccommodationDetails) => void;
  onEditTransportation?: (updatedTransportation: TransportationDetails) => void;
  recommendations?: ActivityItem[];
  isFirstCard?: boolean;
  isLastCard?: boolean;
}

function getHourRange(startTime: string, endTime?: string): number[] {
  const getHours = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  };

  const start = getHours(startTime);
  const end = endTime ? getHours(endTime) : start + 1;

  const hours: number[] = [];
  for (let hour = Math.floor(start); hour < Math.ceil(end); hour++) {
    hours.push(hour);
  }
  return hours;
}

function ActivityEditDialog({ 
  activity, 
  onSave,
  trigger 
}: { 
  activity: ActivityItem; 
  onSave: (updatedActivity: ActivityItem) => void;
  trigger: React.ReactNode;
}) {
  const [editedActivity, setEditedActivity] = useState(activity);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={editedActivity.time}
              onChange={(e) => setEditedActivity({ ...editedActivity, time: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              type="time"
              value={editedActivity.duration || ''} 
              onChange={(e) => setEditedActivity({ ...editedActivity, duration: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editedActivity.title}
              onChange={(e) => setEditedActivity({ ...editedActivity, title: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(editedActivity)}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccommodationEditDialog({ 
  accommodation, 
  onSave,
  trigger 
}: { 
  accommodation: AccommodationDetails; 
  onSave: (updatedAccommodation: AccommodationDetails) => void;
  trigger: React.ReactNode;
}) {
  const [edited, setEdited] = useState(accommodation);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Accommodation</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Hotel Name</Label>
            <Input
              id="title"
              value={edited.title}
              onChange={(e) => setEdited({ ...edited, title: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="details">Details</Label>
            <Input
              id="details"
              value={edited.details}
              onChange={(e) => setEdited({ ...edited, details: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkInTime">Check-in Time</Label>
            <Input
              id="checkInTime"
              type="time"
              value={edited.checkInTime}
              onChange={(e) => setEdited({ ...edited, checkInTime: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkOutTime">Check-out Time</Label>
            <Input
              id="checkOutTime"
              type="time"
              value={edited.checkOutTime}
              onChange={(e) => setEdited({ ...edited, checkOutTime: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDay">Start Day</Label>
              <Input
                id="startDay"
                type="number"
                min={1}
                value={edited.startDay}
                onChange={(e) => setEdited({ ...edited, startDay: parseInt(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDay">End Day</Label>
              <Input
                id="endDay"
                type="number"
                min={1}
                value={edited.endDay}
                onChange={(e) => setEdited({ ...edited, endDay: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(edited)}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransportationEditDialog({ 
  transportation, 
  onSave,
  trigger 
}: { 
  transportation: TransportationDetails; 
  onSave: (updatedTransportation: TransportationDetails) => void;
  trigger: React.ReactNode;
}) {
  const [edited, setEdited] = useState(transportation);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transportation</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Transportation Type</Label>
            <Select 
              value={edited.type}
              onValueChange={(value) => setEdited({ 
                ...edited, 
                type: value as 'continuous' | 'scheduled'
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continuous">Continuous (Car/Bike)</SelectItem>
                <SelectItem value="scheduled">Scheduled (Flight/Train)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={edited.title}
              onChange={(e) => setEdited({ ...edited, title: e.target.value })}
              placeholder={edited.type === 'scheduled' ? "Flight to Paris" : "Rental Car"}
            />
          </div>

          {edited.type === 'scheduled' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="transportMode">Transport Mode</Label>
                <Select 
                  value={edited.transportMode}
                  onValueChange={(value) => setEdited({ ...edited, transportMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="ferry">Ferry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="flightNumber">Flight/Train Number</Label>
                <Input
                  id="flightNumber"
                  value={edited.flightNumber}
                  onChange={(e) => setEdited({ ...edited, flightNumber: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="departureTime">Departure Time</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={edited.departureTime}
                  onChange={(e) => setEdited({ ...edited, departureTime: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="arrivalTime">Arrival Time</Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  value={edited.arrivalTime}
                  onChange={(e) => setEdited({ ...edited, arrivalTime: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="details">Additional Details</Label>
            <Input
              id="details"
              value={edited.details}
              onChange={(e) => setEdited({ ...edited, details: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(edited)}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDayHeader(startDate: Date, day: number): string {
  const currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + day - 1);
  return `${format(currentDate, 'EEE')}, ${format(currentDate, 'dd.MM')} (day ${day})`;
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
  isLastCard = false,
  startDate = new Date() 
}: TravelDayCardProps & { startDate?: Date }) {
  const isWithinStay = day >= accommodation.startDay && day <= accommodation.endDay;
  const isCheckInDay = day === accommodation.startDay;
  const isCheckOutDay = day === accommodation.endDay;

  const accomHours = isWithinStay ? 
    (isCheckInDay ? 
      getHourRange(accommodation.checkInTime, "23:59") :
      isCheckOutDay ?
        getHourRange("00:00", accommodation.checkOutTime) :
        getHourRange("00:00", "23:59")
    ) : [];

  const transHours = transportation.type === 'continuous' ?
    getHourRange("00:00", "23:59") :
    transportation.departureTime && transportation.arrivalTime ?
      getHourRange(transportation.departureTime, transportation.arrivalTime) :
      [];

  const activityHours = activities.flatMap(activity => 
    getHourRange(activity.time, activity.duration)
  );

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
          <h3 className="text-lg font-semibold">{formatDayHeader(startDate, day)}</h3>

          {/* Accommodation Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-emerald-700">
                {isWithinStay ? `Stay at ${accommodation.title}` : 'No Accommodation'}
              </h4>
              {onEditAccommodation && (
                <AccommodationEditDialog
                  accommodation={accommodation}
                  onSave={onEditAccommodation}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
              )}
            </div>
            <div className="relative bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <div className="relative z-10">
                {isWithinStay ? (
                  <>
                    <div className="text-emerald-700 font-medium mb-1">
                      {accommodation.title}
                    </div>
                    <div className="text-sm text-emerald-600">
                      {accommodation.details}
                      <div className="mt-1">
                        {isCheckInDay && (
                          <div>
                            <span className="font-medium">Check-in:</span> {accommodation.checkInTime}
                          </div>
                        )}
                        {isCheckOutDay && (
                          <div>
                            <span className="font-medium">Check-out:</span> {accommodation.checkOutTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-emerald-600 text-sm italic">
                    No accommodation scheduled for this day
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex rounded-lg overflow-hidden">
                {Array.from({ length: 24 }, (_, i) => (
                  <div 
                    key={i}
                    className={`flex-1 ${accomHours.includes(i) ? 'bg-emerald-200/50' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Transportation Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-amber-700">Transportation</h4>
              {onEditTransportation && (
                <TransportationEditDialog
                  transportation={transportation}
                  onSave={onEditTransportation}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
              )}
            </div>
            <div className="relative bg-amber-50 rounded-lg p-3 border border-amber-200">
              <div className="relative z-10">
                <div className="text-amber-700 font-medium mb-1">
                  {transportation.title}
                  {transportation.type === 'scheduled' && transportation.flightNumber && (
                    <span className="text-sm ml-2">({transportation.flightNumber})</span>
                  )}
                </div>
                <div className="text-sm text-amber-600">
                  {transportation.details}
                  {transportation.type === 'scheduled' && (
                    <div className="mt-1">
                      <span className="font-medium">Departure:</span> {transportation.departureTime} |{" "}
                      <span className="font-medium">Arrival:</span> {transportation.arrivalTime}
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 flex rounded-lg overflow-hidden">
                {Array.from({ length: 24 }, (_, i) => (
                  <div 
                    key={i}
                    className={`flex-1 ${transHours.includes(i) ? 'bg-amber-200/50' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Activities Section */}
          <div>
            <h4 className="text-sm font-medium text-blue-700 mb-2">Activities</h4>
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <div 
                  key={index} 
                  className="relative bg-blue-50 rounded-lg p-3 border border-blue-200 flex items-center justify-between"
                >
                  <div className="relative z-10 flex-1">
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
                  <div className="relative z-10 flex items-center space-x-1">
                    {onEditActivity && (
                      <ActivityEditDialog
                        activity={activity}
                        onSave={(updatedActivity) => onEditActivity(index, updatedActivity)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
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
                  <div className="absolute inset-0 flex rounded-lg overflow-hidden">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hours = getHourRange(activity.time, activity.duration);
                      return (
                        <div 
                          key={i}
                          className={`flex-1 ${hours.includes(i) ? 'bg-blue-200/50' : ''}`}
                        />
                      );
                    })}
                  </div>
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
                    className="relative bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                  >
                    <div className="relative z-10 flex-1">
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
                        className="relative z-10 h-8 w-8 p-0"
                        onClick={() => onAddActivity(activity)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="absolute inset-0 flex rounded-lg overflow-hidden">
                      {Array.from({ length: 24 }, (_, i) => {
                        const hours = getHourRange(activity.time, activity.duration);
                        return (
                          <div 
                            key={i}
                            className={`flex-1 ${hours.includes(i) ? 'bg-gray-200/50' : ''}`}
                          />
                        );
                      })}
                    </div>
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