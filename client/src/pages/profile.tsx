import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/content-card";
import { AchievementBadge } from "@/components/achievement-badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SelectContent, SelectAchievement } from "@db/schema";

export default function ProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  interface BookmarkData {
    content: SelectContent;
    bookmarkedAt: string;
  }

  const { data: bookmarks, isLoading: isLoadingBookmarks } = useQuery<BookmarkData[]>({
    queryKey: ["/api/bookmarks"],
    enabled: !!user,
  });

  const { data: achievements } = useQuery<SelectAchievement[]>({
    queryKey: ["/api/achievements"],
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user/cancel-premium", {
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
        title: "Subscription Cancelled",
        description: "Your premium subscription has been cancelled.",
      });
      // Invalidate all necessary queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (!user) return null;

  if (isLoadingBookmarks) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 mt-16">
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
              <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              {user.premium ? (
                <div className="flex items-center gap-4 mt-2">
                  <span className="inline-block px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                    Premium Member
                  </span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? "Cancelling..." : "Cancel Membership"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="bookmarks" className="w-full">
        <TabsList>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 content-grid">
            {bookmarks?.map((bookmark) => (
              <ContentCard 
                key={bookmark.content.id} 
                content={bookmark.content}
              />
            ))}
            {(!bookmarks || bookmarks.length === 0) && (
                <>
                  <p className="text-muted-foreground col-span-full text-center py-8">
                    No bookmarks yet. Start saving interesting historical content!
                  </p>
                  <Button 
                    className="mx-auto mt-4 block"
                    onClick={() => {
                      document.querySelector('.content-grid')?.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }}
                  >
                    View Posts
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <ScrollArea className="h-[500px] rounded-md border p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {achievements?.map((achievement) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
              {(!achievements || achievements.length === 0) && (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  No achievements yet. Keep exploring to earn badges!
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}