import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/theme/ThemeContext";
import useIntersectionObserver from "../../hooks/IntersectionObserver";
import Header from "./components/Header";
import Footer from "./components/Footer";

import mapImg from "../../../assets/map.jpg";
import townImg from "../../../assets/town.jpg";
import informImg from "../../../assets/inform.jpg";
import jeepImg from "../../../assets/jeep.png";

const SLIDES = [
  {
    eyebrow: "01 / ROUTE DISCOVERY",
    title: "Know where you're going.",
    text: "Explore your journey with clearer route information and practical tools for everyday commuting.",
    colorKey: "primary",
    tintKey: "primaryLight",
    buttonText: "Learn More",
    image: mapImg,
    to: "/about",
  },
  {
    eyebrow: "02 / BE PART",
    title: "Help your town.",
    text: "Inform your lgu's, and help your city / municipality in digitalizing routes informations and fare matrix with SmartSakay.",
    colorKey: "secondaryDark",
    tintKey: "secondaryLight",
    buttonText: "Contact Us",
    image: townImg,
    to: "/contact",
  },
  {
    eyebrow: "03 / DASHBOARD",
    title: "Inform commuters.",
    text: "Add routes, terminals, broadcast announcements, and review file reports.",
    colorKey: "accentDark",
    tintKey: "accentLight",
    buttonText: "Login",
    image: informImg,
    to: "/login",
  },
];

const FEATURES = [
  {
    id: "about",
    number: "01",
    eyebrow: "ROUTES & FARES",
    title: "Hindi mo alam ang daan?",
    text: "SmartSakay brings public transportation information together to help commuters reach their destination safely.",
    Art: ChaosArt,
    colorKey: "primary",
    tintKey: "primaryLight",
  },
  {
    id: "driver",
    number: "02",
    eyebrow: "COMMUNITY SAFETY",
    title: "Walang modo na driver?",
    text: "Submit a report with relevant details to help the appropriate people review the concern. Responsible reporting helps support safer journeys.",
    Art: DriverArt,
    colorKey: "secondaryDark",
    tintKey: "secondaryLight",
  },
  {
    id: "live-tracking",
    number: "03",
    eyebrow: "LIVE TRACKING",
    title: "May jeep na ba?",
    text: "Follow available ride location information and share your trip when supported, helping you and your loved ones feel more informed along the way.",
    Art: TrackingArt,
    colorKey: "accent",
    tintKey: "accentLight",
  },
];

function Svg({ children, label, dark, colors }) {
  return (
    <svg
      viewBox="0 0 600 450"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      role="img"
      aria-label={label}
    >
      <rect
        width="600"
        height="450"
        fill={dark ? colors.surfaceElevated : colors.primaryLight}
      />
      {children}
    </svg>
  );
}

function Stars({ x, y, colors }) {
  return [0, 1, 2, 3, 4].map((i) => (
    <path
      key={i}
      transform={`translate(${x + i * 34} ${y})`}
      d="M14 2l3.7 7.6 8.3 1.2-6 5.9 1.4 8.3L14 21l-7.4 4 1.4-8.3-6-5.9 8.3-1.2z"
      fill={i < 4 ? colors.warning : colors.disabled}
    />
  ));
}

function ChaosArt({ dark, colors }) {
  return (
    <Svg
      dark={dark}
      colors={colors}
      label="Illustration of confusing routes becoming one clear route"
    >
      <g
        fill="none"
        stroke={colors.textMuted}
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".65"
      >
        <path d="M30 120 C120 40 160 260 250 150 S120 380 260 330" />
        <path d="M30 330 C110 250 190 60 270 120 S100 200 250 260" />
        <path d="M40 220 C140 300 100 90 230 200 S170 400 280 390" />
        <path d="M60 60 C200 120 40 300 200 360" />
      </g>

      <path
        d="M290 225h50m-14-16 16 16-16 16"
        fill="none"
        stroke={colors.primary}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M380 340H470V225h70V110"
        fill="none"
        stroke={colors.secondaryDark}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {[
        [380, 340],
        [470, 225],
        [540, 110],
      ].map(([x, y]) => (
        <circle
          key={x}
          cx={x}
          cy={y}
          r="15"
          fill={colors.white}
          stroke={colors.secondary}
          strokeWidth="7"
        />
      ))}

      <rect
        x="395"
        y="150"
        width="110"
        height="38"
        rx="12"
        fill={colors.white}
      />

      <text
        x="450"
        y="175"
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill={colors.textPrimary}
      >
        ₱ 14.00
      </text>
    </Svg>
  );
}

