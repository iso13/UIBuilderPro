
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/contexts/user-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Home from "./pages/home";
import NotFound from "./pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { useUser } from "@/contexts/user-context";

// Protected route component
function AuthenticatedRoutes({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) return null;
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/">
        <AuthenticatedRoutes>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/new">
              {/* Placeholder for New Feature page */}
              <div>New Feature Page</div>
            </Route>
            <Route path="/edit/:id">
              {/* Placeholder for Edit Feature page */}
              <div>Edit Feature Page</div>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </AuthenticatedRoutes>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <UserProvider>
          <AppRoutes />
          <Toaster />
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
