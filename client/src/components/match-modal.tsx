import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import confetti from "https://cdn.skypack.dev/canvas-confetti";

type Profile = {
  id: number;
  name: string;
  photos: Array<{ id: number; url: string; isMain: boolean }>;
};

type MatchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  matchedProfile: Profile;
};

export default function MatchModal({ isOpen, onClose, matchedProfile }: MatchModalProps) {
  const [, navigate] = useLocation();
  const [matchId, setMatchId] = useState<number | null>(null);

  // Get the matched profile photo
  const profilePhoto = matchedProfile?.photos?.find(p => p.isMain)?.url || 
                      (matchedProfile?.photos?.length > 0 ? matchedProfile.photos[0].url : '');

  // Trigger confetti when match dialog opens
  useEffect(() => {
    if (isOpen) {
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  // Handle sending a message
  const handleSendMessage = () => {
    // Navigate to messages with the match ID
    if (matchId) {
      navigate(`/messages/${matchId}`);
    } else {
      navigate('/matches');
    }
    onClose();
  };

  // Handle keep swiping
  const handleKeepSwiping = () => {
    onClose();
  };

  if (!matchedProfile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/90 border-none text-white">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="mb-4">
            <div className="w-40 h-40 relative">
              {/* Circular image with glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-50 blur-md" />
              <Avatar className="w-40 h-40 border-4 border-white">
                {profilePhoto ? (
                  <AvatarImage src={profilePhoto} alt={matchedProfile.name} className="object-cover" />
                ) : (
                  <AvatarFallback className="text-4xl">{matchedProfile.name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
            </div>
          </div>
          
          <h2 className="text-3xl font-heading font-bold text-primary mb-2">It's a Match!</h2>
          <p className="text-white/90 mb-6">
            You and <span className="font-bold">{matchedProfile.name}</span> like each other
          </p>
          
          <div className="flex gap-4 w-full">
            <Button 
              onClick={handleSendMessage}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              Send Message
            </Button>
            <Button 
              onClick={handleKeepSwiping}
              variant="outline" 
              className="flex-1 border-white text-white hover:bg-white/10"
            >
              Keep Swiping
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
