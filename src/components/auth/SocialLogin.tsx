"use client";

import { Button } from "@/components/ui/button";

export default function SocialLogin() {
  return (
    <div className="space-y-3">
      <Button variant="outline" className="w-full">
        Continue with Google
      </Button>

      <Button variant="outline" className="w-full">
        Continue with GitHub
      </Button>
    </div>
  );
}