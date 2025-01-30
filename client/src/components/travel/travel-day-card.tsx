import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Plus, Pencil, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { format, addDays, differenceInDays } from "date-fns";
import React from 'react';
import { LocationSearch } from "./location-search";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Utility functions
const calculateEndTime = (startTime: string, duration: string): string => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [durationHour, durationMinute] = duration.split(':').map(Number);

  const totalMinutes = startHour * 60 + startMinute + durationHour * 60 + durationMinute;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;

  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
};

const calculateDuration = (startTime: string, endTimeStr: string): string => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTimeStr.split(':').map(Number);

  let totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  if (totalMinutes < 0) totalMinutes += 24 * 60;  // Handle crossing midnight

  const durationHours = Math.floor(totalMinutes / 60);
  const durationMinutes = totalMinutes % 60;

  return `${durationHours.toString().padStart(2, '0')}:${durationMinutes.toString().padStart(2, '0')}`;
};

// Type definitions
interface ActivityItem {
  time: string;
  title: string;
  duration?: string;
  location?: {
    lat: number;
    lng: number;
  };
  category?: string;
  description?: string;
}

interface AccommodationDetails {
  title: string;
  details: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  price_range?: string;
  booking_url?: string;
  checkInTime?: string;
  checkOutTime?: string;
  startDay?: number;
  endDay?: number;
}

interface TransportationDetails {
  title: string;
  details: string;
  type?: 'continuous' | 'scheduled';
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
  accommodation?: AccommodationDetails;
  transportation?: TransportationDetails[] | TransportationDetails;
  activities?: ActivityItem[];
  onRemoveActivity?: (index: number) => void;
  onAddActivity?: (activity: ActivityItem) => void;
  onEditActivity?: (index: number, updatedActivity: ActivityItem) => void;
  onEditAccommodation?: (updatedAccommodation: AccommodationDetails) => void;
  onRemoveAccommodation?: (accommodation: AccommodationDetails) => void;
  onEditTransportation?: (updatedTransportation: TransportationDetails) => void;
  onAddTransportation?: (transportation: TransportationDetails) => void;
  onAddAccommodation?: (accommodation: AccommodationDetails) => void;
  recommendations?: ActivityItem[];
  isFirstCard?: boolean;
  isLastCard?: boolean;
  startDate?: Date;
}

