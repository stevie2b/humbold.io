import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { format, differenceInDays, addMonths, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SEASONS, TRAVELER_TYPES, ACTIVITIES } from "@/lib/constants";
import { generateICS } from "@/lib/ics-generator";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import DestinationCard from "./destination-card";
import TravelItinerary from "./travel-itinerary";
import { Slider } from "@/components/ui/slider";

interface Destination {
  id: number; // Make id required
  name: string;
  imageUrl?: string;
  description?: string;
  seasonalRatings: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  };
}

// Now SelectedDestination is the same as Destination
type SelectedDestination = Destination;

const formSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  season: z.string().optional(),
  destinations: z.array(z.string()).min(1, "Please select at least one destination"),
  travelerType: z.string(),
  activities: z.array(z.string()).min(1),
  customActivity: z.string().optional(),
  numberOfDays: z.number().min(2).max(30),
}).refine((data) => {
  return (data.startDate && data.endDate) || data.season;
}, {
  message: "Please select either a date range or a season",
});

type FormValues = z.infer<typeof formSchema>;

const searchDestinations = async (query: string) => {
  if (!query || query.length < 2) return [];

  try {
    // First try Mapbox geocoding for cities and countries
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?types=place,country&access_token=${mapboxToken}`
    );

    if (!response.ok) {
      throw new Error('Mapbox geocoding failed');
    }

    const data = await response.json();
    return data.features.map((feature: any) => {
      const context = feature.context || [];
      const country = context.find((c: any) => c.id.startsWith('country'))?.text || '';

      return {
        id: Math.floor(Math.random() * 1000000), // You might want to generate this differently
        name: feature.text,
        description: `${feature.place_name}`,
        seasonalRatings: {
          spring: 0,
          summer: 0,
          autumn: 0,
          winter: 0
        },
        coordinates: {
          lng: feature.center[0],
          lat: feature.center[1]
        }
      };
    });
  } catch (error) {
    console.error("Search error:", error);
    // Fallback to existing API
    const response = await fetch(`/api/destinations/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search destinations');
    }
    const data = await response.json();
    return (data || []).map((dest: any) => {
      // Ensure each destination has a valid ID
      const id = typeof dest.id === 'number' ? dest.id : Math.floor(Math.random() * 1000000);
      return {
        id,
        name: dest.name || 'Unknown Destination',
        description: dest.description || '',
        seasonalRatings: dest.seasonalRatings || {
          spring: 0,
          summer: 0,
          autumn: 0,
          winter: 0
        },
        imageUrl: dest.imageUrl || ''
      };
    });
  }
};

