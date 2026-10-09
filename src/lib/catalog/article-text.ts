/** Working text for a reading. Callers must not persist this. */
export function articleText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  const region = stripped.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? stripped.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? stripped;
  return decode(region.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decode(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}
