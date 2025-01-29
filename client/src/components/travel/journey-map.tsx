import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Location {
  title: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'accommodation' | 'activity' | 'transportation';
  day: number;
}

interface JourneyMapProps {
  locations: Location[];
  className?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (!MAPBOX_TOKEN) {
  console.error('Mapbox token not found. Map functionality will be limited.');
}

// Initialize mapbox
mapboxgl.accessToken = MAPBOX_TOKEN || '';

export function JourneyMap({ locations, className = '' }: JourneyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    try {
      // Initialize map
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: locations[0]?.coordinates || [-74.5, 40],
        zoom: 9
      });

      map.current = newMap;

      // Add markers for all locations
      locations.forEach(location => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '25px';
        el.style.height = '25px';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';

        // Different colors for different types
        switch (location.type) {
          case 'accommodation':
            el.style.backgroundColor = '#10b981'; // Emerald
            break;
          case 'activity':
            el.style.backgroundColor = '#3b82f6'; // Blue
            break;
          case 'transportation':
            el.style.backgroundColor = '#f59e0b'; // Amber
            break;
        }

        // Add popup
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <strong>${location.title}</strong>
            <p>Day ${location.day}</p>
          `);

        new mapboxgl.Marker(el)
          .setLngLat([location.coordinates.lng, location.coordinates.lat])
          .setPopup(popup)
          .addTo(newMap);
      });

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl());

      // Draw lines connecting locations in order
      if (locations.length > 1) {
        newMap.on('load', () => {
          if (newMap) {
            newMap.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: locations.map(loc => [loc.coordinates.lng, loc.coordinates.lat])
                }
              }
            });

            newMap.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#888',
                'line-width': 3,
                'line-dasharray': [2, 1]
              }
            });
          }
        });
      }

      // Cleanup
      return () => {
        if (map.current) {
          map.current.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [locations]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-gray-500">Map view is currently unavailable. Please check if the VITE_MAPBOX_ACCESS_TOKEN environment variable is set.</p>
      </div>
    );
  }

  return (
    <div className={`relative min-h-[400px] ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
    </div>
  );
}