import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, Bookmark, MessageSquare, Clock, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useContentActions } from "@/hooks/use-content-actions";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { SelectContent } from "@db/schema";

export default function ContentDetail() {
  const [, params] = useRoute("/content/:id");
  const { user } = useUser();
  const contentId = params ? parseInt(params.id) : 0;

  const { data: content, isLoading } = useQuery<SelectContent>({
    queryKey: [`/api/content/${contentId}`],
  });

  const {
    comments,
    isLoadingComments,
    isBookmarked,
    like,
    bookmark,
    comment,
    isLoading: actionLoading,
  } = useContentActions(contentId);

  const [commentText, setCommentText] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto py-6 px-4">
        <p className="text-red-500">Content not found</p>
      </div>
    );
  }

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await comment(commentText);
    setCommentText("");
  };

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
          {user && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => like(!content.likes)}
                disabled={actionLoading.like}
              >
                <ThumbsUp className={cn("h-4 w-4", content.likes && "fill-current")} />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => bookmark()}
                disabled={actionLoading.bookmark}
              >
                <Bookmark className={cn(
                  "h-4 w-4",
                  isBookmarked && "fill-current"
                )} />
              </Button>
            </div>
          )}
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
            <p className="text-gray-700">{content.hook}</p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">Content</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{content.content}</p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">Key Takeaway</h2>
            <p className="text-gray-700">{content.takeaway}</p>
          </section>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Comments</h3>
            <p className="text-sm text-muted-foreground">
              <Clock className="h-4 w-4 inline mr-1" />
              {content.createdAt && format(parseISO(content.createdAt.toString()), "PPP")}
            </p>
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="flex-1"
                />
                <Button
                  onClick={handleComment}
                  disabled={actionLoading.comment || !commentText.trim()}
                >
                  {actionLoading.comment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comment
                    </>
                  )}
                </Button>
              </div>

              <ScrollArea className="h-[400px] rounded-md border p-4">
                {isLoadingComments ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments?.map((comment) => (
                      <div key={comment.id} className="p-4 rounded-lg bg-muted">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{comment.username}</p>
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(comment.createdAt.toString()), "PPp")}
                          </span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))}
                    {(!comments || comments.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </div>
                )}
              </ScrollArea>
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