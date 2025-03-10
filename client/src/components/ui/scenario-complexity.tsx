import { motion } from "framer-motion";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Progress } from "./progress";
import { 
  Activity,
  AlertCircle,
  ArrowRight,
  Binary,
  ListTree,
  Layers
} from "lucide-react";

interface ComplexityFactor {
  name: string;
  value: number;
  icon: JSX.Element;
  description: string;
}

interface ScenarioComplexityProps {
  name: string;
  complexity: number;
  factors: {
    stepCount: number;
    dataDependencies: number;
    conditionalLogic: number;
    technicalDifficulty: number;
  };
  explanation: string;
}

function getComplexityColor(value: number): string {
  if (value <= 3) return "bg-green-500";
  if (value <= 6) return "bg-yellow-500";
  return "bg-red-500";
}

function getComplexityLabel(value: number): string {
  if (value <= 3) return "Simple";
  if (value <= 6) return "Moderate";
  return "Complex";
}

export function ScenarioComplexity({ 
  name, 
  complexity,
  factors,
  explanation
}: ScenarioComplexityProps) {
  const complexityFactors: ComplexityFactor[] = [
    {
      name: "Step Count",
      value: factors.stepCount,
      icon: <Layers className="h-4 w-4" />,
      description: "Number of steps in the scenario"
    },
    {
      name: "Data Dependencies",
      value: factors.dataDependencies,
      icon: <Binary className="h-4 w-4" />,
      description: "Complexity of data inputs and dependencies"
    },
    {
      name: "Conditional Logic",
      value: factors.conditionalLogic,
      icon: <ListTree className="h-4 w-4" />,
      description: "Amount of branching and conditional steps"
    },
    {
      name: "Technical Difficulty",
      value: factors.technicalDifficulty,
      icon: <Activity className="h-4 w-4" />,
      description: "Overall implementation complexity"
    }
  ];

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <motion.div
          className="border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">{name}</h3>
            <span className={`px-2 py-1 rounded text-xs text-white ${getComplexityColor(complexity)}`}>
              {getComplexityLabel(complexity)}
            </span>
          </div>
          <Progress value={complexity * 10} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {explanation}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Hover for details
          </p>
        </motion.div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Complexity Factors</h4>
          <div className="space-y-2">
            {complexityFactors.map((factor) => (
              <div key={factor.name} className="flex items-center gap-2">
                {factor.icon}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{factor.name}</span>
                    <span className="text-sm text-muted-foreground">{factor.value}/10</span>
                  </div>
                  <Progress value={factor.value * 10} className="h-1 mt-1" />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">{explanation}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
