import { ForceMajeureLogo } from "@/components/ForceMajeureLogo";
import { Instagram } from "lucide-react";

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-topographic opacity-10 bg-repeat bg-center" />
      <div className="absolute inset-0 bg-gradient-monochrome opacity-5" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-12 animate-fade-in">
          <ForceMajeureLogo className="w-full max-w-md mx-auto" />
        </div>

        {/* Main message */}
        <h1 className="font-display text-4xl md:text-6xl mb-6 animate-slide-down-in">
          Something special on its way,
          <br />
          <span className="text-fm-gold">Is Coming</span>
        </h1>

        <p className="text-lg md:text-l text-muted-foreground mb-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Just hang tight.
          <br />
          Stay tuned for the reveal.
        </p>

        {/* Social links */}
        <div className="flex items-center justify-center gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <a
            href="https://instagram.com/forcemajeure"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-full bg-muted/30 hover:bg-fm-gold hover:text-primary-foreground transition-all duration-300 hover:scale-110"
          >
            <Instagram className="w-6 h-6" />
          </a>
        </div>

        {/* Decorative elements */}
        <div className="mt-16 flex items-center justify-center gap-2 opacity-30">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-fm-gold" />
          <div className="w-2 h-2 rounded-full bg-fm-gold animate-pulse-gold" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-fm-gold" />
        </div>
      </div>
    </div>
  );
}
