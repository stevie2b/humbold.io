import React, { useState } from "react";
import TravelItinerary from "@/components/travel/travel-itinerary";

interface Destination {
  id: number;
  name: string;
  description: string;
  image: string;
}

const exampleDestinations: Destination[] = [
  { id: 1, name: "Paris", description: "Die Stadt der Liebe und Heimat des Eiffelturms.", image: "https://via.placeholder.com/300x200?text=Paris" },
  { id: 2, name: "Tokyo", description: "Erkunde Tokio und die Umgebung mit Kyoto und Hakone.", image: "https://via.placeholder.com/300x200?text=Tokyo" },
  { id: 3, name: "Sydney", description: "Von der Stadt bis zu den Blue Mountains - 10 Tage Abenteuer.", image: "https://via.placeholder.com/300x200?text=Sydney" },
  { id: 4, name: "Italien", description: "14-tägige Rundreise durch Italien: Rom, Florenz, Venedig, Mailand.", image: "https://via.placeholder.com/300x200?text=Italien" },
];

const itineraries = {
  Paris: [
    {
      day: 1,
      accommodation: { title: "Hotel Paris Centre", details: "Zentral gelegen", checkInTime: "14:00", checkOutTime: "12:00", startDay: 1, endDay: 3, coordinates: { lat: 48.8566, lng: 2.3522 } },
      activities: [
        { time: "14:00", title: "Eiffelturm", duration: "2h", location: { lat: 48.8584, lng: 2.2945 } },
        { time: "17:00", title: "Louvre", duration: "3h", location: { lat: 48.8606, lng: 2.3376 } },
      ],
    },
    {
      day: 2,
      activities: [
        { time: "10:00", title: "Notre Dame", duration: "2h", location: { lat: 48.853, lng: 2.3499 } },
        { time: "14:00", title: "Seine-Bootstour", duration: "1.5h", location: { lat: 48.8595, lng: 2.3266 } },
      ],
    },
    {
      day: 3,
      activities: [
        { time: "09:00", title: "Sacré-Cœur", duration: "1.5h", location: { lat: 48.8867, lng: 2.3431 } },
        { time: "12:00", title: "Champs-Élysées", duration: "2h", location: { lat: 48.8698, lng: 2.3073 } },
      ],
    },
  ],
  Tokyo: [
    {
      day: 1,
      accommodation: { title: "Tokyo Tower Hotel", details: "Nähe Shinjuku", checkInTime: "15:00", checkOutTime: "11:00", startDay: 1, endDay: 7, coordinates: { lat: 35.6895, lng: 139.6917 } },
      activities: [{ time: "16:00", title: "Shibuya Crossing", duration: "1h", location: { lat: 35.6595, lng: 139.7005 } }],
    },
    { day: 2, activities: [{ time: "10:00", title: "Senso-ji Tempel", duration: "2h", location: { lat: 35.7148, lng: 139.7967 } }] },
    { day: 3, activities: [{ time: "11:00", title: "Ghibli Museum", duration: "3h", location: { lat: 35.6961, lng: 139.5703 } }] },
    { day: 4, transportation: { type: "scheduled", title: "Zug nach Kyoto", details: "Shinkansen Tokyo-Kyoto", departureTime: "08:00", arrivalTime: "11:00", route: { from: { lat: 35.6895, lng: 139.6917 }, to: { lat: 35.0116, lng: 135.7681 } } }, activities: [{ time: "12:00", title: "Fushimi Inari", duration: "2h", location: { lat: 34.9671, lng: 135.7727 } }] },
    { day: 5, activities: [{ time: "10:00", title: "Kinkaku-ji Tempel", duration: "2h", location: { lat: 35.0394, lng: 135.7292 } }] },
    { day: 6, transportation: { type: "scheduled", title: "Zug nach Hakone", details: "Shinkansen Kyoto-Hakone", departureTime: "10:00", arrivalTime: "13:00", route: { from: { lat: 35.0116, lng: 135.7681 }, to: { lat: 35.2325, lng: 139.1062 } } }, activities: [{ time: "15:00", title: "Hakone Onsen", duration: "3h", location: { lat: 35.2325, lng: 139.1062 } }] },
    { day: 7, activities: [{ time: "10:00", title: "Rückkehr nach Tokyo", duration: "2h", location: { lat: 35.6895, lng: 139.6917 } }] },
  ],
};

const Explore = () => {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Entdecke neue Reiseziele</h1>
      {selectedDestination ? (
        <>
          <button onClick={() => setSelectedDestination(null)} className="mb-4 p-2 bg-gray-200 rounded">
            Zurück zur Übersicht
          </button>
          <TravelItinerary itinerary={itineraries[selectedDestination.name]} />
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exampleDestinations.map((destination) => (
            <div key={destination.id} className="border rounded-lg overflow-hidden shadow-md cursor-pointer"
              onClick={() => setSelectedDestination(destination)}>
              <img src={destination.image} alt={destination.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h2 className="text-lg font-bold">{destination.name}</h2>
                <p className="text-gray-600">{destination.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
