import { db } from "./db";
import { userMetrics, algorithmMetrics, userFeedback } from "@shared/schema";
import { Request, Response } from "express";
import { sql } from "drizzle-orm";

// Track user login and session start
export async function trackUserLogin(userId: number) {
  try {
    await db.insert(userMetrics).values({
      userId,
      loginTime: new Date(),
    });
    console.log(`Tracked login for user ${userId}`);
  } catch (error) {
    console.error("Error tracking user login:", error);
  }
}

// Track user session end and update duration
export async function trackUserSessionEnd(userId: number, duration: number) {
  try {
    // Find the most recent login for this user
    const [latestSession] = await db
      .select()
      .from(userMetrics)
      .where(sql`user_id = ${userId}`)
      .orderBy(sql`login_time DESC`)
      .limit(1);
    
    if (latestSession) {
      await db
        .update(userMetrics)
        .set({ sessionDuration: duration })
        .where(sql`id = ${latestSession.id}`);
      
      console.log(`Updated session duration for user ${userId}: ${duration}s`);
    }
  } catch (error) {
    console.error("Error tracking session end:", error);
  }
}

// Track swipes, likes, and dislikes
export async function trackSwipeAction(userId: number, isLike: boolean) {
  try {
    // Find today's metrics for this user or create if not exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [userDailyMetrics] = await db
      .select()
      .from(userMetrics)
      .where(sql`user_id = ${userId} AND date >= ${today}`)
      .limit(1);
    
    if (userDailyMetrics) {
      // Update existing record
      await db
        .update(userMetrics)
        .set({
          swipesCount: userDailyMetrics.swipesCount + 1,
          likesCount: isLike ? userDailyMetrics.likesCount + 1 : userDailyMetrics.likesCount,
          dislikesCount: !isLike ? userDailyMetrics.dislikesCount + 1 : userDailyMetrics.dislikesCount,
        })
        .where(sql`id = ${userDailyMetrics.id}`);
    } else {
      // Create new record for today
      await db.insert(userMetrics).values({
        userId,
        swipesCount: 1,
        likesCount: isLike ? 1 : 0,
        dislikesCount: !isLike ? 1 : 0,
        date: today,
      });
    }
    
    console.log(`Tracked swipe for user ${userId} - Like: ${isLike}`);
  } catch (error) {
    console.error("Error tracking swipe action:", error);
  }
}

// Track match creation
export async function trackMatchCreation(userId: number) {
  try {
    // Find today's metrics for this user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [userDailyMetrics] = await db
      .select()
      .from(userMetrics)
      .where(sql`user_id = ${userId} AND date >= ${today}`)
      .limit(1);
    
    if (userDailyMetrics) {
      await db
        .update(userMetrics)
        .set({
          matchesCount: userDailyMetrics.matchesCount + 1,
        })
        .where(sql`id = ${userDailyMetrics.id}`);
    } else {
      await db.insert(userMetrics).values({
        userId,
        matchesCount: 1,
        date: today,
      });
    }
    
    console.log(`Tracked match creation for user ${userId}`);
  } catch (error) {
    console.error("Error tracking match creation:", error);
  }
}

// Track message sent
export async function trackMessageSent(userId: number) {
  try {
    // Find today's metrics for this user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [userDailyMetrics] = await db
      .select()
      .from(userMetrics)
      .where(sql`user_id = ${userId} AND date >= ${today}`)
      .limit(1);
    
    if (userDailyMetrics) {
      await db
        .update(userMetrics)
        .set({
          messagesCount: userDailyMetrics.messagesCount + 1,
        })
        .where(sql`id = ${userDailyMetrics.id}`);
    } else {
      await db.insert(userMetrics).values({
        userId,
        messagesCount: 1,
        date: today,
      });
    }
    
    console.log(`Tracked message sent by user ${userId}`);
  } catch (error) {
    console.error("Error tracking message sent:", error);
  }
}

