import {
  Anchor,
  Boxes,
  Truck,
  ArrowDownUp,
  Cog,
  ClipboardList,
  GitBranch,
  Grid3X3,
  Wrench,
  Crown,
} from "lucide-react";
import type { WarehouseRoom } from "@/data/stages";
const icons = {
  dock: Anchor,
  racks: Boxes,
  truck: Truck,
  sort: ArrowDownUp,
  belt: Cog,
  inventory: ClipboardList,
  links: GitBranch,
  array: Grid3X3,
  tools: Wrench,
  master: Crown,
};
export function WarehouseEnvironment({ room }: { room: WarehouseRoom }) {
  const Icon = icons[room.motif];
  return (
    <section
      className={`warehouse-environment room-${room.motif}`}
      style={{ "--room-accent": room.accent } as React.CSSProperties}
      aria-label={`Lingkungan ${room.title}`}
    >
      <div className="room-sign">
        <Icon size={40} />
        <div>
          <span>ZONE {String(room.id).padStart(2, "0")}</span>
          <h2>{room.title}</h2>
          <p>{room.description}</p>
        </div>
      </div>
      <div className="room-scenery" aria-hidden="true">
        {Array.from(
          {
            length:
              room.motif === "master" ? 7 : room.motif === "array" ? 4 : 5,
          },
          (_, i) => (
            <div className="room-fixture" key={i}>
              <span>
                {room.motif === "array"
                  ? `[${i + 1}]`
                  : room.motif === "links"
                    ? `${i + 1} →`
                    : room.motif === "inventory"
                      ? `#00${i + 1}`
                      : "▣"}
              </span>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
