"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, UserPlus, Users as UsersIcon } from "lucide-react";

import { Button } from "@/components/gewci/Button";
import { Input } from "@/components/gewci/Input";
import { EmptyState } from "@/components/gewci/EmptyState";
import { InviteUserDialog } from "./InviteUserDialog";
import { UserRow } from "./UserRow";
import type { AdminUserView } from "@/lib/types";

interface UsersDashboardProps {
  initialUsers: AdminUserView[];
  currentUserId: string;
}

export function UsersDashboard({
  initialUsers,
  currentUserId,
}: UsersDashboardProps) {
  const router = useRouter();
  const [users, setUsers] = React.useState<AdminUserView[]>(initialUsers);
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  // Keep state in sync if the server re-renders with new data after
  // mutations (router.refresh()) -- the new initial list takes over.
  React.useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const filteredUsers = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.email.toLowerCase().includes(q) ||
        (u.display_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const handleMutation = () => {
    // After invite / update / delete, refetch from the server to get the
    // canonical list (including auth-side fields like last_sign_in_at
    // that aren't trivially merge-able from the API responses).
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gewci-white p-4 rounded-[--radius-card] border border-gewci-gray/20 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gewci-gray" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 w-full"
          />
        </div>

        <Button
          onClick={() => setIsInviteOpen(true)}
          className="h-10 gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite User</span>
        </Button>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<UsersIcon className="h-10 w-10 text-gewci-gray/60" />}
            title={search ? "No matching users" : "No users yet"}
            description={
              search
                ? "Try a different search term."
                : "Click the button above to invite the first user."
            }
          />
        </div>
      ) : (
        <div className="bg-gewci-white border border-gewci-gray/20 rounded-[--radius-card] shadow-xs overflow-hidden">
          <div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-2.5 text-[10px] font-bold text-gewci-dark/50 uppercase tracking-wider bg-gewci-gray/5 border-b border-gewci-gray/10 select-none">
            <span>Name</span>
            <span>Status</span>
            <span>Roles</span>
            <span>Last Sign-in</span>
            <span className="justify-self-end pr-2">Actions</span>
          </div>

          <ul className="divide-y divide-gewci-gray/10">
            {filteredUsers.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUserId}
                onMutated={handleMutation}
              />
            ))}
          </ul>
        </div>
      )}

      <InviteUserDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={() => {
          setIsInviteOpen(false);
          handleMutation();
        }}
      />
    </div>
  );
}