function DriverArt({ dark, colors }) {
  return (
    <Svg
      dark={dark}
      colors={colors}
      label="Illustration of a jeepney and driver report card"
    >
      <rect
        y="360"
        width="600"
        height="90"
        fill={colors.textPrimary}
        opacity=".9"
      />

      <path
        d="M40 300L60 235Q64 220 82 220H300Q316 220 322 236L340 300V340H40z"
        fill={colors.primary}
      />

      <rect x="40" y="300" width="300" height="14" fill={colors.primaryDark} />

      {[75, 145, 215].map((x) => (
        <rect
          key={x}
          x={x}
          y="238"
          width="56"
          height="42"
          rx="8"
          fill={colors.white}
        />
      ))}

      {[95, 275].map((x) => (
        <g key={x}>
          <circle cx={x} cy="345" r="26" fill={colors.textPrimary} />
          <circle cx={x} cy="345" r="11" fill={colors.disabled} />
        </g>
      ))}

      <g transform="translate(340 70)">
        <rect
          width="230"
          height="210"
          rx="20"
          fill={dark ? colors.surface : colors.white}
        />

        <circle cx="42" cy="48" r="22" fill={colors.errorLight} />

        <path
          d="M32 58V36m0 0h18l-4 7 4 7H32"
          fill="none"
          stroke={colors.error}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect
          x="76"
          y="34"
          width="110"
          height="12"
          rx="6"
          fill={colors.textPrimary}
        />

        <rect
          x="76"
          y="54"
          width="70"
          height="10"
          rx="5"
          fill={colors.disabled}
        />
        <rect
          x="24"
          y="92"
          width="182"
          height="10"
          rx="5"
          fill={colors.border}
        />
        <rect
          x="24"
          y="112"
          width="140"
          height="10"
          rx="5"
          fill={colors.border}
        />

        <Stars x={24} y={140} colors={colors} />

        <rect
          x="24"
          y="178"
          width="100"
          height="20"
          rx="10"
          fill={colors.secondary}
        />
      </g>
    </Svg>
  );
}

function TrackingArt({ dark, colors }) {
  return (
    <Svg
      dark={dark}
      colors={colors}
      label="Illustration of a phone with a route and vehicle location"
    >
      <g
        stroke={dark ? colors.border : colors.white}
        strokeWidth="14"
        opacity=".95"
      >
        <path d="M0 120H600M0 300H600M150 0V450M430 0V450" />
      </g>

      <path
        d="M150 300V120H430"
        fill="none"
        stroke={colors.accent}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 18"
      />

      <g transform="translate(205 40)">
        <rect width="190" height="370" rx="32" fill={colors.textPrimary} />
        <rect
          x="10"
          y="12"
          width="170"
          height="346"
          rx="24"
          fill={colors.white}
        />

        <rect
          x="22"
          y="26"
          width="146"
          height="170"
          rx="16"
          fill={colors.accentLight}
        />

        <path
          d="M40 170V80H150"
          fill="none"
          stroke={colors.accent}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx="95"
          cy="80"
          r="12"
          fill={colors.primary}
          stroke={colors.white}
          strokeWidth="4"
        />

        <path
          d="M150 54a14 14 0 0114 14c0 12-14 26-14 26s-14-14-14-26a14 14 0 0114-14z"
          fill={colors.secondary}
        />

        <rect
          x="26"
          y="214"
          width="110"
          height="14"
          rx="7"
          fill={colors.textPrimary}
        />

        <rect
          x="26"
          y="238"
          width="80"
          height="10"
          rx="5"
          fill={colors.disabled}
        />

        <rect
          x="26"
          y="276"
          width="138"
          height="44"
          rx="14"
          fill={colors.primary}
        />

        <text
          x="95"
          y="304"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill={colors.white}
        >
          En route
        </text>
      </g>
    </Svg>
  );
}

