export function tabataAt(elapsed, count, rounds) {
  const total = count * rounds * 30000;
  if (elapsed >= total) return { done: true, remaining: 0, total };
  const slot = Math.floor(Math.max(0, elapsed) / 30000);
  const offset = Math.max(0, elapsed) % 30000;
  const rest = offset >= 20000;
  return { done: false, rest, index: slot % count, round: Math.floor(slot / count) + 1,
    remaining: Math.ceil(((rest ? 30000 : 20000) - offset) / 1000),
    fraction: (offset - (rest ? 20000 : 0)) / (rest ? 10000 : 20000), phase: slot * 2 + Number(rest), total };
}
