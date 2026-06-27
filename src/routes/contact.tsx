import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getPublicSettings } from "@/lib/settings.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});

export const Route = createFileRoute("/contact")({
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  head: () => ({
    meta: [
      { title: "Contact — Lakewood Hotel" },
      { name: "description", content: "Contact Lakewood Hotel in Port Harcourt — address, phone and Facebook." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: s } = useSuspenseQuery(settingsQuery);
  const mapsQuery = encodeURIComponent(`${s.name} ${s.address}`);
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader hotelName={s.name} />
      <main className="flex-1 container-page py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="field-label">Get in touch</p>
          <h1 className="font-display text-4xl md:text-6xl">Contact us</h1>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr,1fr]">
          <div className="grid gap-6 sm:grid-cols-2">
            <InfoCard title="Address">
              <p className="whitespace-pre-line leading-relaxed">{s.address}</p>
              {s.plus_code && (
                <p className="mt-2 text-xs text-muted-foreground">Plus code · {s.plus_code}</p>
              )}
            </InfoCard>
            <InfoCard title="Phone">
              {s.phone ? (
                <a href={`tel:${s.phone.replace(/\s+/g, "")}`} className="hover:text-brass transition">{s.phone}</a>
              ) : "—"}
            </InfoCard>
            <InfoCard title="Check-out">
              <p>{s.checkout_time || "—"}</p>
            </InfoCard>
            <InfoCard title="Facebook">
              {s.facebook_url ? (
                <a href={s.facebook_url} target="_blank" rel="noreferrer noopener" className="underline-offset-4 hover:underline">
                  {s.facebook_url.replace(/^https?:\/\//, "")}
                </a>
              ) : "—"}
            </InfoCard>
          </div>
          <div className="surface-card overflow-hidden min-h-[320px]">
            <iframe
              title="Map to Lakewood Hotel"
              src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
              className="w-full h-full min-h-[320px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </main>
      <SiteFooter settings={s} />
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-6">
      <div className="field-label">{title}</div>
      <div className="text-base">{children}</div>
    </div>
  );
}
