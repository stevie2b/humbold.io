import { createEvents, type EventAttributes } from "ics";

interface ActivityItem {
  time: string;
  title: string;
  duration?: string;
}

interface DayItinerary {
  day: number;
  accommodation?: {
    title: string;
    details: string;
    checkInTime?: string;
    checkOutTime?: string;
  };
  transportation?: {
    title: string;
    details: string;
    departureTime?: string;
    arrivalTime?: string;
  };
  activities: ActivityItem[];
}

export function generateICS(itinerary: DayItinerary[]): Promise<string> {
  if (!itinerary || !Array.isArray(itinerary)) {
    return Promise.reject('Invalid itinerary data');
  }

  return new Promise((resolve, reject) => {
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    const events: EventAttributes[] = [];

    itinerary.forEach((day, index) => {
      const currentDate = new Date(baseDate);
      currentDate.setDate(currentDate.getDate() + index);

      // Add accommodation event if it exists
      if (day.accommodation) {
        events.push({
          title: day.accommodation.title,
          description: day.accommodation.details,
          start: [
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            currentDate.getDate(),
            day.accommodation.checkInTime ? parseInt(day.accommodation.checkInTime.split(':')[0]) : 14,
            day.accommodation.checkInTime ? parseInt(day.accommodation.checkInTime.split(':')[1]) : 0,
          ],
          duration: { hours: 1 },
        });
      }

      // Add transportation event if it exists
      if (day.transportation) {
        const startTime = day.transportation.departureTime ? day.transportation.departureTime.split(':') : ['10', '00'];
        events.push({
          title: day.transportation.title,
          description: day.transportation.details,
          start: [
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            currentDate.getDate(),
            parseInt(startTime[0]),
            parseInt(startTime[1]),
          ],
          duration: { hours: 1 },
        });
      }

      // Add activities
      day.activities.forEach((activity) => {
        const [hours, minutes] = activity.time.split(':').map(Number);
        let duration = { hours: 1 };

        if (activity.duration) {
          const [durationHours, durationMinutes] = activity.duration.split(':').map(Number);
          duration = {
            hours: durationHours,
            minutes: durationMinutes
          };
        }

        events.push({
          title: activity.title,
          start: [
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            currentDate.getDate(),
            hours || 12,
            minutes || 0,
          ],
          duration,
        });
      });
    });

    createEvents(events, (error, value) => {
      if (error) {
        reject(error);
        return;
      }

      if (value) {
        const blob = new Blob([value], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        resolve(url);
      } else {
        reject(new Error('Failed to create ICS file'));
      }
    });
  });
}