import { useMemo, useState } from "react";
import { useTheme } from "../../contexts/theme/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

const FAQS = [
  {
    id: 1,
    category: "Getting Started",
    question: "What is SmartSakay?",
    answer:
      "SmartSakay is a transportation information and commuter support system designed to help people access route and fare information, report transportation concerns, and use related commuting tools. It is being developed with the transportation needs of Dagupan City in mind.",
  },
  {
    id: 2,
    category: "Getting Started",
    question: "Why was SmartSakay created?",
    answer:
      "SmartSakay was created to help address common commuting challenges, such as finding transportation information and knowing where to report concerns. Its goal is to bring useful commuter tools and a more organized complaint reporting process into one platform.",
  },
  {
    id: 3,
    category: "Getting Started",
    question: "Who can use SmartSakay?",
    answer:
      "SmartSakay is designed for commuters and authorized transportation stakeholders, including transport operators and local government personnel. Available features depend on the user's account type and assigned permissions.",
  },
  {
    id: 4,
    category: "Routes & Fares",
    question: "Can I find public transportation routes on SmartSakay?",
    answer:
      "SmartSakay is designed to provide route information to help commuters understand available transportation options. The routes shown depend on the information that has been added and made available in the system.",
  },
  {
    id: 5,
    category: "Routes & Fares",
    question: "Does SmartSakay provide fare information?",
    answer:
      "Yes, fare information is one of SmartSakay's intended features. The available information depends on the fare details maintained in the system. Always confirm the applicable fare with the authorized transport provider or relevant authority if anything is unclear.",
  },
  {
    id: 6,
    category: "Routes & Fares",
    question: "Are all routes and fares guaranteed to be up to date?",
    answer:
      "Route and fare information depends on the accuracy and freshness of the data maintained in SmartSakay. Do not assume that every detail is automatically updated in real time. Check the available information and confirm important details when necessary.",
  },
  {
    id: 7,
    category: "Routes & Fares",
    question: "Can SmartSakay help me plan my commute?",
    answer:
      "SmartSakay aims to make route and fare information easier to access so you can make more informed commuting decisions. The options available to you depend on the routes and transportation information currently provided by the system.",
  },
  {
    id: 8,
    category: "Complaints & Safety",
    question: "What transportation concerns can I report?",
    answer:
      "The complaint reporting feature supports concerns such as overcharging, reckless driving, harassment, route deviations, vehicle conditions, and other transportation-related issues.",
  },
  {
    id: 9,
    category: "Complaints & Safety",
    question: "How do I submit a complaint?",
    answer:
      "Sign in to your commuter account, open the complaint reporting feature, select the appropriate concern, and provide the requested details. If photo evidence is requested or available, follow the instructions in the form before submitting your report.",
  },
  {
    id: 10,
    category: "Complaints & Safety",
    question: "Can I attach a photo to my complaint?",
    answer:
      "SmartSakay supports photo attachments for complaint reports. Follow the upload instructions and make sure the image is relevant to your report. Avoid sharing unrelated personal information or exposing other people's private details unnecessarily.",
  },
  {
    id: 11,
    category: "Complaints & Safety",
    question: "What happens after I submit a complaint?",
    answer:
      "A submitted report may be reviewed by the appropriate authorized personnel and routed through the system's complaint management process. The steps and outcome depend on the report, the review, and the responsibilities of the relevant stakeholders.",
  },
  {
    id: 12,
    category: "Complaints & Safety",
    question: "Will every complaint result in a driver being penalized?",
    answer:
      "No particular outcome is guaranteed. A complaint is information that needs to be reviewed by the appropriate personnel. Any action depends on the circumstances, available evidence, applicable procedures, and the authority responsible for the matter.",
  },
  {
    id: 13,
    category: "Complaints & Safety",
    question: "Can I submit a complaint without evidence?",
    answer:
      "Provide as much accurate information as you can and follow the requirements shown in the complaint form. If an attachment is optional, you may be able to submit without one. Never fabricate evidence or include information you know is false.",
  },
  {
    id: 14,
    category: "Account & Privacy",
    question: "Do I need an account to use SmartSakay?",
    answer:
      "Some public information may be accessible without signing in, depending on the feature. Functions such as submitting complaints or using account-based services may require registration and authentication.",
  },
  {
    id: 15,
    category: "Account & Privacy",
    question: "Why are some features unavailable to me?",
    answer:
      "Certain functions are restricted according to account type and permissions. For example, commuter accounts, operator accounts, and authorized local government accounts have different responsibilities. If you believe you should have access, contact the appropriate system administrator.",
  },
  {
    id: 16,
    category: "Account & Privacy",
    question: "How does SmartSakay handle my personal information?",
    answer:
      "SmartSakay uses account and submitted information to support its available features and workflows. Share only the information needed for the task, protect your login credentials, and consult the system's published privacy policy for details about data collection, use, retention, and your rights.",
  },
  {
    id: 17,
    category: "Account & Privacy",
    question: "Can I use SmartSakay as a guest?",
    answer:
      "Guest access may be available for selected public features. Actions that require an authenticated account, such as account-specific services or complaint submission, may ask you to sign in or register first.",
  },
  {
    id: 18,
    category: "SmartSakay AI",
    question: "What is the SmartSakay AI Assistant?",
    answer:
      "The SmartSakay AI Assistant is designed to answer SmartSakay-related questions and provide helpful guidance about supported transportation topics. It is an information tool and should not be treated as a substitute for official instructions or decisions from the responsible authorities.",
  },
  {
    id: 19,
    category: "SmartSakay AI",
    question: "Can the AI Assistant guarantee exact fares or routes?",
    answer:
      "No. AI responses may be incomplete or mistaken, and the assistant should not invent missing transportation information. Verify important route, fare, schedule, and regulatory details using authoritative or current information.",
  },
  {
    id: 20,
    category: "SmartSakay AI",
    question: "Can I speak to the AI Assistant instead of typing?",
    answer:
      "Voice input and spoken responses may be available depending on the version of SmartSakay, your browser or device, and its speech capabilities. If voice features are unavailable, you can use text-based chat where supported.",
  },
  {
    id: 21,
    category: "Operators & Authorities",
    question: "Who manages transportation information in SmartSakay?",
    answer:
      "Authorized personnel manage the information and functions assigned to their roles. Depending on the system's configuration, this may include local authorities and transport operators responsible for relevant routes, fares, or transport records.",
  },
  {
    id: 22,
    category: "Operators & Authorities",
    question: "What is the role of local government personnel?",
    answer:
      "Authorized local government personnel may review complaints referred to their jurisdiction and record appropriate actions within their responsibilities. The platform supports the workflow but does not replace official investigation or enforcement procedures.",
  },
  {
    id: 23,
    category: "Operators & Authorities",
    question: "Can a transport operator manage driver information?",
    answer:
      "Authorized operator accounts may be able to manage driver and transport details within their assigned responsibilities and jurisdiction. Access depends on the account permissions configured in SmartSakay.",
  },
  {
    id: 24,
    category: "Troubleshooting",
    question: "What should I do if SmartSakay is not loading?",
    answer:
      "Check your internet connection, refresh the page, and try again. If the issue continues, reopen the application later or contact the SmartSakay support team with a description of the problem.",
  },
  {
    id: 25,
    category: "Troubleshooting",
    question: "What if the route or fare information appears incorrect?",
    answer:
      "Do not rely on information you believe is inaccurate. Confirm the details with an authorized transport provider or relevant authority, and use the available contact or reporting channel to notify the SmartSakay team about the discrepancy.",
  },
  {
    id: 26,
    category: "Troubleshooting",
    question: "What should I do if my complaint will not submit?",
    answer:
      "Check that the required fields are complete, your internet connection is working, and any uploaded attachment meets the form's requirements. If the problem persists, try again later and contact support with the error message. Avoid submitting repeated reports for the same incident unless instructed to do so.",
  },
];

