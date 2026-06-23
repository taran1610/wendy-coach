import Link from "next/link";

const features = [
  {
    title: "Trade journal",
    description:
      "Log every trade with setup, P&L, emotions, mistakes, and lessons — the full story, not just the result.",
    icon: "↗",
  },
  {
    title: "Daily mindset notes",
    description:
      "Capture market conditions, mood, goals, and reflections so Wendy understands how you think — not just what you traded.",
    icon: "✎",
  },
  {
    title: "Wendy AI coach",
    description:
      "End-of-day reviews with honest feedback: strengths, blind spots, and action items for tomorrow. Chat anytime for guidance.",
    icon: "★",
  },
  {
    title: "RAG-powered memory",
    description:
      "Wendy retrieves your past trades and journals to give advice tied to your real patterns — smarter the more you use it.",
    icon: "◈",
  },
  {
    title: "Tradovate sync",
    description:
      "Connect your Tradovate account and auto-import fills. Built for futures traders and prop firm eval accounts.",
    icon: "⟳",
  },
  {
    title: "Performance dashboard",
    description:
      "Track win rate, P&L, and streaks at a glance. See today vs all-time stats in one clean view.",
    icon: "▣",
  },
];

const steps = [
  {
    step: "01",
    title: "Sign up & journal",
    body: "Create your account, log trades manually or sync from Tradovate, and write your daily notes.",
  },
  {
    step: "02",
    title: "Wendy learns you",
    body: "Every entry builds a memory bank. Wendy uses RAG to find relevant past sessions when coaching you.",
  },
  {
    step: "03",
    title: "Improve every day",
    body: "Get end-of-day reviews, chat with Wendy, and fix bad habits before they become expensive patterns.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[var(--card-border)] bg-[color-mix(in_srgb,var(--background)_85%,transparent)] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[#042f2e] font-bold">
              W
            </div>
            <span className="font-semibold">Wendy Coach</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn btn-secondary text-sm px-4 py-2">
              Sign in
            </Link>
            <Link href="/login" className="btn btn-primary text-sm px-4 py-2">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_srgb,var(--accent)_18%,transparent),transparent)]" />
        <div className="max-w-6xl mx-auto px-5 pt-20 pb-24 relative">
          <p className="text-sm text-[var(--accent)] font-medium tracking-wide uppercase mb-4">
            Trading journal + AI mentor
          </p>
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight max-w-3xl">
            Your trading coach that actually{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--gold)]">
              knows your history
            </span>
          </h1>
          <p className="text-lg text-[var(--muted)] mt-6 max-w-2xl leading-relaxed">
            Wendy Coach is a journal built for serious traders — log trades, reflect on mindset,
            sync from Tradovate, and get end-of-day AI coaching powered by your own data.
          </p>
          <div className="flex flex-wrap gap-3 mt-10">
            <Link href="/login" className="btn btn-primary px-6 py-3 text-base">
              Start journaling free
            </Link>
            <a href="#features" className="btn btn-secondary px-6 py-3 text-base">
              See how it works
            </a>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg">
            <div>
              <p className="text-2xl font-semibold text-[var(--gold)]">RAG</p>
              <p className="text-xs text-[var(--muted)] mt-1">Memory-aware coaching</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--accent)]">Tradovate</p>
              <p className="text-xs text-[var(--muted)] mt-1">Auto-import trades</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">24/7</p>
              <p className="text-xs text-[var(--muted)] mt-1">Chat with Wendy</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="text-2xl md:text-3xl font-semibold mb-3">Everything you need to level up</h2>
        <p className="text-[var(--muted)] mb-12 max-w-xl">
          Like TradeZella meets a personal mentor — built for prop firm traders, futures, and
          anyone who wants process over luck.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <article key={feature.title} className="card hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--card-border))] transition-colors">
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="font-semibold mt-4 mb-2">{feature.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card)_40%,transparent)]">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4">Meet Wendy</h2>
              <p className="text-[var(--muted)] leading-relaxed mb-4">
                Wendy isn&apos;t a generic chatbot. She&apos;s your trading mentor — warm like a
                friend, honest like a coach. She celebrates your discipline, calls out revenge
                trading, and gives specific advice from your actual journal history.
              </p>
              <p className="text-[var(--muted)] leading-relaxed">
                At end of day, Wendy delivers a structured review: summary, strengths, where
                you&apos;re lagging, and concrete action items for tomorrow.
              </p>
            </div>
            <div className="card border-[color-mix(in_srgb,var(--accent)_25%,var(--card-border))] space-y-4">
              <p className="text-xs uppercase tracking-wider text-[var(--gold)]">Sample review</p>
              <p className="text-sm leading-relaxed">
                &quot;You followed your plan on the first two trades but sized up after a loss.
                Your win rate on A+ setups is 68% — stick to those tomorrow.&quot;
              </p>
              <div className="text-sm space-y-2 pt-2 border-t border-[var(--card-border)]">
                <p><span className="text-[var(--accent)]">+</span> Patience on open — waited for confirmation</p>
                <p><span className="text-[var(--danger)]">−</span> Revenge trade after 10:30 AM loss</p>
                <p><span className="text-[var(--gold)]">→</span> Max 2 trades before noon tomorrow</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-20">
        <h2 className="text-2xl md:text-3xl font-semibold mb-12 text-center">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item) => (
            <div key={item.step} className="text-center md:text-left">
              <p className="text-4xl font-bold text-[color-mix(in_srgb,var(--accent)_40%,var(--muted))]">
                {item.step}
              </p>
              <h3 className="font-semibold mt-4 mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-24">
        <div className="card text-center py-14 px-6 bg-gradient-to-br from-[color-mix(in_srgb,var(--accent)_12%,var(--card))] to-[var(--card)] border-[color-mix(in_srgb,var(--accent)_30%,var(--card-border))]">
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">Ready to trade smarter?</h2>
          <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
            Join Wendy Coach — journal your trades, connect Tradovate, and let AI coaching compound
            your edge over time.
          </p>
          <Link href="/login" className="btn btn-primary px-8 py-3 text-base">
            Create your account
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--card-border)] py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <p>© {new Date().getFullYear()} Wendy Coach. Built for traders, by traders.</p>
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in to your journal →
          </Link>
        </div>
      </footer>
    </div>
  );
}
