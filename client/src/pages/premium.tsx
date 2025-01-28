import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Lock, CheckCircle2 } from "lucide-react";

export default function PremiumPage() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/premium/upgrade", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your account has been upgraded to premium.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (!user) {
    navigate("/auth?redirect=/premium");
    return null;
  }

  if (user.premium) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Already Premium
            </CardTitle>
            <CardDescription>
              You already have access to all premium features!
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/")} className="w-full">
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Upgrade to Premium
          </CardTitle>
          <CardDescription>
            Get unlimited access to all historical content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="text-2xl font-bold mb-2">$9.99/month</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Unlimited access to all posts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Exclusive historical content
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Early access to new features
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => upgradeMutation.mutate()} 
            className="w-full"
            disabled={upgradeMutation.isPending}
          >
            {upgradeMutation.isPending ? "Processing..." : "Upgrade Now"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