const CATEGORIES = [
  "All Questions",
  "Getting Started",
  "Routes & Fares",
  "Complaints & Safety",
  "Account & Privacy",
  "SmartSakay AI",
  "Operators & Authorities",
  "Troubleshooting",
];

function SectionLabel({ children, colors }) {
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
      style={{
        color: colors.primary,
        background: `${colors.primary}14`,
      }}
    >
      {children}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function FAQHero({ colors }) {
  const orange = "#F59E0B";

  return (
    <section
      className="relative isolate overflow-hidden px-6 py-20 sm:py-24 lg:py-28"
      style={{
        background: colors.background,
        color: colors.textPrimary,
      }}
    >
      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${colors.textSecondary}0A 1px, transparent 1px),
            linear-gradient(to bottom, ${colors.textSecondary}0A 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, black, transparent 95%)",
        }}
      />

      {/* Cherry-red glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full blur-[100px]"
        style={{ background: `${colors.primary}30` }}
      />

      {/* Orange glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full blur-[100px]"
        style={{ background: `${orange}25` }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]"
          style={{
            color: orange,
            background: `${orange}12`,
            borderColor: `${orange}45`,
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: orange }}
          />
          SmartSakay Help Center
        </span>

        <h1
          className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          style={{ color: colors.textPrimary }}
        >
          Got questions?
          <br />
          <span
            style={{
              background: `linear-gradient(90deg, ${colors.primary}, ${orange})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            We've got answers.
          </span>
        </h1>

        <p
          className="mx-auto mt-6 max-w-2xl text-base leading-8 sm:text-lg"
          style={{ color: colors.textSecondary }}
        >
          Find answers about SmartSakay, transportation routes and fares,
          commuter complaints, accounts, and the tools designed to support your
          everyday journey.
        </p>

        <a
          href="#faq-list"
          className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition duration-200 hover:-translate-y-0.5"
          style={{
            background: `linear-gradient(110deg, ${colors.primary}, #C2410C)`,
            boxShadow: `0 8px 28px ${colors.primary}30`,
          }}
        >
          Browse FAQs
          <span aria-hidden="true">↓</span>
        </a>

        <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm">
          {[
            { icon: "🚌", label: "Routes & fares", color: orange },
            { icon: "🛡️", label: "Safety & complaints", color: colors.primary },
            { icon: "🤖", label: "AI Assistant", color: orange },
          ].map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5"
              style={{
                color: colors.textSecondary,
                background: colors.surface,
                borderColor: colors.border,
              }}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>

        {/* Decorative orange and red accent line */}
        <div className="mx-auto mt-12 flex h-1 w-32 overflow-hidden rounded-full">
          <div className="w-1/2" style={{ background: colors.primary }} />
          <div className="w-1/2" style={{ background: orange }} />
        </div>
      </div>
    </section>
  );
}

