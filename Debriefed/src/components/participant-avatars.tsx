import { cn } from "@/lib/utils";
import type { Speaker } from "@/lib/types";

/** Overlapping avatar stack colored by each speaker's palette index. */
export function ParticipantAvatars({
  participants,
  max = 4,
  size = 28,
  className,
}: {
  participants: Speaker[];
  max?: number;
  size?: number;
  className?: string;
}) {
  const shown = participants.slice(0, max);
  const overflow = participants.length - shown.length;

  return (
    <div className={cn("flex items-center", className)}>
      {shown.map((p, i) => (
        <span
          key={p.id}
          title={p.name ?? p.label}
          className="flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-card"
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -size * 0.3,
            fontSize: size * 0.36,
            backgroundColor: `var(--chart-${p.colorIndex})`,
            zIndex: shown.length - i,
          }}
        >
          {p.initials}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="flex items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-card"
          style={{
            width: size,
            height: size,
            marginLeft: -size * 0.3,
            fontSize: size * 0.32,
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
