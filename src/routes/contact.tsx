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
      { name: "description", content: "Get in touch with Lakewood Hotel — address, phone, and email." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader hotelName={settings.name} />
      <main className="flex-1 container-page py-16 md:py-24 max-w-3xl">
        <p className="field-label">Get in touch</p>
        <h1 className="font-display text-4xl md:text-5xl">Contact us</h1>
        <p className="mt-4 text-muted-foreground">
          We're happy to help with reservations, group stays, or any questions about Lakewood Hotel.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <InfoCard title="Visit">
            <p className="whitespace-pre-line">{settings.address || "Address coming soon"}</p>
          </InfoCard>
          <InfoCard title="Call">
            <p>{settings.phone || "—"}</p>
          </InfoCard>
          <InfoCard title="Email">
            <p>{settings.email || "—"}</p>
          </InfoCard>
        </div>
      </main>
      <SiteFooter settings={settings} />
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
