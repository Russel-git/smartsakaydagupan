import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/theme/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import jeepImg from "../../../assets/jeep.png";

const FEATURES = [
  {
    number: "01",
    icon: "🗺️",
    title: "Route and Fare Information",
    description:
      "Help commuters understand available routes and fare information so they can plan their trips with greater confidence and avoid confusion.",
  },
  {
    number: "02",
    icon: "📍",
    title: "Real-Time Location Sharing",
    description:
      "Support location sharing so commuters can communicate their location and make their journeys easier to monitor when using supported features.",
  },
  {
    number: "03",
    icon: "🛡️",
    title: "Commuter Complaint Reporting",
    description:
      "Give commuters a way to report concerns such as overcharging, reckless driving, harassment, route deviations, and vehicle conditions.",
  },
  {
    number: "04",
    icon: "🏛️",
    title: "Coordinated Complaint Management",
    description:
      "Provide operators and authorized local government personnel with a structured process for reviewing, endorsing, and acting on commuter reports.",
  },
  {
    number: "05",
    icon: "🤖",
    title: "SmartSakay AI Assistant",
    description:
      "Offer conversational assistance for SmartSakay-related questions, commuter guidance, and relevant transportation information.",
  },
  {
    number: "06",
    icon: "👥",
    title: "Role-Based Management",
    description:
      "Organize access for administrators, operators, local government personnel, and commuters according to their responsibilities in the system.",
  },
];

const BENEFITS = [
  {
    title: "For Commuters",
    icon: "🚶",
    description:
      "Access useful transportation information, understand fares and routes, and report commuting concerns through a more organized process.",
  },
  {
    title: "For Transport Operators",
    icon: "🚌",
    description:
      "Manage assigned driver and transport information and review reports referred to them through the system.",
  },
  {
    title: "For Local Authorities",
    icon: "🏢",
    description:
      "Review endorsed complaints and record appropriate actions within their authorized responsibilities.",
  },
];

