import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

interface Comment {
  id: number;
  text: string;
  createdAt: string;
  username: string;
  userId: number;
}

export function useContentActions(contentId: number) {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query comments
  const { data: comments = [], isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: ["/api/content", contentId, "comments"],
    enabled: !!contentId,
  });

  // Query bookmark status
  const { data: bookmarkStatus } = useQuery<{ bookmarked: boolean }>({
    queryKey: ["/api/content", contentId, "bookmarked"],
    enabled: !!user && !!contentId,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (isLiking: boolean) => {
      const response = await fetch(`/api/content/${contentId}/${isLiking ? 'like' : 'unlike'}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", contentId] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (isBookmarking: boolean) => {
      const response = await fetch(`/api/content/${contentId}/bookmark`, {
        method: "POST",  // Always use POST since our endpoint now handles both bookmark/unbookmark
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (_, isBookmarking) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", contentId, "bookmarked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: isBookmarking ? "Bookmarked!" : "Bookmark Removed",
        description: isBookmarking 
          ? "Content added to your bookmarks"
          : "Content removed from your bookmarks",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch(`/api/content/${contentId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", contentId, "comments"] });
      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return {
    comments,
    isLoadingComments,
    isBookmarked: bookmarkStatus?.bookmarked || false,
    like: (isLiking: boolean) => likeMutation.mutate(isLiking),
    bookmark: (isBookmarking: boolean) => bookmarkMutation.mutate(isBookmarking),
    comment: (text: string) => commentMutation.mutate(text),
    isLoading: {
      like: likeMutation.isPending,
      bookmark: bookmarkMutation.isPending,
      comment: commentMutation.isPending,
    },
  };
}