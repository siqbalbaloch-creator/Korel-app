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

export default function WhyFoundersWaste() {
  return (
    <>
      <p style={p}>
        The ideas you share on investor calls, in Slack threads, and during
        customer discovery conversations are almost certainly your best
        thinking. They&apos;re sharp, specific, and informed by real context.
        But they disappear the moment the call ends.
      </p>

      <p style={p}>
        This is the insight trap most founders fall into: the ideas that could
        establish genuine authority — the kind that attracts ideal customers,
        earns media attention, and builds long-term positioning — are locked
        inside conversations, never extracted, never organized, never
        distributed.
      </p>

      <h2 style={h2}>Where Great Thinking Goes to Die</h2>

      <p style={p}>
        Think about what you said in your last investor update. You probably
        articulated the market dynamics better than any blog post you&apos;ve
        written. You described a problem with precision that came from months of
        customer research. You made a claim about the future that most people in
        your industry haven&apos;t considered yet.
      </p>

      <p style={p}>
        Then the meeting ended. That insight went into an email draft nobody
        reads. Or it stayed in your memory, where it slowly erodes.
      </p>

      <p style={p}>
        The same thing happens on sales calls. You explain to a prospect why
        the current approach is fundamentally broken, why your positioning is
        different, why the timing is right. That&apos;s a LinkedIn post. That&apos;s a
        newsletter intro. That&apos;s the foundation of a clear thesis.
      </p>

      <p style={p}>
        It&apos;s not that founders lack insight. They have too much of it, in the
        wrong formats.
      </p>

      <h2 style={h2}>Why This Matters for Authority</h2>

      <p style={p}>
        Authority doesn&apos;t come from publishing frequently. It comes from saying
        specific things, consistently, in a way that accumulates over time.
      </p>

      <p style={p}>
        The founders who become recognizable voices in their space — the ones
        who get referenced in industry discussions, invited to speak, quoted in
        press — share one trait: they&apos;ve extracted a clear point of view from
        their experience and found a systematic way to distribute it.
      </p>

      <p style={p}>
        The extraction step is where most people fall short.
      </p>

      <p style={p}>
        You can&apos;t build authority on content that sounds like everyone
        else&apos;s content. The only way to say something original is to draw from
        original experience. Your investor calls, your customer conversations,
        your internal strategy documents — that&apos;s your source material.
      </p>

      <p style={p}>
        The challenge is that raw experience is unstructured. A 90-minute
        strategy call is full of insight, but it&apos;s also full of noise. Without a
        system to identify the high-leverage moments and translate them into
        structured content, most of it stays trapped.
      </p>

      <h2 style={h2}>The Structural Fix</h2>

      <p style={p}>
        Founders who solve this problem don&apos;t suddenly become better writers.
        They implement a structured extraction step between raw thinking and
        distributed content.
      </p>

      <p style={{ ...p, marginBottom: "0.75rem" }}>This looks like:</p>

      <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem", listStyleType: "disc" }}>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>
            A consistent input format:
          </strong>{" "}
          Transcripts, written updates, or structured notes that can be
          processed systematically.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>
            An extraction layer:
          </strong>{" "}
          A process that identifies core thesis, supporting claims,
          counterarguments, and hooks — the raw material of authority content.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>
            A distribution matrix:
          </strong>{" "}
          A plan for how a single insight gets expressed across LinkedIn,
          newsletters, and other formats without just being reformatted.
        </li>
      </ul>

      <p style={p}>
        The goal is to move from scattered insight to structured authority —
        not through more effort, but through a system that makes it repeatable.
      </p>

      <p style={p}>
        Most founders are sitting on months of valuable thinking. It just
        hasn&apos;t been extracted yet.
      </p>

      <p style={{ ...p, marginBottom: 0 }}>
        The{" "}
        <a
          href="https://usekorel.com"
          style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 500 }}
        >
          Korel authority engine
        </a>{" "}
        was built for exactly this problem — turning raw transcripts, investor
        updates, and strategy calls into structured, distributable authority
        content, without the manual extraction work.
      </p>
    </>
  );
}
