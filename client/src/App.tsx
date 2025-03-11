import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Analytics from "@/pages/analytics";
import Auth from "@/pages/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

function Navigation() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center bg-background/80 backdrop-blur-sm z-50">
      <nav>
        <a href="/" className="mr-4 hover:text-primary">Home</a>
        <a href="/analytics" className="hover:text-primary">Analytics</a>
      </nav>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()}>
          Logout
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}

function Router() {
  const { user } = useAuth();

  // Redirect to auth if not logged in
  if (!user && window.location.pathname !== '/auth') {
    window.location.href = '/auth';
    return null;
  }

  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="feature-generator-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Navigation />
            <div className="pt-16">
              <Router />
            </div>
            <Toaster />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;