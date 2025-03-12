
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Toaster richColors position="top-center" />
        <AppRoutes />
      </UserProvider>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  const [loaded, setLoaded] = useState(false);
  const { user, checkAuth } = useUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setLoaded(true);
    };
    init();
  }, [checkAuth]);

  if (!loaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Home /> : <Login />}
      </Route>
      <Route path="/signup">
        {user ? <Home /> : <Signup />}
      </Route>
      {user ? <AuthenticatedRoutes /> : <Route>{() => {
        navigate("/login");
        return null;
      }}</Route>}
    </Switch>
  );
}

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/">
        <Home />
      </Route>
      <Route path="/new">
        <New />
      </Route>
      <Route path="/edit/:id">
        {(params) => <Edit id={params.id} />}
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default App;
