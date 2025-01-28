import { useEffect } from "react";
import { useUser } from "./use-user";
import { useToast } from "./use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function useStreak() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const updateStreak = async () => {
      try {
        const response = await fetch("/api/streak/update", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        
        if (data.streakLost) {
          toast({
            variant: "destructive",
            title: "Streak Lost!",
            description: `Oh no! You lost your ${data.previousStreak} day streak. Stay active to maintain your streak!`,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["user"] });
      } catch (error: any) {
        console.error("Failed to update streak:", error);
      }
    };

    // Update streak immediately and then every minute
    updateStreak();
    const interval = setInterval(updateStreak, 60000);

    return () => clearInterval(interval);
  }, [user, toast, queryClient]);
}