// Record algorithm metrics (scheduled job)
export async function recordAlgorithmMetrics() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate average score change
    const scoreChanges = await db.execute(sql`
      SELECT AVG(score_diff) as avg_score_change
      FROM (
        SELECT 
          CASE 
            WHEN count(*) > 1 THEN last_value(score) OVER (PARTITION BY profile_id ORDER BY created_at) - first_value(score) OVER (PARTITION BY profile_id ORDER BY created_at)
            ELSE 0
          END as score_diff
        FROM (
          SELECT id, profile_id, score, created_at,
          ROW_NUMBER() OVER (PARTITION BY profile_id ORDER BY created_at) as rn
          FROM profiles
          WHERE created_at >= ${yesterday} AND created_at < ${today}
        ) as profile_changes
        GROUP BY profile_id
      ) as score_diffs
    `);
    
    // Calculate match rate (% of likes that result in matches)
    const matchRateResult = await db.execute(sql`
      WITH daily_likes AS (
        SELECT COUNT(*) as total_likes
        FROM user_metrics
        WHERE date >= ${yesterday} AND date < ${today}
        AND likes_count > 0
      ),
      daily_matches AS (
        SELECT COUNT(*) as total_matches
        FROM user_metrics
        WHERE date >= ${yesterday} AND date < ${today}
        AND matches_count > 0
      )
      SELECT 
        CASE 
          WHEN dl.total_likes > 0 THEN (dm.total_matches * 100.0 / dl.total_likes)
          ELSE 0
        END as match_rate
      FROM daily_likes dl, daily_matches dm
    `);
    
    // Calculate average response time
    const responseTimeResult = await db.execute(sql`
      WITH first_messages AS (
        SELECT match_id, MIN(created_at) as first_message_time
        FROM messages
        WHERE created_at >= ${yesterday} AND created_at < ${today}
        GROUP BY match_id
      ),
      match_times AS (
        SELECT id as match_id, created_at as match_time
        FROM matches
        WHERE created_at >= ${yesterday} AND created_at < ${today}
      )
      SELECT AVG(EXTRACT(EPOCH FROM (fm.first_message_time - mt.match_time))) as avg_response_time
      FROM first_messages fm
      JOIN match_times mt ON fm.match_id = mt.match_id
    `);
    
    // Calculate user retention (% of users active in last 7 days who returned today)
    const retentionResult = await db.execute(sql`
      WITH active_last_week AS (
        SELECT DISTINCT user_id
        FROM user_metrics
        WHERE date >= ${new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)} AND date < ${yesterday}
      ),
      returned_today AS (
        SELECT DISTINCT user_id
        FROM user_metrics
        WHERE date >= ${yesterday} AND date < ${today}
      )
      SELECT 
        CASE 
          WHEN COUNT(alw.user_id) > 0 THEN (COUNT(rt.user_id) * 100.0 / COUNT(alw.user_id))
          ELSE 0
        END as retention_rate
      FROM active_last_week alw
      LEFT JOIN returned_today rt ON alw.user_id = rt.user_id
    `);
    
    // Calculate average session length
    const sessionLengthResult = await db.execute(sql`
      SELECT AVG(session_duration) as avg_session_length
      FROM user_metrics
      WHERE date >= ${yesterday} AND date < ${today}
      AND session_duration IS NOT NULL
    `);
    
    // Extract values from results
    const averageScoreChange = parseFloat(scoreChanges.rows[0]?.avg_score_change || '0');
    const matchRate = parseFloat(matchRateResult.rows[0]?.match_rate || '0');
    const averageResponseTime = parseInt(responseTimeResult.rows[0]?.avg_response_time || '0');
    const userRetention = parseFloat(retentionResult.rows[0]?.retention_rate || '0');
    const averageSessionLength = parseInt(sessionLengthResult.rows[0]?.avg_session_length || '0');
    
    // Record the metrics
    await db.insert(algorithmMetrics).values({
      dateRecorded: yesterday,
      averageScoreChange,
      matchRate,
      averageResponseTime,
      userRetention,
      averageSessionLength,
    });
    
    console.log("Recorded algorithm metrics for", yesterday.toISOString().split('T')[0]);
  } catch (error) {
    console.error("Error recording algorithm metrics:", error);
  }
}

