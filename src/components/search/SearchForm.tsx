import { Search } from "lucide-react";

export type SearchQuery = { q: string; birth: string; death: string; view: "list" | "map" };

export function SearchForm({ query }: { query: SearchQuery }) {
  return (
    <form action="/search" method="get" role="search" className="card grid gap-4 p-5 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end">
      <input type="hidden" name="view" value={query.view} />
      <div>
        <label htmlFor="q" className="label">
          Name
        </label>
        <input id="q" name="q" defaultValue={query.q} placeholder="Search by name or nickname" className="input" autoComplete="off" />
      </div>
      <div>
        <label htmlFor="birth" className="label">
          Birth year
        </label>
        <input id="birth" name="birth" type="number" inputMode="numeric" min={1} max={2200} defaultValue={query.birth} placeholder="e.g. 1948" className="input" />
      </div>
      <div>
        <label htmlFor="death" className="label">
          Year of passing
        </label>
        <input id="death" name="death" type="number" inputMode="numeric" min={1} max={2200} defaultValue={query.death} placeholder="e.g. 2025" className="input" />
      </div>
      <button type="submit" className="btn-primary">
        <Search size={16} aria-hidden /> Search
      </button>
    </form>
  );
}
