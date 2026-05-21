"use client";

import React from "react";
import { Check, Pencil, ShieldCheck, Trash2, X } from "lucide-react";

import { Avatar } from "@/components/gewci/Avatar";
import { Button } from "@/components/gewci/Button";
import { Modal } from "@/components/gewci/Modal";
import {
  ROLE_ADMIN,
  ROLE_EDITOR,
  ROLE_REVIEWER,
  ROLE_VIEWER,
  type Role,
} from "@/lib/auth/roles";
import { formatDate } from "@/lib/utils";
import type { AdminUserView } from "@/lib/types";

interface UserRowProps {
  user: AdminUserView;
  /** True when this row represents the currently signed-in admin. */
  isSelf: boolean;
  onMutated: () => void;
}

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: ROLE_ADMIN, label: "Admin" },
  { value: ROLE_EDITOR, label: "Editor" },
  { value: ROLE_REVIEWER, label: "Reviewer" },
  { value: ROLE_VIEWER, label: "Viewer" },
];

function rolePillClass(role: string): string {
  switch (role) {
    case ROLE_ADMIN:
      return "bg-primary/10 text-primary";
    case ROLE_EDITOR:
      return "bg-secondary/15 text-gewci-dark";
    case ROLE_REVIEWER:
      return "bg-success/10 text-success";
    case ROLE_VIEWER:
    default:
      return "bg-gewci-gray/15 text-gewci-dark/70";
  }
}

function shortRoleLabel(role: string): string {
  return role.split(":")[1] ?? role;
}

export function UserRow({ user, isSelf, onMutated }: UserRowProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftName, setDraftName] = React.useState(user.display_name ?? "");
  const [draftRoles, setDraftRoles] = React.useState<Role[]>(
    user.roles.filter((r): r is Role =>
      ROLE_OPTIONS.some((o) => o.value === r),
    ),
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const beginEdit = () => {
    setDraftName(user.display_name ?? "");
    setDraftRoles(
      user.roles.filter((r): r is Role =>
        ROLE_OPTIONS.some((o) => o.value === r),
      ),
    );
    setError(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (isSaving) return;
    setIsEditing(false);
  };

  const toggleRole = (role: Role) => {
    setDraftRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const saveEdit = async () => {
    if (draftRoles.length === 0) {
      setError("Select at least one role");
      return;
    }
    if (!draftName.trim()) {
      setError("Display name is required");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: draftName.trim(),
          roles: draftRoles,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Failed to update user");
      }
      setIsEditing(false);
      onMutated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const performDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Failed to delete user");
      }
      setConfirmDelete(false);
      onMutated();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const lastSignIn = user.last_sign_in_at
    ? formatDate(user.last_sign_in_at)
    : "Never";
  const isConfirmed = !!user.email_confirmed_at;

  return (
    <li className="px-5 py-4 hover:bg-gewci-gray/5 transition-colors">
      {isEditing ? (
        // ----- Edit mode -----
        <div className="space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={user.avatar_url}
              name={draftName}
              email={user.email}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                disabled={isSaving}
                className="w-full text-sm font-bold text-gewci-dark bg-gewci-white border border-gewci-gray/40 rounded-[--radius-button] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-gewci-dark/60 mt-1 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ROLE_OPTIONS.map((opt) => {
              const checked = draftRoles.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleRole(opt.value)}
                  disabled={isSaving}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                    checked
                      ? `${rolePillClass(opt.value)} border-current`
                      : "border-gewci-gray/30 text-gewci-dark/60 hover:bg-gewci-gray/10"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-xs font-medium text-error">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelEdit}
              disabled={isSaving}
              className="gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveEdit}
              isLoading={isSaving}
              className="gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save</span>
            </Button>
          </div>
        </div>
      ) : (
        // ----- Read mode -----
        <div className="md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] md:gap-4 md:items-center flex flex-col gap-3">
          {/* Name + email */}
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={user.avatar_url}
              name={user.display_name ?? user.email}
              email={user.email}
              size="md"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-gewci-dark truncate flex items-center gap-1.5">
                {user.display_name ?? user.email.split("@")[0]}
                {isSelf && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                    You
                  </span>
                )}
              </p>
              <p className="text-xs text-gewci-dark/60 truncate font-mono">
                {user.email}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 text-xs">
            {isConfirmed ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                <span className="text-gewci-dark/70 font-semibold">Active</span>
              </>
            ) : (
              <span className="text-warning font-semibold">Unconfirmed</span>
            )}
          </div>

          {/* Roles */}
          <div className="flex flex-wrap gap-1">
            {user.roles.length === 0 ? (
              <span className="text-xs text-gewci-dark/40 italic">No roles</span>
            ) : (
              user.roles.map((role) => (
                <span
                  key={role}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${rolePillClass(role)}`}
                >
                  {shortRoleLabel(role)}
                </span>
              ))
            )}
          </div>

          {/* Last sign-in */}
          <div className="text-xs text-gewci-dark/60 font-medium">
            {lastSignIn}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 justify-self-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={beginEdit}
              className="gap-1"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeleteError(null);
                setConfirmDelete(true);
              }}
              disabled={isSelf}
              title={
                isSelf ? "You cannot delete your own account" : "Remove user"
              }
              className="gap-1 text-error hover:bg-error/5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={confirmDelete}
        onClose={() => !isDeleting && setConfirmDelete(false)}
        title="Remove user?"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={performDelete}
              isLoading={isDeleting}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>Remove user</span>
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>
            Permanently remove{" "}
            <span className="font-bold text-gewci-dark">
              {user.display_name ?? user.email}
            </span>{" "}
            from the system?
          </p>
          <p className="text-xs text-gewci-dark/60">
            Their auth account will be deleted. Documents and comments they
            authored remain in the system; their name will continue to appear
            on those records.
          </p>
          {deleteError && (
            <div className="bg-error/5 border border-error/20 text-error rounded-[--radius-button] p-3 text-xs">
              {deleteError}
            </div>
          )}
        </div>
      </Modal>
    </li>
  );
}
