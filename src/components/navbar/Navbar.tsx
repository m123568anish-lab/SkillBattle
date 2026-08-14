import Logo from "./Logo";
import DesktopNavbar from "./DesktopNavbar";
import MobileNavbar from "./MobileNavbar";
import NavButton from "./NavButton";
import NavContainer from "./NavContainer";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#070B14]/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#070B14]/40 transition-all duration-300">
      <div className="absolute inset-x-0 -bottom-[1px] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      <NavContainer>
        <div className="flex h-20 items-center justify-between w-full">
          <Logo />
          
          <DesktopNavbar />

          <div className="hidden lg:flex items-center gap-4">
            <NavButton title="Login" variant="ghost" />
            <div className="h-6 w-[1px] bg-white/10" />
            <NavButton title="Start Battle" />
          </div>

          <MobileNavbar />
        </div>
      </NavContainer>
    </header>
  );
}