"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Heart, Send } from "lucide-react";
import { Input } from "@/components/gewci/Input";
import { Textarea } from "@/components/gewci/Textarea";
import { Button } from "@/components/gewci/Button";
import { Card, CardContent } from "@/components/gewci/Card";

function clientTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function PrayerRequestForm() {
  const router = useRouter();

  const [isAnonymous, setIsAnonymous] = React.useState(false);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [body, setBody] = React.useState("");
  const [wantsPrayWith, setWantsPrayWith] = React.useState(false);
  const [contactViaEmail, setContactViaEmail] = React.useState(false);
  const [honeypot, setHoneypot] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    first_name?: string;
    body?: string;
    email?: string;
    form?: string;
  }>({});

  const handleAnonymousChange = (checked: boolean) => {
    setIsAnonymous(checked);
    if (checked) {
      setFirstName("");
      setLastName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/public/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_anonymous: isAnonymous,
          first_name: isAnonymous ? undefined : firstName,
          last_name: isAnonymous ? undefined : lastName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          body,
          wants_pray_with: wantsPrayWith,
          contact_via_email: contactViaEmail,
          timezone: clientTimezone(),
          website: honeypot,
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? ((await res.json()) as { prayerRequest?: { id: string }; error?: string })
        : null;

      if (!res.ok || !payload?.prayerRequest?.id) {
        throw new Error(payload?.error ?? "Unable to submit your request");
      }

      router.push("/prayer-requests/thank-you");
    } catch (err) {
      setErrors({
        form:
          err instanceof Error ? err.message : "Unable to submit your request",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <Card className="border border-gewci-gray/20 shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-5">
          <label className="flex items-start gap-3 cursor-pointer select-none rounded-[--radius-button] border border-gewci-gray/20 bg-gewci-gray/5 px-4 py-3">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => handleAnonymousChange(e.target.checked)}
              disabled={isLoading}
              className="mt-1 h-4 w-4 rounded border-gewci-gray/50 text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-gewci-dark/80">
              <span className="font-semibold text-gewci-dark block">
                Submit anonymously
              </span>
              We will assign you a private label such as &ldquo;Prayer Friend
              K7M2&rdquo; so our team can refer to your request without using
              your name.
            </span>
          </label>

          {!isAnonymous && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="First Name *"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.first_name}
                disabled={isLoading}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={isLoading}
            />
            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Textarea
            label="Prayer Request *"
            placeholder="Share what you would like us to pray for..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            error={errors.body}
            rows={6}
            disabled={isLoading}
            required
          />

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={wantsPrayWith}
                onChange={(e) => setWantsPrayWith(e.target.checked)}
                disabled={isLoading}
                className="mt-1 h-4 w-4 rounded border-gewci-gray/50 text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-gewci-dark/80">
                I would love someone to pray with me about this
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={contactViaEmail}
                onChange={(e) => setContactViaEmail(e.target.checked)}
                disabled={isLoading}
                className="mt-1 h-4 w-4 rounded border-gewci-gray/50 text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-gewci-dark/80">
                Please contact me via email
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {errors.form && (
        <p className="text-sm font-medium text-error">{errors.form}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading} className="gap-2">
          <Send className="h-4 w-4" />
          <span>Submit Prayer Request</span>
        </Button>
      </div>

      <div className="space-y-2 text-xs text-gewci-dark/50">
        <p className="flex items-start gap-1.5">
          <Heart className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
          All prayer requests are confidential and we respect your privacy.
        </p>
        <p>
          To help prevent misuse, we record limited technical details when you
          submit (such as IP address, browser, and timezone). This information
          is only visible to authorised administrators.
        </p>
      </div>
    </form>
  );
}
