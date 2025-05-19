import { X, Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Photo = {
  id: number;
  url: string;
  isMain: boolean;
};

type Profile = {
  id: number;
  name: string;
  bio?: string;
  gender: string;
  location?: string;
  score: number;
  photos: Photo[];
};

type ProfileDetailsProps = {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onLike: () => void;
  onDislike: () => void;
  disableLike?: boolean;
};

export default function ProfileDetails({
  profile,
  isOpen,
  onClose,
  onLike,
  onDislike,
  disableLike,
}: ProfileDetailsProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!profile) return null;

  const photos = profile.photos || [];
  const currentPhoto = photos[currentPhotoIndex];

  const handleNext = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Format the score for display
  const scorePercentage = profile.score;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl overflow-y-auto pb-16">
        <SheetHeader className="flex flex-row items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <SheetTitle>Profile Details</SheetTitle>
          <div className="w-8" />
        </SheetHeader>

        <div className="space-y-6">
          {/* Photo Gallery */}
          <div className="aspect-square relative rounded-lg overflow-hidden">
            {photos.length > 0 ? (
              <>
                <img
                  src={currentPhoto.url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
                {photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 h-10 w-10 p-0 rounded-full"
                      onClick={handlePrev}
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6 text-white"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 19.5L8.25 12l7.5-7.5"
                        />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 h-10 w-10 p-0 rounded-full"
                      onClick={handleNext}
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-6 h-6 text-white"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground">No photos available</span>
              </div>
            )}
            
            <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl font-heading font-bold text-white">{profile.name}</h2>
              {profile.location && (
                <p className="text-white">{profile.location}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="bg-card rounded-lg shadow-sm p-4">
            <h3 className="font-heading font-semibold mb-2">About Me</h3>
            <p className="text-muted-foreground">
              {profile.bio || "No bio available"}
            </p>
          </div>

          {/* Photo navigation dots */}
          {photos.length > 1 && (
            <div className="flex justify-center space-x-1">
              {photos.map((_, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon"
                  className={`h-2 w-2 rounded-full p-0 ${
                    index === currentPhotoIndex ? "bg-primary" : "bg-muted"
                  }`}
                  onClick={() => setCurrentPhotoIndex(index)}
                >
                  <span className="sr-only">Go to photo {index + 1}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Score Information */}
          <div className="bg-card rounded-lg shadow-sm p-4">
            <h3 className="font-heading font-semibold mb-2">Score Information</h3>
            <div className="flex items-center mb-2">
              <div className="w-full bg-muted rounded-full h-4">
                <div
                  className="bg-secondary h-4 rounded-full"
                  style={{ width: `${scorePercentage}%` }}
                />
              </div>
              <span className="ml-2 font-heading font-bold text-secondary">
                {profile.score.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Score is based on profile quality and interaction patterns
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              className="h-14 w-14 rounded-full"
              variant="outline"
              onClick={onDislike}
            >
              <X className="h-6 w-6 text-destructive" />
            </Button>
            <Button
              className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
              onClick={onLike}
              disabled={disableLike}
            >
              <Heart className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
