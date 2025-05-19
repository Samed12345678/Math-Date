import { memo } from 'react';
import { Badge } from "@/components/ui/badge";

type Profile = {
  id: number;
  name: string;
  bio?: string;
  gender: string;
  location?: string;
  score: number;
  photos: Array<{ id: number; url: string; isMain: boolean }>;
};

type ProfileCardProps = {
  profile: Profile;
  swipeDirection: 'left' | 'right' | null;
  swipePosition: { x: number; y: number };
};

function ProfileCard({ profile, swipeDirection, swipePosition }: ProfileCardProps) {
  // Get main photo or first photo
  const mainPhoto = profile.photos?.find(p => p.isMain)?.url || 
                   (profile.photos?.length > 0 ? profile.photos[0].url : '');
                   
  // Calculate rotation based on swipe
  const rotationDegree = swipePosition.x * 0.1;
  
  // Card styling based on swipe
  const cardStyle = {
    transform: swipeDirection 
      ? `translateX(${swipeDirection === 'right' ? '200%' : '-200%'}) rotate(${swipeDirection === 'right' ? '20deg' : '-20deg'})` 
      : swipePosition.x !== 0 
        ? `translateX(${swipePosition.x}px) rotate(${rotationDegree}deg)` 
        : 'none',
    transition: swipeDirection ? 'transform 0.5s ease' : 'none',
  };
  
  // Action indicators based on swipe
  const showLikeIndicator = swipePosition.x > 50 || swipeDirection === 'right';
  const showDislikeIndicator = swipePosition.x < -50 || swipeDirection === 'left';

  // Max 70 characters for bio preview
  const bioPreview = profile.bio && profile.bio.length > 70 
    ? `${profile.bio.substring(0, 70)}...` 
    : profile.bio;

  return (
    <div 
      className="w-full relative overflow-hidden rounded-lg shadow-lg" 
      style={{
        aspectRatio: '3/4',
        ...cardStyle
      }}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: `url(${mainPhoto})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      {/* Like/Dislike Indicators */}
      {showLikeIndicator && (
        <div className="absolute top-6 right-6 rotate-12">
          <Badge className="bg-primary px-4 py-1 text-lg font-bold border-2 border-primary-foreground">
            LIKE
          </Badge>
        </div>
      )}
      
      {showDislikeIndicator && (
        <div className="absolute top-6 left-6 -rotate-12">
          <Badge className="bg-destructive px-4 py-1 text-lg font-bold border-2 border-destructive-foreground">
            NOPE
          </Badge>
        </div>
      )}
      
      {/* Score Badge */}
      <div className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center bg-black/70 border-2 border-secondary text-white font-bold">
        {profile.score.toFixed(1)}
      </div>
      
      {/* Profile Info */}
      <div className="absolute bottom-0 left-0 w-full p-4 text-white">
        <h2 className="text-xl font-bold">{profile.name}</h2>
        {profile.location && (
          <p className="text-sm mt-1">{profile.location}</p>
        )}
        {bioPreview && (
          <p className="text-sm mt-2 text-white/80">{bioPreview}</p>
        )}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(ProfileCard);
