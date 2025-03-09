import { Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SuggestionsDisplayProps {
  suggestions: string[];
  isLoading: boolean;
}

export function SuggestionsDisplay({ suggestions, isLoading }: SuggestionsDisplayProps) {
  if (isLoading) {
    return (
      <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
        <Lightbulb className="h-4 w-4 animate-pulse" />
        <span>Analyzing your story...</span>
      </div>
    );
  }

  if (!suggestions.length) {
    return null;
  }

  return (
    <div className="mt-2">
      <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4" />
        <span>AI Suggestions:</span>
      </p>
      <AnimatePresence>
        <ul className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md"
            >
              {suggestion}
            </motion.li>
          ))}
        </ul>
      </AnimatePresence>
    </div>
  );
}
