import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, Users, Heart, MessageSquare, BarChart as BarChartIcon } from "lucide-react";

// Define colors for charts
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFD166", "#06D6A0", "#118AB2"];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");

  // Only admin (user with ID 1) can access this page
  if (user && user.id !== 1) {
    return <Redirect to="/" />;
  }

  // User metrics query
  const { 
    data: userMetrics, 
    isLoading: isLoadingUserMetrics 
  } = useQuery({
    queryKey: ["/api/analytics/user-metrics", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/user-metrics?days=${timeRange}`);
      if (!response.ok) throw new Error("Failed to fetch user metrics");
      return response.json();
    },
    enabled: !!user && user.id === 1
  });

  // Algorithm metrics query
  const {
    data: algorithmMetrics,
    isLoading: isLoadingAlgorithmMetrics
  } = useQuery({
    queryKey: ["/api/analytics/algorithm-metrics", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/algorithm-metrics?days=${timeRange}`);
      if (!response.ok) throw new Error("Failed to fetch algorithm metrics");
      return response.json();
    },
    enabled: !!user && user.id === 1
  });

  // Feedback summary query
  const {
    data: feedbackSummary,
    isLoading: isLoadingFeedbackSummary
  } = useQuery({
    queryKey: ["/api/analytics/feedback-summary", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/feedback-summary?days=${timeRange}`);
      if (!response.ok) throw new Error("Failed to fetch feedback summary");
      return response.json();
    },
    enabled: !!user && user.id === 1
  });

  // Format data for charts
  const userActivityData = userMetrics ? userMetrics.map((day: any) => ({
    day: new Date(day.day).toLocaleDateString(),
    activeUsers: parseInt(day.active_users),
    swipes: parseInt(day.total_swipes),
    likes: parseInt(day.total_likes),
    dislikes: parseInt(day.total_dislikes),
    matches: parseInt(day.total_matches),
    messages: parseInt(day.total_messages),
  })) : [];

  const matchRateData = algorithmMetrics ? algorithmMetrics.map((metric: any) => ({
    date: new Date(metric.dateRecorded).toLocaleDateString(),
    matchRate: parseFloat(metric.matchRate),
    avgScoreChange: parseFloat(metric.averageScoreChange),
    userRetention: parseFloat(metric.userRetention),
  })) : [];

  // Calculate average metrics for summary cards
  const calculateAverage = (data: any[], field: string) => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, item) => sum + parseFloat(item[field]), 0) / data.length;
  };

  const avgMatchRate = calculateAverage(matchRateData, 'matchRate');
  const avgScoreChange = calculateAverage(matchRateData, 'avgScoreChange');
  const avgUserRetention = calculateAverage(matchRateData, 'userRetention');

  // Generate feedback data for pie chart
  const feedbackData = feedbackSummary ? [
    { name: 'Match Quality', value: parseFloat(feedbackSummary.avg_match_quality) || 0 },
    { name: 'Algorithm Fairness', value: parseFloat(feedbackSummary.avg_fairness) || 0 },
    { name: 'Overall Satisfaction', value: parseFloat(feedbackSummary.avg_satisfaction) || 0 },
  ] : [];

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (isLoadingUserMetrics || isLoadingAlgorithmMetrics || isLoadingFeedbackSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Dating App Analytics</h1>
      <p className="text-muted-foreground mb-6">
        Monitor user engagement and algorithm effectiveness
      </p>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Game Theory Algorithm Performance</h2>
        <div className="flex gap-2">
          <Button 
            variant={timeRange === "7" ? "default" : "outline"} 
            onClick={() => setTimeRange("7")}
            size="sm"
          >
            7 Days
          </Button>
          <Button 
            variant={timeRange === "30" ? "default" : "outline"} 
            onClick={() => setTimeRange("30")}
            size="sm"
          >
            30 Days
          </Button>
          <Button 
            variant={timeRange === "90" ? "default" : "outline"} 
            onClick={() => setTimeRange("90")}
            size="sm"
          >
            90 Days
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Match Rate</CardTitle>
            <CardDescription>Average % of likes that result in matches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgMatchRate.toFixed(2)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Avg. Score Change</CardTitle>
            <CardDescription>Daily profile score changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {avgScoreChange > 0 ? '+' : ''}{avgScoreChange.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">User Retention</CardTitle>
            <CardDescription>% of users who return within 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgUserRetention.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="user-activity">
        <TabsList className="mb-4">
          <TabsTrigger value="user-activity">User Activity</TabsTrigger>
          <TabsTrigger value="algorithm-metrics">Algorithm Metrics</TabsTrigger>
          <TabsTrigger value="user-feedback">User Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="user-activity">
          <Card>
            <CardHeader>
              <CardTitle>Daily User Activity</CardTitle>
              <CardDescription>User engagement metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              {userActivityData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" name="Active Users" />
                      <Line type="monotone" dataKey="swipes" stroke="#82ca9d" name="Swipes" />
                      <Line type="monotone" dataKey="likes" stroke="#ff7300" name="Likes" />
                      <Line type="monotone" dataKey="matches" stroke="#0088fe" name="Matches" />
                      <Line type="monotone" dataKey="messages" stroke="#00C49F" name="Messages" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No user activity data available for this time period</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Swipe Distribution</CardTitle>
                <CardDescription>Likes vs Dislikes</CardDescription>
              </CardHeader>
              <CardContent>
                {userActivityData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userActivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="likes" fill="#FF6B6B" name="Likes" />
                        <Bar dataKey="dislikes" fill="#4ECDC4" name="Dislikes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No swipe data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Engagement Ratios</CardTitle>
                <CardDescription>Match to Message Conversion</CardDescription>
              </CardHeader>
              <CardContent>
                {userActivityData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userActivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="matches" fill="#FFD166" name="Matches" />
                        <Bar dataKey="messages" fill="#06D6A0" name="Messages" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No engagement data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="algorithm-metrics">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Performance Over Time</CardTitle>
              <CardDescription>Match rates and user retention trends</CardDescription>
            </CardHeader>
            <CardContent>
              {matchRateData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={matchRateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="matchRate" stroke="#FF6B6B" name="Match Rate (%)" />
                      <Line type="monotone" dataKey="avgScoreChange" stroke="#4ECDC4" name="Avg Score Change" />
                      <Line type="monotone" dataKey="userRetention" stroke="#FFD166" name="User Retention (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No algorithm metrics available for this time period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="user-feedback">
          <Card>
            <CardHeader>
              <CardTitle>User Satisfaction Metrics</CardTitle>
              <CardDescription>Average ratings from user feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackData.some(item => item.value > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={feedbackData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
                        >
                          {feedbackData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex flex-col justify-center">
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Feedback Summary</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Based on {feedbackSummary?.total_feedback || 0} user submissions
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Match Quality</span>
                            <span className="text-sm font-medium">
                              {parseFloat(feedbackSummary?.avg_match_quality || 0).toFixed(1)}/5
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2.5">
                            <div 
                              className="bg-primary rounded-full h-2.5" 
                              style={{ width: `${(parseFloat(feedbackSummary?.avg_match_quality || 0) / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Algorithm Fairness</span>
                            <span className="text-sm font-medium">
                              {parseFloat(feedbackSummary?.avg_fairness || 0).toFixed(1)}/5
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2.5">
                            <div 
                              className="bg-primary rounded-full h-2.5" 
                              style={{ width: `${(parseFloat(feedbackSummary?.avg_fairness || 0) / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Overall Satisfaction</span>
                            <span className="text-sm font-medium">
                              {parseFloat(feedbackSummary?.avg_satisfaction || 0).toFixed(1)}/5
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2.5">
                            <div 
                              className="bg-primary rounded-full h-2.5" 
                              style={{ width: `${(parseFloat(feedbackSummary?.avg_satisfaction || 0) / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No feedback data available for this time period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                User Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {userActivityData.length > 0
                  ? `Average of ${(userActivityData.reduce((sum, day) => sum + day.activeUsers, 0) / userActivityData.length).toFixed(0)} daily active users with ${(userActivityData.reduce((sum, day) => sum + day.swipes, 0) / userActivityData.length).toFixed(0)} average swipes per day.`
                  : "Insufficient data to generate insights."
                }
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Matching Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {matchRateData.length > 0
                  ? `Current match rate is ${avgMatchRate.toFixed(1)}%, showing ${avgMatchRate > 25 ? "healthy" : "below average"} user compatibility.`
                  : "Insufficient data to generate insights."
                }
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Conversation Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {userActivityData.length > 0
                  ? `${((userActivityData.reduce((sum, day) => sum + day.messages, 0) / userActivityData.reduce((sum, day) => sum + day.matches, 1)) * 100).toFixed(0)}% of matches result in conversations.`
                  : "Insufficient data to generate insights."
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}