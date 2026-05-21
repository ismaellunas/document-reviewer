import React from "react";
import { FileText, ClipboardList, CheckCircle, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/gewci/Card";

interface DashboardStatsProps {
  stats: {
    totalDocs: number;
    inReviewDocs: number;
    approvedDocs: number;
    totalComments: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      title: "Total Documents",
      value: stats.totalDocs,
      icon: FileText,
      colorClass: "bg-primary/5 text-primary border-primary/10",
    },
    {
      title: "Under Review",
      value: stats.inReviewDocs,
      icon: ClipboardList,
      colorClass: "bg-info/5 text-info border-info/10",
    },
    {
      title: "Approved Policies",
      value: stats.approvedDocs,
      icon: CheckCircle,
      colorClass: "bg-success/5 text-success border-success/10",
    },
    {
      title: "Active Comments",
      value: stats.totalComments,
      icon: MessageSquare,
      colorClass: "bg-secondary/5 text-gewci-dark border-secondary/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className="border border-gewci-gray/20">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gewci-dark/50 uppercase tracking-wider">
                  {card.title}
                </span>
                <span className="text-2xl font-extrabold text-gewci-dark font-heading leading-tight">
                  {card.value}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${card.colorClass} flex items-center justify-center`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
