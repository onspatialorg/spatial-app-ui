/** Brand constants shared across the site. */
export const SITE = {
  name: "Spatial",
  domain: "onspatial.org",
  url: "https://onspatial.org",
  xHandle: "@onspatial",
  xUrl: "https://x.com/onspatial",
  githubUrl: "https://github.com/onspatialorg",
  docsUrl: "https://docs.onspatial.org",
  contactEmail: "hello@onspatial.org",
  chainId: 4663,
  tokenAddress: "",
  appHref: "/platform",
} as const;

export const NAV_LINKS = [
  { label: "Mechanics", href: "/#mechanics" },
  { label: "Market", href: "/#market" },
  { label: "Chain", href: "/#chain" },
  { label: "Explorer", href: "/#explorer" },
  { label: "Roadmap", href: "/#roadmap" },
  { label: "Token", href: "/tokenomics" },
] as const;

/** Pages of the documentation, as served at docs.onspatial.org. */
export const DOCS_LINKS = [
  { label: "Spatial at a glance", path: "" },
  { label: "How Spatial works", path: "mechanics/tour" },
  { label: "Taking a loan", path: "guides/borrowing" },
  { label: "Lending at your own price", path: "guides/lending" },
  { label: "Risks and their controls", path: "risk/register" },
  { label: "Contract reference", path: "architecture/contracts" },
  { label: "Frequently asked questions", path: "resources/questions" },
] as const;

export function docsHref(path: string): string {
  return path ? `${SITE.docsUrl}/${path}` : SITE.docsUrl;
}
