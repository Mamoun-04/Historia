import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Bookmark, MessageSquare, Lock } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { SelectContent } from "@db/schema";
import { useUser } from "@/hooks/use-user";
import { useContentActions } from "@/hooks/use-content-actions";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  content: SelectContent;
  isPremiumLocked?: boolean;
}

function PremiumOverlay() {
  const [, navigate] = useLocation();

  return (
    <div className="absolute inset-0 backdrop-blur-md bg-background/50 flex flex-col items-center justify-center p-6 text-center gap-4">
      <Lock className="h-8 w-8 text-primary" />
      <h3 className="text-xl font-semibold">Premium Content</h3>
      <p className="text-muted-foreground mb-4">
        Sign up for Premium to unlock unlimited posts
      </p>
      <Button onClick={() => navigate("/premium")}>
        Upgrade to Premium
      </Button>
    </div>
  );
}

export function ContentCard({ content, isPremiumLocked = false }: ContentCardProps) {
  const { user } = useUser();
  const isLocked = isPremiumLocked && !user?.premium;
  const { isBookmarked, like, bookmark, isLoading } = useContentActions(content.id);

  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-lg transition-shadow relative",
      isLocked && "select-none"
    )}>
      {content.imageUrl && (
        <img
          src={content.imageUrl}
          alt={content.title}
          className={cn(
            "w-full h-48 object-cover",
            isLocked && "filter blur-sm"
          )}
        />
      )}

      <CardContent className={cn("p-6", isLocked && "filter blur-sm")}>
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold">{content.title}</h3>
            <span className="text-sm text-muted-foreground">{content.period}</span>
          </div>
          <p className="text-sm text-muted-foreground">{content.category}</p>
        </div>

        <p className="mb-4 line-clamp-3">{content.hook}</p>

        <Link href={`/content/${content.id}`}>
          <Button variant="secondary" className="w-full">
            Read More
          </Button>
        </Link>
      </CardContent>

      <CardFooter className={cn(
        "px-6 py-4 bg-muted/50 flex justify-between",
        isLocked && "filter blur-sm"
      )}>
        <div className="flex gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => like(!content.likes)} 
            disabled={isLoading.like || !user}
          >
            <ThumbsUp className={cn("h-4 w-4 mr-1", content.likes && "fill-current")} />
            <span className="text-sm">{content.likes || 0}</span>
          </Button>
          <Link href={`/content/${content.id}#comments`}>
            <Button variant="ghost" size="sm">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span className="text-sm">0</span>
            </Button>
          </Link>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => bookmark(!isBookmarked)}
          disabled={isLoading.bookmark || !user}
        >
          <Bookmark className={cn(
            "h-4 w-4",
            isBookmarked && "fill-foreground text-foreground"
          )} />
        </Button>
      </CardFooter>

      {isLocked && <PremiumOverlay />}
    </Card>
  );
}