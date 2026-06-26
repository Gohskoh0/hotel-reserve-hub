import { Link } from "@tanstack/react-router";

export function SiteHeader({ hotelName }: { hotelName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
          <span aria-hidden className="inline-block size-2.5 rounded-full bg-brass" />
          {hotelName || "Lakewood Hotel"}
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
