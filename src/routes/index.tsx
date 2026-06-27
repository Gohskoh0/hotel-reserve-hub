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
      { title: "Lakewood Hotel — Port Harcourt" },
      {
        name: "description",
        content:
          "Lakewood Hotel, a 3-star stay on Agip Link Road, Port Harcourt. Browse rooms and reserve online.",
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
              className="size-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/55 to-foreground/85" />
          </div>
          <div className="container-page min-h-[88vh] flex flex-col justify-end pb-24 pt-32 text-background">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-background/85">
              {settings.star_rating > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brass/60 px-3 py-1 text-brass">
                  {"★".repeat(settings.star_rating)}
                  <span className="text-background/80 normal-case tracking-normal">
                    {settings.star_rating}-star hotel
                  </span>
                </span>
              )}
              <span className="text-background/70">Port Harcourt · Rivers State</span>
            </div>
            <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.02] md:text-7xl lg:text-[5.5rem]">
              {settings.name}
            </h1>
            {settings.guest_rating > 0 && (
              <p className="mt-5 max-w-xl text-background/85">
                <span className="font-semibold text-brass">{settings.guest_rating.toFixed(1)}</span>
                <span className="mx-2 text-background/50">/</span>
                <span>5 from {settings.review_count.toLocaleString()} guest reviews</span>
              </p>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/rooms" className="btn-brass">Reserve a room</Link>
              <Link to="/contact" className="btn-ghost border-background/40 !text-background hover:!bg-background/10">
                Visit & contact
              </Link>
            </div>
          </div>
        </section>

        {/* Quick facts strip */}
        <section className="border-y border-border bg-secondary/40">
          <div className="container-page grid gap-px md:grid-cols-4 text-sm">
            <Fact label="Class" value={settings.star_rating > 0 ? `${settings.star_rating}-star hotel` : "—"} />
            <Fact label="Location" value="Rumueme, Port Harcourt" />
            <Fact label="Check-out" value={settings.checkout_time || "—"} />
            <Fact label="Reservations" value={settings.phone || "—"} />
          </div>
        </section>

        {/* Rooms preview */}
        <section className="container-page py-24">
          <div className="flex items-end justify-between gap-6 mb-12">
            <div>
              <p className="field-label">Stay with us</p>
              <h2 className="font-display text-3xl md:text-5xl">Rooms & suites</h2>
            </div>
            <Link to="/rooms" className="text-sm font-medium underline-offset-4 hover:underline">
              View all rooms →
            </Link>
          </div>
          {rooms.length === 0 ? (
            <div className="surface-card p-12 text-center text-muted-foreground">
              Rooms will appear here once published.
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
        <section className="container-page pb-24">
          <div className="surface-card p-8 md:p-12 grid gap-8 md:grid-cols-3 relative overflow-hidden">
            <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />
            <div>
              <div className="field-label">Visit</div>
              <p className="text-foreground whitespace-pre-line leading-relaxed">{settings.address}</p>
              {settings.plus_code && (
                <p className="mt-2 text-xs text-muted-foreground">Plus code · {settings.plus_code}</p>
              )}
            </div>
            <div>
              <div className="field-label">Call</div>
              <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="text-foreground hover:text-brass transition">
                {settings.phone}
              </a>
            </div>
            <div>
              <div className="field-label">Check-out</div>
              <p className="text-foreground">{settings.checkout_time}</p>
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noreferrer noopener"
                  className="mt-3 inline-block text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-foreground">
                  Follow on Facebook →
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-6">
      <div className="field-label">{label}</div>
      <div className="font-display text-lg">{value}</div>
    </div>
  );
}

function RoomCard({ room, currencySymbol }: { room: any; currencySymbol: string }) {
  return (
    <Link
      to="/book/$roomTypeId"
      params={{ roomTypeId: room.id }}
      className="surface-card overflow-hidden group transition hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {room.image_url ? (
          <img
            src={room.image_url}
            alt={room.name}
            loading="lazy"
            className="size-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="size-full grid place-items-center text-muted-foreground text-sm">
            No photo
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-xl">{room.name}</h3>
          <span className="text-sm">
            <span className="font-semibold">{currencySymbol}{Number(room.price_per_night).toLocaleString()}</span>
            <span className="text-muted-foreground"> / night</span>
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{room.description || ""}</p>
        <div className="mt-4 text-xs text-muted-foreground">Sleeps {room.capacity}</div>
      </div>
    </Link>
  );
}
