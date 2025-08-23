import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Force Majeure Brand Colors
				'fm-gold': 'hsl(var(--fm-gold))',
				'fm-crimson': 'hsl(var(--fm-crimson))',
				'fm-charcoal': 'hsl(var(--fm-charcoal))',
				'fm-silver': 'hsl(var(--fm-silver))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				'screamer': ['FK Screamer', 'system-ui', 'sans-serif'],
				'canela': ['Canela Deck', 'Georgia', 'serif'],
				'display': ['FK Screamer', 'system-ui', 'sans-serif'],
				'body': ['Canela Deck', 'Georgia', 'serif'],
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(100%)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'pulse-gold': {
					'0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--fm-gold) / 0.7)' },
					'50%': { boxShadow: '0 0 0 10px hsl(var(--fm-gold) / 0)' }
				},
				'shimmer': {
					'0%': { 
						backgroundPosition: '-200% 0',
						borderImage: 'linear-gradient(45deg, transparent, hsl(var(--accent)), transparent) 1'
					},
					'100%': { 
						backgroundPosition: '200% 0',
						borderImage: 'linear-gradient(45deg, transparent, hsl(var(--accent)), transparent) 1'
					}
				},
				'border-shimmer': {
					'0%': { borderColor: 'hsl(var(--fm-crimson))' },
					'50%': { borderColor: 'hsl(var(--accent))' },
					'100%': { borderColor: 'hsl(var(--fm-crimson))' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.3s ease-out',
				'accordion-up': 'accordion-up 0.3s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'pulse-gold': 'pulse-gold 2s infinite',
				'shimmer': 'shimmer 2s infinite',
				'border-shimmer': 'border-shimmer 2s infinite'
			},
			backgroundImage: {
				'gradient-gold': 'var(--gradient-gold)',
				'gradient-crimson': 'var(--gradient-crimson)',
				'gradient-monochrome': 'var(--gradient-monochrome)',
				'topographic': 'var(--topographic-pattern)'
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)',
				'gold': 'var(--shadow-gold)',
				'crimson': 'var(--shadow-crimson)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
