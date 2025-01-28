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
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="overflow-hidden">
        {content.imageUrl && (
          <div className="w-full h-[400px] relative">
            <img
              src={content.imageUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-3">{content.title}</h1>
              <p className="text-lg text-muted-foreground">
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

          <div className="space-y-8 prose prose-lg max-w-none">
            <p className="text-xl leading-relaxed">{content.hook}</p>

            <Separator className="my-8" />

            <div className="text-lg leading-relaxed space-y-6">
              {content.content.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <Separator className="my-8" />

            <blockquote className="text-xl not-italic border-l-4 pl-6 py-2">
              {content.takeaway}
            </blockquote>
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Discussion</h3>
              <p className="text-sm text-muted-foreground">
                <Clock className="h-4 w-4 inline mr-1" />
                {content.createdAt && format(parseISO(content.createdAt.toString()), "PPP")}
              </p>
            </div>

            {user ? (
              <div className="space-y-6">
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
                          No comments yet. Be the first to share your thoughts!
                        </p>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Please login to join the discussion.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}