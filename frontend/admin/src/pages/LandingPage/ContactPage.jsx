import { useState } from "react";
import {
  MapPin,
  Mail,
  Phone,
  Clock,
  Send,
  ArrowRight,
  ShieldCheck,
  BusFront,
  Users,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { useTheme } from "../../contexts/theme/ThemeContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

const ORANGE = "#F59E0B";
const ORANGE_DARK = "#D97706";
const ORANGE_LIGHT = "#FBBF24";

const contactOptions = [
  {
    icon: ShieldCheck,
    title: "Local Government Units",
    description:
      "Help your town build safer, more accountable public transportation through better reporting and coordination.",
    action: "Partner with us",
    subject: "LGU Partnership",
  },
  {
    icon: MessageCircle,
    title: "General Inquiries & Support",
    description:
      "Have questions about SmartSakay or need help understanding our platform? Reach out to learn more about our features, goals, and commitment to safer public transportation.",
    action: "Ask a question",
    subject: "General Inquiry",
  },
  {
    icon: Users,
    title: "Commuters & Community",
    description:
      "Have a suggestion, concern, or idea? Your voice can help make every journey safer and smarter.",
    action: "Share your thoughts",
    subject: "Community Feedback",
  },
];

export default function ContactPage() {
  const { colors, isDark } = useTheme();
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const updateField = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setError("");
    setSubmitted(false);
  };

  const selectSubject = (subject) => {
    setForm((prev) => ({ ...prev, subject }));

    document.getElementById("contact-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSubmitted(false);

    if (sending) return;

    setSending(true);

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject,
          message: form.message.trim(),
        },
        {
          publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
        },
      );

      setSubmitted(true);

      setForm({
        name: "",
        email: "",
        subject: "General Inquiry",
        message: "",
      });
    } catch (err) {
      console.error("EmailJS submission failed:", err);

      setError(
        "We couldn't send your message right now. Please try again later.",
      );
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    background: isDark ? colors.background : "#FFFFFF",
    color: colors.textPrimary,
    borderColor: colors.border,
  };

  const primaryGradient = `linear-gradient(110deg, ${colors.primary}, ${ORANGE_DARK})`;

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
        {/* HERO */}
        <section
          className="relative isolate overflow-hidden"
          style={{
            background: colors.background,
            color: colors.textPrimary,
          }}
        >
          {/* Subtle grid background — matches FAQ page */}
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

          {/* Primary theme glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full blur-3xl"
            style={{ background: `${colors.primary}30` }}
          />

          {/* Orange glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 left-1/4 -z-10 h-80 w-80 rounded-full blur-3xl"
            style={{ background: `${ORANGE}25` }}
          />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-16">
            <div>
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em]"
                style={{
                  borderColor: `${ORANGE}55`,
                  background: `${ORANGE}12`,
                  color: ORANGE,
                }}
              >
                <MessageCircle size={15} />
                Let's start a conversation
              </div>

              <h1 className="max-w-2xl text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                Want to help{" "}
                <span
                  style={{
                    background: `linear-gradient(90deg, ${colors.primary}, ${ORANGE})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  your town?
                </span>
                <br />
                Let's talk.
              </h1>

              <p
                className="mt-6 max-w-xl text-base leading-8 sm:text-lg"
                style={{ color: colors.textSecondary }}
              >
                Safer rides start with a community that cares. Whether you're an
                LGU representative, a transport operator, or a commuter with an
                idea, SmartSakay wants to hear from you.
              </p>

              <div
                className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm"
                style={{ color: colors.textSecondary }}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} color={ORANGE} />
                  Community-first
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} color={ORANGE} />
                  Safer transportation
                </span>
              </div>
            </div>

            {/* HERO VISUAL */}
            <div className="relative mx-auto w-full max-w-lg">
              <div
                className="absolute -inset-4 rounded-4xl blur-2xl"
                style={{ background: `${ORANGE}18` }}
              />

              <div
                className="relative overflow-hidden rounded-4xl border p-7 sm:p-9"
                style={{
                  background: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-[0.18em]"
                      style={{ color: ORANGE }}
                    >
                      One community
                    </p>

                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                      One safer journey.
                    </h2>
                  </div>

                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background: `${ORANGE}18`,
                      color: ORANGE_DARK,
                    }}
                  >
                    <BusFront size={26} />
                  </div>
                </div>

                <div className="relative my-8 overflow-hidden rounded-2xl">
                  <img
                    src="/images/smartsakay-contact.jpg"
                    alt="SmartSakay public transportation community"
                    className="h-52 w-full object-cover sm:h-64"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(0deg, #24181865, transparent 65%)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: ShieldCheck, label: "Safety" },
                    { icon: BusFront, label: "Transport" },
                    { icon: Users, label: "Community" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="rounded-xl border px-2 py-4 text-center"
                      style={{
                        borderColor: colors.border,
                        background: colors.background,
                      }}
                    >
                      <Icon size={23} className="mx-auto mb-2" color={ORANGE} />

                      <span className="text-xs font-semibold">{label}</span>
                    </div>
                  ))}
                </div>

                <p
                  className="mt-6 text-sm leading-6"
                  style={{ color: colors.textSecondary }}
                >
                  Better communication. Stronger partnerships. A smarter way to
                  move our communities forward.
                </p>
              </div>

              {/* Floating message card */}
              <div
                className="absolute -bottom-5 -left-3 rounded-2xl border px-4 py-3 shadow-xl sm:-left-6"
                style={{
                  background: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background: `${ORANGE}18`,
                      color: ORANGE_DARK,
                    }}
                  >
                    <MessageCircle size={21} />
                  </div>

                  <div>
                    <p className="text-sm font-extrabold">Your voice matters</p>

                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      Let's make a difference
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT OPTIONS */}
        <section
          id="partnerships"
          className="px-5 py-20 sm:px-8 sm:py-24"
          style={{ background: colors.surface }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p
                className="text-xs font-extrabold uppercase tracking-[0.2em]"
                style={{ color: ORANGE }}
              >
                Let's work together
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Who are you reaching out for?
              </h2>

              <p
                className="mt-4 leading-7"
                style={{ color: colors.textSecondary }}
              >
                Every partnership brings us one step closer to safer and more
                reliable public transportation.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {contactOptions.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="group flex flex-col rounded-2xl border p-6 transition duration-300 hover:-translate-y-1 sm:p-7"
                    style={{
                      background: colors.background,
                      borderColor: colors.border,
                    }}
                  >
                    <div
                      className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        background: `${ORANGE}18`,
                        color: ORANGE_DARK,
                      }}
                    >
                      <Icon size={25} />
                    </div>

                    <h3 className="text-xl font-extrabold">{item.title}</h3>

                    <p
                      className="mt-3 flex-1 text-sm leading-7"
                      style={{ color: colors.textSecondary }}
                    >
                      {item.description}
                    </p>

                    <button
                      type="button"
                      onClick={() => selectSubject(item.subject)}
                      className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-bold transition hover:gap-3"
                      style={{ color: ORANGE_DARK }}
                    >
                      {item.action} <ArrowRight size={16} />
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* CONTACT FORM + INFO */}
        <section
          id="contact-form"
          className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24"
          style={{ background: colors.background }}
        >
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p
                className="text-xs font-extrabold uppercase tracking-[0.2em]"
                style={{ color: ORANGE }}
              >
                Get in touch
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Have something in mind?
              </h2>

              <p
                className="mt-5 leading-7"
                style={{ color: colors.textSecondary }}
              >
                We'd love to hear your ideas, answer your questions, and explore
                how we can work together to improve transportation in your
                community.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  {
                    icon: Mail,
                    title: "Email",
                    value: "smartsakay@gmail.com",
                    note: "For inquiries and partnerships",
                  },
                  {
                    icon: Phone,
                    title: "Phone",
                    value: "+63 9123456789",
                    note: "For direct assistance",
                  },
                  {
                    icon: MapPin,
                    title: "Location",
                    value: "Dagupan City, Pangasinan",
                    note: "Serving the local community",
                  },
                  {
                    icon: Clock,
                    title: "Response time",
                    value: "We're here to listen",
                    note: "Response times may vary",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="flex items-start gap-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: `${ORANGE}18`,
                          color: ORANGE_DARK,
                        }}
                      >
                        <Icon size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-bold">{item.title}</p>

                        <p className="mt-1 text-sm font-semibold">
                          {item.value}
                        </p>

                        <p
                          className="mt-1 text-xs"
                          style={{ color: colors.textSecondary }}
                        >
                          {item.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border p-6 shadow-sm sm:p-9"
              style={{
                background: colors.surface,
                borderColor: colors.border,
              }}
            >
              {submitted ? (
                <div className="py-12 text-center">
                  <CheckCircle2
                    size={48}
                    className="mx-auto mb-4"
                    color={ORANGE}
                  />

                  <h3 className="text-2xl font-black">Message received!</h3>

                  <p className="mt-3" style={{ color: colors.textSecondary }}>
                    Thank you for reaching out to SmartSakay.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-black">Send us a message</h3>

                  <p
                    className="mt-2 text-sm leading-6"
                    style={{ color: colors.textSecondary }}
                  >
                    Tell us a little about what you'd like to discuss.
                  </p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2 block text-sm font-bold"
                      >
                        Full name
                      </label>

                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        maxLength={100}
                        autoComplete="name"
                        value={form.name}
                        onChange={updateField}
                        placeholder="Juan Dela Cruz"
                        className="w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/40"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-bold"
                      >
                        Email address
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        value={form.email}
                        onChange={updateField}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/40"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <label
                      htmlFor="subject"
                      className="mb-2 block text-sm font-bold"
                    >
                      What is this about?
                    </label>

                    <select
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={updateField}
                      className="w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/40"
                      style={inputStyle}
                    >
                      <option>General Inquiry</option>
                      <option>LGU Partnership</option>
                      <option>Community Feedback</option>
                      <option>Technical Support</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="mt-5">
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-bold"
                    >
                      Your message
                    </label>

                    <textarea
                      id="message"
                      name="message"
                      required
                      minLength={10}
                      maxLength={3000}
                      rows={5}
                      value={form.message}
                      onChange={updateField}
                      placeholder="Tell us how we can help or how you'd like to work with SmartSakay..."
                      className="w-full resize-y rounded-xl border px-4 py-3.5 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/40"
                      style={inputStyle}
                    />

                    <p
                      className="mt-2 text-right text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      {form.message.length}/3000
                    </p>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="mt-4 rounded-xl border p-3 text-sm"
                      style={{
                        color: isDark ? ORANGE_LIGHT : "#92400E",
                        borderColor: `${ORANGE}80`,
                        background: `${ORANGE}12`,
                      }}
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background: primaryGradient,
                      boxShadow: `0 8px 24px ${colors.primary}25`,
                    }}
                  >
                    {sending ? (
                      <>
                        Sending message...
                        <span className="animate-spin">⟳</span>
                      </>
                    ) : (
                      <>
                        Send message <Send size={17} />
                      </>
                    )}
                  </button>

                  <p
                    className="mt-4 text-center text-xs leading-5"
                    style={{ color: colors.textSecondary }}
                  >
                    By submitting this form, you agree to have your information
                    used to respond to your inquiry.
                  </p>
                </>
              )}
            </form>
          </div>
        </section>

        {/* BOTTOM CTA — matches FAQ CTA */}
        <section
          className="px-5 pb-20 sm:px-8 sm:pb-24"
          style={{ background: colors.background }}
        >
          <div
            className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-16"
            style={{
              background: colors.primary,
              color: "#FFFFFF",
            }}
          >
            <div
              className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full blur-3xl"
              style={{ background: `${ORANGE}35` }}
            />

            <div
              className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full blur-3xl"
              style={{ background: `${ORANGE_DARK}25` }}
            />

            <div className="relative">
              <p
                className="text-xs font-extrabold uppercase tracking-[0.2em]"
                style={{ color: ORANGE_LIGHT }}
              >
                Ride safe. Ride smart.
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black sm:text-4xl">
                A safer town starts with people like you.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/85">
                Let's bring commuters, transport operators, and local
                authorities together for a better journey.
              </p>

              <a
                href="#contact-form"
                className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-extrabold transition hover:-translate-y-0.5"
                style={{
                  background: "#FFFFFF",
                  color: colors.primary,
                }}
              >
                Let's work together
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
