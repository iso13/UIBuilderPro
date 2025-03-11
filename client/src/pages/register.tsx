import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "wouter";
import { registerSchema, type RegisterInput } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function RegisterPage() {
  const { toast } = useToast();
  const [, navigate] = useNavigate();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });

      toast({
        title: "Registration successful",
        description: "You can now log in with your credentials.",
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-md py-8">
      <Card className="p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Create an Account</h1>
          <p className="text-muted-foreground">Join our beta testing program</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Email</Form.Label>
                  <Form.Control>
                    <Input placeholder="your@email.com" {...field} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="password"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Password</Form.Label>
                  <Form.Control>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
