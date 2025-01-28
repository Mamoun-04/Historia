import { useQuery } from "@tanstack/react-query";
import { ContentCard } from "@/components/content-card";
import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import type { SelectContent } from "@db/schema";

export default function Home() {
  const { user } = useUser();
  const { data: content, isLoading } = useQuery<SelectContent[]>({
    queryKey: ["/api/content"],
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {content?.map((item, index) => (
          <ContentCard 
            key={item.id} 
            content={item} 
            isPremiumLocked={(index + 1) % 3 === 0}
          />
        ))}
      </div>
    </div>
  );
}