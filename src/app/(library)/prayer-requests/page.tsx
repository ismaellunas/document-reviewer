import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/gewci/Button";
import { PrayerRequestForm } from "@/components/prayer/PrayerRequestForm";

export default function PrayerRequestsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <section className="space-y-3 select-none">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">
          Prayer Requests
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gewci-dark font-heading tracking-tight">
          How Can We Pray For You?
        </h1>
        <p className="text-sm sm:text-base text-gewci-dark/65 leading-relaxed">
          We love to pray for anyone who asks. We believe God hears and answers
          prayer, and we would be honoured to pray for you and whatever you are
          facing. All prayer requests are confidential, and we respect your
          privacy.
        </p>
      </section>

      <PrayerRequestForm />

      <div className="pt-2">
        <Link href="/">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to library</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
