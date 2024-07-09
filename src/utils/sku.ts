export const formatSku = (sku: string) => {
  let formatted = sku?.trim();
  ["p1", "p2", "p3", "p4", "p5", "P1", "P2", "P3", "P4", "P5"].forEach((item) => {
    if (formatted.endsWith(item)) formatted = formatted.replace(item, "")
  });
  return formatted.trim()
}