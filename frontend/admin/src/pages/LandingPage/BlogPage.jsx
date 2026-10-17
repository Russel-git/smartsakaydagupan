import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/theme/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

const POSTS = [
  {
    id: 1,
    author: "Russel Manangan",
    initials: "RM",
    date: "October 1, 2026",
    category: "The SmartSakay Story",
    readTime: "4 min read",
    title: "Why We Created SmartSakay",
    excerpt:
      "Every day, people depend on public transportation to reach school, work, and home. We created SmartSakay to help make those everyday journeys more informed and convenient.",
    image: "https://newsinfo.inquirer.net/files/2024/04/000_34Q287J.jpg",
    content: [
      "Public transportation is an important part of everyday life. Students travel to school, employees commute to work, and families rely on available transport to reach their destinations. Yet commuters may still face challenges when looking for route information, understanding fares, or deciding which ride to take.",
      "These everyday transportation concerns inspired the idea behind SmartSakay. We wanted to create a centralized platform that could help commuters access useful transportation information and provide a clearer way to communicate concerns.",
      "SmartSakay brings together features such as route and fare information, commuter complaint reporting, location-related tools, and an AI assistant for SmartSakay-related questions. Our goal is to make relevant information easier to find while supporting communication between commuters and authorized transportation stakeholders.",
      "For us, SmartSakay is about more than providing a digital service. It is an opportunity to explore how technology can respond to the needs of people who rely on public transportation every day, particularly within our target community of Dagupan City.",
    ],
    takeaway:
      "SmartSakay began with one purpose: use technology to help make everyday public transportation more informed, accessible, and accountable.",
  },
  {
    id: 2,
    author: "Jhazper Pascua",
    initials: "JP",
    date: "October 3, 2026",
    category: "Commuter Experience",
    readTime: "4 min read",
    title: "The Daily Commuting Ride: More Than Getting There",
    excerpt:
      "A jeepney ride may be part of an ordinary day, but knowing where to go, which route to take, and what fare to prepare can make the journey easier.",
    image:
      "https://media.assettype.com/gulfnews%2Fimport%2F2024%2F01%2F19%2FSTOCK-metro-manila-philippines-traffic_18d2117ada2_large.jpg",
    content: [
      "For many commuters, taking public transportation is part of a daily routine. A trip might begin with waiting for a ride, checking the destination, preparing the fare, and hoping to arrive on time. Although these steps seem ordinary, uncertainty can make the journey more difficult.",
      "Commuters may be unfamiliar with a particular route or may want to understand the fare before boarding. New passengers, students, and visitors can especially benefit from having accessible transportation information.",
      "This is one of the needs SmartSakay aims to address. By bringing route and fare information into one platform, the system is intended to help users prepare for their trips and make more informed commuting decisions.",
      "Public transportation is not just about the vehicle. It is also about the people who depend on it and the information they need along the way. Understanding this perspective helps explain why commuter-focused features matter.",
    ],
    takeaway:
      "A smoother commuting experience starts with helping passengers feel better informed before and during their journey.",
  },
  {
    id: 3,
    author: "Jave Aaron Clavel",
    initials: "JC",
    date: "October 5, 2026",
    category: "Routes & Fares",
    readTime: "5 min read",
    title: "Finding Your Way: Why Route and Fare Information Matters",
    excerpt:
      "Knowing where a vehicle travels and how much a trip may cost helps commuters plan ahead and travel with greater confidence.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq4FwPi_MWsalA4Ck9VfAQpsUeetKchFWvuh6FE-VOQ3B0AtWQ31sbDkA&s=10",
    content: [
      "Route and fare information plays an important role in public transportation. Before traveling, commuters may need to know whether a vehicle serves their destination, where they can board, and how much money to prepare for the trip.",
      "When information is difficult to find, passengers may need to rely on asking other people or searching across different sources. This can be inconvenient, particularly for those traveling somewhere unfamiliar.",
      "SmartSakay is designed to bring route and fare information together so that commuters have a more convenient place to look for available information. The system also provides a foundation for authorized personnel to manage transportation details relevant to their assigned areas.",
      "Reliable information is important. Route details and fares need to be maintained carefully, and users should be able to distinguish available information from details that have not yet been provided or verified.",
    ],
    takeaway:
      "Accessible and properly maintained route and fare information can help commuters plan their journeys with greater confidence.",
  },
  {
    id: 4,
    author: "Brandon Polar",
    initials: "BP",
    date: "October 7, 2026",
    category: "Commuter Safety",
    readTime: "4 min read",
    title: "When a Commute Goes Wrong: Giving Commuters a Voice",
    excerpt:
      "Overcharging, reckless driving, harassment, and other transportation concerns deserve a clear way to be reported and reviewed.",
    image:
      "https://images.topgear.com.ph/topgear/images/2022/03/28/commuter-problems-with-public-transportation-in-metro-manila-1648457137.jpg",
    content: [
      "Most commuters want to reach their destinations safely and without unnecessary stress. However, passengers can sometimes encounter problems involving fares, driving behavior, harassment, route deviations, or vehicle conditions.",
      "Knowing how to communicate a concern is an important part of addressing these situations. A clear reporting channel can help commuters submit information about an incident rather than leaving them uncertain about where to turn.",
      "SmartSakay includes a complaint reporting feature intended to help organize these concerns. Reports can move through a structured workflow involving the relevant transportation stakeholders and authorized local personnel, depending on their roles and responsibilities.",
      "Reporting a concern does not automatically guarantee a particular investigation or outcome. Appropriate personnel still need to review the information and determine what action, if any, is warranted. The purpose of the system is to support a more organized process for communicating and managing reports.",
    ],
    takeaway:
      "A more organized complaint process can help commuters communicate concerns and help responsible stakeholders manage reports more effectively.",
  },
  {
    id: 5,
    author: "Christian Aguilar",
    initials: "CA",
    date: "October 9, 2026",
    category: "Transportation Information",
    readTime: "4 min read",
    title: "How SmartSakay Brings Commuter Information Together",
    excerpt:
      "From route and fare details to AI-assisted guidance and location-related features, SmartSakay aims to put useful commuting tools in one place.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80",
    content: [
      "Planning a trip can involve several questions. Which route should I take? What fare information is available? How can I report a transportation concern? Where can I find guidance about using the platform?",
      "SmartSakay is designed to bring several commuter support features together instead of requiring users to treat every task as a separate process. The platform includes route and fare information, complaint reporting, location-related functionality, and an AI assistant for SmartSakay-related questions.",
      "Each feature serves a different purpose, but together they support a broader goal: helping commuters access information and navigate transportation-related tasks through one platform.",
      "The usefulness of these tools depends on the quality of the information available and how well the features meet users' needs. That is why clarity, responsible access, and the proper management of transportation information remain important considerations.",
    ],
    takeaway:
      "A connected set of commuter tools can make transportation information easier to access and everyday tasks easier to navigate.",
  },
  {
    id: 6,
    author: "Mario Camacho",
    initials: "MC",
    date: "October 12, 2026",
    category: "The Future of Commuting",
    readTime: "5 min read",
    title: "A Smarter Journey for the Commuters",
    excerpt:
      "Our vision for SmartSakay is rooted in a simple idea: transportation technology should respond to the real needs of the people who use it.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQscMnL3kO_sWNTNMwohcBlrg2-fIXOElsckNaOvgDVFQ&s=10",
    content: [
      "Every city has people who depend on public transportation to go about their daily lives. Students, workers, residents, and visitors all benefit when transportation information is easier to access and concerns have a clearer reporting path.",
      "SmartSakay focuses on the commuting needs of Dagupan City. Through its transportation information and complaint management features, the platform aims to support commuters and improve coordination among the stakeholders involved in public transportation.",
      "A smarter commuting experience does not depend on technology alone. Accurate information, responsible transportation services, accessible tools, and appropriate action from the relevant authorities all play important roles.",
      "As SmartSakay continues to evolve, its purpose remains centered on the commuter. The system is an opportunity to explore how digital tools can support better-informed travel decisions and more organized communication about transportation concerns.",
      "Our hope is that SmartSakay can contribute to a future in which people have more convenient access to transportation information and a clearer way to communicate issues affecting their journeys.",
    ],
    takeaway:
      "A smarter commuting future starts by listening to commuters and building tools around their real transportation needs.",
  },
];