export default function Questionnaire() {
  const [step, setStep] = useState(1);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [endDateDefaultMonth, setEndDateDefaultMonth] = useState<Date | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<SelectedDestination[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinations: [],
      activities: [],
      customActivity: "",
      numberOfDays: 7, //added default value
    },
  });

  const destinationsQuery = useQuery({
    queryKey: ["/api/destinations/search", searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, query] = queryKey;
      if (!query || query.length < 2) {
        return [];
      }

      try {
        return await searchDestinations(query);
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description: "Failed to search destinations. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!searchQuery && searchQuery.length >= 2,
  });

  const getCurrentSeason = () => {
    if (form.watch("season")) {
      return form.watch("season");
    }
    if (form.watch("startDate")) {
      const date = new Date(form.watch("startDate")!);
      const month = date.getMonth();
      if (month >= 2 && month <= 4) return "spring";
      if (month >= 5 && month <= 7) return "summer";
      if (month >= 8 && month <= 10) return "autumn";
      return "winter";
    }
    return null;
  };

  const recommendedDestinationsQuery = useQuery({
    queryKey: ["/api/destinations/recommended", getCurrentSeason()],
    queryFn: async () => {
      const season = getCurrentSeason();
      if (!season) return [];

      try {
        const response = await fetch(`/api/destinations/recommended?season=${season}`);
        if (!response.ok) {
          throw new Error("Failed to fetch recommended destinations");
        }
        const data = await response.json();
        return data as Destination[];
      } catch (error) {
        console.error("Error fetching recommended destinations:", error);
        return [];
      }
    },
    enabled: !!getCurrentSeason(),
  });

  useEffect(() => {
    const formDestinations = form.watch("destinations") || []; // Ensure we have an array
    const allDestinations = [
      ...(destinationsQuery.data || []),
      ...(recommendedDestinationsQuery.data || [])
    ].filter(dest => dest && typeof dest.id === 'number'); // Filter out invalid destinations

    setSelectedDestinations(prevSelected => {
      const newSelected = [...prevSelected];

      // Filter out any destinations that are no longer selected
      const filtered = newSelected.filter(dest =>
        dest && dest.id && formDestinations.includes(dest.id.toString())
      );

      // Add any newly selected destinations
      formDestinations.forEach(destId => {
        if (!filtered.find(d => d && d.id && d.id.toString() === destId)) {
          const dest = allDestinations.find(d => d && d.id && d.id.toString() === destId);
          if (dest) {
            filtered.push(dest);
          }
        }
      });

      return filtered;
    });
  }, [
    form.watch("destinations"),
    destinationsQuery.data,
    recommendedDestinationsQuery.data
  ]);

  const searchStatus = destinationsQuery.status === "pending" ? (
    <p className="text-sm text-muted-foreground">Searching...</p>
  ) : destinationsQuery.status === "error" ? (
    <p className="text-sm text-destructive">Error searching destinations</p>
  ) : destinationsQuery.data?.length === 0 ? (
    <p className="text-sm text-muted-foreground">No destinations found</p>
  ) : null;

  useEffect(() => {
    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");
    if (startDate && endDate) {
      form.setValue("season", undefined);
    }
  }, [form.watch("startDate"), form.watch("endDate")]);

  const planMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      return response.json();
    },
    onSuccess: (data) => {
      generateICS(data.itinerary);
      setStep(5);
      toast({
        title: "Success!",
        description: "Your travel itinerary has been generated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate travel plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Submitting form data:", data);
    planMutation.mutate({
      ...data,
      numberOfDays: data.numberOfDays || 7,
    });
  };

  const nextStep = () => {
    const formState = form.getValues();

    if (step === 1) {
      const hasSelectedDates = !!(formState.startDate && formState.endDate);
      const hasSelectedSeason = !!formState.season;
      const hasValidTimeSelection = hasSelectedDates || hasSelectedSeason;
      if (!hasValidTimeSelection) {
        toast({
          title: "Validation Error",
          description: "Please select either a date range or a season",
          variant: "destructive",
        });
        return;
      }
    } else if (step === 2) {
      if (!formState.destinations || formState.destinations.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one destination",
          variant: "destructive",
        });
        return;
      }
    }

    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const hasSelectedDates = !!(form.watch("startDate") && form.watch("endDate"));
  const hasSelectedSeason = !!form.watch("season");
  const hasValidTimeSelection = hasSelectedDates || hasSelectedSeason;


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {step === 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div
                  className={`space-y-4 ${hasSelectedSeason ? "opacity-50" : ""}`}
                  onClick={() => {
                    if (hasSelectedSeason) {
                      form.setValue("season", undefined);
                    }
                  }}
                >
                  <h3 className="text-lg font-semibold">Select Travel Dates</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    disabled={hasSelectedSeason}
                                    className="w-full"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : "Select start date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      field.onChange(date);
                                      if (date) {
                                        // Get the last day of the selected month
                                        const lastDayOfMonth = endOfMonth(date);
                                        const daysUntilMonthEnd = differenceInDays(lastDayOfMonth, date);

                                        // If the selected date is within the last 7 days of the month,
                                        // show the next month for end date selection
                                        if (daysUntilMonthEnd <= 7) {
                                          setEndDateDefaultMonth(addMonths(date, 1));
                                        } else {
                                          // Otherwise, show the same month
                                          setEndDateDefaultMonth(date);
                                        }
                                        setEndDateOpen(true);
                                      }
                                    }}
                                    disabled={(date) => date < new Date() || date > new Date(2025, 11, 31)}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <div>
                              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    disabled={hasSelectedSeason}
                                    className="w-full"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : "Select end date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    defaultMonth={endDateDefaultMonth}
                                    onSelect={(date) => {
                                      field.onChange(date);
                                      setEndDateOpen(false);
                                    }}
                                    disabled={(date) =>
                                      date < (form.watch("startDate") || new Date()) ||
                                      date > new Date(2025, 11, 31)
                                    }
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {hasSelectedDates && form.watch("startDate") && form.watch("endDate") && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Duration: {differenceInDays(form.watch("endDate")!, form.watch("startDate")!) + 1} days
                    </p>
                  )}
                </div>

                <div
                  className={`space-y-4 ${hasSelectedDates ? "opacity-50" : ""}`}
                  onClick={() => {
                    if (hasSelectedDates) {
                      form.setValue("startDate", undefined);
                      form.setValue("endDate", undefined);
                      setEndDateOpen(false);
                    }
                  }}
                >
                  <h3 className="text-lg font-semibold">Or Select a Season</h3>
                  <FormField
                    control={form.control}
                    name="season"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div>
                            <RadioGroup
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue("startDate", undefined);
                                form.setValue("endDate", undefined);
                                setEndDateOpen(false);
                              }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4"
                              disabled={hasSelectedDates}
                            >
                              {SEASONS.map((season) => (
                                <div key={season.value} className="flex items-center space-x-2">
                                  <RadioGroupItem value={season.value} id={season.value} />
                                  <label
                                    htmlFor={season.value}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {season.label}
                                  </label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Add number of days slider */}
                  <div className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Number of Days</h3>
                    <FormField
                      control={form.control}
                      name="numberOfDays"
                      defaultValue={7}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-4">
                              <Slider
                                min={2}
                                max={30}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="w-full"
                              />
                              <p className="text-sm text-muted-foreground text-center">
                                {field.value} days
                              </p>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="destinations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold mb-4">Where would you like to go?</FormLabel>
                    <FormControl>
                      <div className="space-y-6">
                        {/* Selected Destinations */}
                        {selectedDestinations.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Selected destinations:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedDestinations.filter(d => d && d.id).map((destination) => (
                                <Badge
                                  key={destination.id}
                                  variant="secondary"
                                  className="pl-2 pr-1 py-1 flex items-center gap-1"
                                >
                                  {destination.name}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      const newDestinations = field.value
                                        .filter(id => id !== destination.id.toString());
                                      form.setValue('destinations', newDestinations);
                                    }}
                                    className="hover:bg-muted rounded-full p-1"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Destination Search */}
                        <div>
                          <FormLabel>Search for destinations</FormLabel>
                          <Input
                            placeholder="Type to search destinations (min. 2 characters)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          {searchStatus}
                          {destinationsQuery.data && destinationsQuery.data.length > 0 && (
                            <div className="border rounded-lg divide-y mt-4">
                              {destinationsQuery.data.map((destination) => (
                                <div
                                  key={destination.id}
                                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                                    field.value.includes(destination.id.toString())
                                      ? 'bg-primary/5'
                                      : ''
                                  }`}
                                  onClick={() => {
                                    const currentDestinations = field.value;
                                    const destId = destination.id.toString();
                                    if (currentDestinations.includes(destId)) {
                                      form.setValue(
                                        'destinations',
                                        currentDestinations.filter(id => id !== destId)
                                      );
                                    } else {
                                      form.setValue('destinations', [...currentDestinations, destId]);
                                    }
                                  }}
                                >
                                  <div>
                                    <span className="text-sm font-medium">{destination.name}</span>
                                    {destination.description && (
                                      <p className="text-xs text-muted-foreground mt-1">{destination.description}</p>
                                    )}
                                  </div>
                                  {field.value.includes(destination.id.toString()) && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recommended Destinations */}
                        <div className="mt-8">
                          <h4 className="text-md font-medium mb-2">
                            {getCurrentSeason()
                              ? `Best places to visit in ${getCurrentSeason()}`
                              : "Popular destinations"}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Curated recommendations based on your selected time period
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recommendedDestinationsQuery.data?.slice(0, 4).map((destination) => (
                              <DestinationCard
                                key={destination.id}
                                destination={destination}
                                selected={field.value.includes(destination.id.toString())}
                                onSelect={() => {
                                  const currentDestinations = field.value;
                                  const destId = destination.id.toString();
                                  if (currentDestinations.includes(destId)) {
                                    form.setValue(
                                      'destinations',
                                      currentDestinations.filter(id => id !== destId)
                                    );
                                  } else {
                                    form.setValue('destinations', [...currentDestinations, destId]);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="travelerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">What type of traveler are you?</FormLabel>
                    <FormControl>
                      <div>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
                        >
                          {TRAVELER_TYPES.map((type) => (
                            <div key={type.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={type.value} id={type.value} />
                              <label
                                htmlFor={type.value}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {type.label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="activities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">What are your preferred activities?</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {ACTIVITIES.filter(activity => activity.value !== 'other').map((activity) => (
                            <div key={activity.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={activity.value}
                                checked={field.value?.includes(activity.value)}
                                onChange={(e) => {
                                  const updatedActivities = e.target.checked
                                    ? [...(field.value || []), activity.value]
                                    : field.value?.filter((v) => v !== activity.value) || [];
                                  field.onChange(updatedActivities);
                                }}
                                className="h-4 w-4"
                              />
                              <label htmlFor={activity.value} className="text-sm font-medium leading-none">
                                {activity.label}
                              </label>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name="customActivity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Other activities (optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter your own activities..."
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      if (e.target.value && !form.watch("activities").includes("custom")) {
                                        form.setValue("activities", [...form.watch("activities"), "custom"]);
                                      } else if (!e.target.value) {
                                        form.setValue("activities", form.watch("activities").filter(a => a !== "custom"));
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <TravelItinerary itinerary={planMutation.data?.itinerary || []} />

            <div className="flex justify-center mt-8">
              <Button
                type="button"
                onClick={() => setStep(1)}
                variant="outline"
                className="mr-4"
              >
                Plan Another Trip
              </Button>
              <Button
                type="button"
                onClick={() => generateICS(planMutation.data?.itinerary)}
              >
                Download Itinerary
              </Button>
            </div>
          </div>
        )}

        {step < 5 && (
          <div className="flex justify-between">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
            {step < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={
                  step === 1 && !hasValidTimeSelection ||
                  step === 2 && form.watch("destinations").length === 0
                }
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={planMutation.isPending}>
                {planMutation.isPending ? "Generating Plan..." : "Generate Plan"}
              </Button>
            )}
          </div>
        )}
      </form>
    </Form>
  );
}