import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import Scavenger from "./pages/Scavenger";
import ProxyToken from "./pages/ProxyToken";
import AdminConfig from "./pages/AdminConfig";
import NotFound from "./pages/NotFound";
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
  
  // Debug logging
  console.log('Feature Flags:', { flags, comingSoonMode });
  console.log('Current Path:', window.location.pathname);

  return (
    <Routes>
      {/* Always-accessible routes - highest priority */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/scavenger" element={<Scavenger />} />
      <Route path="/proxy-token" element={<ProxyToken />} />
      
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
          <Route path="/admin" element={<AdminConfig />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </>
      )}
    </Routes>
  );
};

const App = () => {
  // Force dark mode by adding class to html element
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MusicPlayerProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </MusicPlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
