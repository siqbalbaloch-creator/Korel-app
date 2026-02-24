import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/getUserPlan";
import { PLAN_CONFIGS } from "@/lib/plans";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";
import { AuthorityProfileForm } from "./AuthorityProfileForm";

export default async function SettingsPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;

  const [user, oauthAccounts, planInfo] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, password: true, role: true },
    }),
    prisma.account.findMany({
      where: { userId },
      select: { provider: true },
    }),
    getUserPlan(userId, { role: session.user.role }),
  ]);

  if (!user) redirect("/signin");

  const isOAuth = oauthAccounts.length > 0;
  const hasPassword = !!user.password;
  const oauthProviders = oauthAccounts.map((a) =>
    a.provider.charAt(0).toUpperCase() + a.provider.slice(1),
  );

  const planConfig = PLAN_CONFIGS[planInfo.plan];
  const isAdmin = user.role === "admin";

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[640px] mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your account and preferences.
          </p>
        </div>

        {/* â”€â”€ Account â”€â”€ */}
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Account</h2>
          </div>
          <div className="px-6 py-5 space-y-5">
            {/* Role badge */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#4F46E5]" />
                <span className="text-xs font-semibold text-[#4F46E5]">
                  Admin
                </span>
              </div>
            )}

            {/* Email (read-only) */}
            <div>
              <p className="text-xs font-medium text-neutral-600 mb-1">
                Email address
              </p>
              <p className="text-sm text-neutral-800">{user.email ?? "â€”"}</p>
              {isOAuth && (
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  Managed via {oauthProviders.join(", ")} â€” cannot be changed
                  here.
                </p>
              )}
            </div>

            {/* Name (editable) */}
            <ProfileForm initialName={user.name ?? ""} />
          </div>
        </section>

        {/* â”€â”€ Authentication â”€â”€ */}
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">
              Authentication
            </h2>
          </div>
          <div className="px-6 py-5">
            {isOAuth && !hasPassword ? (
              /* Pure OAuth user */
              <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3">
                <p className="text-sm font-medium text-neutral-700">
                  Signed in via {oauthProviders.join(", ")}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Your account is authenticated through{" "}
                  {oauthProviders.join(" and ")}. Password management is handled
                  by your identity provider.
                </p>
              </div>
            ) : (
              /* Credentials user (may also have OAuth linked) */
              <PasswordForm />
            )}
          </div>
        </section>

        {/* -- Authority Profile -- */}
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">
              Authority Profile
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Persistent context applied to every pack you generate.
            </p>
          </div>
          <AuthorityProfileForm />
        </section>

        {/* -- Plan -- */}
        <section className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">Plan</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {planConfig.name} plan
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {planConfig.monthlyPackLimit === Infinity
                    ? "Unlimited Authority Packs per month"
                    : `${planConfig.monthlyPackLimit} Authority Packs per month`}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  planInfo.plan !== "FREE"
                    ? "bg-[#EEF2FF] text-[#4F46E5]"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {planConfig.name}
              </span>
            </div>

            {/* Usage bar */}
            {planConfig.monthlyPackLimit !== Infinity && (
              <div>
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>This month</span>
                  <span>
                    {planInfo.used} / {planConfig.monthlyPackLimit} Authority Packs
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4F46E5] transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (planInfo.used / planConfig.monthlyPackLimit) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Link
              href="/upgrade"
              className="inline-block rounded-lg border border-[#C7D2FE] bg-[#EEF2FF] px-4 py-2 text-xs font-semibold text-[#4F46E5] hover:bg-[#E0E7FF] transition-colors"
            >
              View Upgrade Plans
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