// Record user feedback
export async function recordUserFeedback(userId: number, data: {
  matchQualityRating?: number;
  algorithmFairnessRating?: number;
  generalSatisfaction?: number;
  feedbackText?: string;
}) {
  try {
    await db.insert(userFeedback).values({
      userId,
      matchQualityRating: data.matchQualityRating,
      algorithmFairnessRating: data.algorithmFairnessRating,
      generalSatisfaction: data.generalSatisfaction,
      feedbackText: data.feedbackText,
      dateSubmitted: new Date(),
    });
    
    console.log(`Recorded feedback from user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error recording user feedback:", error);
    return false;
  }
}

// API endpoints for analytics
export function registerAnalyticsRoutes(app: any) {
  // Endpoint for client-side tracking of session end
  app.post("/api/analytics/session-end", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { duration } = req.body;
    if (typeof duration !== "number") {
      return res.status(400).json({ error: "Invalid duration parameter" });
    }
    
    trackUserSessionEnd(req.user!.id, duration)
      .then(() => res.status(200).json({ success: true }))
      .catch((error) => {
        console.error("Error in session-end endpoint:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  });
  
  // Endpoint for user feedback submission
  app.post("/api/analytics/feedback", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { matchQualityRating, algorithmFairnessRating, generalSatisfaction, feedbackText } = req.body;
    
    recordUserFeedback(req.user!.id, {
      matchQualityRating,
      algorithmFairnessRating,
      generalSatisfaction,
      feedbackText,
    })
      .then((success) => {
        if (success) {
          res.status(200).json({ success: true });
        } else {
          res.status(500).json({ error: "Failed to record feedback" });
        }
      })
      .catch((error) => {
        console.error("Error in feedback endpoint:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  });
  
  // Admin endpoint for getting algorithm metrics
  app.get("/api/analytics/algorithm-metrics", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Check if user is admin (you may want to add an admin field to user table)
    // For simplicity, we'll just check if it's the first user (ID 1)
    if (req.user!.id !== 1) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const days = parseInt(req.query.days as string || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    db.select()
      .from(algorithmMetrics)
      .where(sql`date_recorded >= ${startDate}`)
      .orderBy(sql`date_recorded`)
      .then((metrics) => {
        res.status(200).json(metrics);
      })
      .catch((error) => {
        console.error("Error fetching algorithm metrics:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  });
  
  // Admin endpoint for getting user metrics
  app.get("/api/analytics/user-metrics", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Check if user is admin (simplified check)
    if (req.user!.id !== 1) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const days = parseInt(req.query.days as string || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    db.execute(sql`
      SELECT 
        DATE_TRUNC('day', date) as day,
        COUNT(DISTINCT user_id) as active_users,
        SUM(swipes_count) as total_swipes,
        SUM(likes_count) as total_likes,
        SUM(dislikes_count) as total_dislikes,
        SUM(matches_count) as total_matches,
        SUM(messages_count) as total_messages,
        AVG(session_duration) as avg_session_duration
      FROM user_metrics
      WHERE date >= ${startDate}
      GROUP BY DATE_TRUNC('day', date)
      ORDER BY day
    `)
      .then((result) => {
        res.status(200).json(result.rows);
      })
      .catch((error) => {
        console.error("Error fetching user metrics:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  });
  
  // Admin endpoint for getting feedback summary
  app.get("/api/analytics/feedback-summary", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Check if user is admin (simplified check)
    if (req.user!.id !== 1) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const days = parseInt(req.query.days as string || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    db.execute(sql`
      SELECT 
        AVG(match_quality_rating) as avg_match_quality,
        AVG(algorithm_fairness_rating) as avg_fairness,
        AVG(general_satisfaction) as avg_satisfaction,
        COUNT(*) as total_feedback
      FROM user_feedback
      WHERE date_submitted >= ${startDate}
    `)
      .then((result) => {
        res.status(200).json(result.rows[0]);
      })
      .catch((error) => {
        console.error("Error fetching feedback summary:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  });
}