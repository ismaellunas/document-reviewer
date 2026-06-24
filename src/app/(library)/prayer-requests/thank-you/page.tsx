import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/gewci/Button";
import { Card, CardContent } from "@/components/gewci/Card";

export default function PrayerThankYouPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="border border-gewci-gray/20 shadow-xs text-center">
        <CardContent className="p-8 sm:p-12 space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-secondary">
            <Heart className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gewci-dark font-heading">
            We&apos;ll Pray For You
          </h1>
          <p className="text-sm sm:text-base text-gewci-dark/70 leading-relaxed max-w-md mx-auto">
            Thank you for sharing your request. Our team will be praying for you.
            Your submission is confidential and handled with care.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/">
              <Button variant="outline" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to library</span>
              </Button>
            </Link>
            <Link href="/prayer-requests">
              <Button className="gap-1.5">Submit another request</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
