import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-3 text-xl text-gray-600">Page not found</p>
      <p className="mt-4 text-center text-gray-500 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button
        onClick={() => navigate("/")}
        className="mt-8"
      >
        Go back home
      </Button>
    </div>
  );
}