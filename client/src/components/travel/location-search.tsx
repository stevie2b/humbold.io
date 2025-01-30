import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { useState } from "react";

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  initialAddress?: string;
  searchType?: string;
}

export function LocationSearch({
  onLocationSelect,
  initialAddress = "",
  searchType = ""
}: LocationSearchProps) {
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
