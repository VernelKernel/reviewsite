export type ShareTarget = {
  id: string;
  label: string;
  href: string;
};

export type MailService = {
  id: string;
  label: string;
  href: string;
};

export const WATERMARK_NAME = "FRAME";
export const WATERMARK_LINE = "From published evaluations";

export function shareSummary(title: string): string {
  return `${title}. ${WATERMARK_LINE} on Frame.`;
}

export function shareFileName(path: string): string {
  const slug = path.split("?")[0].split("#")[0].split("/").filter(Boolean).pop() || "reading";
  return `${slug}-frame.png`;
}

export function networkTargets(url: string, title: string): ShareTarget[] {
  const summary = shareSummary(title);
  const encodedUrl = encodeURIComponent(url);
  const encodedSummary = encodeURIComponent(summary);
  return [
    {
      id: "x",
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?text=${encodedSummary}&url=${encodedUrl}`,
    },
    {
      id: "reddit",
      label: "Share on Reddit",
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedSummary}`,
    },
    {
      id: "bluesky",
      label: "Share on Bluesky",
      href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${summary}\n${url}`)}`,
    },
    {
      id: "pinterest",
      label: "Share on Pinterest",
      href: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedSummary}`,
    },
    {
      id: "facebook",
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ];
}

export function mailServices(url: string, title: string): MailService[] {
  const subject = encodeURIComponent(title);
  const body = encodeURIComponent(`${shareSummary(title)}\n${url}`);
  return [
    {
      id: "gmail",
      label: "Gmail",
      href: `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
    },
    {
      id: "outlook",
      label: "Outlook",
      href: `https://outlook.live.com/mail/0/deeplink/compose?subject=${subject}&body=${body}`,
    },
    {
      id: "yahoo",
      label: "Yahoo Mail",
      href: `https://compose.mail.yahoo.com/?subject=${subject}&body=${body}`,
    },
    {
      id: "app",
      label: "Email app",
      href: `mailto:?subject=${subject}&body=${body}`,
    },
  ];
}
