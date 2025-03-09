import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export type Step = {
  id: string;
  label: string;
  status: "waiting" | "current" | "completed";
};

interface ProgressStepsProps {
  steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="space-y-4 mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            {step.status === "completed" ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </motion.div>
            ) : step.status === "current" ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-6 h-6 text-primary" />
              </motion.div>
            ) : (
              <Circle className="w-6 h-6 text-muted-foreground" />
            )}
            {index < steps.length - 1 && (
              <div className="absolute top-full left-1/2 w-px h-4 bg-border" />
            )}
          </div>
          <div>
            <p className={`text-sm font-medium ${
              step.status === "waiting" 
                ? "text-muted-foreground"
                : "text-foreground"
            }`}>
              {step.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
