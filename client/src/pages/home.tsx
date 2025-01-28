import { useEffect } from "react";
import { motion } from "framer-motion";
import Questionnaire from "@/components/travel/questionnaire";

export default function Home() {
  useEffect(() => {
    document.title = "AI Travel Planner";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            AI Travel Planner
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Let's plan your perfect trip together! Answer a few questions and get personalized recommendations.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Questionnaire />
        </motion.div>
      </div>
    </div>
  );
}
