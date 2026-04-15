import { hierarchy, pack, type HierarchyCircularNode } from "d3-hierarchy";

export type PackedBubble = {
  name: string;
  value: number;
  x: number;
  y: number;
  r: number;
};

/** Datum shape for D3 pack (root has children; leaves have `value`). */
type PackDatum = {
  name: string;
  value?: number;
  children?: PackDatum[];
};

/**
 * Circle packing via D3’s {@link https://d3js.org/d3-hierarchy/pack pack} layout —
 * tight, non-overlapping placement from values (standard bubble-chart approach).
 */
export function computeExpenseBubblePack(
  items: { name: string; value: number }[],
  width: number,
  height: number,
  padding = 2,
): PackedBubble[] {
  if (items.length === 0) return [];

  const rootData: PackDatum = {
    name: "__root__",
    children: items.map((d) => ({
      name: d.name,
      value: Math.max(d.value, 1),
    })),
  };

  const root = hierarchy<PackDatum>(rootData)
    .sum((d) => (typeof d.value === "number" ? d.value : 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const packedRoot = pack<PackDatum>()
    .size([width, height])
    .padding(padding)(root);

  return packedRoot.leaves().map((node: HierarchyCircularNode<PackDatum>) => {
    const d = node.data;
    return {
      name: d.name,
      value: d.value ?? 0,
      x: node.x,
      y: node.y,
      r: node.r,
    };
  });
}
