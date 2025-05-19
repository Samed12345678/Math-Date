import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TopBar from "@/components/top-bar";
import NavigationBar from "@/components/navigation-bar";
import ChatWindow from "@/components/chat-window";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MessagesPage() {
  const params = useParams();
  const matchId = params?.matchId ? parseInt(params.matchId) : undefined;
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch user profile
  const { data: myProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profiles/me"],
  });

  // Fetch matches
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/matches"],
    enabled: !!myProfile,
  });

  // Fetch messages for selected match
  const { 
    data: messages, 
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ["/api/matches", matchId, "messages"],
    enabled: !!matchId,
  });

  // Get the current match details
  const currentMatch = matchId && matches 
    ? matches.find((match: any) => match.match.id === matchId) 
    : null;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/matches/${matchId}/messages`, { content });
      return await res.json();
    },
    onSuccess: () => {
      setMessage("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Setup polling for new messages
  useEffect(() => {
    if (!matchId) return;
    
    const interval = setInterval(() => {
      refetchMessages();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [matchId, refetchMessages]);

  if (!matchId) {
    // If no match selected, show matches list
    navigate("/matches");
    return null;
  }

  if (profileLoading || matchesLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar credits={myProfile?.credits?.amount || 0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <NavigationBar active="matches" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-10 bg-background p-4 border-b border-border flex items-center">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/matches")}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {currentMatch ? (
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              {currentMatch.profile.photos && currentMatch.profile.photos.length > 0 ? (
                <AvatarImage src={currentMatch.profile.photos[0].url} alt={currentMatch.profile.name} />
              ) : (
                <AvatarFallback>{currentMatch.profile.name.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div className="ml-3">
              <h3 className="font-semibold">{currentMatch.profile.name}</h3>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Loading conversation...</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        {messagesLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            <ChatWindow 
              messages={messages || []} 
              currentUserId={myProfile?.id} 
              matchProfile={currentMatch?.profile}
            />
          </div>
        )}
        
        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-center">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="ml-2"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <NavigationBar active="matches" />
    </div>
  );
}
