import type { ReactNode } from "react";
import DocsNav from "./docs-nav";

type DocsShellProps = {
  current?: string;
  children: ReactNode;
};

export default function DocsShell({ current, children }: DocsShellProps) {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 pb-16 pt-24">
      <div className="grid gap-10 md:grid-cols-[240px_1fr]">
        <DocsNav current={current} />
        <div className="space-y-10">{children}</div>
      </div>
    </div>
  );
}
