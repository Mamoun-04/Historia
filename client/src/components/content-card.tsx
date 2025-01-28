import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Bookmark, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import type { SelectContent } from "@db/schema";

interface ContentCardProps {
  content: SelectContent;
}

export function ContentCard({ content }: ContentCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {content.imageUrl && (
        <img
          src={content.imageUrl}
          alt={content.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <CardContent className="p-6">
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

      <CardFooter className="px-6 py-4 bg-muted/50 flex justify-between">
        <div className="flex gap-4">
          <Button variant="ghost" size="sm">
            <ThumbsUp className="h-4 w-4 mr-1" />
            <span className="text-sm">0</span>
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span className="text-sm">0</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm">
          <Bookmark className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
