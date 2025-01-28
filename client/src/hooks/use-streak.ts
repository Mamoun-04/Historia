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
        } else if (data.user.streak > (data.previousStreak || 0)) {
          toast({
            title: "Streak Increased! 🔥",
            description: `Awesome! Your streak is now ${data.user.streak}! Keep it up!`,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["user"] });
      } catch (error: any) {
        console.error("Failed to update streak:", error);
      }
    };

    // Update streak only on login/component mount
    updateStreak();
  }, [user, toast, queryClient]);
}