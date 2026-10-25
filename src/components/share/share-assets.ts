export const SHARE_ICONS: Record<string, string> = {
  x: "/share/x.png",
  reddit: "/share/reddit.png",
  bluesky: "/share/bluesky.png",
  pinterest: "/share/pinterest.png",
  facebook: "/share/facebook.png",
};

export function saveFile(file: File) {
  const href = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = file.name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1500);
}

export function saveFiles(files: File[]) {
  for (const file of files) saveFile(file);
}
