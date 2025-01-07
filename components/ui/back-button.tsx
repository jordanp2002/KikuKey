"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 w-fit hover:bg-[#F87171] hover:text-white transition-colors"
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
} 