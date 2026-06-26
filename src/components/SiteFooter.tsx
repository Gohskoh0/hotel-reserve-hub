import { Link } from "@tanstack/react-router";
import type { PublicSettings } from "@/lib/settings.functions";

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  return (
    <footer className="border-t border-border bg-secondary/60 mt-24">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <h3 className="font-display text-xl font-semibold">{settings.name || "Lakewood Hotel"}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            {settings.tagline || "Lakeside calm. Effortless hospitality."}
          </p>
        </div>
        <div className="text-sm">
          <div className="field-label">Visit</div>
          <p className="text-foreground whitespace-pre-line">{settings.address || "Address coming soon"}</p>
        </div>
        <div className="text-sm">
          <div className="field-label">Reach us</div>
          {settings.phone && <p className="text-foreground">{settings.phone}</p>}
          {settings.email && <p className="text-foreground">{settings.email}</p>}
          {!settings.phone && !settings.email && (
            <p className="text-muted-foreground">Contact info coming soon</p>
          )}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {settings.name || "Lakewood Hotel"}. All rights reserved.</span>
          <Link to="/admin" className="hover:text-foreground transition">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
