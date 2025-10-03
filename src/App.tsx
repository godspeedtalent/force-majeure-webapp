import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import Index from "./pages/Index";
import EventDetails from "./pages/EventDetails";
import Merch from "./pages/Merch";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import ComingSoon from "./pages/ComingSoon";
import ScavengerSignup from "./pages/ScavengerSignup";
import ScavengerLeaderboard from "./pages/ScavengerLeaderboard";
import NotFound from "./pages/NotFound";
import { FeatureFlagGuard } from "@/components/FeatureFlagGuard";
import { FeatureFlagDevToggle } from "@/components/FeatureFlagDevToggle";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { data: flags, isLoading } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-fm-gold" />
      </div>
    );
  }

  const comingSoonMode = flags?.coming_soon_mode ?? false;

  return (
    <Routes>
      {/* Scavenger Hunt Routes - Always available regardless of coming_soon_mode */}
      <Route 
        path="/lf-system-scavenger-hunt" 
        element={
          <FeatureFlagGuard flagName="scavenger_hunt_active" redirectTo="/">
            <ScavengerSignup />
          </FeatureFlagGuard>
        } 
      />
      <Route path="/scavenger-leaderboard" element={<ScavengerLeaderboard />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Coming Soon Mode - Show only coming soon page for other routes */}
      {comingSoonMode ? (
        <>
          <Route path="/" element={<ComingSoon />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          {/* Normal App Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="fm-theme">
      <AuthProvider>
        <MusicPlayerProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
      <BrowserRouter>
        <AppRoutes />
        <FeatureFlagDevToggle />
      </BrowserRouter>
          </TooltipProvider>
        </MusicPlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
