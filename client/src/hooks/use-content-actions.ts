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
    mutationFn: async () => {
      const response = await fetch(`/api/content/${contentId}/bookmark`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", contentId, "bookmarked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });

      // Check if bookmark was added or removed based on the response message
      const isAdding = data.message === "Content bookmarked successfully";

      toast({
        title: isAdding ? "Bookmarked!" : "Bookmark Removed",
        description: isAdding 
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
    bookmark: () => bookmarkMutation.mutate(),
    comment: (text: string) => commentMutation.mutate(text),
    isLoading: {
      like: likeMutation.isPending,
      bookmark: bookmarkMutation.isPending,
      comment: commentMutation.isPending,
    },
  };
}