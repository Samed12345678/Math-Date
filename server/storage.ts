import { 
  users, type User, type InsertUser,
  profiles, type Profile, type InsertProfile,
  photos, type Photo, type InsertPhoto,
  interests, profileInterests,
  likes, type Like, type InsertLike,
  matches, type Match,
  messages, type Message, type InsertMessage,
  credits, type Credit
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, inArray, not, gt, lt, isNull, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Profile management
  getProfile(id: number): Promise<Profile | undefined>;
  getProfileByUserId(userId: number): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile, userId: number): Promise<Profile>;
  updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile>;
  getProfileWithDetails(profileId: number): Promise<any>;
  
  // Photo management
  addPhoto(photo: InsertPhoto): Promise<Photo>;
  getPhotosByProfileId(profileId: number): Promise<Photo[]>;
  setMainPhoto(photoId: number, profileId: number): Promise<void>;
  deletePhoto(photoId: number, profileId: number): Promise<void>;
  
  // Interest management
  getAllInterests(): Promise<any[]>;
  addProfileInterest(profileId: number, interestId: number): Promise<void>;
  removeProfileInterest(profileId: number, interestId: number): Promise<void>;
  
  // Match and like management
  getPotentialMatches(profileId: number, limit: number, offset: number): Promise<any[]>;
  likeProfile(likerId: number, likedId: number): Promise<{ isMatch: boolean, match?: Match }>;
  dislikeProfile(likerId: number, dislikedId: number): Promise<void>;
  getMatches(profileId: number): Promise<any[]>;
  getMatch(profileId1: number, profileId2: number): Promise<Match | undefined>;
  
  // Credit management
  getCredits(profileId: number): Promise<Credit | undefined>;
  useCredit(profileId: number): Promise<Credit>;
  refreshCredits(profileId: number): Promise<Credit>;
  
  // Message management
  getMessages(matchId: number): Promise<Message[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(matchId: number, recipientId: number): Promise<void>;
  
  // Score management
  updateScore(profileId: number, isLiked: boolean): Promise<number>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Profile management
  async getProfile(id: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
    return profile;
  }

  async getProfileByUserId(userId: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertProfile, userId: number): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values({
      ...profile,
      userId,
    }).returning();

    // Initialize credits for the new profile
    await db.insert(credits).values({
      profileId: newProfile.id,
      amount: 10,
      lastRefreshed: new Date(),
    });

    return newProfile;
  }

  async updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile> {
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();
    return updatedProfile;
  }

  async getProfileWithDetails(profileId: number): Promise<any> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
    
    if (!profile) {
      return undefined;
    }
    
    const profilePhotos = await db.select().from(photos).where(eq(photos.profileId, profileId)).orderBy(asc(photos.order));
    
    const profileInterestData = await db
      .select({
        id: interests.id,
        name: interests.name,
      })
      .from(profileInterests)
      .innerJoin(interests, eq(profileInterests.interestId, interests.id))
      .where(eq(profileInterests.profileId, profileId));
    
    return {
      ...profile,
      photos: profilePhotos,
      interests: profileInterestData,
    };
  }

  // Photo management
  async addPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values(photo).returning();
    return newPhoto;
  }

  async getPhotosByProfileId(profileId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.profileId, profileId)).orderBy(asc(photos.order));
  }

  async setMainPhoto(photoId: number, profileId: number): Promise<void> {
    // First, set all photos for this profile to not main
    await db
      .update(photos)
      .set({ isMain: false })
      .where(eq(photos.profileId, profileId));
    
    // Then set the selected photo as main
    await db
      .update(photos)
      .set({ isMain: true })
      .where(and(eq(photos.id, photoId), eq(photos.profileId, profileId)));
  }

  async deletePhoto(photoId: number, profileId: number): Promise<void> {
    await db
      .delete(photos)
      .where(and(eq(photos.id, photoId), eq(photos.profileId, profileId)));
  }

  // Interest management
  async getAllInterests(): Promise<any[]> {
    return await db.select().from(interests);
  }

  async addProfileInterest(profileId: number, interestId: number): Promise<void> {
    await db.insert(profileInterests).values({
      profileId,
      interestId
    });
  }

  async removeProfileInterest(profileId: number, interestId: number): Promise<void> {
    await db
      .delete(profileInterests)
      .where(and(
        eq(profileInterests.profileId, profileId),
        eq(profileInterests.interestId, interestId)
      ));
  }

  // Match and like management
  async getPotentialMatches(profileId: number, limit: number, offset: number): Promise<any[]> {
    // Get the user's profile to determine what gender they're interested in
    const [userProfile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
    
    if (!userProfile) {
      return [];
    }
    
    // Find previously liked profiles
    const likedProfiles = await db
      .select({ id: likes.likedId })
      .from(likes)
      .where(eq(likes.likerId, profileId));
    
    const likedIds = likedProfiles.map(like => like.id);
    
    // Build the base query to find potential matches
    let query = db
      .select({
        id: profiles.id,
        name: profiles.name,
        bio: profiles.bio,
        gender: profiles.gender,
        location: profiles.location,
        score: profiles.score,
      })
      .from(profiles)
      .where(and(
        // Not the current user
        not(eq(profiles.id, profileId)),
        // Not already liked/disliked
        likedIds.length > 0 ? not(inArray(profiles.id, likedIds)) : sql`1=1`,
      ))
      .orderBy(desc(profiles.score)) // Order by score
      .limit(limit)
      .offset(offset);

    // Add gender filter based on user interest
    if (userProfile.interestedIn !== 'everyone') {
      query = query.where(eq(profiles.gender, userProfile.interestedIn));
    }
    
    const potentialMatches = await query;
    
    // Fetch photos for each profile
    const profileIds = potentialMatches.map(profile => profile.id);
    
    if (profileIds.length === 0) {
      return [];
    }
    
    const profilePhotos = await db
      .select()
      .from(photos)
      .where(inArray(photos.profileId, profileIds));
    
    // Add photos to each profile
    return potentialMatches.map(profile => {
      const profilePhotoList = profilePhotos.filter(photo => photo.profileId === profile.id);
      return {
        ...profile,
        photos: profilePhotoList,
      };
    });
  }

  async likeProfile(likerId: number, likedId: number): Promise<{ isMatch: boolean, match?: Match }> {
    // Add the like
    await db.insert(likes).values({
      likerId,
      likedId,
    });
    
    // Update score for the liked profile
    await this.updateScore(likedId, true);
    
    // Check if there's a mutual like (they already liked this user)
    const [mutualLike] = await db
      .select()
      .from(likes)
      .where(and(
        eq(likes.likerId, likedId),
        eq(likes.likedId, likerId)
      ));
    
    if (mutualLike) {
      // Create a match
      const [newMatch] = await db.insert(matches).values({
        profileId1: likerId,
        profileId2: likedId,
      }).returning();
      
      return { isMatch: true, match: newMatch };
    }
    
    return { isMatch: false };
  }

  async dislikeProfile(likerId: number, dislikedId: number): Promise<void> {
    // For a dislike, we just need to mark it in the likes table with a negative indicator
    // In a real app, you might have a separate "dislikes" table
    await db.insert(likes).values({
      likerId,
      likedId: dislikedId,
    });
    
    // Update score for the disliked profile
    await this.updateScore(dislikedId, false);
  }

  async getMatches(profileId: number): Promise<any[]> {
    // Get all matches for this profile
    const userMatches = await db
      .select()
      .from(matches)
      .where(or(
        eq(matches.profileId1, profileId),
        eq(matches.profileId2, profileId)
      ));
    
    if (userMatches.length === 0) {
      return [];
    }
    
    // Get profiles for all matches
    const matchProfiles = [];
    
    for (const match of userMatches) {
      const otherProfileId = match.profileId1 === profileId ? match.profileId2 : match.profileId1;
      const otherProfile = await this.getProfileWithDetails(otherProfileId);
      
      // Get last message
      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.matchId, match.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      // Get unread count
      const unreadCount = await db
        .select({ count: sql`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.matchId, match.id),
          eq(messages.senderId, otherProfileId),
          eq(messages.read, false)
        ));
      
      matchProfiles.push({
        match: match,
        profile: otherProfile,
        lastMessage: lastMessage || null,
        unreadCount: unreadCount[0].count,
      });
    }
    
    return matchProfiles;
  }

  async getMatch(profileId1: number, profileId2: number): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(
        or(
          and(
            eq(matches.profileId1, profileId1),
            eq(matches.profileId2, profileId2)
          ),
          and(
            eq(matches.profileId1, profileId2),
            eq(matches.profileId2, profileId1)
          )
        )
      );
    
    return match;
  }

  // Credit management
  async getCredits(profileId: number): Promise<Credit | undefined> {
    const [userCredits] = await db
      .select()
      .from(credits)
      .where(eq(credits.profileId, profileId));
    
    return userCredits;
  }

  async useCredit(profileId: number): Promise<Credit> {
    // Get current credits
    const [userCredits] = await db
      .select()
      .from(credits)
      .where(eq(credits.profileId, profileId));
    
    if (!userCredits || userCredits.amount <= 0) {
      throw new Error("No credits available");
    }
    
    // Decrement credits
    const [updatedCredits] = await db
      .update(credits)
      .set({
        amount: userCredits.amount - 1,
      })
      .where(eq(credits.profileId, profileId))
      .returning();
    
    return updatedCredits;
  }

  async refreshCredits(profileId: number): Promise<Credit> {
    // Reset credits to 10 and update last refreshed time
    const [refreshedCredits] = await db
      .update(credits)
      .set({
        amount: 10,
        lastRefreshed: new Date(),
      })
      .where(eq(credits.profileId, profileId))
      .returning();
    
    return refreshedCredits;
  }

  // Message management
  async getMessages(matchId: number): Promise<Message[]> {
    const messagesList = await db
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(asc(messages.createdAt));
    
    return messagesList;
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    return newMessage;
  }

  async markMessagesAsRead(matchId: number, recipientId: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(and(
        eq(messages.matchId, matchId),
        not(eq(messages.senderId, recipientId)),
        eq(messages.read, false)
      ));
  }

  // Score management using game theory principles
  async updateScore(profileId: number, isLiked: boolean): Promise<number> {
    // Get current profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profileId));
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    // Game theory implementation:
    // 1. Score is on a scale of 0-100
    // 2. When liked, higher scores get smaller increments (diminishing returns)
    // 3. When disliked, lower scores get smaller decrements (floor effect)
    let newScore = profile.score;
    
    if (isLiked) {
      // Calculate boost with diminishing returns for high scores
      // Max boost is 3 points, min boost is 0.5 points
      const boost = Math.max(0.5, 3 * (1 - (profile.score / 100)));
      newScore = Math.min(100, profile.score + boost);
    } else {
      // Calculate penalty with diminishing effects for low scores
      // Max penalty is 2 points, min penalty is 0.3 points
      const penalty = Math.max(0.3, 2 * (profile.score / 100));
      newScore = Math.max(0, profile.score - penalty);
    }
    
    // Update the profile score
    const [updatedProfile] = await db
      .update(profiles)
      .set({ score: newScore })
      .where(eq(profiles.id, profileId))
      .returning();
    
    return updatedProfile.score;
  }
}

export const storage = new DatabaseStorage();
