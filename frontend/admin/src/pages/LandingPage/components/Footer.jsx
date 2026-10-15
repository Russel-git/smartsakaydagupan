import { useState } from "react";
import { useTheme } from "../../../contexts/theme/ThemeContext";

const FOOTER_COLUMNS = [
  {
    heading: "Explore",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/#place-finder" },
      { label: "FAQ", href: "/#features" },
      { label: "Contact", href: "/#features" },
    ],
  },
  {
    heading: "Follow us",
    links: [
      { label: "Facebook", href: "https://www.facebook.com/" },
      { label: "Twitter", href: "https://x.com/" },
      { label: "Instagram", href: "https://www.instagram.com/" },
    ],
  },
];

function Logo({ colors }) {
  return (
    <a
      href="/"
      aria-label="SmartSakay home"
      className="inline-flex items-center gap-3 rounded-xl"
    >
      <span
        className="max-md:text-2xl md:text-4xl font-black tracking-tight"
        style={{ color: colors.white }}
      >
        Smart
        <span style={{ color: colors.primaryLight }}>Sakay</span>
      </span>
    </a>
  );
}

export default function Footer() {
  const { colors, isDark } = useTheme();

  return (
    <footer
      id="contact"
      style={{
        background: isDark ? colors.background : colors.textPrimary,
        color: colors.textSecondary,
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:py-16">
        <div>
          <Logo colors={colors} />

          <p
            className="mt-5 max-w-sm text-sm leading-7"
            style={{ color: colors.textMuted }}
          >
            Ride safe, ride smart. Helpful route and fare information for
            everyday commuters.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.heading}>
            <h3 className="font-extrabold" style={{ color: colors.white }}>
              {column.heading}
            </h3>

            <ul className="mt-5 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    className="text-sm transition hover:underline"
                    style={{
                      color: colors.textMuted,
                      textUnderlineOffset: 4,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = colors.textMuted;
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="border-t px-5 py-5 sm:px-8"
        style={{ borderColor: colors.border }}
      >
        <div
          className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs sm:flex-row"
          style={{ color: colors.textMuted }}
        >
          <p>© {new Date().getFullYear()} SmartSakay. All rights reserved.</p>
          <p>Built for safer, smarter journeys.</p>
        </div>
      </div>
    </footer>
  );
}
