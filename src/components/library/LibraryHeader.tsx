"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ChevronDown,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import { Avatar } from "@/components/gewci/Avatar";
import { Button } from "@/components/gewci/Button";
import { ToolsMenu } from "@/components/gewci/ToolsMenu";
import { MINISTRY_TOOLS, resolveMinistryTools } from "@/lib/config/tools";
import { useSupabaseBrowser } from "@/hooks/useSupabaseBrowser";

interface ViewerCapabilities {
  isAdmin: boolean;
  canCreateDocuments: boolean;
}

export function LibraryHeader() {
  const router = useRouter();
  const getSupabase = useSupabaseBrowser();

  const [user, setUser] = React.useState<User | null>(null);
  const [capabilities, setCapabilities] = React.useState<ViewerCapabilities>({
    isAdmin: false,
    canCreateDocuments: false,
  });
  const [isToolsOpen, setIsToolsOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toolsMenuRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const supabase = getSupabase();

    async function getUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
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
      if (
        toolsMenuRef.current &&
        !toolsMenuRef.current.contains(event.target as Node)
      ) {
        setIsToolsOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await getSupabase().auth.signOut();
    router.refresh();
  };

  const closeMenus = () => {
    setIsToolsOpen(false);
    setIsMobileMenuOpen(false);
  };

  const tools = React.useMemo(
    () => resolveMinistryTools({ isAdmin: capabilities.isAdmin }),
    [capabilities.isAdmin],
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-gewci-white border-b border-gewci-gray/20 shadow-sm">
      <div className="h-1.5 w-full bg-primary" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2 select-none shrink-0">
            <span className="font-heading font-black text-xl tracking-tight text-primary flex items-center">
              GEWCI<span className="text-secondary font-medium ml-1">Tools</span>
            </span>
          </Link>

          <span className="h-6 w-px bg-gewci-gray/30 hidden md:block" />

          <div className="hidden md:block relative" ref={toolsMenuRef}>
            <button
              type="button"
              onClick={() => setIsToolsOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[--radius-button] hover:bg-gewci-gray/10 text-sm font-semibold text-primary transition-colors cursor-pointer"
            >
              <Wrench className="h-4 w-4" />
              <span>Tools</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isToolsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isToolsOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-gewci-white border border-gewci-gray/20 rounded-[--radius-card] shadow-lg animate-[slide-up_0.2s_ease-out] z-50">
                <ToolsMenu
                  tools={tools}
                  onNavigate={closeMenus}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/document-review" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  Review Room
                </Button>
              </Link>

              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                  className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gewci-gray/10 transition-colors cursor-pointer"
                >
                  <Avatar
                    src={user.user_metadata?.avatar_url}
                    name={user.user_metadata?.display_name || user.email}
                    email={user.email}
                    size="sm"
                  />
                  <ChevronDown
                    className={`h-3 w-3 text-gewci-dark/50 transition-transform duration-200 hidden sm:block ${isUserMenuOpen ? "rotate-180" : ""}`}
                  />
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
                      href="/document-review"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gewci-dark hover:bg-gewci-gray/5 transition-colors"
                    >
                      <span>Document Review Room</span>
                    </Link>

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
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gewci-dark hover:bg-gewci-gray/5 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gewci-gray" />
                      <span>Settings</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        void handleLogout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors border-t border-gewci-gray/10 mt-1 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/login?redirectTo=/document-review">
              <Button size="sm" className="gap-1.5">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="p-2 rounded-[--radius-button] hover:bg-gewci-gray/10 text-primary md:hidden cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gewci-gray/10 bg-gewci-white px-4 pt-2 pb-4 space-y-3 shadow-inner animate-[fade-in_0.15s_ease-out]">
          <div className="py-1">
            <span className="text-[10px] font-bold text-gewci-dark/40 uppercase tracking-wider block mb-2 px-2">
              Tools
            </span>
            <ToolsMenu
              tools={tools}
              variant="list"
              onNavigate={closeMenus}
            />
          </div>

          {!user && (
            <Link
              href="/login?redirectTo=/document-review"
              onClick={closeMenus}
              className="flex items-center justify-center"
            >
              <Button className="w-full gap-1.5">
                <LogIn className="h-4 w-4" />
                <span>Login to Review Room</span>
              </Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
