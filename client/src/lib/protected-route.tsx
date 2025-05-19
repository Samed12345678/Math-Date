import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        return <Component />;
      }}
    </Route>
  );
}
