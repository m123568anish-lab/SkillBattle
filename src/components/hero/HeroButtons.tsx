"use client";

import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroButtons() {
  return (
    <div className="mt-10 flex flex-wrap gap-4">
      <Button
        size="lg"
        className="bg-violet-600 hover:bg-violet-700"
      >
        Start Battle

        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      <Button
        size="lg"
        variant="outline"
      >
        <Play className="mr-2 h-4 w-4" />

        Watch Demo
      </Button>
    </div>
  );
}