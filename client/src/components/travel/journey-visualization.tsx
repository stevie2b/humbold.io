import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";

interface JourneyVisualizationProps {
  destinations: Array<{
    id: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
  }>;
  season?: string;
}

export default function JourneyVisualization({ destinations, season }: JourneyVisualizationProps) {
  if (!destinations.length) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const lineVariants = {
    hidden: { pathLength: 0 },
    visible: {
      pathLength: 1,
      transition: { duration: 1, ease: "easeInOut" },
    },
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/50">
      <h3 className="text-xl font-semibold mb-6">Your Travel Journey</h3>
      <motion.div
        className="relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Timeline */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

        {/* Destinations */}
        <div className="space-y-8 relative">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              className="ml-12 relative"
              variants={itemVariants}
            >
              {/* Connection Line */}
              {index > 0 && (
                <motion.svg
                  className="absolute -top-8 -left-8 w-8 h-8"
                  viewBox="0 0 32 32"
                  fill="none"
                  variants={lineVariants}
                >
                  <motion.path
                    d="M0 0 L32 32"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    variants={lineVariants}
                  />
                </motion.svg>
              )}

              {/* Timeline Dot */}
              <div className="absolute -left-[2.5rem] w-4 h-4 rounded-full bg-primary" />

              {/* Destination Card */}
              <div className="p-4 rounded-lg bg-card border">
                <h4 className="font-medium text-lg">{destination.name}</h4>
                {destination.startDate && destination.endDate ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(destination.startDate, "MMM d")} -{" "}
                    {format(destination.endDate, "MMM d, yyyy")}
                  </p>
                ) : season ? (
                  <p className="text-sm text-muted-foreground mt-1 capitalize">
                    {season}
                  </p>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Card>
  );
}
