import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import type { Feature } from "@shared/schema";

interface FeatureViewDialogProps {
  feature: Feature | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureViewDialog({ feature, open, onOpenChange }: FeatureViewDialogProps) {
  if (!feature) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl">{feature.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div>
            <h3 className="text-sm font-medium mb-2">User Story</h3>
            <p className="text-muted-foreground">{feature.story}</p>
          </div>
          {feature.generatedContent && (
            <div>
              <h3 className="text-sm font-medium mb-2">Generated Feature</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap text-sm">
                {feature.generatedContent}
              </pre>
            </div>
          )}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-800"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
