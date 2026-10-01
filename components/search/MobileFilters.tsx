"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Small-screen filter sheet built on <dialog>. The sidebar content is
 * rendered on the server and passed in as children.
 */
export function MobileFilters({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const params = useSearchParams();

  // Close after a filter link navigates.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname, params]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="rounded-lg border border-[#d5d9d9] bg-white px-3 py-1 text-[13px] shadow-[0_2px_5px_rgba(15,17,17,.15)] lg:hidden"
      >
        Filters{activeCount > 0 && ` (${activeCount})`}
      </button>

      <dialog
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
        className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-2xl p-0 backdrop:bg-black/50 lg:hidden"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-[#e7e7e7] bg-white px-4 py-3">
          <h2 className="font-bold">Filters</h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="rounded-full px-3 py-1 text-sm text-link hover:bg-[#f7fafa]"
          >
            Done
          </button>
        </div>
        <div className="px-4 py-3">{children}</div>
      </dialog>
    </>
  );
}
