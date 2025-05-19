import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import TopBar from "@/components/top-bar";
import NavigationBar from "@/components/navigation-bar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, ZapIcon, Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Profile form schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  birthdate: z.string().refine(date => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    
    return age >= 18;
  }, "You must be at least 18 years old"),
  bio: z.string().optional(),
  gender: z.enum(["male", "female", "non-binary", "other"]),
  interestedIn: z.enum(["male", "female", "non-binary", "other", "everyone"]),
  location: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Photo form schema
const photoSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  isMain: z.boolean().default(false),
  order: z.number().default(0),
});

type PhotoFormValues = z.infer<typeof photoSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);

  // Fetch user profile
  const { 
    data: profile, 
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["/api/profiles/me"],
  });

  // Profile form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      birthdate: "",
      bio: "",
      gender: "male",
      interestedIn: "everyone",
      location: "",
    },
  });

  // Photo form
  const photoForm = useForm<PhotoFormValues>({
    resolver: zodResolver(photoSchema),
    defaultValues: {
      url: "",
      isMain: false,
      order: 0,
    },
  });

  // Fill form with profile data when loaded
  useEffect(() => {
    if (profile) {
      // Format date for input
      const birthdate = profile.birthdate 
        ? new Date(profile.birthdate).toISOString().split('T')[0]
        : "";
      
      form.reset({
        name: profile.name || "",
        birthdate,
        bio: profile.bio || "",
        gender: profile.gender || "male",
        interestedIn: profile.interestedIn || "everyone",
        location: profile.location || "",
      });
    } else {
      setIsCreating(true);
    }
  }, [profile, form]);

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("POST", "/api/profiles", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile created",
        description: "Your profile has been created successfully",
      });
      refetchProfile();
      setIsCreating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", `/api/profiles/${profile.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      refetchProfile();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add photo mutation
  const addPhotoMutation = useMutation({
    mutationFn: async (data: PhotoFormValues) => {
      const res = await apiRequest("POST", "/api/photos", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo added",
        description: "Your photo has been added successfully",
      });
      photoForm.reset();
      refetchProfile();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set main photo mutation
  const setMainPhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const res = await apiRequest("PUT", `/api/photos/${photoId}/main`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Main photo updated",
        description: "Your main photo has been updated",
      });
      refetchProfile();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update main photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const res = await apiRequest("DELETE", `/api/photos/${photoId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo deleted",
        description: "Your photo has been deleted",
      });
      refetchProfile();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    if (isCreating) {
      createProfileMutation.mutate(data);
    } else {
      updateProfileMutation.mutate(data);
    }
  };

  const onPhotoSubmit = (data: PhotoFormValues) => {
    addPhotoMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSetMainPhoto = (photoId: number) => {
    setMainPhotoMutation.mutate(photoId);
  };

  const handleDeletePhoto = (photoId: number) => {
    deletePhotoMutation.mutate(photoId);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar credits={profile?.credits?.amount || 0} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
        <NavigationBar active="profile" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar credits={profile?.credits?.amount || 0} />
      
      <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold mb-4">{isCreating ? "Create Profile" : "Your Profile"}</h1>
        
        {!isCreating && profile && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Avatar className="h-16 w-16">
                  {profile.photos && profile.photos.length > 0 ? (
                    <AvatarImage 
                      src={profile.photos.find(p => p.isMain)?.url || profile.photos[0].url} 
                      alt={profile.name} 
                    />
                  ) : (
                    <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold">{profile.name}</h2>
                  <p className="text-sm text-muted-foreground">{profile.location || "No location set"}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Your Score</h3>
                <div className="flex items-center mb-1">
                  <Progress value={profile.score} className="flex-1" />
                  <span className="ml-2 font-semibold text-sm">{profile.score.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your score affects who sees your profile
                </p>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Daily Credits</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ZapIcon className="h-5 w-5 text-warning mr-2" />
                    <span className="text-xl font-bold">{profile.credits?.amount || 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Refreshed daily
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {!isCreating && profile && !isEditingPhotos ? (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Profile Photos</CardTitle>
                <CardDescription>Add up to 6 photos to your profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {profile.photos && profile.photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square">
                      <img 
                        src={photo.url} 
                        alt="Profile" 
                        className={`w-full h-full object-cover rounded-md ${photo.isMain ? 'ring-2 ring-primary' : ''}`}
                      />
                      {photo.isMain && (
                        <div className="absolute top-1 left-1 bg-primary text-xs text-white px-1 rounded">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {(!profile.photos || profile.photos.length < 6) && (
                    <div 
                      className="aspect-square border-2 border-dashed border-border rounded-md flex items-center justify-center cursor-pointer"
                      onClick={() => setIsEditingPhotos(true)}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                  onClick={() => setIsEditingPhotos(true)}
                >
                  Edit Photos
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Edit your profile details</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="birthdate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            You must be at least 18 years old
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>About Me</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Tell others about yourself..."
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>I am</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="non-binary">Non-binary</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="interestedIn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interested In</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select preference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Men</SelectItem>
                                <SelectItem value="female">Women</SelectItem>
                                <SelectItem value="non-binary">Non-binary</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="everyone">Everyone</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="City, Country"
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <>Updating <Loader2 className="ml-2 h-4 w-4 animate-spin" /></>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </form>
                </Form>
                
                <Separator className="my-6" />
                
                <Button 
                  variant="outline" 
                  className="w-full text-destructive"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </>
        ) : isEditingPhotos && profile ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Photos</CardTitle>
              <CardDescription>Add, remove, or set your main photo</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.photos && profile.photos.length > 0 && (
                <div className="grid gap-4 mb-6">
                  {profile.photos.map((photo) => (
                    <div key={photo.id} className="flex items-center">
                      <div className="h-16 w-16 relative">
                        <img 
                          src={photo.url} 
                          alt="Profile" 
                          className="w-full h-full object-cover rounded-md"
                        />
                        {photo.isMain && (
                          <div className="absolute top-0 right-0 bg-primary text-xs text-white px-1 rounded">
                            Main
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm truncate max-w-[200px]">{photo.url}</p>
                        <div className="flex gap-2 mt-1">
                          {!photo.isMain && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSetMainPhoto(photo.id)}
                              disabled={setMainPhotoMutation.isPending}
                            >
                              Set as Main
                            </Button>
                          )}
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeletePhoto(photo.id)}
                            disabled={deletePhotoMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Form {...photoForm}>
                <form onSubmit={photoForm.handleSubmit(onPhotoSubmit)} className="space-y-4">
                  <FormField
                    control={photoForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo URL</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="https://example.com/photo.jpg"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a URL for your photo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={photoForm.control}
                    name="isMain"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Set as main photo
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={addPhotoMutation.isPending}
                  >
                    {addPhotoMutation.isPending ? (
                      <>Adding Photo <Loader2 className="ml-2 h-4 w-4 animate-spin" /></>
                    ) : (
                      "Add Photo"
                    )}
                  </Button>
                </form>
              </Form>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setIsEditingPhotos(false)}
              >
                Back to Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Profile</CardTitle>
              <CardDescription>Tell us about yourself to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Your name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="birthdate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          You must be at least 18 years old
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About Me</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Tell others about yourself..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>I am</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="non-binary">Non-binary</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="interestedIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interested In</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Men</SelectItem>
                              <SelectItem value="female">Women</SelectItem>
                              <SelectItem value="non-binary">Non-binary</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="everyone">Everyone</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="City, Country"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createProfileMutation.isPending}
                  >
                    {createProfileMutation.isPending ? (
                      <>Creating Profile <Loader2 className="ml-2 h-4 w-4 animate-spin" /></>
                    ) : (
                      "Create Profile"
                    )}
                  </Button>
                </form>
              </Form>
              
              <Separator className="my-6" />
              
              <Button 
                variant="outline" 
                className="w-full text-destructive"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      <NavigationBar active="profile" />
    </div>
  );
}
