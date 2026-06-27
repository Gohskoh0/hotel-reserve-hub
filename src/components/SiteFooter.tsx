import { Link } from "@tanstack/react-router";
import type { PublicSettings } from "@/lib/settings.functions";

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  return (
    <footer className="border-t border-border bg-secondary/60 mt-24">
      <div className="container-page grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="font-display text-2xl font-semibold">{settings.name}</h3>
          {settings.star_rating > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="text-brass">{"★".repeat(settings.star_rating)}</span>
              <span className="ml-2">{settings.star_rating}-star hotel · Port Harcourt</span>
            </p>
          )}
        </div>
        <div className="text-sm">
          <div className="field-label">Visit</div>
          <p className="text-foreground whitespace-pre-line leading-relaxed">{settings.address}</p>
          {settings.plus_code && (
            <p className="mt-2 text-xs text-muted-foreground">Plus code · {settings.plus_code}</p>
          )}
        </div>
        <div className="text-sm space-y-1.5">
          <div className="field-label">Reach us</div>
          {settings.phone && (
            <p><a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="hover:text-brass transition">{settings.phone}</a></p>
          )}
          {settings.checkout_time && (
            <p className="text-muted-foreground">Check-out · {settings.checkout_time}</p>
          )}
          {settings.facebook_url && (
            <p>
              <a href={settings.facebook_url} target="_blank" rel="noreferrer noopener" className="underline-offset-4 hover:underline">
                Facebook
              </a>
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {settings.name}. All rights reserved.</span>
          <Link to="/admin" className="hover:text-foreground transition">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
