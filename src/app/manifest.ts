import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spatial",
    short_name: "Spatial",
    description: "Fixed-rate, fixed-term loans against tokenized stocks, agreed lender to borrower on Robinhood Chain.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f9fa",
    theme_color: "#0a8782",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
