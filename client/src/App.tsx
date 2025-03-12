
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "sonner";
import { NotFound } from "./pages/not-found";
import { Login } from "./pages/login";
import { Signup } from "./pages/signup";
import { Home } from "./pages/home";
import { Edit } from "./pages/edit";
import { New } from "./pages/new";
import { UserProvider, useUser } from "./contexts/user-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useEffect, useState } from "react";

function AuthenticatedRoutes() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new" component={New} />
      <Route path="/edit/:id" component={Edit} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppRoutes() {
  const { user, isLoading } = useUser();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route>
        <AuthenticatedRoutes />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Toaster richColors position="top-center" />
        <AppRoutes />
      </UserProvider>
    </QueryClientProvider>
  );
}