const CATEGORIES = [
  "All Posts",
  "The SmartSakay Story",
  "Commuter Experience",
  "Routes & Fares",
  "Commuter Safety",
  "Transportation Information",
  "The Future of Commuting",
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
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BlogHero({ colors }) {
  return (
    <section
      className="relative overflow-hidden px-6 py-20 sm:py-24 lg:py-28"
      style={{
        background: `linear-gradient(120deg, ${colors.background}, ${colors.primary}12)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: `${colors.primary}15` }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionLabel colors={colors}>The SmartSakay Blog</SectionLabel>

          <h1
            className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: colors.textPrimary }}
          >
            Real stories.
            <br />
            Real insights.
            <br />
            <span style={{ color: colors.primary }}>From our developers.</span>
          </h1>

          <p
            className="mt-6 max-w-2xl text-base leading-8 sm:text-lg"
            style={{ color: colors.textSecondary }}
          >
            Discover why we created SmartSakay, the commuting experiences that
            inspired us, and the lessons we learned while building a platform
            for a better public transportation experience.
          </p>

          <a
            href="#latest-posts"
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition hover:-translate-y-0.5"
            style={{
              background: colors.primary,
              boxShadow: `0 8px 24px ${colors.primary}25`,
            }}
          >
            Explore our stories <span aria-hidden="true">→</span>
          </a>

          <div
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
            style={{ color: colors.textSecondary }}
          >
            <span>✍️ Developers perspectives</span>
            <span>•</span>
            <span>💡 Ideas, experiences, and lessons</span>
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute inset-5 rounded-4xl blur-2xl"
            style={{ background: `${colors.primary}15` }}
          />

          <div
            className="relative overflow-hidden rounded-3xl border p-3 shadow-xl sm:p-4"
            style={{
              background: colors.surface,
              borderColor: colors.border,
            }}
          >
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0YAYedZlgH-i8FlWmc9qfU15v4d-VfdRl48CfGyD22VXmUNwjO4rkbHpW&s=10"
              alt="Public transportation representing the commuting experiences behind SmartSakay"
              className="h-64 w-full rounded-2xl object-cover sm:h-80"
            />

            <div className="p-4 sm:p-5">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: colors.primary }}
              >
                Behind the system
              </p>
              <h2
                className="mt-2 text-xl font-extrabold sm:text-2xl"
                style={{ color: colors.textPrimary }}
              >
                Every feature starts with a reason.
              </h2>
              <p
                className="mt-2 leading-7"
                style={{ color: colors.textSecondary }}
              >
                Get to know the people, ideas, and purpose behind SmartSakay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogCard({ post, colors, onRead }) {
  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1"
      style={{
        background: colors.surface,
        borderColor: colors.border,
        boxShadow: `0 5px 20px ${colors.textPrimary}08`,
      }}
    >
      <button
        type="button"
        onClick={() => onRead(post)}
        className="block w-full overflow-hidden text-left"
        aria-label={`Read ${post.title}`}
      >
        <img
          src={post.image}
          alt=""
          loading="lazy"
          className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </button>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel colors={colors}>{post.category}</SectionLabel>
          <span className="text-xs" style={{ color: colors.textSecondary }}>
            {post.readTime}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onRead(post)}
          className="mt-4 text-left text-xl font-extrabold leading-snug transition"
          style={{ color: colors.textPrimary }}
        >
          {post.title}
        </button>

        <p
          className="mt-3 flex-1 text-sm leading-7"
          style={{ color: colors.textSecondary }}
        >
          {post.excerpt}
        </p>

        <div
          className="mt-5 flex items-center gap-3 border-t pt-4"
          style={{ borderColor: colors.border }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
            style={{
              background: `${colors.primary}16`,
              color: colors.primary,
            }}
          >
            {post.initials}
          </div>

          <div className="min-w-0">
            <p
              className="truncate text-sm font-bold"
              style={{ color: colors.textPrimary }}
            >
              {post.author}
            </p>
            <p className="mt-1 text-xs" style={{ color: colors.textSecondary }}>
              {post.date}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRead(post)}
          className="mt-5 inline-flex items-center gap-2 self-start text-sm font-bold transition hover:gap-3"
          style={{ color: colors.primary }}
        >
          Read full story <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

function ArticleModal({ post, colors, onClose }) {
  if (!post) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
      style={{ background: "#00000099" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-title"
        className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border shadow-2xl"
        style={{
          background: colors.surface,
          borderColor: colors.border,
          color: colors.textPrimary,
        }}
      >
        <div className="relative">
          <img
            src={post.image}
            alt=""
            className="h-56 w-full object-cover sm:h-80"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close article"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold"
            style={{
              background: colors.surface,
              color: colors.textPrimary,
            }}
          >
            ×
          </button>
        </div>

        <div className="p-6 sm:p-10">
          <SectionLabel colors={colors}>{post.category}</SectionLabel>

          <h2
            id="article-title"
            className="mt-5 text-3xl font-black leading-tight sm:text-4xl"
          >
            {post.title}
          </h2>

          <div
            className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm"
            style={{ color: colors.textSecondary }}
          >
            <span>By {post.author}</span>
            <span>{post.date}</span>
            <span>{post.readTime}</span>
          </div>

          <p
            className="mt-6 text-lg font-medium leading-8"
            style={{ color: colors.textSecondary }}
          >
            {post.excerpt}
          </p>

          <div className="mt-7 space-y-5">
            {post.content.map((paragraph, index) => (
              <p
                key={index}
                className="leading-8"
                style={{ color: colors.textPrimary }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div
            className="mt-8 rounded-2xl border-l-4 p-5"
            style={{
              borderColor: colors.primary,
              background: `${colors.primary}0D`,
            }}
          >
            <p
              className="text-sm font-extrabold uppercase tracking-wide"
              style={{ color: colors.primary }}
            >
              Our takeaway
            </p>
            <p className="mt-2 leading-7">{post.takeaway}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 rounded-xl px-5 py-3 font-bold text-white"
            style={{ background: colors.primary }}
          >
            Back to all stories
          </button>
        </div>
      </article>
    </div>
  );
}

export default function BlogPage() {
  const { colors } = useTheme();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Posts");
  const [selectedPost, setSelectedPost] = useState(null);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return POSTS.filter((post) => {
      const matchesCategory =
        category === "All Posts" || post.category === category;

      const searchableText = [
        post.title,
        post.author,
        post.category,
        post.excerpt,
        ...post.content,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [search, category]);

  const featuredPost = POSTS[0];

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
        <BlogHero colors={colors} />

        <section
          id="latest-posts"
          className="scroll-mt-24 px-6 py-16 sm:py-20"
          style={{ background: colors.background }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <SectionLabel colors={colors}>Latest Stories</SectionLabel>
                <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                  Stories from the team
                </h2>
                <p
                  className="mt-3 max-w-2xl leading-7"
                  style={{ color: colors.textSecondary }}
                >
                  Six perspectives on the idea, commuting experiences, and
                  development journey behind SmartSakay.
                </p>
              </div>

              <label
                className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 lg:w-80"
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
                  placeholder="Search stories..."
                  aria-label="Search blog stories"
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: colors.textPrimary }}
                />
              </label>
            </div>

            <div
              className="mb-9 flex gap-2 overflow-x-auto pb-2"
              aria-label="Filter blog posts by category"
            >
              {CATEGORIES.map((item) => {
                const active = category === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition"
                    style={{
                      color: active ? "#FFFFFF" : colors.textSecondary,
                      background: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {category === "All Posts" && !search.trim() && (
              <div
                className="mb-10 grid overflow-hidden rounded-3xl border lg:grid-cols-2"
                style={{
                  background: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <img
                  src={featuredPost.image}
                  alt=""
                  className="h-64 w-full object-cover lg:h-full lg:min-h-82.5"
                />

                <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-10">
                  <SectionLabel colors={colors}>Featured Story</SectionLabel>
                  <h3 className="mt-5 text-2xl font-black leading-tight sm:text-3xl">
                    {featuredPost.title}
                  </h3>
                  <p
                    className="mt-4 leading-7"
                    style={{ color: colors.textSecondary }}
                  >
                    {featuredPost.excerpt}
                  </p>
                  <div
                    className="mt-4 text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    {featuredPost.author} · {featuredPost.readTime}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPost(featuredPost)}
                    className="mt-6 inline-flex items-center gap-2 self-start font-bold"
                    style={{ color: colors.primary }}
                  >
                    Read featured story <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            )}

            {filteredPosts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    colors={colors}
                    onRead={setSelectedPost}
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
                <div className="text-4xl">🔎</div>
                <h3 className="mt-4 text-xl font-bold">No stories found</h3>
                <p className="mt-2" style={{ color: colors.textSecondary }}>
                  Try another keyword or select a different category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All Posts");
                  }}
                  className="mt-5 rounded-xl px-5 py-3 font-bold text-white"
                  style={{ background: colors.primary }}
                >
                  Clear filters
                </button>
              </div>
            )}

            <div
              className="mt-12 text-center text-sm"
              style={{ color: colors.textSecondary }}
            >
              Showing {filteredPosts.length} of {POSTS.length} stories
            </div>
          </div>
        </section>

        <section
          className="px-6 pb-20"
          style={{ background: colors.background }}
        >
          <div
            className="mx-auto max-w-7xl rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16"
            style={{
              background: colors.primary,
              color: "#FFFFFF",
            }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
              More than a school project
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black sm:text-4xl">
              Every better journey begins with an idea.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/85">
              SmartSakay is our effort to connect technology with everyday
              transportation needs. This is the story behind what we are
              building and why it matters to us.
            </p>
            <Link
              to="/about"
              className="mt-7 inline-flex rounded-xl px-6 py-3 font-bold transition hover:-translate-y-0.5 text-center"
              style={{ background: "#FFFFFF", color: colors.primary }}
            >
              Learn More About SmartSakay
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      <ArticleModal
        post={selectedPost}
        colors={colors}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
}
