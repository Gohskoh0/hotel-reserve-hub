import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getPublicSettings } from "@/lib/settings.functions";
import { listPublicRooms } from "@/lib/rooms.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import heroFallback from "@/assets/hero-lake.jpg";

const settingsQuery = queryOptions({
  queryKey: ["public-settings"],
  queryFn: () => getPublicSettings(),
});
const roomsQuery = queryOptions({
  queryKey: ["public-rooms"],
  queryFn: () => listPublicRooms(),
});

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(roomsQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Lakewood Hotel — Reserve your lakeside stay" },
      {
        name: "description",
        content:
          "Lakewood Hotel — a quiet lakeside retreat. Browse rooms and book your stay online in minutes.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { data: rooms } = useSuspenseQuery(roomsQuery);
  const heroImage = settings.hero_image_url || heroFallback;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader hotelName={settings.name} />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img
              src={heroImage}
              alt=""
              width={1920}
              height={1024}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/40 to-foreground/70" />
          </div>
          <div className="container-page min-h-[78vh] flex flex-col justify-end pb-20 pt-32 text-background">
            <p className="text-sm uppercase tracking-[0.22em] text-background/80">
              {settings.tagline || "Lakeside calm. Effortless hospitality."}
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.05] md:text-7xl">
              {settings.name || "Lakewood Hotel"}
            </h1>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/rooms" className="btn-brass">Book a room</Link>
              <Link to="/contact" className="btn-ghost border-background/40 !text-background hover:!bg-background/10">
                Get in touch
              </Link>
            </div>
          </div>
        </section>

        {/* About */}
        {settings.about && (
          <section className="container-page py-20">
            <div className="grid gap-10 md:grid-cols-[1fr,2fr] items-start">
              <h2 className="font-display text-3xl md:text-4xl">A place to slow down</h2>
              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                {settings.about}
              </p>
            </div>
          </section>
        )}

        {/* Rooms preview */}
        <section className="container-page py-20">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <p className="field-label">Stay with us</p>
              <h2 className="font-display text-3xl md:text-4xl">Rooms & suites</h2>
            </div>
            <Link to="/rooms" className="text-sm font-medium underline-offset-4 hover:underline">
              View all rooms →
            </Link>
          </div>
          {rooms.length === 0 ? (
            <div className="surface-card p-10 text-center text-muted-foreground">
              No rooms have been published yet. Check back soon.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.slice(0, 3).map((r) => (
                <RoomCard
                  key={r.id}
                  room={r}
                  currencySymbol={settings.currency_symbol}
                />
              ))}
            </div>
          )}
        </section>

        {/* Contact strip */}
        <section className="container-page pb-16">
          <div className="surface-card p-8 md:p-10 grid gap-6 md:grid-cols-3">
            <div>
              <div className="field-label">Visit</div>
              <p className="whitespace-pre-line">{settings.address || "Address coming soon"}</p>
            </div>
            <div>
              <div className="field-label">Call</div>
              <p>{settings.phone || "—"}</p>
            </div>
            <div>
              <div className="field-label">Email</div>
              <p>{settings.email || "—"}</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}

function RoomCard({ room, currencySymbol }: { room: any; currencySymbol: string }) {
  return (
    <Link
      to="/book/$roomTypeId"
      params={{ roomTypeId: room.id }}
      className="surface-card overflow-hidden group transition hover:shadow-[var(--shadow-lift)]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {room.image_url ? (
          <img
            src={room.image_url}
            alt={room.name}
            loading="lazy"
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="size-full grid place-items-center text-muted-foreground text-sm">
            No photo
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl">{room.name}</h3>
          <span className="text-sm">
            <span className="font-semibold">{currencySymbol}{Number(room.price_per_night).toLocaleString()}</span>
            <span className="text-muted-foreground"> / night</span>
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{room.description || "—"}</p>
        <div className="mt-4 text-xs text-muted-foreground">Sleeps {room.capacity}</div>
      </div>
    </Link>
  );
}
