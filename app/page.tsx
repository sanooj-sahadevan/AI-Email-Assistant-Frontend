import { Suspense } from "react";
import Link from "next/link";
import HealthPanel from "./components/health-panel";
import HealthStatus from "./components/health-status";
import { Dashboard } from "./components/dashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header bar with System Health badge */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Inbox Signal Home"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-base font-bold text-white shadow-sm transition-transform group-hover:scale-105">
              I
            </span>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-950">
                Inbox Signal
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Categorization Dashboard
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Suspense fallback={<HealthStatus initialHealth={{ kind: "loading" }} />}>
              <HealthPanel />
            </Suspense>
          </div>
        </div>
      </header>

      {/* Main Responsive Categorization & Filtering Dashboard */}
      <div className="flex-1">
        <Dashboard />
      </div>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Inbox Signal Email Assistant · Read-only Gmail integration with rule-based categorization
      </footer>
    </div>
  );
}
