import { Switch, Route } from "wouter";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import MatchesPage from "@/pages/matches-page";
import MessagesPage from "@/pages/messages-page";
import ProfilePage from "@/pages/profile-page";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function Router() {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/matches" component={MatchesPage} />
      <ProtectedRoute path="/messages/:matchId?" component={MessagesPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route path="*" component={() => <NotFound />} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class">
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
