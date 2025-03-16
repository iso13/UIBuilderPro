import { Switch, Route } from "wouter";
import { Toaster } from "sonner";
import { AuthProvider } from "./hooks/use-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import NotFound from "./pages/not-found";
import { Home } from "./pages/home";
import { ProtectedRoute } from "./lib/protected-route";
import { queryClient } from "./lib/queryClient";
import { Header } from "./components/header";
import { ThemeProvider } from "./components/theme-provider";

// Lazy load pages
import { lazy, Suspense } from "react";
const Login = lazy(() => import("./pages/login"));
const Signup = lazy(() => import("./pages/signup"));
const Analytics = lazy(() => import("./pages/analytics"));

const Loading = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Suspense fallback={<Loading />}>
              <Switch>
                <Route path="/login">
                  <Login />
                </Route>
                <Route path="/signup">
                  <Signup />
                </Route>
                <Route path="/">
                  <ProtectedRoute path="*" component={() => (
                    <AuthenticatedLayout>
                      <Switch>
                        <Route path="/" component={Home} />
                        <Route path="/analytics" component={Analytics} />
                        <Route component={NotFound} />
                      </Switch>
                    </AuthenticatedLayout>
                  )} />
                </Route>
              </Switch>
            </Suspense>
          </div>
          <Toaster position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}