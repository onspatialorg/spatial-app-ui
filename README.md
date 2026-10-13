<div align="center">
  <img src="public/icon-512.png" alt="Spatial" width="88" />
  <h1>spatial-web</h1>
  <p>The marketing site for <a href="https://onspatial.org">onspatial.org</a> and the lending app that lives under <code>/platform</code>.</p>
</div>

Spatial lets people borrow USDG against tokenized stocks on Robinhood Chain, with lenders setting their own rates. This repository holds everything a browser sees: the public pages, the tokenomics page, and the app where requests and offers are posted, matched and settled.

## Getting started

You will need Node 24 or later (the version is pinned in `.nvmrc`), a Supabase project and a Privy app.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill it in. Privy gives you an app id and secret. From Supabase you need the URL of the project plus its anon and service-role keys. Leave the chain settings alone for Robinhood Chain.
3. Prepare the database by following `supabase/README.md`.
4. Run `npm run dev` and open http://localhost:3000. The app is at http://localhost:3000/platform.

If any required variable is missing, `/platform` shows a short setup screen listing what to add instead of failing.

| Command | Purpose |
| :-- | :-- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Layout of the code

```
src/app/                 routes: the home page, /tokenomics, /platform/* and the API route
src/components/          site sections, the header and footer, shared visual pieces
src/components/platform/ the app shell, providers and the small UI kit used by every app page
src/lib/site.ts          brand constants: name, domain, social links, nav
src/lib/platform/        data access, EIP-712 types, contract calls, maths and formatting
supabase/                schema, seeds, patches and the setup guide
public/                  the mark, app icons and the hero photograph
```

Styling is Tailwind CSS 4. Colour, type and component tokens are defined once in `src/app/globals.css`; the display face is Bricolage Grotesque and everything else is set in Geist.

## How data moves

**Public reads.** For the book, loans, slices, events, markets, prices and parameters, the browser queries Supabase itself using the anon key. Nothing here is private, which is exactly what the Explorer needs.

**Anything done as a user.** Profiles, attestations, posting or cancelling requests and offers, settling, repaying and topping up all go through `POST /api/platform/db` carrying the Privy access token. The server confirms the token, applies the validation that `src/lib/platform/ops.ts` defines, and only then calls Supabase using the service-role key, with an `x-spatial-actor` header that names the confirmed user. `app_user_id()` in the database only honours that header on service-role calls, so ownership rules inside the `security definer` functions see the real user.

**Signatures.** Requests and offers are EIP-712 typed data that match the contracts byte for byte: domain name `Spatial`, version `1`, the chain id and the `CreditHub` address. Privy signs without gas, and the hash and signature are saved with the row.

**Settlement.** Offers are matched cheapest APR first. When `protocol_params` holds a `CreditHub` address under its `deployment` key, settling sends a real `originate` transaction from the user's wallet and keeps the hash with the loan. Without one, the match is written to the book only.

**Configuration over constants.** Markets, prices, parameters and contract addresses all come from Supabase, so the interface never carries hardcoded protocol values.

## Elsewhere

- Smart contracts and deploy scripts: `contracts/README.md`
- Protocol documentation, published with GitBook: `docs/`
- News and updates: [@onspatial](https://x.com/onspatial)
