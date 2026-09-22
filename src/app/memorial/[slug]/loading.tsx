export default function MemorialLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading memorial">
      <div className="h-[42vh] min-h-[280px] max-h-[520px] w-full bg-navy-800/70" />
      <div className="container-page -mt-[72px] flex flex-col items-center">
        <div className="h-[156px] w-[156px] rounded-full bg-navy-700 ring-4 ring-navy-900" />
        <div className="mt-6 h-10 w-64 rounded-lg bg-navy-700/80" />
        <div className="mt-3 h-5 w-32 rounded bg-navy-700/60" />
        <div className="mt-6 h-6 w-80 max-w-full rounded bg-navy-700/50" />
        <div className="mt-8 flex gap-2">
          <div className="h-10 w-24 rounded-full bg-navy-700/60" />
          <div className="h-10 w-24 rounded-full bg-navy-700/60" />
          <div className="h-10 w-24 rounded-full bg-navy-700/60" />
        </div>
      </div>
      <div className="container-page mt-16 space-y-6">
        <div className="h-8 w-56 rounded bg-navy-700/60" />
        <div className="h-[260px] w-full rounded-2xl bg-navy-800/70" />
        <div className="h-4 w-full rounded bg-navy-700/40" />
        <div className="h-4 w-5/6 rounded bg-navy-700/40" />
        <div className="h-4 w-2/3 rounded bg-navy-700/40" />
      </div>
    </div>
  );
}
