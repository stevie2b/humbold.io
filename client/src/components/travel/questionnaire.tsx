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
import { format, differenceInDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SEASONS, TRAVELER_TYPES, ACTIVITIES } from "@/lib/constants";
import { generateICS } from "@/lib/ics-generator";
import DestinationCard from "./destination-card";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  season: z.string().optional(),
  destinations: z.array(z.string()).min(1, "Please select at least one destination"),
  travelerType: z.string(),
  activities: z.array(z.string()).min(1),
  customActivity: z.string().optional(),
}).refine((data) => {
  return (data.startDate && data.endDate) || data.season;
}, {
  message: "Please select either a date range or a season",
});

export default function Questionnaire() {
  const [step, setStep] = useState(1);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const destinationsQuery = useQuery({
    queryKey: ["/api/destinations/search", searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, query] = queryKey;
      const response = await fetch(`/api/destinations/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    enabled: !!searchQuery && searchQuery.length > 2,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinations: [],
      activities: [],
      customActivity: "",
    },
  });

  useEffect(() => {
    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");
    if (startDate && endDate) {
      form.setValue("season", undefined);
    }
  }, [form.watch("startDate"), form.watch("endDate")]);

  const planMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
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
      toast({
        title: "Success!",
        description: "Your travel itinerary has been generated and downloaded.",
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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    planMutation.mutate(data);
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
                                        setEndDateOpen(true);
                                      }
                                    }}
                                    disabled={(date) =>
                                      date < new Date() || date > new Date(2025, 11, 31)
                                    }
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Where would you like to go?</h3>

              <div className="mb-6">
                <FormField
                  control={form.control}
                  name="destinations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search for destinations</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <Input
                            placeholder="Type to search destinations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          {destinationsQuery.data && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {destinationsQuery.data.map((destination: any) => (
                                <DestinationCard
                                  key={destination.id}
                                  destination={{
                                    id: destination.id.toString(),
                                    name: destination.name,
                                    description: destination.description || "No description available",
                                    image: destination.imageUrl || "https://via.placeholder.com/400x300",
                                  }}
                                  selected={field.value.includes(destination.id.toString())}
                                  onSelect={() => {
                                    const currentDestinations = field.value;
                                    if (currentDestinations.includes(destination.id.toString())) {
                                      field.onChange(currentDestinations.filter(id => id !== destination.id.toString()));
                                    } else {
                                      field.onChange([...currentDestinations, destination.id.toString()]);
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="mb-6">
                <h4 className="text-md font-medium mb-2">
                  {getCurrentSeason()
                    ? `Best places to visit in ${getCurrentSeason()}`
                    : "Popular destinations"}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Curated recommendations based on your selected time period
                </p>
              </div>
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
      </form>
    </Form>
  );
}