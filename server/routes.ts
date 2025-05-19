import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertProfileSchema, insertPhotoSchema, insertMessageSchema } from "@shared/schema";
import schedule from "node-schedule";
import { 
  registerAnalyticsRoutes, 
  trackUserLogin,
  trackSwipeAction,
  trackMatchCreation,
  trackMessageSent,
  recordAlgorithmMetrics
} from "./analytics";

// Daily credit refresh job at midnight
const refreshCreditsJob = schedule.scheduleJob("0 0 * * *", async () => {
  console.log("Running daily credit refresh job");
  try {
    // In a real app, you would refresh all users' credits here
    // For this demo, we'll refresh credits when a user logs in if they haven't been refreshed today
  } catch (error) {
    console.error("Error refreshing credits:", error);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up analytics routes
  registerAnalyticsRoutes(app);
  
  // Schedule daily algorithm metrics recording at 1 AM
  schedule.scheduleJob('0 1 * * *', async () => {
    console.log('Running daily algorithm metrics job');
    await recordAlgorithmMetrics();
  });

  // Helper function to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Profile routes
  app.get("/api/profiles/me", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const profileWithDetails = await storage.getProfileWithDetails(profile.id);
      
      // Check if credits need to be refreshed (if last refresh was before today)
      const credits = await storage.getCredits(profile.id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (credits && credits.lastRefreshed < today) {
        await storage.refreshCredits(profile.id);
      }
      
      // Return profile with credits
      const updatedCredits = await storage.getCredits(profile.id);
      
      res.json({
        ...profileWithDetails,
        credits: updatedCredits
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/profiles", isAuthenticated, async (req, res) => {
    try {
      // Check if profile already exists
      const existingProfile = await storage.getProfileByUserId(req.user!.id);
      if (existingProfile) {
        return res.status(400).json({ message: "Profile already exists" });
      }
      
      // Validate profile data
      const profileData = insertProfileSchema.parse(req.body);
      
      // Create profile
      const profile = await storage.createProfile(profileData, req.user!.id);
      res.status(201).json(profile);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/profiles/:id", isAuthenticated, async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const profile = await storage.getProfile(profileId);
      
      // Check if profile exists and belongs to current user
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      if (profile.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate profile data
      const profileData = insertProfileSchema.partial().parse(req.body);
      
      // Update profile
      const updatedProfile = await storage.updateProfile(profileId, profileData);
      res.json(updatedProfile);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Photo routes
  app.post("/api/photos", isAuthenticated, async (req, res) => {
    try {
      // Get the user's profile
      const profile = await storage.getProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(400).json({ message: "Create a profile first" });
      }
      
      // Validate photo data
      const photoData = insertPhotoSchema.parse({
        ...req.body,
        profileId: profile.id
      });
      
      // Add photo
      const photo = await storage.addPhoto(photoData);
      res.status(201).json(photo);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid photo data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/photos/:id/main", isAuthenticated, async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const profile = await storage.getProfileByUserId(req.user!.id);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Set main photo
      await storage.setMainPhoto(photoId, profile.id);
      res.json({ message: "Main photo updated" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/photos/:id", isAuthenticated, async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      const profile = await storage.getProfileByUserId(req.user!.id);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Delete photo
      await storage.deletePhoto(photoId, profile.id);
      res.json({ message: "Photo deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Interests routes
  app.get("/api/interests", async (req, res) => {
    try {
      const interests = await storage.getAllInterests();
      res.json(interests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/profiles/interests", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const { interestId } = req.body;
      if (!interestId) {
        return res.status(400).json({ message: "Interest ID is required" });
      }
      
      await storage.addProfileInterest(profile.id, interestId);
      res.status(201).json({ message: "Interest added" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/profiles/interests/:interestId", isAuthenticated, async (req, res) => {
    try {
      const interestId = parseInt(req.params.interestId);
      const profile = await storage.getProfileByUserId(req.user!.id);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      await storage.removeProfileInterest(profile.id, interestId);
      res.json({ message: "Interest removed" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Matching routes
  app.get("/api/matches/potential", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const limit = parseInt(req.query.limit as string || "10");
      const offset = parseInt(req.query.offset as string || "0");
      
      const potentialMatches = await storage.getPotentialMatches(profile.id, limit, offset);
      res.json(potentialMatches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/matches/like/:profileId", isAuthenticated, async (req, res) => {
    try {
      const likedId = parseInt(req.params.profileId);
      const profile = await storage.getProfileByUserId(req.user!.id);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Check if user has credits
      const credits = await storage.getCredits(profile.id);
      if (!credits || credits.amount <= 0) {
        return res.status(400).json({ message: "Not enough credits" });
      }
      
      // Use a credit
      await storage.useCredit(profile.id);
      
      // Like the profile
      const result = await storage.likeProfile(profile.id, likedId);
      
      // Track analytics: user liked a profile
      trackSwipeAction(req.user!.id, true);
      
      // If it's a match, track that too
      if (result.isMatch) {
        trackMatchCreation(req.user!.id);
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/matches/dislike/:profileId", isAuthenticated, async (req, res) => {
    try {
      const dislikedId = parseInt(req.params.profileId);
      const profile = await storage.getProfileByUserId(req.user!.id);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Dislike doesn't use credits
      await storage.dislikeProfile(profile.id, dislikedId);
      
      // Track analytics: user disliked a profile
      trackSwipeAction(req.user!.id, false);
      
      res.json({ message: "Profile disliked" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/matches", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const matches = await storage.getMatches(profile.id);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Message routes
  app.get("/api/matches/:matchId/messages", isAuthenticated, async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const profile = await storage.getProfileByUserId(req.user!.id);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Mark messages as read
      await storage.markMessagesAsRead(matchId, profile.id);
      
      // Get messages
      const messages = await storage.getMessages(matchId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/matches/:matchId/messages", isAuthenticated, async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const profile = await storage.getProfileByUserId(req.user!.id);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Validate message data
      const messageData = insertMessageSchema.parse({
        matchId,
        senderId: profile.id,
        content: req.body.content
      });
      
      // Send message
      const message = await storage.sendMessage(messageData);
      
      // Track analytics: user sent a message
      trackMessageSent(req.user!.id);
      
      res.status(201).json(message);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Credits route
  app.get("/api/credits", isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const credits = await storage.getCredits(profile.id);
      
      // Check if credits need to be refreshed
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (credits && credits.lastRefreshed < today) {
        const refreshedCredits = await storage.refreshCredits(profile.id);
        return res.json(refreshedCredits);
      }
      
      res.json(credits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
