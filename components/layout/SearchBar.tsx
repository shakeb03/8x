"use client";

import Form from "next/form";
import { useState } from "react";
import { CaretDownIcon, SearchIcon } from "@/components/icons";

type Option = { slug: string; name: string };

export function SearchBar({ departments }: { departments: Option[] }) {
  const [scope, setScope] = useState("");
  const scopeLabel = departments.find((d) => d.slug === scope)?.name ?? "All";

  return (
    <Form
      action="/s"
      role="search"
      className="flex h-10 w-full overflow-hidden rounded-md bg-white focus-within:ring-[3px] focus-within:ring-focus"
    >
      {/* Native select for accessibility, visually replaced by the label beside it. */}
      <label className="relative hidden shrink-0 items-center gap-1 border-r border-[#cdcdcd] bg-[#e6e6e6] px-3 text-xs text-[#555] hover:bg-[#d4d4d4] hover:text-ink sm:flex">
        <span>{scopeLabel}</span>
        <CaretDownIcon className="size-2" />
        <select
          name="i"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          aria-label="Search in department"
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <input
        type="search"
        name="k"
        placeholder="Search products, brands and more"
        aria-label="Search"
        autoComplete="off"
        className="min-w-0 flex-1 px-3 text-[15px] text-ink outline-none placeholder:text-[#777]"
      />

      <button
        type="submit"
        aria-label="Go"
        className="flex w-12 shrink-0 items-center justify-center bg-accent text-ink hover:bg-accent-hover"
      >
        <SearchIcon className="size-5" />
      </button>
    </Form>
  );
}
