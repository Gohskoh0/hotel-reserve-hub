import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAdminRooms, upsertRoom, deleteRoom, type RoomType } from "@/lib/rooms.functions";

export const Route = createFileRoute("/admin/rooms")({
  component: AdminRoomsPage,
});

type Draft = Omit<RoomType, "id"> & { id?: string };

const empty: Draft = {
  name: "", description: "", image_url: "", price_per_night: 0,
  capacity: 2, total_inventory: 1, amenities: [], active: true, sort_order: 0,
};

function AdminRoomsPage() {
  const qc = useQueryClient();
  const upsertFn = useServerFn(upsertRoom);
  const deleteFn = useServerFn(deleteRoom);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [amenitiesText, setAmenitiesText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const roomsQ = useQuery({ queryKey: ["admin-rooms"], queryFn: () => listAdminRooms() });

  const saveM = useMutation({
    mutationFn: (d: Draft) => upsertFn({ data: d as any }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-rooms"] });
      qc.invalidateQueries({ queryKey: ["public-rooms"] });
      setDraft(null); setErr(null);
    },
    onError: (e: any) => setErr(e?.message || "Could not save"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-rooms"] });
      qc.invalidateQueries({ queryKey: ["public-rooms"] });
    },
  });

  function startEdit(r?: RoomType) {
    if (r) {
      setDraft({ ...r });
      setAmenitiesText(r.amenities.join(", "));
    } else {
      setDraft({ ...empty });
      setAmenitiesText("");
    }
    setErr(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const amenities = amenitiesText.split(",").map((s) => s.trim()).filter(Boolean);
    saveM.mutate({ ...draft, amenities });
  }

  return (
    <div>
      <header className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="field-label">Inventory</p>
          <h1 className="font-display text-3xl">Rooms</h1>
        </div>
        <button onClick={() => startEdit()} className="btn-primary">+ Add room</button>
      </header>

      {roomsQ.isLoading ? (
        <div className="surface-card p-10 text-center text-muted-foreground">Loading…</div>
      ) : (roomsQ.data?.length ?? 0) === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">
          No rooms yet. Click "Add room" to create your first room type.
        </div>
      ) : (
        <div className="grid gap-4">
          {roomsQ.data!.map((r) => (
            <div key={r.id} className="surface-card p-5 flex flex-wrap items-center gap-4">
              <div className="size-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {r.image_url ? <img src={r.image_url} alt="" className="size-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="font-display text-lg">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.total_inventory} in inventory · sleeps {r.capacity} · sort {r.sort_order}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="font-medium">{Number(r.price_per_night).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">per night</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs ${r.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                {r.active ? "Active" : "Inactive"}
              </span>
              <div className="flex gap-2">
                <button onClick={() => startEdit(r)} className="btn-ghost py-1.5 px-3 text-xs">Edit</button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${r.name}"? Bookings referencing it will keep it as inactive instead.`)) {
                      deleteM.mutate(r.id);
                    }
                  }}
                  className="btn-ghost py-1.5 px-3 text-xs text-destructive">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={() => setDraft(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={onSubmit}
            className="surface-card w-full max-w-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto space-y-5">
            <h2 className="font-display text-2xl">{draft.id ? "Edit room" : "New room"}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="field-label">Name</span>
                <input required value={draft.name} maxLength={120}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field-input" />
              </label>
              <label className="block md:col-span-2">
                <span className="field-label">Description</span>
                <textarea rows={3} value={draft.description} maxLength={2000}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="field-input" />
              </label>
              <label className="block md:col-span-2">
                <span className="field-label">Image URL</span>
                <input value={draft.image_url} maxLength={2000}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                  placeholder="https://…" className="field-input" />
              </label>
              <label className="block">
                <span className="field-label">Price / night</span>
                <input type="number" min={0} step="0.01" required value={draft.price_per_night}
                  onChange={(e) => setDraft({ ...draft, price_per_night: Number(e.target.value) })}
                  className="field-input" />
              </label>
              <label className="block">
                <span className="field-label">Capacity (guests/room)</span>
                <input type="number" min={1} max={20} required value={draft.capacity}
                  onChange={(e) => setDraft({ ...draft, capacity: Number(e.target.value) })}
                  className="field-input" />
              </label>
              <label className="block">
                <span className="field-label">Total inventory</span>
                <input type="number" min={0} required value={draft.total_inventory}
                  onChange={(e) => setDraft({ ...draft, total_inventory: Number(e.target.value) })}
                  className="field-input" />
              </label>
              <label className="block">
                <span className="field-label">Sort order</span>
                <input type="number" min={0} value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                  className="field-input" />
              </label>
              <label className="block md:col-span-2">
                <span className="field-label">Amenities (comma-separated)</span>
                <input value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)}
                  placeholder="Air conditioning, Wi-Fi, Breakfast" className="field-input" />
              </label>
              <label className="flex items-center gap-2 md:col-span-2">
                <input type="checkbox" checked={draft.active}
                  onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                <span className="text-sm">Active (visible to guests)</span>
              </label>
            </div>
            {err && <div className="text-sm text-destructive">{err}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDraft(null)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={saveM.isPending} className="btn-primary">
                {saveM.isPending ? "Saving…" : "Save room"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