function FAQItem({ faq, colors, open, onToggle }) {
  const answerId = `faq-answer-${faq.id}`;

  return (
    <article
      className="overflow-hidden rounded-2xl border transition-colors"
      style={{
        background: colors.surface,
        borderColor: open ? `${colors.primary}70` : colors.border,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={answerId}
        className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
      >
        <span className="flex items-start gap-4">
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold"
            style={{
              color: colors.primary,
              background: `${colors.primary}14`,
            }}
          >
            ?
          </span>

          <span
            className="text-base font-bold leading-7 sm:text-lg"
            style={{ color: colors.textPrimary }}
          >
            {faq.question}
          </span>
        </span>

        <ChevronIcon open={open} />
      </button>

      {open && (
        <div id={answerId} className="px-5 pb-6 pl-17 sm:px-6 sm:pl-18">
          <p
            className="text-sm leading-7 sm:text-base"
            style={{ color: colors.textSecondary }}
          >
            {faq.answer}
          </p>
        </div>
      )}
    </article>
  );
}

function FAQCategories({ categories, selected, onSelect, colors }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      aria-label="Filter questions by category"
    >
      {categories.map((category) => {
        const active = selected === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            className="shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition"
            style={{
              color: active ? "#FFFFFF" : colors.textSecondary,
              background: active ? colors.primary : colors.surface,
              borderColor: active ? colors.primary : colors.border,
            }}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

function ContactSupport({ colors }) {
  return (
    <section className="px-6 pb-20" style={{ background: colors.background }}>
      <div
        className="mx-auto max-w-5xl rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16"
        style={{
          background: colors.primary,
          color: "#FFFFFF",
        }}
      >
        <div className="text-4xl" aria-hidden="true">
          💬
        </div>

        <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-white/80">
          Still need help?
        </p>

        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black sm:text-4xl">
          We're here to help with your journey.
        </h2>

        <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/85">
          If you couldn't find the answer you need, reach out through the
          SmartSakay contact page so your question can be directed to the
          appropriate team.
        </p>

        <a
          href="/contact"
          className="mt-7 inline-flex rounded-xl px-6 py-3 font-bold transition hover:-translate-y-0.5"
          style={{
            background: "#FFFFFF",
            color: colors.primary,
          }}
        >
          Contact SmartSakay
        </a>
      </div>
    </section>
  );
}

export default function FAQPage() {
  const { colors } = useTheme();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Questions");
  const [openItems, setOpenItems] = useState([1]);

  const filteredFAQs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return FAQS.filter((faq) => {
      const matchesCategory =
        category === "All Questions" || faq.category === category;

      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const toggleFAQ = (id) => {
    setOpenItems((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All Questions");
    setOpenItems([]);
  };

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
        <FAQHero colors={colors} />

        <section
          id="faq-list"
          className="scroll-mt-24 px-6 py-16 sm:py-20"
          style={{ background: colors.background }}
        >
          <div className="mx-auto max-w-5xl">
            <div className="mb-9 text-center">
              <SectionLabel colors={colors}>
                Frequently Asked Questions
              </SectionLabel>

              <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                How can we help you?
              </h2>

              <p
                className="mx-auto mt-3 max-w-2xl leading-7"
                style={{ color: colors.textSecondary }}
              >
                Search for a question or choose a category to find the
                information you need.
              </p>
            </div>

            <label
              className="mb-7 flex items-center gap-3 rounded-2xl border px-5 py-4"
              style={{
                background: colors.surface,
                borderColor: colors.border,
                color: colors.textSecondary,
              }}
            >
              <SearchIcon />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions, fares, complaints..."
                aria-label="Search frequently asked questions"
                className="w-full bg-transparent text-sm outline-none sm:text-base"
                style={{ color: colors.textPrimary }}
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="text-xl"
                >
                  ×
                </button>
              )}
            </label>

            <div className="mb-8">
              <FAQCategories
                categories={CATEGORIES}
                selected={category}
                onSelect={setCategory}
                colors={colors}
              />
            </div>

            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {filteredFAQs.length}{" "}
                {filteredFAQs.length === 1 ? "question" : "questions"} found
              </p>

              <button
                type="button"
                onClick={() =>
                  setOpenItems(
                    openItems.length === filteredFAQs.length
                      ? []
                      : filteredFAQs.map((faq) => faq.id),
                  )
                }
                className="text-sm font-bold"
                style={{ color: colors.primary }}
              >
                {filteredFAQs.length > 0 &&
                filteredFAQs.every((faq) => openItems.includes(faq.id))
                  ? "Collapse all"
                  : "Expand all"}
              </button>
            </div>

            {filteredFAQs.length > 0 ? (
              <div className="space-y-3">
                {filteredFAQs.map((faq) => (
                  <FAQItem
                    key={faq.id}
                    faq={faq}
                    colors={colors}
                    open={openItems.includes(faq.id)}
                    onToggle={() => toggleFAQ(faq.id)}
                  />
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl border px-6 py-16 text-center"
                style={{
                  background: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div className="text-4xl" aria-hidden="true">
                  🔎
                </div>

                <h3 className="mt-4 text-xl font-bold">No questions found</h3>

                <p
                  className="mt-2 leading-7"
                  style={{ color: colors.textSecondary }}
                >
                  Try another keyword or select a different category.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl px-5 py-3 font-bold text-white"
                  style={{ background: colors.primary }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        <ContactSupport colors={colors} />
      </main>

      <Footer />
    </div>
  );
}
