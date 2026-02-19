import SidebarNavigation from "./SidebarNavigation";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      <aside className="w-[240px] bg-white border-r border-[#E2E8F0] flex flex-col">
        <div className="px-6 py-6">
          <h1 className="text-lg font-semibold">Korel</h1>
        </div>

        <SidebarNavigation />

        <div className="mt-auto px-6 py-6">
          <div className="flex items-center gap-3 text-xs text-[#64748B]">
            <div className="h-8 w-8 rounded-full bg-[#E2E8F0] text-[#64748B] flex items-center justify-center text-xs font-medium">
              U
            </div>
            <div>Free Plan</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex">{children}</main>
    </div>
  );
}
