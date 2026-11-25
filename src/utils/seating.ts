export interface RowSpec {
  label: string;
  count: number;
}

export type SeatState = 'available' | 'booked' | 'sold-out';

/** Amphitheater cinema hall layout (Row I at back -> Row A near screen). */
export const HALL_ROWS: RowSpec[] = [
  { label: 'I', count: 14 },
  { label: 'H', count: 16 },
  { label: 'G', count: 18 },
  { label: 'F', count: 16 },
  { label: 'E', count: 14 },
  { label: 'D', count: 12 },
  { label: 'C', count: 10 },
  { label: 'B', count: 8 },
  { label: 'A', count: 6 },
];

/** Deterministic seat availability for a given movie/theatre/date/showtime seed. */
export function computeSeatState(
  rowLabel: string,
  seatNum: number,
  seedStr: string
): SeatState {
  let hash = 0;
  const key = `${seedStr}-${rowLabel}-${seatNum}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const mod = hash % 100;
  if (rowLabel === 'D' || rowLabel === 'E') {
    if (mod < 38) return 'sold-out';
    if (mod < 54) return 'booked';
    return 'available';
  }
  if (mod < 16) return 'sold-out';
  if (mod < 36) return 'booked';
  return 'available';
}

/** Build full seat status map for a specific screening. */
export function buildSeatStatusMap(seedStr: string): Map<string, SeatState> {
  const map = new Map<string, SeatState>();
  for (const row of HALL_ROWS) {
    for (let num = 1; num <= row.count; num++) {
      map.set(`${row.label}${num}`, computeSeatState(row.label, num, seedStr));
    }
  }
  return map;
}

/** Pick 2-3 contiguous center-acoustic sweet-spot seats that are guaranteed available. */
export function getAiRecommendedSeats(
  seatStatusMap: Map<string, SeatState>,
  desiredCount = 3
): string[] {
  for (const rowLabel of ['G', 'F', 'H', 'E']) {
    const rowSpec = HALL_ROWS.find((r) => r.label === rowLabel);
    if (!rowSpec) continue;
    const mid = Math.floor(rowSpec.count / 2);
    // Search outward from center
    const offsets = [0, -1, 1, -2, 2, -3, 3];
    for (const offset of offsets) {
      const start = mid + offset;
      const candidates: string[] = [];
      for (let k = 0; k < desiredCount; k++) {
        const seatNum = start + k;
        if (seatNum >= 1 && seatNum <= rowSpec.count) {
          candidates.push(`${rowLabel}${seatNum}`);
        }
      }
      if (
        candidates.length === desiredCount &&
        candidates.every((id) => seatStatusMap.get(id) === 'available')
      ) {
        return candidates;
      }
    }
  }
  // Fallback: any available seats
  for (const [id, state] of seatStatusMap.entries()) {
    if (state === 'available') return [id];
  }
  return [];
}