function SectionHeading({ eyebrow, title, description, colors }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p
        className="mb-3 text-sm font-bold uppercase tracking-[0.2em]"
        style={{ color: colors.primary }}
      >
        {eyebrow}
      </p>

      <h2
        className="text-3xl font-extrabold tracking-tight sm:text-4xl"
        style={{ color: colors.textPrimary }}
      >
        {title}
      </h2>

      {description && (
        <p
          className="mx-auto mt-4 max-w-2xl text-base leading-7 sm:text-lg"
          style={{ color: colors.textSecondary }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function AboutHero({ colors }) {
  return (
    <section
      className="relative overflow-hidden px-6 py-20 sm:py-28 lg:py-32"
      style={{ background: colors.background }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: `${colors.primary}18` }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full blur-3xl"
        style={{ background: `${colors.primary}12` }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div>
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
            style={{
              color: colors.primary,
              borderColor: `${colors.primary}45`,
              background: `${colors.primary}0D`,
            }}
          >
            <span>🚌</span>
            About SmartSakay
          </div>

          <h1
            className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: colors.textPrimary }}
          >
            Making every
            <span style={{ color: colors.primary }}> ride</span>
            <br />a smarter journey.
          </h1>

          <p
            className="mt-6 max-w-xl text-base leading-8 sm:text-lg"
            style={{ color: colors.textSecondary }}
          >
            SmartSakay is a transportation information and commuter support
            system designed to make everyday public transportation more
            informed, accessible, and accountable—starting with the commuting
            needs of Dagupan City.
          </p>

          <p
            className="mt-4 max-w-xl text-base leading-8"
            style={{ color: colors.textSecondary }}
          >
            By bringing route and fare information, complaint reporting,
            location-related features, and coordinated report management into
            one platform, SmartSakay aims to help commuters and transportation
            stakeholders work toward a better commuting experience.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={
                import.meta.env.VITE_APP_URL ||
                "https://smartsakaydagupan-mobilev1.vercel.app/"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-20 py-3 font-bold text-white transition hover:-translate-y-0.5"
              style={{
                background: colors.primary,
                boxShadow: `0 8px 24px ${colors.primary}30`,
              }}
            >
              Launch our app
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div
            className="absolute -inset-4 rounded-4xl blur-2xl"
            style={{ background: `${colors.primary}12` }}
          />

          <div
            className="relative overflow-hidden rounded-4xl border p-5 shadow-2xl sm:p-8"
            style={{
              background: colors.surface,
              borderColor: colors.border,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Your commuting companion
                </p>
                <h3
                  className="mt-1 text-2xl font-extrabold"
                  style={{ color: colors.textPrimary }}
                >
                  Ride safe. Ride smart.
                </h3>
              </div>

              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
                style={{ background: `${colors.primary}15` }}
              >
                🚌
              </div>
            </div>

            <div
              className="my-6 overflow-hidden rounded-2xl border"
              style={{
                background: colors.background,
                borderColor: colors.border,
              }}
            >
              <img
                src={jeepImg}
                alt="Jeepney representing public transportation in SmartSakay"
                className="h-56 w-full object-contain p-4 sm:h-64"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="px-5 pb-5">
                <p
                  className="text-sm font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Built around everyday commuters
                </p>
                <p
                  className="mt-1 text-sm leading-6"
                  style={{ color: colors.textSecondary }}
                >
                  Useful information and reporting tools in one connected
                  experience.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "🗺️", label: "Routes & fares" },
                { icon: "🛡️", label: "Safety reporting" },
                { icon: "📍", label: "Location features" },
                { icon: "🤖", label: "AI assistance" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl border p-3"
                  style={{
                    background: colors.background,
                    borderColor: colors.border,
                  }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colors.textPrimary }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionSection({ colors }) {
  return (
    <section
      className="px-6 py-20 sm:py-24"
      style={{ background: colors.surface }}
    >
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
        <div
          className="rounded-3xl border p-7 sm:p-10"
          style={{
            background: colors.background,
            borderColor: colors.border,
          }}
        >
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
            style={{
              color: colors.primary,
              background: `${colors.primary}15`,
            }}
          >
            🎯
          </div>
          <h2
            className="text-2xl font-extrabold"
            style={{ color: colors.textPrimary }}
          >
            Our Mission
          </h2>
          <p className="mt-4 leading-8" style={{ color: colors.textSecondary }}>
            To provide a centralized digital platform that helps commuters
            access transportation information and report concerns, while
            supporting more organized coordination among transport operators and
            authorized local authorities.
          </p>
        </div>

        <div
          className="rounded-3xl border p-7 sm:p-10"
          style={{
            background: colors.background,
            borderColor: colors.border,
          }}
        >
          <div
            className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
            style={{
              color: colors.primary,
              background: `${colors.primary}15`,
            }}
          >
            🌟
          </div>
          <h2
            className="text-2xl font-extrabold"
            style={{ color: colors.textPrimary }}
          >
            Our Vision
          </h2>
          <p className="mt-4 leading-8" style={{ color: colors.textSecondary }}>
            A commuting environment where transportation information is easier
            to access, commuter concerns have a clearer reporting path, and
            stakeholders can use digital tools to support safer and more
            accountable public transportation.
          </p>
        </div>
      </div>
    </section>
  );
}

function WhyWeBuiltIt({ colors }) {
  return (
    <section
      className="px-6 py-20 sm:py-24"
      style={{ background: colors.background }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p
            className="mb-3 text-sm font-bold uppercase tracking-[0.2em]"
            style={{ color: colors.primary }}
          >
            Why SmartSakay?
          </p>

          <h2
            className="text-3xl font-extrabold leading-tight sm:text-4xl"
            style={{ color: colors.textPrimary }}
          >
            Everyday commuting deserves a smarter solution.
          </h2>

          <p className="mt-5 leading-8" style={{ color: colors.textSecondary }}>
            Commuters may have difficulty finding reliable route and fare
            information or knowing where to direct a transportation complaint.
            Meanwhile, operators and local authorities need a more organized way
            to receive and manage reports.
          </p>

          <p className="mt-4 leading-8" style={{ color: colors.textSecondary }}>
            SmartSakay was designed to address these challenges by connecting
            useful commuter tools with a structured reporting and management
            process. Rather than treating each concern as an isolated task, the
            system brings relevant information and workflows together in one
            place.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              title: "Information can be hard to find",
              text: "Route and fare information should be easier for commuters to access and understand.",
            },
            {
              title: "Reporting should be more organized",
              text: "A clear reporting workflow helps authorized personnel review and manage commuter concerns.",
            },
            {
              title: "Different stakeholders need different tools",
              text: "Role-based access gives commuters, operators, and local authorities tools suited to their responsibilities.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl border p-5 sm:p-6"
              style={{
                background: colors.surface,
                borderColor: colors.border,
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-extrabold"
                style={{
                  color: colors.primary,
                  background: `${colors.primary}15`,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                <h3 className="font-bold" style={{ color: colors.textPrimary }}>
                  {item.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-7"
                  style={{ color: colors.textSecondary }}
                >
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ colors }) {
  return (
    <section
      className="px-6 py-20 sm:py-24"
      style={{ background: colors.surface }}
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="What SmartSakay Offers"
          title="Features designed for a better commute"
          description="SmartSakay brings together commuter information, reporting tools, and stakeholder workflows in a single transportation support system."
          colors={colors}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.number}
              className="group rounded-2xl border p-6 transition duration-300 hover:-translate-y-1"
              style={{
                background: colors.background,
                borderColor: colors.border,
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition group-hover:scale-105"
                  style={{ background: `${colors.primary}14` }}
                >
                  {feature.icon}
                </div>
                <span
                  className="text-sm font-extrabold"
                  style={{ color: colors.primary }}
                >
                  {feature.number}
                </span>
              </div>

              <h3
                className="mt-6 text-xl font-bold"
                style={{ color: colors.textPrimary }}
              >
                {feature.title}
              </h3>

              <p
                className="mt-3 text-sm leading-7"
                style={{ color: colors.textSecondary }}
              >
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StakeholdersSection({ colors }) {
  return (
    <section
      className="px-6 py-20 sm:py-24"
      style={{ background: colors.background }}
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="One Platform, Shared Purpose"
          title="Designed for the people behind every journey"
          description="SmartSakay supports a coordinated approach to commuter information and transportation concerns, with access based on each user's role."
          colors={colors}
        />

        <div className="grid gap-5 md:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <article
              key={benefit.title}
              className="rounded-2xl border p-7"
              style={{
                background: colors.surface,
                borderColor: colors.border,
              }}
            >
              <span className="text-3xl">{benefit.icon}</span>
              <h3
                className="mt-5 text-xl font-extrabold"
                style={{ color: colors.textPrimary }}
              >
                {benefit.title}
              </h3>
              <p
                className="mt-3 leading-7"
                style={{ color: colors.textSecondary }}
              >
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValuesSection({ colors }) {
  const values = [
    {
      icon: "🔎",
      title: "Transparency",
      text: "Make relevant transportation information and complaint progress easier to understand.",
    },
    {
      icon: "🤝",
      title: "Accountability",
      text: "Support structured reporting and coordination among the people responsible for handling concerns.",
    },
    {
      icon: "📱",
      title: "Accessibility",
      text: "Bring important commuter support tools together in a digital platform.",
    },
    {
      icon: "🔐",
      title: "Responsible Access",
      text: "Separate system permissions according to user roles and assigned responsibilities.",
    },
  ];

  return (
    <section
      className="px-6 py-20 sm:py-24"
      style={{ background: colors.surface }}
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="What Guides Us"
          title="The principles behind SmartSakay"
          description="Our approach focuses on making transportation support more useful, organized, and responsible."
          colors={colors}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border p-6"
              style={{
                background: colors.background,
                borderColor: colors.border,
              }}
            >
              <div className="text-3xl">{value.icon}</div>
              <h3
                className="mt-4 font-bold"
                style={{ color: colors.textPrimary }}
              >
                {value.title}
              </h3>
              <p
                className="mt-2 text-sm leading-7"
                style={{ color: colors.textSecondary }}
              >
                {value.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction({ colors }) {
  return (
    <section
      className="px-6 py-20 sm:py-24"
      style={{ background: colors.background }}
    >
      <div
        className="mx-auto max-w-5xl overflow-hidden rounded-3xl px-7 py-12 text-center sm:px-12 sm:py-16"
        style={{
          background: colors.primary,
          color: "#FFFFFF",
        }}
      >
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
          The journey toward smarter commuting
        </p>

        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black sm:text-4xl">
          Ride safe. Ride smart. Make every journey count.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/85">
          Explore SmartSakay and discover how transportation information and
          commuter support tools can come together in one platform.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl px-6 py-3 font-bold transition hover:-translate-y-0.5 inline-block text-center"
            style={{ background: "#FFFFFF", color: colors.primary }}
          >
            Back to Home
          </Link>

          <Link
            to="/contact"
            className="rounded-xl border border-white/50 px-6 py-3 font-bold text-white transition hover:bg-white/10 inline-block text-center"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const { colors } = useTheme();

  return (
    <div
      className="min-h-screen font-sans antialiased"
      style={{
        background: colors.background,
        color: colors.textPrimary,
      }}
    >
      <Header />
      <main>
        <AboutHero colors={colors} />
        <MissionSection colors={colors} />
        <WhyWeBuiltIt colors={colors} />
        <FeaturesSection colors={colors} />
        <StakeholdersSection colors={colors} />
        <ValuesSection colors={colors} />
        <CallToAction colors={colors} />
      </main>
      <Footer />
    </div>
  );
}
