import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import TopBar from "@/components/top-bar";
import NavigationBar from "@/components/navigation-bar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function MatchesPage() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch user profile
  const { data: myProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profiles/me"],
  });

  // Fetch matches
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/matches"],
    enabled: !!myProfile,
  });

  const handleMatchClick = (matchId: number) => {
    navigate(`/messages/${matchId}`);
  };

  // Filter matches based on active tab
  const getFilteredMatches = () => {
    if (!matches) return [];
    
    if (activeTab === "new") {
      return matches.filter((match: any) => !match.lastMessage);
    }
    
    if (activeTab === "messages") {
      return matches.filter((match: any) => match.lastMessage);
    }
    
    return matches;
  };
  
  const filteredMatches = getFilteredMatches();

  // Format the time for last message
  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return "";
    }
  };

  if (profileLoading || matchesLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar credits={myProfile?.credits?.amount || 0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading matches...</p>
        </div>
        <NavigationBar active="matches" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar credits={myProfile?.credits?.amount || 0} />
      
      <div className="flex-1 flex flex-col p-4">
        <h1 className="text-2xl font-bold mb-4">Your Matches</h1>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No matches yet</p>
                <p className="text-sm text-muted-foreground">
                  Start swiping to find new matches
                </p>
              </div>
            ) : (
              filteredMatches.map((match: any) => (
                <div 
                  key={match.match.id} 
                  className="flex items-center p-3 rounded-lg bg-card hover:bg-accent/10 cursor-pointer"
                  onClick={() => handleMatchClick(match.match.id)}
                >
                  <Avatar className="h-12 w-12">
                    {match.profile.photos && match.profile.photos.length > 0 ? (
                      <AvatarImage src={match.profile.photos[0].url} alt={match.profile.name} />
                    ) : (
                      <AvatarFallback>{match.profile.name.charAt(0)}</AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{match.profile.name}</h3>
                      {match.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(match.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {match.lastMessage 
                        ? match.lastMessage.content 
                        : "New match! Say hello!"}
                    </p>
                  </div>
                  
                  {match.unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {match.unreadCount}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <NavigationBar active="matches" />
    </div>
  );
}
