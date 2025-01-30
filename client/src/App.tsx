import { Switch, Route, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useStreak } from "@/hooks/use-streak";
import { Loader2, User, Flame } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import ContentDetail from "@/pages/content-detail";
import ProfilePage from "@/pages/profile";
import PremiumPage from "@/pages/premium";

function Navbar() {
  const { user, logout } = useUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-display hover:opacity-80 transition-opacity">
            History Bits
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="font-medium">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-orange-500">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-medium">{user.streak || 0}</span>
                </div>
                <span className="text-sm text-muted-foreground hidden md:inline-block">
                  Welcome, {user.username}
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => logout()}
                  className="font-medium"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button className="font-medium">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  const { isLoading } = useUser();
  useStreak(); // Add streak tracking

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/content/:id" component={ContentDetail} />
        <Route path="/premium" component={PremiumPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;