import type { ReactNode } from "react";
import CaseStudiesNav from "./case-studies-nav";

type CaseStudiesShellProps = {
  current?: string;
  children: ReactNode;
};

export default function CaseStudiesShell({ current, children }: CaseStudiesShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 pb-16 pt-24">
      <div className="grid gap-10 md:grid-cols-[260px_1fr]">
        <CaseStudiesNav current={current} />
        <div className="space-y-10">{children}</div>
      </div>
    </div>
  );
}
