import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Analytics from "@/pages/analytics";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="feature-generator-theme">
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background text-foreground">
          <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center bg-background/80 backdrop-blur-sm z-50">
            <nav>
              <a href="/" className="mr-4 hover:text-primary">Home</a>
              <a href="/analytics" className="hover:text-primary">Analytics</a>
            </nav>
            <ThemeToggle />
          </div>
          <div className="pt-16">
            <Router />
          </div>
          <Toaster />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;