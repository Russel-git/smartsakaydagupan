import { useEffect, useState } from "react";
import { useTheme } from "../../../contexts/theme/ThemeContext";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Blog", href: "/#place-finder" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

function Logo({ light = false, colors }) {
  return (
    <a
      href="/"
      aria-label="SmartSakay home"
      className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2"
      style={{ "--tw-ring-color": colors.primary }}
    >
      <span
        className="max-md:text-2xl md:text-4xl font-black tracking-tight"
        style={{ color: light ? colors.white : colors.textPrimary }}
      >
        Smart
        <span
          style={{
            color: light ? colors.primaryLight : colors.primary,
          }}
        >
          Sakay
        </span>
      </span>
    </a>
  );
}

export default function Header() {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-xl"
      style={{
        background: colors.surface,
        borderColor: colors.border,
        boxShadow: scrolled ? "0 8px 30px rgba(15,23,42,.06)" : "none",
      }}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8"
        aria-label="Main navigation"
      >
        <Logo colors={colors} />

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                style={{ color: colors.textSecondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.primary;
                  e.currentTarget.style.background = colors.primaryLight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.textSecondary;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href={import.meta.env.VITE_APP_URL}
            className="hidden rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-95 md:inline-flex"
            style={{ background: colors.primary }}
          >
            Get Started
          </a>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl border md:hidden"
            style={{
              borderColor: colors.border,
              color: colors.textPrimary,
              background: colors.surface,
            }}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            onClick={() => setOpen((previous) => !previous)}
          >
            <span className="text-2xl leading-none">{open ? "×" : "☰"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div
          className="border-t px-5 pb-4 pt-2 md:hidden"
          style={{
            borderColor: colors.border,
            background: colors.surface,
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 font-semibold"
              style={{ color: colors.textSecondary }}
            >
              {link.label}
            </a>
          ))}

          <a
            href={import.meta.env.VITE_APP_URL}
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-xl px-4 py-3 text-center font-bold text-white"
            style={{ background: colors.primary }}
          >
            Get Started
          </a>
        </div>
      )}
    </header>
  );
}
