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

const steps: Step[] = [
  {
    id: "feature",
    title: "1. Writing Feature Title",
    description: "A Cucumber feature file starts with a tag and title. The tag helps categorize and organize features, while the title clearly describes what the feature does.",
    example: `# Tag follows the format @lowercaseFirst + UppercaseRest
@userRegistration
Feature: User Registration
# Story follows below the Feature line with no empty line`,
    completed: false,
  },
  {
    id: "story",
    title: "2. Writing User Story",
    description: "The story explains the business value in the format: As a [role], I want [goal], So that [benefit]. This drives the feature's purpose.",
    example: `@userRegistration
Feature: User Registration
As a potential customer
I want to create an account on the platform
So that I can access personalized features`,
    completed: false,
  },
  {
    id: "structure",
    title: "3. Understanding Generated Scenarios",
    description: "Each scenario uses Given-When-Then to describe a specific test case. Background section contains common setup steps used across all scenarios.",
    example: `Background:
  Given the registration page is open

Scenario: Successful Registration
  When valid registration details are entered
  Then a new account should be created
  And a welcome email should be sent

Scenario: Invalid Email Format
  When an invalid email format is used
  Then an error message should be displayed
  And the registration should not proceed`,
    completed: false,
  }
];

export function CucumberGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState<string | null>("feature");

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(current => {
        const next = current + 1;
        setExpandedStep(steps[next].id);
        return next;
      });
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <PlayCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold">Creating Cucumber Features</h2>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {steps.map((step, index) => (
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
              {index < steps.length - 1 && (
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
        {steps.map((step, index) => (
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
                  <pre className="whitespace-pre-wrap text-sm font-mono">{step.example}</pre>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Step through the guide to learn how to create Cucumber features</p>
        <Button
          onClick={nextStep}
          disabled={currentStep >= steps.length - 1}
        >
          {currentStep >= steps.length - 1 ? (
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