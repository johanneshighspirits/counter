// Placeholder with the same size as the two chart cards
export const ChartSkeleton = () => (
  <div className="w-full flex flex-col gap-4" aria-label="Laddar statistik">
    {[220, 180].map((height) => (
      <div
        key={height}
        className="w-full rounded-xl p-3 flex flex-col gap-2 bg-[#0f1a14]">
        <div className="h-6 w-28 rounded bg-white/10 animate-pulse" />
        <div
          className="rounded bg-white/5 animate-pulse"
          style={{ height }}
        />
      </div>
    ))}
  </div>
);
