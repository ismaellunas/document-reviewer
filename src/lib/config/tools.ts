import {
  Calendar,
  FileCheck,
  FileSpreadsheet,
  Heart,
  MonitorPlay,
  Users,
  type LucideIcon,
} from "lucide-react";

export const CHURCH_PRESENTATION_MONITOR_URL =
  "https://church-presentation-monitor.vercel.app/";

export interface MinistryTool {
  id: string;
  name: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
  external: boolean;
}

export const PRAYER_REQUESTS_TOOL_ID = "prayer-requests";

export const MINISTRY_TOOLS: MinistryTool[] = [
  {
    id: "document-review",
    name: "Document Review Room",
    desc: "Collaborative document review and commenting",
    href: "/document-review",
    icon: FileCheck,
    enabled: true,
    external: false,
  },
  {
    id: "church-presentation-monitor",
    name: "Church Presentation Monitor",
    desc: "Live presentation monitor for services",
    href: CHURCH_PRESENTATION_MONITOR_URL,
    icon: MonitorPlay,
    enabled: true,
    external: true,
  },
  {
    id: PRAYER_REQUESTS_TOOL_ID,
    name: "Prayer Requests",
    desc: "Submit a confidential prayer request",
    href: "/prayer-requests",
    icon: Heart,
    enabled: true,
    external: false,
  },
  {
    id: "meeting-minutes",
    name: "Meeting Minutes Recorder",
    desc: "Meeting transcriptions and notes (Future)",
    href: "#",
    icon: Calendar,
    enabled: false,
    external: false,
  },
  {
    id: "ministry-roster",
    name: "Ministry Roster Manager",
    desc: "Organize volunteers and schedules (Future)",
    href: "#",
    icon: Users,
    enabled: false,
    external: false,
  },
  {
    id: "financial-policy",
    name: "Financial Policy Manager",
    desc: "Audit logs and financial policy documents (Future)",
    href: "#",
    icon: FileSpreadsheet,
    enabled: false,
    external: false,
  },
];

/** Swap prayer-requests for the admin inbox when the viewer is an admin. */
export function resolveMinistryTools(options: { isAdmin?: boolean } = {}): MinistryTool[] {
  return MINISTRY_TOOLS.map((tool) => {
    if (tool.id === PRAYER_REQUESTS_TOOL_ID && options.isAdmin) {
      return {
        ...tool,
        name: "Manage Prayer Requests",
        desc: "Review submissions, mark prayed, and print lists",
        href: "/admin/prayer-requests",
      };
    }
    return tool;
  });
}
