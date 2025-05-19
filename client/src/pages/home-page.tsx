import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TopBar from "@/components/top-bar";
import ProfileCard from "@/components/profile-card";
import ActionButtons from "@/components/action-buttons";
import ProfileDetails from "@/components/profile-details";
import MatchModal from "@/components/match-modal";
import NavigationBar from "@/components/navigation-bar";
import { useSwipe } from "@/hooks/use-swipe";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);

  // Fetch the user's profile
  const { data: myProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profiles/me"],
    retry: false,
    onError: () => {
      toast({
        title: "Profile needed",
        description: "Please create your profile to start swiping",
        variant: "default",
      });
      navigate("/profile");
    },
  });

  // Fetch potential matches
  const { 
    data: potentialMatches, 
    isLoading: matchesLoading,
    refetch: refetchPotentialMatches
  } = useQuery({
    queryKey: ["/api/matches/potential"],
    enabled: !!myProfile,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const res = await apiRequest("POST", `/api/matches/like/${profileId}`);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.isMatch) {
        // If it's a match, show the match modal
        setMatchedProfile(potentialMatches?.[currentProfileIndex]);
        setShowMatchModal(true);
      }
      // Move to next profile
      handleNextProfile();
      // Refresh credits
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not like profile",
        description: error.message || "Not enough credits or an error occurred",
        variant: "destructive",
      });
    },
  });

  // Dislike mutation
  const dislikeMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const res = await apiRequest("POST", `/api/matches/dislike/${profileId}`);
      return await res.json();
    },
    onSuccess: () => {
      handleNextProfile();
    },
    onError: (error: Error) => {
      toast({
        title: "Could not dislike profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!potentialMatches || potentialMatches.length === 0) return;
    const currentProfile = potentialMatches[currentProfileIndex];
    likeMutation.mutate(currentProfile.id);
  };

  const handleDislike = () => {
    if (!potentialMatches || potentialMatches.length === 0) return;
    const currentProfile = potentialMatches[currentProfileIndex];
    dislikeMutation.mutate(currentProfile.id);
  };

  const handleInfo = () => {
    setProfileDetailsOpen(true);
  };

  const handleNextProfile = () => {
    if (potentialMatches && currentProfileIndex < potentialMatches.length - 1) {
      setCurrentProfileIndex(prevIndex => prevIndex + 1);
    } else {
      // No more profiles, refetch
      refetchPotentialMatches();
      setCurrentProfileIndex(0);
    }
  };

  // Set up swipe handlers
  const currentProfile = potentialMatches?.[currentProfileIndex];
  const { handleTouchStart, handleTouchMove, handleTouchEnd, swipeDirection, swipePosition } = useSwipe({
    onSwipeLeft: handleDislike,
    onSwipeRight: handleLike
  });

  // Create profile if one doesn't exist
  useEffect(() => {
    if (user && !profileLoading && !myProfile) {
      navigate("/profile");
    }
  }, [user, myProfile, profileLoading, navigate]);

  // Check if there are no more profiles
  const noMoreProfiles = potentialMatches && potentialMatches.length === 0;

  // Loading state while fetching profile or matches
  if (profileLoading || matchesLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar credits={myProfile?.credits?.amount || 0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading profiles...</p>
        </div>
        <NavigationBar active="home" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar credits={myProfile?.credits?.amount || 0} />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        {noMoreProfiles ? (
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold mb-2">No more profiles</h2>
            <p className="text-muted-foreground mb-4">Check back later for new people</p>
            <Button onClick={() => refetchPotentialMatches()}>Refresh</Button>
          </div>
        ) : currentProfile ? (
          <>
            <div 
              className="w-full max-w-sm relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <ProfileCard 
                profile={currentProfile}
                swipeDirection={swipeDirection}
                swipePosition={swipePosition}
              />
            </div>
            <ActionButtons 
              onLike={handleLike}
              onDislike={handleDislike}
              onInfo={handleInfo}
              disableLike={myProfile?.credits?.amount <= 0}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold mb-2">Error loading profiles</h2>
            <p className="text-muted-foreground mb-4">Please try again</p>
            <Button onClick={() => refetchPotentialMatches()}>Retry</Button>
          </div>
        )}
      </main>
      
      <NavigationBar active="home" />
      
      {currentProfile && (
        <ProfileDetails
          profile={currentProfile}
          isOpen={profileDetailsOpen}
          onClose={() => setProfileDetailsOpen(false)}
          onLike={handleLike}
          onDislike={handleDislike}
          disableLike={myProfile?.credits?.amount <= 0}
        />
      )}
      
      {matchedProfile && (
        <MatchModal
          isOpen={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          matchedProfile={matchedProfile}
        />
      )}
    </div>
  );
}
