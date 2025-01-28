import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface DestinationCardProps {
  destination: {
    id: string;
    name: string;
    image: string;
    description: string;
  };
  selected: boolean;
  onSelect: () => void;
}

export default function DestinationCard({ destination, selected, onSelect }: DestinationCardProps) {
  const { name, description, image } = destination;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          selected ? "ring-2 ring-primary" : ""
        }`}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div
            className="w-full h-48 rounded-lg bg-cover bg-center mb-4"
            style={{ 
              backgroundImage: `url(${image})`,
              backgroundColor: '#f3f4f6' // Fallback color
            }}
          />
          <h3 className="font-semibold text-lg mb-2">{name}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}