import { useQuery } from "@tanstack/react-query";
import { ContentCard } from "@/components/content-card";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import type { SelectContent } from "@db/schema";

export default function Home() {
  const { user } = useUser();
  const { data: content, isLoading, error } = useQuery<SelectContent[]>({
    queryKey: ["/api/content"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <p className="text-red-500">Error loading content: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Historical Posts</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {content?.map((item, index) => (
          <ContentCard 
            key={item.id} 
            content={item}
            isPremiumLocked={user?.premium === false && (index + 1) % 3 === 0}
          />
        ))}
      </div>
      {(!content || content.length === 0) && (
        <p className="text-center text-muted-foreground">No historical posts available.</p>
      )}
    </div>
  );
}