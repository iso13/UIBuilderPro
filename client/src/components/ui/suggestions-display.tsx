import { Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SuggestionsDisplayProps {
  suggestions: string[];
  isLoading: boolean;
}

export function SuggestionsDisplay({ suggestions, isLoading }: SuggestionsDisplayProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="mt-2 text-sm text-muted-foreground flex items-center gap-2"
      >
        <Lightbulb className="h-4 w-4 animate-pulse" />
        <span>AI is analyzing your story to suggest feature titles...</span>
      </motion.div>
    );
  }

  if (!suggestions.length) {
    return null;
  }

  return (
    <div className="mt-2">
      <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4" />
        <span>Suggested Feature Titles:</span>
      </p>
      <AnimatePresence>
        <ul className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.1 }}
              className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md cursor-pointer hover:bg-muted"
            >
              {suggestion}
            </motion.li>
          ))}
        </ul>
      </AnimatePresence>
    </div>
  );
}