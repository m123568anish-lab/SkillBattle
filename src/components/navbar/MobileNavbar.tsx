"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileNavbar() {
  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
      >
        <Menu className="h-6 w-6" />
      </Button>
    </div>
  );
}