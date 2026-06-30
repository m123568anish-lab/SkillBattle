import Logo from "./Logo";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";
import NavButton from "./NavButton";
import NavContainer from "./NavContainer";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070B14]/70 backdrop-blur-xl">
      <NavContainer>

        <Logo />

        <DesktopNavbar />

        <div className="hidden lg:flex items-center gap-3">
          <NavButton
            title="Login"
            variant="ghost"
          />

          <NavButton
            title="Start Battle"
          />
        </div>

        <MobileNavbar />

      </NavContainer>
    </header>
  );
}