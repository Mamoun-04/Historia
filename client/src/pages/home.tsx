import { useQuery } from "@tanstack/react-query";
import { ContentCard } from "@/components/content-card";
import { useUser } from "@/hooks/use-user";
import { Loader2, ChevronDown } from "lucide-react";
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
    <div className="min-h-screen">
      {/* Hero Section with Parallax */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="parallax-container absolute inset-0">
          <div className="parallax-content bg-gradient-to-b from-background to-muted h-[120%] w-full" />
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-display mb-6 animate-fade-in">
            Journey Through Time
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in [animation-delay:200ms]">
            Discover fascinating historical moments through bite-sized, interactive learning experiences.
          </p>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="container mx-auto py-24">
        <h2 className="text-4xl font-display mb-12 text-center">Historical Posts</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {content?.map((item, index) => (
            <div 
              key={item.id}
              className="opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <ContentCard 
                content={item}
                isPremiumLocked={user?.premium === false && (index + 1) % 3 === 0}
              />
            </div>
          ))}
        </div>
        {(!content || content.length === 0) && (
          <p className="text-center text-muted-foreground">No historical posts available.</p>
        )}
      </section>
    </div>
  );
}