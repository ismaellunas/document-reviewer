import React from "react";

import { getServerContext } from "@/lib/http";
import { usersService } from "@/lib/services/users.service";
import { Breadcrumb } from "@/components/gewci/Breadcrumb";
import { UsersDashboard } from "./UsersDashboard";

export default async function AdminUsersPage() {
  const ctx = await getServerContext();
  // The /admin layout already gates non-admins; the service runs the
  // requireAdmin check again as defense-in-depth.
  const users = await usersService.list(ctx);

  return (
    <div className="space-y-6">
      <div className="space-y-1 select-none">
        <Breadcrumb items={[{ label: "User Management", href: "/admin/users" }]} />
        <h1 className="text-2xl font-extrabold text-gewci-dark font-heading tracking-tight mt-1">
          User Management
        </h1>
        <p className="text-xs text-gewci-dark/50">
          Invite, edit roles, and remove users. New users are auto-confirmed
          and can sign in immediately with the temporary password you set.
        </p>
      </div>

      <UsersDashboard initialUsers={users} currentUserId={ctx.user.id} />
    </div>
  );
}
