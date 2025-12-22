import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Instagram, Music, ArrowRight, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DecorativeDivider } from "@/components/primitives/DecorativeDivider";
import { ForceMajeureLogo } from "@/components/navigation/ForceMajeureLogo";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/common/shadcn/button";
import { FmI18nPages } from "@/components/common/i18n";
import { useUserLinkedArtist } from "@/shared/hooks/useUserLinkedArtist";
export default function ComingSoon() {
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const navigate = useNavigate();
    const { hasLinkedArtist } = useUserLinkedArtist();
    useEffect(() => {
        // Check if fonts are already loaded
        const checkFonts = async () => {
            try {
                // Wait for document fonts to be ready
                await document.fonts.ready;
                // Small delay to ensure smooth transition
                setTimeout(() => {
                    setFontsLoaded(true);
                }, 100);
            }
            catch (_error) {
                // Fallback after timeout in case of font loading issues
                setTimeout(() => setFontsLoaded(true), 1000);
            }
        };
        checkFonts();
    }, []);
    return (_jsx(Layout, { hideFooter: true, children: _jsxs("div", { className: "h-[calc(100vh-64px)] flex items-center justify-center relative overflow-hidden", children: [_jsxs("div", { className: `text-center px-4 md:px-6 max-w-xl mx-auto w-full transition-opacity duration-500 ${fontsLoaded ? "opacity-100" : "opacity-0"}`, children: [_jsx("div", { className: `mb-3 md:mb-4 flex justify-center ${fontsLoaded ? "animate-fade-in" : ""}`, children: _jsx("div", { className: "w-full max-w-[100px] md:max-w-[150px]", children: _jsx(ForceMajeureLogo, { size: "responsive" }) }) }), _jsx(FmI18nPages, { i18nKey: "comingSoon.title", as: "h1", className: `font-display text-xl md:text-3xl mb-1.5 md:mb-2 ${fontsLoaded ? "animate-slide-down-in" : ""}` }), _jsx(FmI18nPages, { i18nKey: "comingSoon.subtitle", as: "p", className: `text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 ${fontsLoaded ? "animate-fade-in" : ""}` }), _jsx("div", { className: `p-2.5 md:p-4 bg-black/60 backdrop-blur-sm border border-fm-gold/20 mb-3 md:mb-4 ${fontsLoaded ? "animate-fade-in" : ""}`, style: { animationDelay: fontsLoaded ? "0.3s" : "0s" }, children: hasLinkedArtist ? (
                            // Signed up artist view
                            _jsxs("div", { className: "flex items-start gap-1.5 md:gap-2", children: [_jsx(CheckCircle, { className: "h-3.5 w-3.5 text-fm-gold mt-0.5 flex-shrink-0" }), _jsxs("div", { className: "text-left", children: [_jsx(FmI18nPages, { i18nKey: "comingSoon.artistSignedUp", as: "h2", className: "font-canela text-xs md:text-sm text-fm-gold mb-0.5 md:mb-1" }), _jsx(FmI18nPages, { i18nKey: "comingSoon.artistSignedUpDescription", as: "p", className: "text-[10px] md:text-xs text-muted-foreground leading-snug" })] })] })) : (
                            // Default view for users without linked artist
                            _jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-start gap-1.5 md:gap-2 mb-1.5 md:mb-2", children: [_jsx(Music, { className: "h-3.5 w-3.5 text-fm-gold mt-0.5 flex-shrink-0" }), _jsxs("div", { className: "text-left", children: [_jsx(FmI18nPages, { i18nKey: "comingSoon.lookingForArtists", as: "h2", className: "font-canela text-xs md:text-sm text-fm-gold mb-0.5 md:mb-1" }), _jsx(FmI18nPages, { i18nKey: "comingSoon.artistDescription", as: "p", className: "text-[10px] md:text-xs text-muted-foreground leading-snug" })] })] }), _jsxs(Button, { variant: "outline", onClick: () => navigate("/artists/signup"), className: "w-full border-fm-gold bg-transparent text-white hover:text-fm-gold hover:bg-fm-gold/10 text-[10px] md:text-xs py-1.5", children: [_jsx(FmI18nPages, { i18nKey: "comingSoon.signUpAsArtist" }), _jsx(ArrowRight, { className: "ml-1.5 h-2.5 w-2.5" })] })] })) }), _jsx(DecorativeDivider, { marginTop: "mt-2 md:mt-3", marginBottom: "mb-2 md:mb-3" }), _jsx("div", { className: `flex items-center justify-center ${fontsLoaded ? "animate-fade-in" : "opacity-0"}`, style: { animationDelay: fontsLoaded ? "0.4s" : "0s" }, children: _jsx("a", { href: "https://www.instagram.com/force.majeure.events", target: "_blank", rel: "noopener noreferrer", className: "p-2 md:p-2.5 rounded-full bg-muted/30 hover:bg-fm-gold hover:text-primary-foreground transition-all duration-300 hover:scale-110", children: _jsx(Instagram, { className: "w-4 h-4 md:w-5 md:h-5" }) }) })] }), !fontsLoaded && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-background z-20", children: _jsx(FmI18nPages, { i18nKey: "comingSoon.loading", as: "div", className: "animate-pulse text-muted-foreground" }) }))] }) }));
}
