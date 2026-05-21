"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Settings,
  Calendar,
  Users,
  FileSpreadsheet,
  Menu,
  X,
  FileCheck,
  MonitorPlay,
  ExternalLink,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { DocumentReviewLogo } from "@/components/drr/DocumentReviewLogo";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  
  const [user, setUser] = React.useState<any>(null);
  const [isToolMenuOpen, setIsToolMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toolMenuRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    }
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Click outside listener to close menus
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolMenuRef.current && !toolMenuRef.current.contains(event.target as Node)) {
        setIsToolMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const currentToolName = "Document Review Room";

  const tools = [
    {
      name: "Document Review Room",
      desc: "Collaborative document review & commenting",
      href: "/document-review",
      icon: FileCheck,
      active: true,
      enabled: true,
      external: false,
    },
    {
      name: "Church Presentation Monitor",
      desc: "Live presentation monitor for services",
      href: "https://church-presentation-monitor.vercel.app/",
      icon: MonitorPlay,
      active: false,
      enabled: true,
      external: true,
    },
    {
      name: "Meeting Minutes Recorder",
      desc: "Meeting transcriptions and notes (Future)",
      href: "#",
      icon: Calendar,
      active: false,
      enabled: false,
      external: false,
    },
    {
      name: "Ministry Roster Manager",
      desc: "Organize volunteers and schedules (Future)",
      href: "#",
      icon: Users,
      active: false,
      enabled: false,
      external: false,
    },
    {
      name: "Financial Policy Manager",
      desc: "Audit logs and financial policy documents (Future)",
      href: "#",
      icon: FileSpreadsheet,
      active: false,
      enabled: false,
      external: false,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-gewci-white border-b border-gewci-gray/20 shadow-sm">
      {/* Top Accent Bar */}
      <div className="h-1.5 w-full bg-primary" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Logo & App Switcher */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link href="/document-review" className="flex items-center gap-2 select-none">
            <span className="font-heading font-black text-xl tracking-tight text-primary flex items-center">
              GEWCI<span className="text-secondary font-medium ml-1">Tools</span>
            </span>
          </Link>

          <span className="h-6 w-px bg-gewci-gray/30 hidden md:block" />

          {/* Tool Switcher (Desktop) */}
          <div className="relative hidden md:block" ref={toolMenuRef}>
            <button
              onClick={() => setIsToolMenuOpen(!isToolMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[--radius-button] hover:bg-gewci-gray/10 text-sm font-semibold text-primary transition-colors cursor-pointer"
            >
              <DocumentReviewLogo className="h-5 w-5" />
              <span>{currentToolName}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isToolMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isToolMenuOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-gewci-white border border-gewci-gray/20 rounded-[--radius-card] shadow-lg py-2 animate-[slide-up_0.2s_ease-out] z-50">
                <div className="px-4 py-2 border-b border-gewci-gray/10">
                  <span className="text-xs font-bold text-gewci-dark/40 uppercase tracking-wider">
                    Ministry Suite Tools
                  </span>
                </div>
                <div className="divide-y divide-gewci-gray/10">
                  {tools.map((t, idx) => {
                    const Icon = t.icon;
                    const className = `flex items-start gap-3 p-3 transition-colors ${
                      t.active
                        ? "bg-primary/5 text-primary"
                        : t.enabled
                        ? "hover:bg-gewci-gray/5 text-gewci-dark"
                        : "opacity-50 cursor-not-allowed text-gewci-dark/60"
                    }`;
                    const body = (
                      <>
                        <Icon
                          className={`h-5 w-5 mt-0.5 ${
                            t.active ? "text-primary" : "text-gewci-gray"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold flex items-center gap-1.5">
                            <span className="truncate">{t.name}</span>
                            {t.external && (
                              <ExternalLink
                                className="h-3 w-3 shrink-0 text-gewci-dark/40"
                                aria-hidden="true"
                              />
                            )}
                          </p>
                          <p className="text-xs text-gewci-dark/60 mt-0.5">
                            {t.desc}
                          </p>
                        </div>
                      </>
                    );

                    if (t.external) {
                      return (
                        <a
                          key={idx}
                          href={t.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsToolMenuOpen(false)}
                          className={className}
                        >
                          {body}
                        </a>
                      );
                    }

                    return (
                      <Link
                        key={idx}
                        href={t.href}
                        onClick={() => setIsToolMenuOpen(false)}
                        className={className}
                        style={{ pointerEvents: t.enabled ? "auto" : "none" }}
                      >
                        {body}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: User Controls */}
        <div className="flex items-center gap-4">
          {/* User Profile Menu (Desktop) */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gewci-gray/10 transition-colors cursor-pointer"
              >
                <Avatar
                  src={user.user_metadata?.avatar_url}
                  name={user.user_metadata?.display_name || user.email}
                  email={user.email}
                  size="sm"
                />
                <div className="hidden sm:flex flex-col items-start text-left leading-none pr-1">
                  <span className="text-xs font-bold text-gewci-dark">
                    {user.user_metadata?.display_name || user.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-gewci-dark/50 mt-0.5 select-none font-semibold uppercase tracking-wider">
                    {user.app_metadata?.roles?.[0] || "Reviewer"}
                  </span>
                </div>
                <ChevronDown className={`h-3 w-3 text-gewci-dark/50 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gewci-white border border-gewci-gray/20 rounded-[--radius-card] shadow-lg py-1.5 animate-[slide-up_0.2s_ease-out] z-50">
                  <div className="px-4 py-2 border-b border-gewci-gray/10">
                    <p className="text-xs font-bold text-gewci-dark truncate">
                      {user.user_metadata?.display_name || "GEWCI User"}
                    </p>
                    <p className="text-[10px] text-gewci-dark/50 truncate mt-0.5 font-mono">
                      {user.email}
                    </p>
                  </div>
                  
                  <Link
                    href="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gewci-dark hover:bg-gewci-gray/5 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gewci-gray" />
                    <span>Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors border-t border-gewci-gray/10 mt-1 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold text-primary hover:text-primary-light transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-[--radius-button] hover:bg-gewci-gray/10 text-primary md:hidden cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gewci-gray/10 bg-gewci-white px-4 pt-2 pb-4 space-y-3 shadow-inner animate-[fade-in_0.15s_ease-out]">
          <div className="py-1">
            <span className="text-[10px] font-bold text-gewci-dark/40 uppercase tracking-wider block mb-2 px-2">
              Ministry Tools
            </span>
            <div className="space-y-1">
              {tools.map((t, idx) => {
                const Icon = t.icon;
                const className = `flex items-center gap-3 p-2 rounded-md transition-colors ${
                  t.active
                    ? "bg-primary/5 text-primary font-bold"
                    : t.enabled
                    ? "hover:bg-gewci-gray/5 text-gewci-dark"
                    : "opacity-40 cursor-not-allowed pointer-events-none text-gewci-dark/60"
                }`;
                const body = (
                  <>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm flex-1 truncate">{t.name}</span>
                    {t.external && (
                      <ExternalLink
                        className="h-3.5 w-3.5 shrink-0 text-gewci-dark/40"
                        aria-hidden="true"
                      />
                    )}
                  </>
                );

                if (t.external) {
                  return (
                    <a
                      key={idx}
                      href={t.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={className}
                    >
                      {body}
                    </a>
                  );
                }

                return (
                  <Link
                    key={idx}
                    href={t.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={className}
                  >
                    {body}
                  </Link>
                );
              })}
            </div>
          </div>

          {user && (
            <div className="border-t border-gewci-gray/10 pt-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 p-2 text-sm text-error rounded.md hover:bg-error/5 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