// Dialog Components
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
  const [timeError, setTimeError] = useState('');
  const [endTime, setEndTime] = useState(() => {
    if (activity.duration) {
      return calculateEndTime(activity.time, activity.duration);
    }
    return '';
  });

  const validateTimes = (startTime: string, endTimeStr: string) => {
    if (!endTimeStr) return true;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;
    if (endMinutes < startMinutes) endMinutes += 24 * 60;  // Handle crossing midnight

    return endMinutes > startMinutes;
  };

  const handleSave = () => {
    if (!validateTimes(editedActivity.time, endTime)) {
      setTimeError('End time must be after start time');
      return;
    }
    const duration = calculateDuration(editedActivity.time, endTime);
    onSave({ ...editedActivity, duration });
  };

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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editedActivity.title}
              onChange={(e) => setEditedActivity({ ...editedActivity, title: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="time">Start Time</Label>
            <Input
              id="time"
              type="time"
              value={editedActivity.time}
              onChange={(e) => {
                setTimeError('');
                setEditedActivity({ ...editedActivity, time: e.target.value });
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => {
                setTimeError('');
                setEndTime(e.target.value);
              }}
            />
            {timeError && <p className="text-sm text-red-500">{timeError}</p>}
            {editedActivity.time && endTime && !timeError && (
              <p className="text-sm text-muted-foreground">
                Duration: {calculateDuration(editedActivity.time, endTime).split(':').map((n, i) => `${n}${i === 0 ? 'h' : 'm'}`).join(' ')}
              </p>
            )}
          </div>

          <LocationSearch
            onLocationSelect={({ lat, lng, address }) => {
              setEditedActivity({
                ...editedActivity,
                location: { lat, lng },
                title: address.split(',')[0]
              });
            }}
            searchType="venue"
            initialAddress={activity.title}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccommodationEditDialog({
  accommodation,
  onSave,
  trigger,
  startDate,
  currentDay
}: {
  accommodation: AccommodationDetails;
  onSave: (updatedAccommodation: AccommodationDetails) => void;
  trigger: React.ReactNode;
  startDate: Date;
  currentDay: number;
}) {
  const [edited, setEdited] = useState(accommodation);
  const [stayStartDate, setStayStartDate] = useState<Date | undefined>(
    accommodation.startDay ? addDays(startDate, accommodation.startDay - 1) : undefined
  );
  const [stayEndDate, setStayEndDate] = useState<Date | undefined>(
    accommodation.endDay ? addDays(startDate, accommodation.endDay - 1) : undefined
  );

  useEffect(() => {
    if (!stayStartDate) {
      setStayStartDate(addDays(startDate, currentDay - 1));
    }
    if (!stayEndDate) {
      setStayEndDate(addDays(startDate, currentDay - 1));
    }
  }, [currentDay, startDate]);

  const handleSave = () => {
    if (!stayStartDate || !stayEndDate) {
      return;
    }

    // Convert dates back to day numbers
    const startDay = differenceInDays(stayStartDate, startDate) + 1;
    const endDay = differenceInDays(stayEndDate, startDate) + 1;

    onSave({
      ...edited,
      startDay,
      endDay
    });
  };

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

          <LocationSearch
            onLocationSelect={({ lat, lng, address }) => {
              setEdited({
                ...edited,
                coordinates: { lat, lng },
                title: address
              });
            }}
            searchType="accommodation"
            initialAddress={accommodation.title}
          />

          <div className="grid gap-2">
            <Label htmlFor="details">Details</Label>
            <Input
              id="details"
              value={edited.details}
              onChange={(e) => setEdited({ ...edited, details: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Stay Duration</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Check-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !stayStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {stayStartDate ? format(stayStartDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={stayStartDate}
                      onSelect={setStayStartDate}
                      disabled={(date) => date < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Check-out Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !stayEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {stayEndDate ? format(stayEndDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={stayEndDate}
                      onSelect={setStayEndDate}
                      disabled={(date) => date < (stayStartDate || startDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="checkInTime">Check-in Time</Label>
            <Input
              id="checkInTime"
              type="time"
              value={edited.checkInTime || "14:00"}
              onChange={(e) => setEdited({ ...edited, checkInTime: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkOutTime">Check-out Time</Label>
            <Input
              id="checkOutTime"
              type="time"
              value={edited.checkOutTime || "11:00"}
              onChange={(e) => setEdited({ ...edited, checkOutTime: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
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
  const [timeError, setTimeError] = useState('');

  const validateTimes = (departureTime: string, arrivalTime: string) => {
    if (!departureTime || !arrivalTime) return true;

    const [depHour, depMinute] = departureTime.split(':').map(Number);
    const [arrHour, arrMinute] = arrivalTime.split(':').map(Number);

    const depMinutes = depHour * 60 + depMinute;
    const arrMinutes = arrHour * 60 + arrMinute;

    return arrMinutes > depMinutes;
  };

  const handleSave = () => {
    if (edited.type === 'scheduled' && !validateTimes(edited.departureTime || '', edited.arrivalTime || '')) {
      setTimeError('Arrival time must be after departure time');
      return;
    }
    onSave(edited);
  };

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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={edited.title}
              onChange={(e) => setEdited({ ...edited, title: e.target.value })}
            />
          </div>

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
                <Label htmlFor="departureTime">Departure Time</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={edited.departureTime}
                  onChange={(e) => {
                    setTimeError('');
                    setEdited({ ...edited, departureTime: e.target.value });
                  }}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="arrivalTime">Arrival Time</Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  value={edited.arrivalTime}
                  onChange={(e) => {
                    setTimeError('');
                    setEdited({ ...edited, arrivalTime: e.target.value });
                  }}
                />
                {timeError && <p className="text-sm text-red-500">{timeError}</p>}
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

          <div className="grid gap-2">
            <Label>Route</Label>
            <div className="space-y-4">
              <div>
                <Label className="mb-2">From Location</Label>
                <LocationSearch
                  onLocationSelect={({ lat, lng, address }) => {
                    setEdited({
                      ...edited,
                      route: {
                        ...edited.route,
                        from: { lat, lng }
                      }
                    });
                  }}
                  initialAddress={transportation.route?.from ? `${transportation.route.from.lat},${transportation.route.from.lng}` : undefined}
                />
              </div>
              <div>
                <Label className="mb-2">To Location</Label>
                <LocationSearch
                  onLocationSelect={({ lat, lng, address }) => {
                    setEdited({
                      ...edited,
                      route: {
                        ...edited.route,
                        to: { lat, lng }
                      }
                    });
                  }}
                  initialAddress={transportation.route?.to ? `${transportation.route.to.lat},${transportation.route.to.lng}` : undefined}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransportationContent({
  transportation,
  onEdit
}: {
  transportation: TransportationDetails;
  onEdit?: (updatedTransportation: TransportationDetails) => void;
}) {
  const getHourRange = (startTime: string, endTime: string) => {
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    return Array.from({ length: 24 }, (_, i) => i >= startHour && i <= endHour);
  };

  return (
    <>
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-amber-700 font-medium mb-1">
              {transportation.title}
              {transportation.type === 'scheduled' && transportation.flightNumber && (
                <span className="text-sm ml-2">({transportation.flightNumber})</span>
              )}
            </div>
            <div className="text-sm text-amber-600">
              {transportation.details}
              {transportation.type === 'scheduled' && transportation.departureTime && (
                <div className="mt-1">
                  <span className="font-medium">Departure:</span> {transportation.departureTime}
                  {transportation.arrivalTime && (
                    <> | <span className="font-medium">Arrival:</span> {transportation.arrivalTime}</>
                  )}
                </div>
              )}
            </div>
          </div>
          {onEdit && (
            <TransportationEditDialog
              transportation={transportation}
              onSave={onEdit}
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
      </div>
      <div className="absolute inset-0 flex rounded-lg overflow-hidden">
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            className={`flex-1 ${
              transportation.type === 'continuous' ||
              (transportation.departureTime &&
                transportation.arrivalTime &&
                getHourRange(transportation.departureTime, transportation.arrivalTime)[i])
                ? 'bg-amber-200/50'
                : ''
            }`}
          />
        ))}
      </div>
    </>
  );
}

function AccommodationBox({
  title,
  details,
  checkInTime,
  checkOutTime,
  type,
  onEdit,
  onRemove,
  accommodation,
  startDate,
  day
}: {
  title: string;
  details: string;
  checkInTime?: string;
  checkOutTime?: string;
  type: 'checkin' | 'checkout' | 'full';
  onEdit?: (updatedAccommodation: AccommodationDetails) => void;
  onRemove?: () => void;
  accommodation: AccommodationDetails;
  startDate: Date;
  day: number;
}) {
  const getDisplayTime = () => {
    if (type === 'checkin' && checkInTime) {
      return `Check-in: ${checkInTime}`;
    }
    if (type === 'checkout' && checkOutTime) {
      return `Check-out: ${checkOutTime}`;
    }
    if (type === 'full') {
      return 'Continued stay';
    }
    return '';
  };

  return (
    <div className="relative bg-emerald-100 rounded-lg p-3 border border-emerald-200 mb-2">
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-emerald-700 font-medium mb-1">{title}</div>
            <div className="text-sm text-emerald-600">
              {details}
              <div className="mt-1 italic">
                {getDisplayTime()}
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            {onEdit && (
              <AccommodationEditDialog
                accommodation={accommodation}
                onSave={onEdit}
                startDate={startDate}
                currentDay={day}
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
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex rounded-lg overflow-hidden">
        {Array.from({ length: 24 }, (_, i) => {
          let isColored = false;
          if (type === 'checkin' && checkInTime) {
            const checkInHour = parseInt(checkInTime.split(':')[0]);
            isColored = i >= checkInHour;
          } else if (type === 'checkout' && checkOutTime) {
            const checkOutHour = parseInt(checkOutTime.split(':')[0]);
            isColored = i < checkOutHour;
          } else if (type === 'full') {
            isColored = true;
          }
          return (
            <div
              key={i}
              className={`flex-1 ${isColored ? 'bg-emerald-200/50' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}


// Main component
export default function TravelDayCard({
  day,
  accommodation,
  transportation,
  activities = [],
  onRemoveActivity,
  onAddActivity,
  onEditActivity,
  onEditAccommodation,
  onRemoveAccommodation,
  onEditTransportation,
  onAddTransportation,
  onAddAccommodation,
  recommendations = [],
  isFirstCard = false,
  isLastCard = false,
  startDate = new Date()
}: TravelDayCardProps) {
  const containerClasses = `
    h-full
    ${isFirstCard ? 'pr-0' : isLastCard ? 'pl-0' : 'px-0'}
  `;

  const formatDayHeader = (date: Date, dayNum: number): string => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + dayNum - 1);
    return `${format(currentDate, 'EEE')}, ${format(currentDate, 'dd.MM')}. (day ${dayNum})`;
  };

  // Extract city information from accommodation
  const getCurrentLocation = () => {
    if (!accommodation) return "";
    const city = accommodation.title.split(',')[0];
    return city;
  };

  const getAccommodationType = (day: number, accommodation: AccommodationDetails): 'checkin' | 'checkout' | 'full' => {
    if (!accommodation.startDay || !accommodation.endDay) return 'full';
    if (accommodation.startDay === day) return 'checkin';
    if (accommodation.endDay === day) return 'checkout';
    if (day > accommodation.startDay && day < accommodation.endDay) return 'full';
    return 'full';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={containerClasses}
    >
      <Card className="h-full">
        <div className="relative p-4 bg-gradient-to-b from-blue-50 to-white border-b">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">
              {formatDayHeader(startDate, day)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {getCurrentLocation()}
            </p>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <h4 className="text-sm font-medium text-emerald-700">Accommodation</h4>
              {onAddAccommodation && !accommodation && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={onAddAccommodation}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            {accommodation && (
              <AccommodationBox
                title={accommodation.title}
                details={accommodation.details}
                checkInTime={accommodation.checkInTime}
                checkOutTime={accommodation.checkOutTime}
                type={getAccommodationType(day, accommodation)}
                onEdit={onEditAccommodation}
                onRemove={onRemoveAccommodation}
                accommodation={accommodation}
                startDate={startDate}
                day={day}
              />
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-amber-700">Transportation</h4>
                {onAddTransportation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onAddTransportation({
                      title: `New Transportation ${Date.now()}`,
                      details: "",
                      type: "continuous"
                    })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {Array.isArray(transportation) ? (
              <div className="space-y-2">
                {transportation.map((transport, idx) => (
                  <div key={idx} className="relative bg-amber-100 rounded-lg p-3 border border-amber-200">
                    <TransportationContent
                      transportation={transport}
                      onEdit={onEditTransportation}
                    />
                  </div>
                ))}
              </div>
            ) : transportation ? (
              <div className="relative bg-amber-100 rounded-lg p-3 border border-amber-200">
                <TransportationContent
                  transportation={transportation}
                  onEdit={onEditTransportation}
                />
              </div>
            ) : null}
          </div>

          {activities && activities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2">Activities</h4>
              <div className="space-y-2">
                {activities.map((activity, index) => {
                  const endTimeStr = activity.duration ? calculateEndTime(activity.time, activity.duration) : '';
                  return (
                    <div
                      key={index}
                      className="relative bg-blue-100 rounded-lg p-3 border border-blue-200 flex items-center justify-between"
                    >
                      <div className="relative z-10 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600 font-medium">
                            {activity.time}
                            {endTimeStr && ` - ${endTimeStr}`}
                          </span>
                          <span className="text-blue-700">{activity.title}</span>
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
                          const [hours, minutes] = activity.time.split(':').map(Number);
                          const [durationHours = 0, durationMinutes = 0] = (activity.duration || '00:00').split(':').map(Number);
                          const startMinutes = hours * 60 + minutes;
                          const endMinutes = startMinutes + durationHours * 60 + durationMinutes;
                          const currentMinutes = i * 60;
                          return (
                            <div
                              key={i}
                              className={`flex-1 ${
                                currentMinutes >= startMinutes && currentMinutes < endMinutes
                                  ? 'bg-blue-200/50'
                                  : ''
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {recommendations && recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Activities</h4>
              <div className="space-y-2">
                {recommendations.map((activity, index) => {
                  const isOwnIdea = activity.category === 'custom';
                  const isAlreadyAdded = !isOwnIdea && activities.some(
                    existingActivity => existingActivity.title === activity.title
                  );

                  if (!isAlreadyAdded || isOwnIdea) {
                    const suggestedTime = "14:00";
                    const suggestedEndTime = "16:00";

                    return (
                      <div
                        key={index}
                        className="relative bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                      >
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500 text-sm">                            {suggestedTime} - {suggestedEndTime}
                          </span>
                            <span className="text-gray-700">{activity.title}</span>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                          )}
                        </div>
                        {onAddActivity && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="relative z-10 h-8 w-8 p-0"
                            onClick={() => onAddActivity({...activity,
                              time: suggestedTime,
                              duration: "02:00"
                            })}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}