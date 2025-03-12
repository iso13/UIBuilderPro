
import { useEffect, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/contexts/user-context";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Home from "./pages/home";
import NewFeature from "./pages/new";
import EditFeature from "./pages/edit";
import NotFound from "./pages/not-found";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <UserProvider>
        <AppRoutes />
        <Toaster />
      </UserProvider>
    </ThemeProvider>
  );
}

function AppRoutes() {
  const [location] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        setIsAuthenticated(response.ok);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [location]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Home /> : <Login />}
      </Route>
      <Route path="/signup">
        {isAuthenticated ? <Home /> : <Signup />}
      </Route>
      {isAuthenticated ? (
        <AuthenticatedRoutes />
      ) : (
        <Route>
          <Login />
        </Route>
      )}
    </Switch>
  );
}

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new" component={NewFeature} />
      <Route path="/edit/:id" component={EditFeature} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
