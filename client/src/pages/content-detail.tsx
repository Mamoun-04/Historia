import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThumbsUp, Bookmark, MessageSquare, Clock } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { format } from "date-fns";

export default function ContentDetail() {
  const [, params] = useRoute("/content/:id");
  const { user } = useUser();
  
  const { data: content } = useQuery({
    queryKey: ["/api/content", params?.id],
  });

  if (!content) return null;

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{content.title}</h1>
            <p className="text-muted-foreground">
              {content.period} · {content.category}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {content.imageUrl && (
          <img
            src={content.imageUrl}
            alt={content.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">Hook</h2>
            <p>{content.hook}</p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">Content</h2>
            <p className="whitespace-pre-wrap">{content.content}</p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">Key Takeaway</h2>
            <p>{content.takeaway}</p>
          </section>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Comments</h3>
            <p className="text-sm text-muted-foreground">
              <Clock className="h-4 w-4 inline mr-1" />
              {format(new Date(content.createdAt), "PPP")}
            </p>
          </div>

          {user ? (
            <div className="space-y-4">
              <textarea
                className="w-full min-h-[100px] p-3 rounded-md border"
                placeholder="Share your thoughts..."
              />
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Comment
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Please login to comment on this content.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
