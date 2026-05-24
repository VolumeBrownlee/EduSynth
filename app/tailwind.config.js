/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // === Typography (load via index.html) ===
      fontFamily: {
        display: ["var(--font-display)"],
        sans:    ["var(--font-body)"],
        mono:    ["var(--font-mono)"],
      },

      // === Colors — every value maps to an HSL token in index.css ===
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Auxiliary roles (previously inline hex)
        lecturer: {
          DEFAULT: "hsl(var(--lecturer))",
          foreground: "hsl(var(--lecturer-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        gold: "hsl(var(--gold))",
        silver: "hsl(var(--silver))",
        bronze: "hsl(var(--bronze))",

        // Sidebar (kept for multi-tenant theming)
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },

      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },

      // === Type scale — floor at 12px, no sub-readable sizes ===
      fontSize: {
        '2xs':  ['0.75rem',  { lineHeight: '1rem'    }],  // 12px — labels, captions
        xs:     ['0.8125rem',{ lineHeight: '1.125rem'}],  // 13px — chip text
        sm:     ['0.875rem', { lineHeight: '1.25rem' }],  // 14px — body small
        base:   ['1rem',     { lineHeight: '1.5rem'  }],  // 16px — body
        lg:     ['1.125rem', { lineHeight: '1.625rem'}],  // 18px
        xl:     ['1.25rem',  { lineHeight: '1.75rem' }],  // 20px
        '2xl':  ['1.5rem',   { lineHeight: '2rem'    }],  // 24px
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],  // 30px
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem'  }],  // 36px
        '5xl':  ['3rem',     { lineHeight: '1.05'    }],  // 48px
        '6xl':  ['3.75rem',  { lineHeight: '1'       }],  // 60px
      },

      boxShadow: {
        xs: "0 1px 2px hsl(var(--foreground) / 0.04)",
        sm: "0 1px 3px hsl(var(--foreground) / 0.06), 0 1px 2px hsl(var(--foreground) / 0.04)",
        md: "0 4px 6px hsl(var(--foreground) / 0.07), 0 2px 4px hsl(var(--foreground) / 0.05)",
        lg: "0 10px 15px hsl(var(--foreground) / 0.08), 0 4px 6px hsl(var(--foreground) / 0.05)",
        glow: "0 0 0 1px hsl(var(--primary) / 0.2), 0 0 20px hsl(var(--primary) / 0.15)",
      },

      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "caret-blink":    { "0%,70%,100%": { opacity: "1" }, "20%,50%": { opacity: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "caret-blink":    "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
