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

export default function OneInterview() {
  return (
    <>
      <p style={p}>
        If you&apos;ve ever done a good founder interview — as a guest on a podcast,
        in a customer discovery call, or during an investor pitch — you&apos;ve
        produced more useful content material than you&apos;ll use in six months.
      </p>

      <p style={p}>
        Most of it will stay in the recording.
      </p>

      <p style={p}>
        This is one of the most fixable problems in content strategy. Not
        because you need to work harder, but because the extraction and
        distribution framework most people use is too shallow.
      </p>

      <h2 style={h2}>Why Interviews Are Different</h2>

      <p style={p}>
        Interviews produce a different quality of thinking than writing.
      </p>

      <p style={p}>
        When you write, you start from a blank page — which means going from
        zero to structure. Most people default to the easiest articulation of an
        idea, which is often generic.
      </p>

      <p style={p}>
        When you speak — especially in response to sharp questions — you&apos;re
        forced to articulate things you&apos;ve never written down. The example you
        give to explain a concept. The caveat you add when you realize
        you&apos;re being imprecise. The moment when the question surfaces a
        connection you hadn&apos;t made consciously.
      </p>

      <p style={p}>
        That material is significantly more specific and more original than what
        most people produce when they sit down to write content.
      </p>

      <p style={p}>
        The challenge is that it&apos;s embedded in hours of conversation, interspersed
        with digressions, filler, and context that doesn&apos;t transfer to written
        format.
      </p>

      <h2 style={h2}>The Extraction Framework</h2>

      <p style={{ ...p, marginBottom: "0.75rem" }}>
        An interview transcript typically contains these content-relevant elements:
      </p>

      <ol style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem", listStyleType: "decimal" }}>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Core claims</strong> — the assertions you made about how things work, why something is happening, or what should be done differently.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Evidence points</strong> — specific examples, data points, or observations you used to support claims.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Objections and responses</strong> — moments where you pushed back on a premise or handled a counterargument.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Frameworks</strong> — any system or model you described for thinking about a problem.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Stories</strong> — anecdotes with enough specificity to illustrate a broader point.
        </li>
      </ol>

      <p style={p}>
        A single hour-long interview typically surfaces 4–8 core claims, 6–12
        evidence points, 2–4 frameworks, and 3–6 stories. That&apos;s enough
        material for 30+ pieces of content if distributed correctly.
      </p>

      <h2 style={h2}>The Distribution Matrix</h2>

      <p style={{ ...p, marginBottom: "0.75rem" }}>
        Each type of raw material maps differently to content formats:
      </p>

      {/* Simple table without @tailwindcss/typography */}
      <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "15px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 16px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontSize: "13px",
                  letterSpacing: "0.02em",
                }}
              >
                Source material
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 16px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  fontWeight: 600,
                  color: "#0F172A",
                  fontSize: "13px",
                  letterSpacing: "0.02em",
                }}
              >
                Formats it supports
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Core claim", "LinkedIn hook, newsletter thesis, Twitter thread"],
              ["Evidence point", "Case example, supporting detail, proof point"],
              ["Framework", "Visual explainer, LinkedIn carousel, doc section"],
              ["Story", "Long-form post, newsletter section, talk example"],
              ["Objection + response", "Contrarian take, FAQ entry, thread reply"],
            ].map(([source, formats], i) => (
              <tr
                key={source}
                style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#FAFAFA" }}
              >
                <td
                  style={{
                    padding: "10px 16px",
                    border: "1px solid #E2E8F0",
                    color: "#374151",
                    fontWeight: 500,
                  }}
                >
                  {source}
                </td>
                <td
                  style={{
                    padding: "10px 16px",
                    border: "1px solid #E2E8F0",
                    color: "#64748B",
                  }}
                >
                  {formats}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={p}>
        The goal isn&apos;t to repost the same thing in five places. It&apos;s to find the
        format where each piece of thinking lands best. A core claim works as a
        LinkedIn hook because it&apos;s compressed and provokes a reaction. That same
        claim, expanded with evidence and a framework, becomes a newsletter
        section. The story that supports it becomes a standalone post.
      </p>

      <h2 style={h2}>The Practical Workflow</h2>

      <ol style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem", listStyleType: "decimal" }}>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Start with the transcript</strong> — either a literal transcript or structured notes from the conversation.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Run an extraction pass</strong> — identify which category each passage belongs to: claim, evidence, framework, story, or objection.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Build the distribution plan</strong> — for each core claim, decide which two formats it&apos;ll appear in.
        </li>
        <li style={li}>
          <strong style={{ color: "#0F172A", fontWeight: 600 }}>Draft the formats</strong> — start with the most constrained format (LinkedIn hook, tweet) and expand from there.
        </li>
      </ol>

      <p style={p}>
        The reason to start with the most constrained format is that it forces
        you to reduce the idea to its clearest articulation. A good 20-word
        LinkedIn hook contains everything essential. The longer formats are just
        that same core, expanded with context and evidence.
      </p>

      <h2 style={h2}>Why This Compounds</h2>

      <p style={p}>
        The compounding effect of this approach isn&apos;t obvious in the first week.
        It becomes obvious after three months, when you have 30 pieces of
        content all drawing from the same intellectual source — reinforcing the
        same core positioning, demonstrating the same way of thinking about
        problems, building a coherent body of thought rather than a scattered
        collection of posts.
      </p>

      <p style={p}>
        Authority isn&apos;t built by posting frequently. It&apos;s built by saying the
        same essential things in many different ways, in many different formats,
        until they start to land. One good interview, extracted correctly, can
        do most of that work.
      </p>

      <p style={{ ...p, marginBottom: 0 }}>
        The{" "}
        <a
          href="https://usekorel.com"
          style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 500 }}
        >
          Korel authority engine
        </a>{" "}
        handles the extraction and structuring step automatically — so you can
        focus on producing the source material and let the system build the
        distribution plan.
      </p>
    </>
  );
}
