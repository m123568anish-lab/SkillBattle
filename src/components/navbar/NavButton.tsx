import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  variant?: "default" | "ghost";
}

export default function NavButton({
  title,
  variant = "default",
}: Props) {
  return (
    <Button
      variant={variant}
      className={
        variant === "default"
          ? "bg-violet-600 hover:bg-violet-700"
          : ""
      }
    >
      {title}
    </Button>
  );
}