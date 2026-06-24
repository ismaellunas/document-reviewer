import {
  Calendar,
  FileCheck,
  FileSpreadsheet,
  MonitorPlay,
  Users,
  type LucideIcon,
} from "lucide-react";

export const CHURCH_PRESENTATION_MONITOR_URL =
  "https://church-presentation-monitor.vercel.app/";

export interface MinistryTool {
  name: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
  external: boolean;
}

export const MINISTRY_TOOLS: MinistryTool[] = [
  {
    name: "Document Review Room",
    desc: "Collaborative document review and commenting",
    href: "/document-review",
    icon: FileCheck,
    enabled: true,
    external: false,
  },
  {
    name: "Church Presentation Monitor",
    desc: "Live presentation monitor for services",
    href: CHURCH_PRESENTATION_MONITOR_URL,
    icon: MonitorPlay,
    enabled: true,
    external: true,
  },
  {
    name: "Meeting Minutes Recorder",
    desc: "Meeting transcriptions and notes (Future)",
    href: "#",
    icon: Calendar,
    enabled: false,
    external: false,
  },
  {
    name: "Ministry Roster Manager",
    desc: "Organize volunteers and schedules (Future)",
    href: "#",
    icon: Users,
    enabled: false,
    external: false,
  },
  {
    name: "Financial Policy Manager",
    desc: "Audit logs and financial policy documents (Future)",
    href: "#",
    icon: FileSpreadsheet,
    enabled: false,
    external: false,
  },
];
