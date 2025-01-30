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
    { day: 1, accommodation: { title: "Hotel Paris Centre", details: "Zentral gelegen", coordinates: { lat: 48.8566, lng: 2.3522 } }, transportation: { type: "scheduled", title: "Flug nach Paris", details: "Direktflug von Berlin", route: { from: { lat: 52.5200, lng: 13.4050 }, to: { lat: 48.8566, lng: 2.3522 } } }, activities: [{ time: "14:00", title: "Eiffelturm", duration: "2h", location: { lat: 48.8584, lng: 2.2945 } }] },
    { day: 2, activities: [{ time: "10:00", title: "Louvre Museum", duration: "3h", location: { lat: 48.8606, lng: 2.3376 } }] },
    { day: 3, activities: [{ time: "09:00", title: "Sacré-Cœur", duration: "1.5h", location: { lat: 48.8867, lng: 2.3431 } }] }
  ],
  Tokyo: Array.from({ length: 7 }, (_, i) => ({ day: i + 1, accommodation: { title: `Hotel Tag ${i + 1}`, details: "Komfortable Unterkunft", coordinates: { lat: 35.6895, lng: 139.6917 } }, transportation: { type: "scheduled", title: `Zugreise Tag ${i + 1}`, details: "Shinkansen zu einem neuen Ziel" }, activities: [{ time: "10:00", title: `Sehenswürdigkeit Tag ${i + 1}`, duration: "5h" }] })),
  Sydney: Array.from({ length: 10 }, (_, i) => ({ day: i + 1, accommodation: { title: `Hotel Sydney Tag ${i + 1}`, details: "Nahe am Strand", coordinates: { lat: -33.8688, lng: 151.2093 } }, transportation: { type: "scheduled", title: `Flug oder Bus Tag ${i + 1}`, details: "Reise zum nächsten Ziel" }, activities: [{ time: "10:00", title: `Erkundungstag ${i + 1}`, duration: "5h" }] })),
  Italien: Array.from({ length: 14 }, (_, i) => ({ day: i + 1, accommodation: { title: `Hotel Italien Tag ${i + 1}`, details: "Stadthotel", coordinates: { lat: 41.9028, lng: 12.4964 } }, transportation: { type: "scheduled", title: `Zugreise durch Italien Tag ${i + 1}`, details: "Reise zwischen Städten" }, activities: [{ time: "10:00", title: `Städtetour Tag ${i + 1}`, duration: "6h" }] }))
};

const Explore = () => {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  console.log("Selected destination:", selectedDestination);
  console.log("Itinerary being passed:", selectedDestination ? itineraries[selectedDestination.name] : "No destination selected");

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