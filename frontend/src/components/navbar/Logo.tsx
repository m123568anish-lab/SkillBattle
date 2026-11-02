import Link from "next/link";
import QubiraLogo from "@/components/brand/QubiraLogo";

export default function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 transition-opacity hover:opacity-90">
      <QubiraLogo variant="full" size="md" />
    </Link>
  );
}
