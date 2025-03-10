import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, PlayCircle, Book, Code, CheckCircle2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Step {
  id: string;
  title: string;
  description: string;
  example: string;
  completed: boolean;
}

const bddSteps: Step[] = [
  {
    id: "given",
    title: "Given (Context)",
    description: "Set up the initial context of the scenario. What's the starting point?",
    example: "Given I am logged in as an administrator\nAnd I am on the dashboard page",
    completed: false,
  },
  {
    id: "when",
    title: "When (Action)",
    description: "Describe the key action the user performs.",
    example: "When I click on 'Create New User'\nAnd I fill in the user details",
    completed: false,
  },
  {
    id: "then",
    title: "Then (Outcome)",
    description: "Verify the expected outcome after the action.",
    example: "Then I should see a success message\nAnd the new user should appear in the user list",
    completed: false,
  },
];

export function CucumberGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState<string | null>("given");

  const nextStep = () => {
    if (currentStep < bddSteps.length - 1) {
      setCurrentStep(current => {
        const next = current + 1;
        setExpandedStep(bddSteps[next].id);
        return next;
      });
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <PlayCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold">Interactive BDD Guide</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {bddSteps.map((step, index) => (
            <motion.div
              key={step.id}
              className="flex items-center"
              animate={{ opacity: index <= currentStep ? 1 : 0.5 }}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {index + 1}
              </div>
              {index < bddSteps.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <Accordion
        type="single"
        value={expandedStep || undefined}
        onValueChange={setExpandedStep}
        className="mb-6"
      >
        {bddSteps.map((step, index) => (
          <AccordionItem key={step.id} value={step.id}>
            <AccordionTrigger
              className={`${
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                {index <= currentStep ? (
                  <Book className="h-4 w-4" />
                ) : (
                  <Code className="h-4 w-4" />
                )}
                {step.title}
                {index < currentStep && (
                  <CheckCircle2 className="h-4 w-4 text-primary ml-2" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">{step.description}</p>
                <div className="bg-muted p-4 rounded-md">
                  <pre className="whitespace-pre-wrap text-sm">{step.example}</pre>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-end">
        <Button
          onClick={nextStep}
          disabled={currentStep >= bddSteps.length - 1}
        >
          {currentStep >= bddSteps.length - 1 ? (
            "Completed!"
          ) : (
            <>
              Next Step
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
