import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../../contexts/theme/ThemeContext";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faqs" },
  { label: "Contact", href: "/contact" },
];

function Logo({ colors }) {
  return (
    <a
      href="/"
      aria-label="SmartSakay home"
      className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2"
      style={{ "--tw-ring-color": colors.primary }}
    >
      <span
        className="max-md:text-2xl md:text-4xl font-black tracking-tight"
        style={{ color: colors.textPrimary }}
      >
        Smart
        <span style={{ color: colors.primary }}>Sakay</span>
      </span>
    </a>
  );
}

export default function Header() {
  const { colors } = useTheme();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isActive = (href) => {
    if (href === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === href || location.pathname.startsWith(`${href}/`)
    );
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu when the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const getLinkStyle = (active) => ({
    color: active ? colors.primary : colors.textSecondary,
    background: active ? `${colors.primary}15` : "transparent",
    boxShadow: active
      ? `0 0 14px ${colors.primary}25, inset 0 0 0 1px ${colors.primary}25`
      : "none",
  });

  const handleMouseEnter = (event) => {
    event.currentTarget.style.color = colors.primary;
    event.currentTarget.style.background = `${colors.primary}15`;
    event.currentTarget.style.boxShadow = `0 0 14px ${colors.primary}30, inset 0 0 0 1px ${colors.primary}30`;
  };

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

        {/* Desktop navigation */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);

            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200"
                  style={getLinkStyle(active)}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={(event) => {
                    Object.assign(
                      event.currentTarget.style,
                      getLinkStyle(active),
                    );
                  }}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href={
              import.meta.env.VITE_APP_URL ||
              "https://smartsakaydagupan-mobilev1.vercel.app/"
            }
            rel="noopener noreferrer"
            className="hidden rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-95 md:inline-flex"
            style={{ background: colors.primary }}
          >
            Get Started
          </a>

          {/* Mobile menu button */}
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

      {/* Mobile navigation */}
      {open && (
        <div
          className="border-t px-5 pb-4 pt-2 md:hidden"
          style={{
            borderColor: colors.border,
            background: colors.surface,
          }}
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);

            return (
              <a
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="mb-1 block rounded-xl px-4 py-3 font-semibold transition-all duration-200"
                style={getLinkStyle(active)}
              >
                {link.label}
              </a>
            );
          })}

          <a
            href={
              import.meta.env.VITE_APP_URL ||
              "https://smartsakaydagupan-mobilev1.vercel.app/"
            }
            target="_blank"
            rel="noopener noreferrer"
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
