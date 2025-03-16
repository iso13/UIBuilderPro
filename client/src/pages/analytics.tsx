import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { type Analytics } from "@shared/schema";

interface AnalyticsWithTitle extends Analytics {
  featureTitle?: string;
}

export default function Analytics() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsWithTitle[]>({
    queryKey: ["/api/analytics"],
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Show error or no data state
  if (error || !analytics) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            {error ? "Error loading analytics data" : "No analytics data available yet"}
          </p>
        </div>
      </div>
    );
  }

  // Calculate analytics metrics
  const totalFeatures = analytics.filter(
    (event) => event.eventType === "feature_generation"
  ).length;

  const successfulFeatures = analytics.filter(
    (event) => event.eventType === "feature_generation" && event.successful
  ).length;

  const successRate = totalFeatures ? (successfulFeatures / totalFeatures) * 100 : 0;

  const averageScenarios =
    analytics.reduce((acc, event) => acc + (event.scenarioCount || 0), 0) /
    (totalFeatures || 1);

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track feature generation metrics and usage
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalFeatures}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{successRate.toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avg. Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{averageScenarios.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{analytics.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border ${
                    event.successful
                      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900"
                      : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {event.featureTitle || "Untitled Feature"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.eventType === "feature_generation" ? "Generation" : "View"}
                        {event.successful ? " • Success" : " • Failed"}
                        {event.scenarioCount &&
                          ` • ${event.scenarioCount} scenarios`}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {event.errorMessage && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {event.errorMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}