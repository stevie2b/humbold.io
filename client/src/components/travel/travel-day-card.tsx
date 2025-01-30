import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";
import { X, Plus, Pencil, MapPin, Search } from "lucide-react";
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
import React from 'react';

// First define the utility functions
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

// Only modifying the LocationSearch component
function LocationSearch({
  onLocationSelect,
  initialAddress = "",
  searchType = ""
}: {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialAddress?: string;
  searchType?: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [searchResults, setSearchResults] = useState<Array<{
    place_name: string;
    center: [number, number];
  }>>([]);

  const searchLocation = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
      // Add the type of place to the search query if provided
      const searchText = searchType ? `${query} ${searchType}` : query;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?access_token=${token}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="grid gap-2">
      <Label>Search Location</Label>
      <div className="flex gap-2">
        <Input
          placeholder={searchType ? `Search for ${searchType}...` : "Enter location..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              searchLocation(searchQuery);
            }
          }}
        />
        <Button
          variant="secondary"
          onClick={() => searchLocation(searchQuery)}
          disabled={isSearching}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {selectedAddress && (
        <div className="text-sm text-muted-foreground bg-accent/50 p-2 rounded-md flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {selectedAddress}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mt-2 border rounded-md divide-y">
          {searchResults.map((result, index) => (
            <button
              key={index}
              className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
              onClick={() => {
                onLocationSelect({
                  lat: result.center[1],
                  lng: result.center[0],
                  address: result.place_name
                });
                setSelectedAddress(result.place_name);
                setSearchResults([]);
                setSearchQuery('');
              }}
            >
              {result.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
  const [timeError, setTimeError] = useState('');
  const [endTime, setEndTime] = useState(activity.duration ? calculateEndTime(activity.time, activity.duration) : '');

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
                setEndTime(calculateEndTime(e.target.value, editedActivity.duration || ''))
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

// Update AccommodationEditDialog to include LocationSearch
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

          <LocationSearch
            onLocationSelect={({ lat, lng }) => {
              setEdited({
                ...edited,
                coordinates: { lat, lng }
              });
            }}
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

// Update TransportationEditDialog to show title first
function TransportationEditDialog({
  transportation,
  onSave,
  trigger,
  onAddTransportation
}: {
  transportation: TransportationDetails;
  onSave: (updatedTransportation: TransportationDetails) => void;
  trigger: React.ReactNode;
  onAddTransportation?: (transportation: TransportationDetails) => void;
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
              placeholder={edited.type === 'scheduled' ? "Flight to Paris" : "Rental Car"}
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
  onEditTransportation?: (updatedTransportation: TransportationDetails) => void;
  onAddTransportation?: (transportation: TransportationDetails) => void;
  recommendations?: ActivityItem[];
  isFirstCard?: boolean;
  isLastCard?: boolean;
  startDate?: Date;
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

function formatDayHeader(startDate: Date, day: number): string {
  const currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + day - 1);
  return `${format(currentDate, 'EEE')}, ${format(currentDate, 'dd.MM')}. (day ${day})`;
}

function TravelDayCard({
  day,
  accommodation,
  transportation,
  activities = [],
  onRemoveActivity,
  onAddActivity,
  onEditActivity,
  onEditAccommodation,
  onEditTransportation,
  recommendations = [],
  isFirstCard = false,
  isLastCard = false,
  startDate = new Date(),
  onAddTransportation
}: TravelDayCardProps) {

  const isWithinStay = accommodation
    ? (day >= accommodation.startDay && day <= accommodation.endDay)
    : false;
  const isCheckInDay = accommodation ? day === accommodation.startDay : false;
  const isCheckOutDay = accommodation ? day === accommodation.endDay : false;

  const accomHours = isWithinStay && accommodation ?
    (isCheckInDay ?
      getHourRange(accommodation.checkInTime, "23:59") :
      isCheckOutDay ?
        getHourRange("00:00", accommodation.checkOutTime) :
        getHourRange("00:00", "23:59")
    ) : [];

  const transHours = transportation ? (
    Array.isArray(transportation) ?
      transportation.flatMap(transport => transport.departureTime && transport.arrivalTime ? getHourRange(transport.departureTime, transport.arrivalTime) : []) :
      transportation.type === 'continuous' ?
        getHourRange("00:00", "23:59") :
        transportation.departureTime && transportation.arrivalTime ?
          getHourRange(transportation.departureTime, transportation.arrivalTime) :
          []
  ) : [];

  const activityHours = activities ? activities.flatMap(activity =>
    getHourRange(activity.time, activity.duration)
  ) : [];

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
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${
              accommodation?.coordinates
                ? `${accommodation.coordinates.lng},${accommodation.coordinates.lat},12,0`
                : '0,0,2,0'
              }/600x300@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`}
            alt={`Map of day ${day}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90">
            <div className="absolute bottom-4 left-4">
              <h3 className="text-xl font-semibold text-black">
                {formatDayHeader(startDate, day)}
              </h3>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {accommodation && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-sm font-medium text-emerald-700">
                    Accommodation
                  </h4>
                </div>
              </div>
              <div className="relative bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <div className="relative z-10">
                  {isWithinStay ? (
                    <div className="flex justify-between items-start">
                      <div>
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
                      </div>
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
          )}

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
                      title: "New Transportation",
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
                  <div key={idx} className="relative bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <TransportationContent
                      transportation={transport}
                      onEdit={onEditTransportation}
                    />
                  </div>
                ))}
              </div>
            ) : transportation ? (
              <div className="relative bg-amber-50 rounded-lg p-3 border border-amber-200">
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
                            <span className="text-gray-500 text-sm">
                              {suggestedTime} - {suggestedEndTime}
                            </span>
                            <span className="text-gray-700">
                              {activity.title}
                            </span>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {activity.description}
                            </p>
                          )}
                        </div>
                        {onAddActivity && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="relative z-10 h-8 w-8 p-0"
                            onClick={() => onAddActivity({
                              ...activity,
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

// Helper component for transportation card content
function TransportationContent({
  transportation,
  onEdit
}: {
  transportation: TransportationDetails;
  onEdit?: (updatedTransportation: TransportationDetails) => void;
}) {
  return (
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
            {transportation.type === 'scheduled' && (
              <div className="mt-1">
                <span className="font-medium">Departure:</span> {transportation.departureTime} |{" "}
                <span className="font-medium">Arrival:</span> {transportation.arrivalTime}
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
  );
}

export default TravelDayCard;