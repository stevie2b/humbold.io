import { createEvents, type EventAttributes } from "ics";

interface ItineraryItem {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export function generateICS(itinerary: ItineraryItem[]) {
  const events: EventAttributes[] = itinerary.map((item) => {
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    
    return {
      title: item.title,
      description: item.description,
      location: item.location,
      start: [
        start.getFullYear(),
        start.getMonth() + 1,
        start.getDate(),
        start.getHours(),
        start.getMinutes(),
      ],
      end: [
        end.getFullYear(),
        end.getMonth() + 1,
        end.getDate(),
        end.getHours(),
        end.getMinutes(),
      ],
    };
  });

  createEvents(events, (error, value) => {
    if (error) {
      console.error(error);
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
