const p: React.CSSProperties = {
  marginBottom: "1.5rem",
};

const h2: React.CSSProperties = {
  fontSize: "1.35rem",
  fontWeight: 700,
  color: "#0F172A",
  letterSpacing: "-0.01em",
  lineHeight: 1.3,
  marginTop: "2.75rem",
  marginBottom: "1rem",
};

const li: React.CSSProperties = {
  marginBottom: "0.6rem",
  paddingLeft: "0.25rem",
};

const callout: React.CSSProperties = {
  backgroundColor: "#F8FAFC",
  border: "1px solid #E2E8F0",
  borderRadius: "8px",
  padding: "20px 24px",
  marginBottom: "1.5rem",
};

export default function FounderAuthoritySystem() {
  return (
    <>
      <p style={p}>
        You just spent 90 minutes on a podcast. You were sharp. You made claims
        you&apos;ve never written down before. You explained your positioning better
        than you have in any board deck.
      </p>

      <p style={p}>
        Within a week, most of it will be forgotten — not by the audience, but
        by you. The episode goes live, gets a handful of shares, and then
        disappears into the feed like everything else.
      </p>

      <p style={p}>
        This is almost entirely a systems failure, not a content failure. The
        raw material was there. What was missing was a process for turning it
        into something that compounds.
      </p>

      <h2 style={h2}>Why Podcast Appearances Produce Better Material Than Writing</h2>

      <p style={p}>
        When you write a LinkedIn post or newsletter, you&apos;re starting from zero.
        The blank page defaults you to the most accessible version of your
        thinking — which is usually the version you&apos;ve already stated before.
      </p>

      <p style={p}>
        A podcast guest slot works differently. A good host is asking questions
        you haven&apos;t prepared for. They&apos;re pushing back on your framing. They&apos;re
        asking you to explain things to an unfamiliar audience. That pressure
        produces material that you would never have written spontaneously.
      </p>

      <p style={p}>
        The analogies that surface under that pressure. The counterintuitive
        claims you make when you&apos;re being pushed. The specific numbers and
        timelines you give to make a point concrete. That&apos;s your best thinking —
        and it usually shows up in recorded conversations, not written drafts.
      </p>

      <h2 style={h2}>The 3-Phase System</h2>

      <p style={p}>
        The goal is to build a process around every podcast appearance — before,
        during, and after — so that the 90 minutes you spend becomes 30 days of
        structured authority content.
      </p>

      <p style={{ ...p, fontWeight: 600, color: "#0F172A", marginBottom: "0.5rem" }}>
        Phase 1: Pre-recording (10 minutes)
      </p>
      <p style={p}>
        Before every podcast, write down three things you want to say regardless
        of what gets asked. Not talking points — actual claims. Single sentences
        that express a specific point of view about your market, your approach,
        or the problem you solve.
      </p>
      <p style={p}>
        These become your content anchors. Even if the conversation goes in a
        different direction, you&apos;ll find a way to land them. And because you
        wrote them down in advance, they&apos;re already half-formatted as LinkedIn
        hooks.
      </p>

      <p style={{ ...p, fontWeight: 600, color: "#0F172A", marginBottom: "0.5rem" }}>
        Phase 2: During the recording
      </p>
      <p style={p}>
        You can&apos;t take notes mid-conversation, but you can train yourself to
        notice a few specific signals: a strong analogy that you&apos;ve never used
        before, a moment when the host says &ldquo;wait, say that again,&rdquo; or a
        counterintuitive claim that came out under pressure.
      </p>
      <p style={p}>
        Don&apos;t over-prepare or try to control the conversation. The best
        material comes from being pushed into corners you didn&apos;t expect.
      </p>

      <p style={{ ...p, fontWeight: 600, color: "#0F172A", marginBottom: "0.5rem" }}>
        Phase 3: The extraction pass (within 48 hours)
      </p>
      <p style={p}>
        Get the transcript. Read through it once and mark four types of content
        with a simple tag:
      </p>

      <div style={callout}>
        <ul style={{ paddingLeft: "1.25rem", margin: 0, listStyleType: "disc" }}>
          <li style={{ ...li, marginBottom: "0.5rem" }}>
            <strong style={{ color: "#0F172A" }}>[HOOK]</strong> — a single sharp sentence that could open a post
          </li>
          <li style={{ ...li, marginBottom: "0.5rem" }}>
            <strong style={{ color: "#0F172A" }}>[CLAIM]</strong> — a substantive assertion with a clear implication
          </li>
          <li style={{ ...li, marginBottom: "0.5rem" }}>
            <strong style={{ color: "#0F172A" }}>[STORY]</strong> — a specific example or anecdote with enough detail to be useful
          </li>
          <li style={{ ...li, marginBottom: 0 }}>
            <strong style={{ color: "#0F172A" }}>[FRAMEWORK]</strong> — a model or structure you described for thinking about a problem
          </li>
        </ul>
      </div>

      <p style={p}>
        One hour-long podcast typically surfaces 3–5 hooks, 4–8 claims, 3–6
        stories, and 1–3 frameworks. That&apos;s your raw content inventory.
      </p>

      <h2 style={h2}>The Distribution Calendar</h2>

      <p style={p}>
        Once you have your inventory, map it to a four-week schedule. You
        don&apos;t need to fill every day — you need to be consistent and coherent.
      </p>

      <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem", listStyleType: "disc" }}>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Week 1:</strong>{" "}
          Two LinkedIn posts built from your strongest hooks, each developed
          with the five-part structure (hook, context, insight, implication,
          invitation).
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Week 2:</strong>{" "}
          A newsletter section built from your main claim and the story that
          best supports it.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Week 3:</strong>{" "}
          An X thread walking through the framework — one tweet per step,
          with the claim as the opener.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Week 4:</strong>{" "}
          A longer LinkedIn post or follow-on piece that addresses the
          objection most people raise to your main claim.
        </li>
      </ul>

      <p style={p}>
        That&apos;s one episode turning into five to seven pieces of structured
        content spread across 30 days. None of it is rephrasing the same idea —
        each piece takes a different angle on the same underlying thinking.
      </p>

      <h2 style={h2}>Why This Builds Authority Instead of Just Volume</h2>

      <p style={p}>
        The compounding effect of this approach isn&apos;t obvious until you run it
        for two or three podcast cycles. Then it becomes very clear.
      </p>

      <p style={p}>
        When all your content for a month traces back to one strong recorded
        conversation, it creates a coherence of voice that scattered posting
        never achieves. The reader who sees four of your posts in a month
        notices that they all reinforce the same core thinking from different
        angles. That&apos;s what makes you feel like an authority rather than someone
        who posts regularly.
      </p>

      <p style={p}>
        The standard approach to content — posting whenever you have something
        to say — produces a feed that looks active but reads incoherently. The
        system approach produces a feed that reads like a body of thought.
      </p>

      <p style={p}>
        Most founders have more than enough source material. The constraint is
        never ideas — it&apos;s the extraction and structuring step between the
        conversation and the published post.
      </p>

      <p style={{ ...p, marginBottom: 0 }}>
        The{" "}
        <a
          href="https://usekorel.com"
          style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 500 }}
        >
          Korel authority engine
        </a>{" "}
        automates exactly this step — taking a podcast transcript or recorded
        conversation and producing a structured set of LinkedIn posts, X
        threads, and newsletter sections, ready to schedule across the month.
      </p>
    </>
  );
}
