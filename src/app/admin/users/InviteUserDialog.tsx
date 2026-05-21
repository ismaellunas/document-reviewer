"use client";

import React from "react";
import { Eye, EyeOff, Shuffle, UserPlus } from "lucide-react";

import { Modal } from "@/components/gewci/Modal";
import { Button } from "@/components/gewci/Button";
import { Input } from "@/components/gewci/Input";
import {
  ROLE_ADMIN,
  ROLE_EDITOR,
  ROLE_REVIEWER,
  ROLE_VIEWER,
  type Role,
} from "@/lib/auth/roles";

interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FieldErrors {
  email?: string;
  display_name?: string;
  password?: string;
  roles?: string;
  general?: string;
}

const ROLE_OPTIONS: Array<{ value: Role; label: string; description: string }> = [
  {
    value: ROLE_ADMIN,
    label: "Admin",
    description: "Full access to user management and all documents",
  },
  {
    value: ROLE_EDITOR,
    label: "Editor",
    description: "Can create and edit any document",
  },
  {
    value: ROLE_REVIEWER,
    label: "Reviewer",
    description: "Can comment on documents",
  },
  {
    value: ROLE_VIEWER,
    label: "Viewer",
    description: "Read-only access",
  },
];

function generateTempPassword(): string {
  // 12 chars, mix of upper / lower / digits / symbols. Random enough for
  // a one-time temp password that the admin will share out-of-band.
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digits + symbols;
  const pick = (set: string) =>
    set.charAt(Math.floor(Math.random() * set.length));
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const remaining = Array.from({ length: 8 }, () => pick(all));
  return [...required, ...remaining]
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function InviteUserDialog({
  isOpen,
  onClose,
  onSuccess,
}: InviteUserDialogProps) {
  const [email, setEmail] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [password, setPassword] = React.useState(generateTempPassword);
  const [roles, setRoles] = React.useState<Role[]>([ROLE_VIEWER]);
  const [showPassword, setShowPassword] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});

  const resetForm = React.useCallback(() => {
    setEmail("");
    setDisplayName("");
    setPassword(generateTempPassword());
    setRoles([ROLE_VIEWER]);
    setErrors({});
    setShowPassword(true);
  }, []);

  // Reset whenever the dialog reopens so a previous invite doesn't bleed in.
  React.useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen, resetForm]);

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const toggleRole = (role: Role) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      next.email = "Enter a valid email";
    if (!displayName.trim()) next.display_name = "Display name is required";
    if (password.length < 8)
      next.password = "Password must be at least 8 characters";
    if (roles.length === 0) next.roles = "Select at least one role";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, general: undefined }));

    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          display_name: displayName.trim(),
          password,
          roles,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error ?? "Failed to invite user");
      }

      onSuccess();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite a new user"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="invite-user-form"
            isLoading={isLoading}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create user</span>
          </Button>
        </>
      }
    >
      <form id="invite-user-form" onSubmit={handleSubmit} className="space-y-5">
        {errors.general && (
          <div className="bg-error/5 border border-error/20 text-error rounded-[--radius-button] p-3 text-xs">
            {errors.general}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="off"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={isLoading}
        />

        <Input
          label="Display Name"
          placeholder="Jane Doe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={errors.display_name}
          disabled={isLoading}
        />

        <div className="flex flex-col space-y-1.5 w-full">
          <label className="text-xs font-semibold text-gewci-dark/80 select-none uppercase tracking-wider">
            Temporary Password
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={`flex h-10 w-full rounded-[--radius-button] border bg-gewci-white pl-3 pr-10 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
                  errors.password
                    ? "border-error focus:ring-error/20 focus:border-error"
                    : "border-gewci-gray/40"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gewci-dark/50 hover:text-gewci-dark transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setPassword(generateTempPassword())}
              disabled={isLoading}
              className="gap-1.5 shrink-0"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>Re-roll</span>
            </Button>
          </div>
          {errors.password ? (
            <p className="text-xs font-medium text-error">{errors.password}</p>
          ) : (
            <p className="text-xs text-gewci-dark/50">
              Copy this password and share it with the user out-of-band
              (Slack DM, Signal, etc). They can change it after first sign-in.
            </p>
          )}
        </div>

        <div className="flex flex-col space-y-2 w-full">
          <span className="text-xs font-semibold text-gewci-dark/80 select-none uppercase tracking-wider">
            Roles
          </span>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((opt) => {
              const checked = roles.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-[--radius-button] border cursor-pointer transition-colors ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-gewci-gray/30 hover:bg-gewci-gray/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRole(opt.value)}
                    disabled={isLoading}
                    className="mt-0.5 h-4 w-4 rounded border-gewci-gray/40 text-primary focus:ring-primary/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gewci-dark">{opt.label}</p>
                    <p className="text-xs text-gewci-dark/60 mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.roles && (
            <p className="text-xs font-medium text-error">{errors.roles}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
