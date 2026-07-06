import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function SiteHeader({ hotelName }: { hotelName?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label={hotelName || "Lakewood Hotel"}>
          <img
            src={logo}
            alt={hotelName || "Lakewood Hotel"}
            width={160}
            height={56}
            className="h-10 w-auto object-contain md:h-12"
          />
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link to="/" activeOptions={{ exact: true }} className="text-muted-foreground transition hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Home
          </Link>
          <Link to="/rooms" className="text-muted-foreground transition hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Rooms
          </Link>
          <Link to="/contact" className="text-muted-foreground transition hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Contact
          </Link>
        </nav>
        <Link to="/rooms" className="btn-brass !py-2 !px-4 text-sm">
          Book a stay
        </Link>
      </div>
    </header>
  );
}
