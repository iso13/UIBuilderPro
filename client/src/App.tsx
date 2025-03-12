
import { Switch, Route, Router } from "wouter";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/user-context";
import { QueryClientProvider } from "@tanstack/react-query";
import NotFound from "./pages/not-found";
import { Home } from "./pages/home";
import { ProtectedRoute } from "./lib/protected-route";
import { queryClient } from "./lib/queryClient";

// Lazy load pages
import { lazy, Suspense } from "react";
const Login = lazy(() => import("./pages/login"));
const Signup = lazy(() => import("./pages/signup"));
const New = lazy(() => import("./pages/new"));
const Edit = lazy(() => import("./pages/edit"));

const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

function UnauthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/login">
        <Suspense fallback={<Loading />}>
          <Login />
        </Suspense>
      </Route>
      <Route path="/signup">
        <Suspense fallback={<Loading />}>
          <Signup />
        </Suspense>
      </Route>
      <Route path="*">
        <Suspense fallback={<Loading />}>
          <Login />
        </Suspense>
      </Route>
    </Switch>
  );
}

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new">
        <Suspense fallback={<Loading />}>
          <New />
        </Suspense>
      </Route>
      <Route path="/edit/:id">
        {(params) => (
          <Suspense fallback={<Loading />}>
            <Edit id={params.id} />
          </Suspense>
        )}
      </Route>
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Switch>
              <Route path="/login">
                <UnauthenticatedRoutes />
              </Route>
              <Route path="/signup">
                <UnauthenticatedRoutes />
              </Route>
              <ProtectedRoute path="*" component={AuthenticatedRoutes} />
            </Switch>
          </div>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
