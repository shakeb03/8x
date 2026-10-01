export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading results">
      <div className="h-[45px] border-b border-[#ddd] bg-white" />
      <div className="mx-auto flex max-w-[1500px] gap-6 px-3 pt-4 md:px-5">
        <div className="hidden h-[600px] w-60 shrink-0 animate-pulse rounded-lg bg-white lg:block" />
        <div className="min-w-0 flex-1">
          <div className="mb-3 h-8 w-64 animate-pulse rounded bg-white" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="overflow-hidden rounded-md bg-white">
                <div className="aspect-square animate-pulse bg-[#f0f2f2]" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-11/12 animate-pulse rounded bg-[#f0f2f2]" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-[#f0f2f2]" />
                  <div className="h-6 w-1/3 animate-pulse rounded bg-[#f0f2f2]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
