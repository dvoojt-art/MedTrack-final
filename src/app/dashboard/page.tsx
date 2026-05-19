
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect simple admin directly to logs
    router.replace("/dashboard/records");
  }, [router]);

  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
