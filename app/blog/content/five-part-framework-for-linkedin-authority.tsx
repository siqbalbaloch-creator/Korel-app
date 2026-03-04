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

const callout: React.CSSProperties = {
  borderLeft: "3px solid #4F46E5",
  paddingLeft: "1.25rem",
  marginBottom: "1.5rem",
  color: "#374151",
};

export default function FivePartFramework() {
  return (
    <>
      <p style={p}>
        The problem with most LinkedIn content from founders isn&apos;t quality.
        It&apos;s structure.
      </p>

      <p style={p}>
        Founders often write LinkedIn posts the way they think: starting from
        where they are right now, sharing what they learned today, circling
        around to a vague conclusion. This approach produces content that feels
        authentic but is hard to understand quickly — and hard to share.
      </p>

      <p style={p}>
        Authority content has a different structure. It&apos;s designed to be
        understood immediately, to make one specific point, and to leave the
        reader with something worth remembering.
      </p>

      <p style={p}>
        Here&apos;s a framework that achieves all three.
      </p>

      <h2 style={h2}>Part 1: The Hook</h2>

      <p style={p}>
        The hook is a single line, sometimes two. Its job is to create a gap —
        a moment of tension where the reader needs to know what comes next.
      </p>

      <div style={callout}>
        <p style={{ margin: 0, marginBottom: "0.5rem", color: "#94A3B8", fontSize: "0.875rem" }}>
          Weak hook
        </p>
        <p style={{ margin: 0, fontStyle: "italic" }}>
          &ldquo;I&apos;ve been thinking about content strategy lately.&rdquo;
        </p>
      </div>

      <div style={{ ...callout, borderLeftColor: "#10B981", marginBottom: "1.5rem" }}>
        <p style={{ margin: 0, marginBottom: "0.5rem", color: "#94A3B8", fontSize: "0.875rem" }}>
          Strong hook
        </p>
        <p style={{ margin: 0, fontStyle: "italic" }}>
          &ldquo;Most founders are generating content from the wrong source.&rdquo;
        </p>
      </div>

      <p style={p}>
        The strong hook makes a specific claim that challenges an assumption. It
        works because it&apos;s specific enough to matter and provocative enough to
        create curiosity.
      </p>

      <p style={p}>
        The best hooks are usually compressed versions of your core thesis.
        They don&apos;t explain — they interrupt.
      </p>

      <h2 style={h2}>Part 2: The Context</h2>

      <p style={p}>
        Context is what makes your hook credible. You&apos;ve made a claim; now you
        need to ground it in something real.
      </p>

      <p style={p}>
        This can be a specific situation you&apos;ve observed, a pattern across
        multiple conversations, or a concrete example from your experience.
        Context should be one to three short paragraphs. The goal is to make the
        reader think &ldquo;yes, I&apos;ve seen this&rdquo; or &ldquo;interesting, I hadn&apos;t thought
        about it that way.&rdquo;
      </p>

      <p style={p}>
        Avoid abstractions at this stage. Be specific about who, what, and where.
      </p>

      <h2 style={h2}>Part 3: The Insight</h2>

      <p style={p}>
        This is the intellectual core of the post — the thing you actually
        learned or figured out that others probably haven&apos;t.
      </p>

      <p style={p}>
        The insight should do one of three things: reframe how the reader thinks
        about the problem, surface a mechanism that wasn&apos;t visible before, or
        make a specific claim that most people would disagree with.
      </p>

      <p style={p}>
        One way to test whether your insight is strong enough: if someone could
        have written this without your specific experience, it&apos;s not your
        insight. It&apos;s a summary.
      </p>

      <p style={p}>
        Your insight is strongest when it comes from the intersection of
        something you&apos;ve done and something you&apos;ve observed that most others
        haven&apos;t.
      </p>

      <h2 style={h2}>Part 4: The Implication</h2>

      <p style={p}>
        The implication turns your insight into something actionable or
        consequential. It answers the question: &ldquo;so what?&rdquo;
      </p>

      <p style={p}>
        This is where a lot of posts stop too early. You&apos;ve shared what you
        learned. But you haven&apos;t told the reader what it means for them.
      </p>

      <p style={p}>
        Implications can be: &ldquo;This means the standard approach to X is missing
        something important.&rdquo; Or: &ldquo;If this is true, then X is a bigger risk
        than most people realize.&rdquo; The implication is what makes your post worth
        sharing. It gives the reader something to bring into a conversation.
      </p>

      <h2 style={h2}>Part 5: The Invitation</h2>

      <p style={p}>
        The final element is a low-friction call to engage. Not a direct ask
        (&ldquo;what do you think?&rdquo;) but an open question or observation that
        invites response.
      </p>

      <p style={p}>
        Examples: &ldquo;Curious whether others have noticed this shift.&rdquo; Or:
        &ldquo;This seems obvious once you see it, but I rarely hear it discussed.&rdquo;
        The invitation keeps the thread open without being demanding.
      </p>

      <h2 style={h2}>Putting It Together</h2>

      <p style={p}>
        A post built on this framework takes one insight and delivers it clearly
        across five distinct moves. It&apos;s not about length — a strong post can be
        150 words or 600. It&apos;s about structure.
      </p>

      <p style={p}>
        The founders who build recognizable authority on LinkedIn aren&apos;t
        necessarily writing more. They&apos;re writing with more precision.
      </p>

      <p style={{ ...p, marginBottom: 0 }}>
        If you want to apply this framework to your existing content
        automatically, the{" "}
        <a
          href="https://usekorel.com"
          style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 500 }}
        >
          Korel authority engine
        </a>{" "}
        extracts structured posts, hooks, and threads directly from your
        transcripts and long-form documents.
      </p>
    </>
  );
}
