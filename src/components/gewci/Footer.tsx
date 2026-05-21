import React from "react";
import Link from "next/link";

import { SiteCredits } from "./SiteCredits";

export function Footer() {
  return (
    <footer className="bg-gewci-dark text-gewci-white/80 border-t border-gewci-gray/10 py-8 px-6 mt-auto select-none">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
            <span className="font-bold text-sm tracking-wider font-heading text-gewci-gold uppercase">
              GEWCI Ministry Tools
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
            <span className="text-gewci-white/40 font-semibold uppercase tracking-wider block w-full text-center md:w-auto md:text-left mb-1 md:mb-0">
              Other Tools:
            </span>
            <Link
              href="/meeting-minutes"
              className="hover:text-gewci-gold transition-colors"
            >
              Meeting Minutes
            </Link>
            <Link
              href="/ministry-roster"
              className="hover:text-gewci-gold transition-colors"
            >
              Ministry Roster
            </Link>
            <Link
              href="/financial-policies"
              className="hover:text-gewci-gold transition-colors"
            >
              Financial Policies
            </Link>
            <Link
              href="/settings"
              className="hover:text-gewci-gold transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>

        <div className="border-t border-gewci-white/10 pt-5">
          <SiteCredits variant="dark" />
        </div>
      </div>
    </footer>
  );
}
