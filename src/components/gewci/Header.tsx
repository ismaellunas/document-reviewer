"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ChevronDown,
  LogOut,
  Settings,
  Menu,
  X,
  FileCheck,
  ShieldCheck,
  Heart,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { DocumentReviewLogo } from "@/components/drr/DocumentReviewLogo";
import { ToolsMenu } from "@/components/gewci/ToolsMenu";
import { resolveMinistryTools } from "@/lib/config/tools";
import { useSupabaseBrowser } from "@/hooks/useSupabaseBrowser";

interface ViewerCapabilities {
  isAdmin: boolean;
  canCreateDocuments: boolean;
}

export function Header() {
  const router = useRouter();
  const getSupabase = useSupabaseBrowser();

  const [user, setUser] = React.useState<User | null>(null);
  const [capabilities, setCapabilities] = React.useState<ViewerCapabilities>({
    isAdmin: false,
    canCreateDocuments: false,
  });
  const [isToolMenuOpen, setIsToolMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toolMenuRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const supabase = getSupabase();

    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [getSupabase]);

  React.useEffect(() => {
    if (!user) {
      setCapabilities({ isAdmin: false, canCreateDocuments: false });
      return;
    }
    let cancelled = false;
    fetch("/api/v1/me/capabilities")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.capabilities) return;
        setCapabilities(data.capabilities as ViewerCapabilities);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

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
    await getSupabase().auth.signOut();
    router.push("/");
  };

  const closeMenus = () => {
    setIsToolMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const tools = React.useMemo(
    () => resolveMinistryTools({ isAdmin: capabilities.isAdmin }),
    [capabilities.isAdmin],
  );

  const currentToolName = "Document Review Room";

  return (
    <header className="sticky top-0 z-40 w-full bg-gewci-white border-b border-gewci-gray/20 shadow-sm">
      <div className="h-1.5 w-full bg-primary" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 select-none">
            <span className="font-heading font-black text-xl tracking-tight text-primary flex items-center">
              GEWCI<span className="text-secondary font-medium ml-1">Tools</span>
            </span>
          </Link>

          <span className="h-6 w-px bg-gewci-gray/30 hidden md:block" />

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
              <div className="absolute left-0 mt-2 w-80 bg-gewci-white border border-gewci-gray/20 rounded-[--radius-card] shadow-lg animate-[slide-up_0.2s_ease-out] z-50">
                <ToolsMenu
                  tools={tools}
                  activeToolName={currentToolName}
                  onNavigate={closeMenus}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
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
                  
                  {capabilities.isAdmin && (
                    <Link
                      href="/admin/users"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gewci-dark hover:bg-gewci-gray/5 transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>User Management</span>
                    </Link>
                  )}

                  {capabilities.isAdmin && (
                    <Link
                      href="/admin/prayer-requests"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gewci-dark hover:bg-gewci-gray/5 transition-colors"
                    >
                      <Heart className="h-4 w-4 text-primary" />
                      <span>Manage Prayer Requests</span>
                    </Link>
                  )}

                  <Link
                    href="/"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gewci-dark hover:bg-gewci-gray/5 transition-colors"
                  >
                    <FileCheck className="h-4 w-4 text-gewci-gray" />
                    <span>Document Library</span>
                  </Link>

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
              href="/login?redirectTo=/document-review"
              className="text-sm font-semibold text-primary hover:text-primary-light transition-colors"
            >
              Sign In
            </Link>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-[--radius-button] hover:bg-gewci-gray/10 text-primary md:hidden cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gewci-gray/10 bg-gewci-white px-4 pt-2 pb-4 space-y-3 shadow-inner animate-[fade-in_0.15s_ease-out]">
          <div className="py-1">
            <span className="text-[10px] font-bold text-gewci-dark/40 uppercase tracking-wider block mb-2 px-2">
              Ministry Tools
            </span>
            <ToolsMenu
              tools={tools}
              activeToolName={currentToolName}
              variant="list"
              onNavigate={closeMenus}
            />
          </div>

          {user && (
            <div className="border-t border-gewci-gray/10 pt-3 space-y-1">
              {capabilities.isAdmin && (
                <Link
                  href="/admin/users"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 text-sm text-gewci-dark rounded-md hover:bg-gewci-gray/5 transition-colors"
                >
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>User Management</span>
                </Link>
              )}
              {capabilities.isAdmin && (
                <Link
                  href="/admin/prayer-requests"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 text-sm text-gewci-dark rounded-md hover:bg-gewci-gray/5 transition-colors"
                >
                  <Heart className="h-4 w-4 text-primary" />
                  <span>Manage Prayer Requests</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 p-2 text-sm text-error rounded-md hover:bg-error/5 transition-colors cursor-pointer"
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
