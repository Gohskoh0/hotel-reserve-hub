import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getPublicSettings } from "@/lib/settings.functions";
import { listPublicRooms } from "@/lib/rooms.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});
const roomsQuery = queryOptions({
  queryKey: ["public-rooms"],
  queryFn: () => listPublicRooms(),
});

export const Route = createFileRoute("/rooms")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(roomsQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Rooms & Suites — Lakewood Hotel" },
      { name: "description", content: "Browse rooms and suites at Lakewood Hotel and reserve online." },
    ],
  }),
  component: RoomsPage,
});

function RoomsPage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { data: rooms } = useSuspenseQuery(roomsQuery);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader hotelName={settings.name} />
      <main className="flex-1 container-page py-16 md:py-24">
        <header className="max-w-2xl">
          <p className="field-label">Rooms & suites</p>
          <h1 className="font-display text-4xl md:text-5xl">Find your room</h1>
          <p className="mt-4 text-muted-foreground">
            Every room is thoughtfully appointed for a calm, restful stay. Choose what suits you and reserve in a few clicks.
          </p>
        </header>

        {rooms.length === 0 ? (
          <div className="mt-16 surface-card p-16 text-center text-muted-foreground">
            No rooms have been published yet.
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {rooms.map((r) => (
              <article key={r.id} className="surface-card overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.name} loading="lazy" className="size-full object-cover" />
                  ) : (
                    <div className="size-full grid place-items-center text-muted-foreground text-sm">No photo</div>
                  )}
                </div>
                <div className="p-6 md:p-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="font-display text-2xl">{r.name}</h2>
                    <div className="text-right">
                      <div className="font-semibold">
                        {settings.currency_symbol}{Number(r.price_per_night).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">per night</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{r.description || "—"}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-secondary px-3 py-1">Sleeps {r.capacity}</span>
                    {r.amenities.slice(0, 6).map((a) => (
                      <span key={a} className="rounded-full bg-secondary px-3 py-1">{a}</span>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Link
                      to="/book/$roomTypeId"
                      params={{ roomTypeId: r.id }}
                      className="btn-primary"
                    >
                      Reserve this room
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