function ImageSlot({ src, alt, Art, dark, colors }) {
  return src ? (
    <img src={src} alt={alt} className="h-full w-full object-cover" />
  ) : (
    <Art dark={dark} colors={colors} />
  );
}

function Logo({ dark, light = false, colors }) {
  return (
    <a
      href="/"
      className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2"
      style={{ "--tw-ring-color": colors.primary }}
    >
      <span
        className="max-md:text-2xl md:text-4xl font-black tracking-tight"
        style={{
          color: light ? colors.white : colors.textPrimary,
        }}
      >
        Smart
        <span style={{ color: light ? colors.primaryLight : colors.primary }}>
          Sakay
        </span>
      </span>
    </a>
  );
}

function Hero({ dark, colors }) {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden px-5 py-14 sm:px-8 sm:py-14 lg:py-18"
      style={{ background: colors.background }}
    >
      {/* Grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${colors.border} 1px, transparent 1px),
            linear-gradient(to bottom, ${colors.border} 1px, transparent 1px)`,
          backgroundSize: "6rem 4rem",
          maskImage: "linear-gradient(to bottom, black, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 95%)",
        }}
      />

      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle 800px at 100% 0px, ${colors.primaryLight}, transparent)`,
          opacity: dark ? 0.35 : 0.8,
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
        <div>
          <h1
            className="mt-7 text-5xl font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ color: colors.textPrimary }}
          >
            RIDE SAFE.
            <br />
            <span style={{ color: colors.primary }}>RIDE SMART.</span>
          </h1>

          <p
            className="mt-6 max-w-xl max-md:text-sm md:text-lg leading-8"
            style={{ color: colors.textSecondary }}
          >
            Making lives better through SmartSakay. Designed as your everyday
            transit companion, keeping you informed with accurate, real-time
            public transportation updates for a smoother daily commute.
          </p>

          <div
            className="mt-9 flex max-sm:flex-col sm:flex-wrap gap-x-6 gap-y-3 text-sm font-semibold"
            style={{ color: colors.textSecondary }}
          >
            {["Route discovery", "Fare information", "Safer journeys"].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full text-xs">
                    ✓
                  </span>
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div id="place-finder" className="scroll-mt-24">
          <div
            className="relative rounded-4xl border p-2 shadow-2xl"
            style={{
              background: colors.surface,
              borderColor: colors.border,
              boxShadow: dark
                ? "0 25px 60px rgba(0,0,0,.22)"
                : "0 25px 60px rgba(15,23,42,.12)",
            }}
          >
            <div className="aspect-4/3 overflow-hidden rounded-3xl">
              <img
                src={jeepImg}
                alt="Jeepney"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slides({ dark, colors }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);

    update();
    media.addEventListener?.("change", update);

    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;

    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [paused, reducedMotion]);

  const go = (next) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  };

  const slide = SLIDES[index];
  const slideColor = colors[slide.colorKey];

  return (
    <section
      id="features"
      aria-roledescription="carousel"
      aria-label="SmartSakay highlights"
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
    >
      <div className="relative w-full overflow-hidden">
        {/* Full-width background illustration */}
        <div
          key={index}
          className="absolute inset-0 scale-110"
          aria-hidden="true"
        >
          <img
            src={slide.image}
            alt="BG-Image"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Dark overlay for readable text */}
        <div
          className="absolute inset-0"
          style={{
            background: dark ? "rgba(0, 0, 0, 0.78)" : "rgba(0, 0, 0, 0.62)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />

        {/* Additional gradient for contrast */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,.35), rgba(0,0,0,.12), rgba(0,0,0,.35))",
          }}
        />

        {/* Centered slide content */}
        <div
          key={`content-${index}`}
          className="relative z-10 flex min-h-120 w-full flex-col items-center justify-center px-6 pb-24 pt-16 text-center sm:min-h-135 sm:px-12 lg:min-h-150"
        >
          <span className="rounded-full border border-white/25 bg-black/25 px-4 py-2 text-xs font-extrabold tracking-[.2em] text-white backdrop-blur-md">
            {slide.eyebrow}
          </span>

          <h2 className="mt-7 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl">
            {slide.title}
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
            {slide.text}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={slide.to}
              className="rounded-xl w-50 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 cursor-pointer"
              style={{
                background: slideColor,
                boxShadow: `0 10px 30px ${slideColor}55`,
              }}
            >
              {slide.buttonText}
            </a>
          </div>
        </div>

        {/* Previous slide */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => go(index - 1)}
          className="absolute left-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/35 text-xl text-white backdrop-blur-md transition hover:bg-black/60 sm:left-8 sm:h-12 sm:w-12"
        >
          ←
        </button>

        {/* Next slide */}
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => go(index + 1)}
          className="absolute right-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/35 text-xl text-white backdrop-blur-md transition hover:bg-black/60 sm:right-8 sm:h-12 sm:w-12"
        >
          →
        </button>

        {/* Pagination dots */}
        <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5">
          {SLIDES.map((s, i) => {
            const dotColor = colors[s.colorKey];

            return (
              <button
                key={s.eyebrow}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className="h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 34 : 10,
                  background: i === index ? dotColor : "rgba(255,255,255,.55)",
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Feature({ feature, index, dark, colors }) {
  const { id, number, eyebrow, title, text, Art, colorKey, tintKey } = feature;

  const reverse = index % 2 === 1;
  const color = colors[colorKey];
  const tint = colors[tintKey];

  const featureRef = useRef(null);

  const isVisible = useIntersectionObserver(featureRef, {
    threshold: 0.3,
    rootMargin: "0px 0px -40px 0px",
    triggerOnce: true,
  });

  return (
    <section
      ref={featureRef}
      id={id}
      className={`scroll-mt-20 px-5 py-12 sm:px-8 sm:py-16 lg:py-20 transition-all duration-700 ease-out motion-reduce:transition-none ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={{
        background: index % 2 === 1 ? colors.background : colors.surface,
      }}
    >
      <div
        className={`mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-20 ${
          reverse ? "lg:[&>div:first-child]:order-2" : ""
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className="grid h-11 w-11 place-items-center rounded-xl text-sm font-black"
              style={{
                color,
                background: dark ? colors.surfaceElevated : tint,
              }}
            >
              {number}
            </span>

            <span
              className="text-xs font-extrabold tracking-[.18em]"
              style={{ color }}
            >
              {eyebrow}
            </span>
          </div>

          <h2
            className="mt-6 max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            style={{ color: colors.textPrimary }}
          >
            {title}
          </h2>

          <p
            className="mt-5 max-w-xl text-base leading-8 sm:text-lg"
            style={{ color: colors.textSecondary }}
          >
            {text}
          </p>
        </div>

        <div
          className="overflow-hidden rounded-4xl border p-2 shadow-xl"
          style={{
            background: colors.surfaceElevated,
            borderColor: colors.border,
            boxShadow: dark
              ? "0 20px 50px rgba(0,0,0,.18)"
              : "0 20px 50px rgba(15,23,42,.08)",
          }}
        >
          <div
            className="aspect-4/3 overflow-hidden rounded-3xl"
            style={{
              background: dark ? colors.background : tint,
            }}
          >
            <ImageSlot
              src={null}
              alt={title}
              Art={Art}
              dark={dark}
              colors={colors}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { colors, isDark } = useTheme();

  return (
    <div
      className="min-h-screen font-sans antialiased"
      style={{
        background: colors.background,
        color: colors.textPrimary,
      }}
    >
      <Header dark={isDark} colors={colors} />

      <main>
        <Hero dark={isDark} colors={colors} />

        <Slides dark={isDark} colors={colors} />

        <div>
          {FEATURES.map((feature, index) => (
            <Feature
              key={feature.id}
              feature={feature}
              index={index}
              dark={isDark}
              colors={colors}
            />
          ))}
        </div>
      </main>

      <Footer dark={isDark} colors={colors} />
    </div>
  );
}
