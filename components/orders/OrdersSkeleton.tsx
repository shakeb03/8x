export function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading orders">
      <div className="h-8 w-48 animate-pulse rounded bg-white" />
      <div className="h-48 animate-pulse rounded-lg bg-white" />
      <div className="h-48 animate-pulse rounded-lg bg-white" />
    </div>
  );
}
