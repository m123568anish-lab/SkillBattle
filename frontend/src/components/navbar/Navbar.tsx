import Logo from "./Logo";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";
import NavButton from "./NavButton";
import NavContainer from "./NavContainer";
import ClerkAuthControls from "./ClerkAuthControls";
import { ThemeToggle } from "@/components/common/ExperienceEnhancements";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-default)] bg-[var(--surface-canvas)]/95 transition-colors">
      <NavContainer>
        <div className="flex h-20 items-center justify-between w-full">
          <Logo />
          
          <DesktopNavbar />

          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            <ClerkAuthControls />
            <NavButton title="Start Battle" />
          </div>

          <MobileNavbar />
        </div>
      </NavContainer>
    </header>
  );
}
