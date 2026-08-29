import Link from "next/link";
import { Logo } from "@/components/Logo";
import { GitHubIcon, XIcon } from "@/components/icons";
import { DOCS_LINKS, SITE, docsHref } from "@/lib/site";

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Launch the app", href: SITE.appHref },
      { label: "Mechanics", href: "/#mechanics" },
      { label: "Borrowing", href: "/#market" },
      { label: "Lending", href: "/#market" },
      { label: "Explorer", href: "/#explorer" },
      { label: "Tokenomics", href: "/tokenomics" },
    ],
  },
  {
    heading: "Protocol",
    links: [
      { label: "Robinhood Chain", href: "/#chain" },
      { label: "Telemetry", href: "/#telemetry" },
      { label: "Compared with pools", href: "/#compare" },
      { label: "Roadmap", href: "/#roadmap" },
    ],
  },
  {
    heading: "Documentation",
    links: DOCS_LINKS.map((d) => ({ label: d.label, href: docsHref(d.path), external: true as const })),
  },
  {
    heading: "Company",
    links: [
      { label: "Write to us", href: `mailto:${SITE.contactEmail}` },
      { label: SITE.xHandle, href: SITE.xUrl, external: true },
      { label: "GitHub", href: SITE.githubUrl, external: true },
    ],
  },
] as const;

export function Footer() {
  const iconLink =
    "inline-flex size-10 items-center justify-center rounded-full border border-line bg-white text-tide transition-colors hover:border-lagoon-muted hover:text-lagoon-deep";
  return (
    <footer className="relative bg-canvas">
      <div className="container pb-10 pt-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)] lg:gap-8">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <Logo size={30} />
            <p className="mt-5 text-[14.5px] leading-relaxed text-tide">
              Loans between people, secured by tokenized stocks, settled in USDG on Robinhood Chain. The rate and the term
              are agreed up front and a syndicate of lenders shares the funding.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href={SITE.xUrl} target="_blank" rel="noopener noreferrer" aria-label="Spatial on X" className={iconLink}>
                <XIcon className="size-3.5" />
              </a>
              <a href={SITE.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="Spatial on GitHub" className={iconLink}>
                <GitHubIcon className="size-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-[13px] font-semibold text-navy">{column.heading}</h3>
              <ul className="mt-5 flex flex-col gap-3">
                {column.links.map((link) => {
                  const external = "external" in link && link.external;
                  const cls = "text-[14.5px] text-tide transition-colors hover:text-lagoon-deep";
                  return (
                    <li key={link.label}>
                      {external ? (
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className={cls}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-line pt-7 text-[13px] text-fog md:flex-row md:items-center">
          <p>&copy; 2026 Spatial · {SITE.domain}</p>
          <p className="flex items-center gap-2">
            Open-source contracts with verified bytecode, priced by Chainlink, settled on Robinhood Chain.
          </p>
        </div>
      </div>
    </footer>
  );
}
