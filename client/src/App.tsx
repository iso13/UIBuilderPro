import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import { UserProvider } from "@/contexts/user-context";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import NewFeature from "@/pages/new";
import EditFeature from "@/pages/edit";
import { useAuth } from "@/hooks/use-auth";

function AuthenticatedRoutes() {
  const [location, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  // Show nothing while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If user is not authenticated, this won't render because we'll navigate away
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new" component={NewFeature} />
      <Route path="/edit/:id" component={EditFeature} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/*">
            <AuthenticatedRoutes />
          </Route>
        </Switch>
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}