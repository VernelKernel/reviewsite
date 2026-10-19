"use client";

import { usePathname } from "next/navigation";

const links = [
  { href: "/games", label: "Games" },
  { href: "/discover", label: "Discover" },
  { href: "/about", label: "About" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav-links" aria-label="Primary">
      {links.map((link) => (
        <a key={link.href} href={link.href} aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
