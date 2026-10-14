export function steamArtwork(title: string, headerImage: string | null, portrait: string | null) {
  return [
    ...(headerImage
      ? [{ kind: "KEY_ART" as const, src: headerImage, alt: `Key art for ${title}`, isPrimary: true, sortOrder: 0 }]
      : []),
    ...(portrait ? [{ kind: "POSTER" as const, src: portrait, alt: `Cover art for ${title}`, isPrimary: !headerImage, sortOrder: 1 }] : []),
  ];
}
