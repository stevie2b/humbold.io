import { createEvents, type EventAttributes } from "ics";

interface ActivityItem {
  time: string;
  title: string;
}

interface DayItinerary {
  day: number;
  accommodation: {
    title: string;
    details: string;
  };
  transportation: {
    title: string;
    details: string;
  };
  activities: ActivityItem[];
}

export function generateICS(itinerary: DayItinerary[]) {
  if (!itinerary || !Array.isArray(itinerary)) {
    console.error('Invalid itinerary data');
    return;
  }

  // Get the current date to use as a base for the itinerary
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  const events: EventAttributes[] = [];

  itinerary.forEach((day, index) => {
    const currentDate = new Date(baseDate);
    currentDate.setDate(currentDate.getDate() + index);

    // Add accommodation event
    events.push({
      title: day.accommodation.title,
      description: day.accommodation.details,
      start: [
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate(),
        9, // Default check-in time
        0,
      ],
      duration: { hours: 1 },
    });

    // Add transportation event
    events.push({
      title: day.transportation.title,
      description: day.transportation.details,
      start: [
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate(),
        10, // Default transportation time
        0,
      ],
      duration: { hours: 1 },
    });

    // Add activities
    day.activities.forEach((activity) => {
      const [hours, minutes] = activity.time.split(':').map(Number);
      events.push({
        title: activity.title,
        start: [
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          currentDate.getDate(),
          hours || 12,
          minutes || 0,
        ],
        duration: { hours: 2 }, // Default duration for activities
      });
    });
  });

  createEvents(events, (error, value) => {
    if (error) {
      console.error("Error generating ICS file:", error);
      return;
    }

    if (value) {
      const blob = new Blob([value], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'travel-itinerary.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  });
}