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
    id: "title",
    title: "1. Feature Title",
    description: "Start by naming your feature clearly and concisely. A good title should describe what the feature does from a business perspective.",
    example: "User Registration\n\nOther examples:\n- Shopping Cart Checkout\n- Product Search\n- Order Tracking",
    completed: false,
  },
  {
    id: "story",
    title: "2. User Story",
    description: "Write a user story that explains the business value. Follow the format: As a [role], I want [goal], So that [benefit].",
    example: "As a new visitor\nI want to register for an account\nSo that I can access member-only features",
    completed: false,
  },
  {
    id: "scenarios",
    title: "3. Generated Scenarios",
    description: "The AI will generate scenarios using Given-When-Then format. Each scenario represents a specific test case.",
    example: "@userRegistration\nFeature: User Registration\n\nBackground:\n  Given the registration page is open\n\nScenario: Successful Registration\n  When the user enters valid registration details\n  Then a new account should be created\n  And the user should be logged in",
    completed: false,
  }
];

export function CucumberGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState<string | null>("title");

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

      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Click through each step to learn about the BDD process</p>
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