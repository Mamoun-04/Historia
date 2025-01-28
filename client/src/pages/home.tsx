import { useQuery } from "@tanstack/react-query";
import { ContentCard } from "@/components/content-card";
import { useUser } from "@/hooks/use-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AchievementBadge } from "@/components/achievement-badge";
import { Loader2 } from "lucide-react";
import type { SelectContent, SelectAchievement } from "@db/schema";

export default function Home() {
  const { user } = useUser();
  const { data: content, isLoading } = useQuery<SelectContent[]>({
    queryKey: ["/api/content"],
  });

  const { data: achievements } = useQuery<SelectAchievement[]>({
    queryKey: ["/api/achievements"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Tabs defaultValue="feed" className="w-full">
        <TabsList>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          {user && <TabsTrigger value="achievements">Achievements</TabsTrigger>}
        </TabsList>

        <TabsContent value="feed" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content?.map((item, index) => (
              <ContentCard 
                key={item.id} 
                content={item} 
                isPremiumLocked={(index + 1) % 3 === 0}
              />
            ))}
          </div>
        </TabsContent>

        {user && (
          <TabsContent value="achievements" className="mt-6">
            <ScrollArea className="h-[500px] rounded-md border p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {achievements?.map((achievement) => (
                  <AchievementBadge 
                    key={achievement.id} 
                    achievement={achievement} 
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}