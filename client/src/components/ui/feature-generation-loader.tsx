import { motion } from "framer-motion";
import { Wand2, FileText, CheckCircle } from "lucide-react";

interface Step {
  icon: JSX.Element;
  label: string;
  description: string;
}

interface FeatureGenerationLoaderProps {
  currentStep: number;
}

export function FeatureGenerationLoader({ currentStep }: FeatureGenerationLoaderProps) {
  const steps: Step[] = [
    {
      icon: <Wand2 className="h-6 w-6" />,
      label: "Analyzing Input",
      description: "Processing your feature requirements",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      label: "Generating Scenarios",
      description: "Creating comprehensive test scenarios",
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      label: "Finalizing",
      description: "Polishing and formatting the output",
    },
  ];

  return (
    <div className="space-y-8 py-4">
      {steps.map((step, index) => {
        const isActive = currentStep === index;
        const isComplete = currentStep > index;

        return (
          <div key={step.label} className="relative">
            <motion.div
              className={`flex items-center gap-4 ${
                isActive 
                  ? "text-primary" 
                  : isComplete 
                    ? "text-primary/80" 
                    : "text-muted-foreground/80 dark:text-foreground/90"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20 dark:bg-primary/40"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
                <div className={`${
                  isActive 
                    ? "text-primary dark:text-primary"
                    : isComplete 
                      ? "text-primary/80 dark:text-primary/80"
                      : "text-foreground/60 dark:text-foreground/90"
                }`}>
                  {step.icon}
                </div>
              </div>
              <div>
                <p className="font-medium dark:text-foreground/100">{step.label}</p>
                <p className="text-sm text-muted-foreground dark:text-foreground/80">{step.description}</p>
              </div>
            </motion.div>
            {index < steps.length - 1 && (
              <motion.div
                className="absolute left-3 top-10 h-8 w-px bg-border dark:bg-border/80"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: isComplete ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}