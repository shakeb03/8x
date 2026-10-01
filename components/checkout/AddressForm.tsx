"use client";

import { useState, type FormEvent } from "react";
import { PROVINCES } from "@/lib/tax";
import type { ShippingAddress } from "@/lib/types";

type Errors = Partial<Record<keyof ShippingAddress, string>>;

const POSTAL_CODE = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

function normalize(form: FormData): ShippingAddress {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const postal = get("postalCode").toUpperCase().replace(/[\s-]/g, "");
  return {
    fullName: get("fullName"),
    street: get("street"),
    unit: get("unit"),
    city: get("city"),
    province: get("province"),
    postalCode: postal.length === 6 ? `${postal.slice(0, 3)} ${postal.slice(3)}` : postal,
    phone: get("phone"),
  };
}

function validate(a: ShippingAddress): Errors {
  const errors: Errors = {};
  if (!a.fullName) errors.fullName = "Enter a full name.";
  if (!a.street) errors.street = "Enter a street address.";
  if (!a.city) errors.city = "Enter a city.";
  if (!a.province) errors.province = "Choose a province or territory.";
  if (!POSTAL_CODE.test(a.postalCode)) errors.postalCode = "Enter a valid postal code, like K1A 0B1.";
  if (a.phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a 10-digit phone number.";
  return errors;
}

const inputCls =
  "w-full rounded-md border px-3 py-1.5 text-sm shadow-[inset_0_1px_2px_rgba(15,17,17,.15)] outline-none focus:border-link focus:ring-3 focus:ring-[#c8f3fa]";

function Field({
  name,
  label,
  error,
  children,
  hint,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="text-xs text-deal">
          {error}
        </p>
      )}
    </div>
  );
}

export function AddressForm({
  initial,
  onSubmit,
}: {
  initial: ShippingAddress | null;
  onSubmit: (address: ShippingAddress) => void;
}) {
  const [errors, setErrors] = useState<Errors>({});

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const address = normalize(new FormData(e.currentTarget));
    const found = validate(address);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    onSubmit(address);
  };

  const props = (name: keyof ShippingAddress) => ({
    id: name,
    name,
    defaultValue: initial?.[name] ?? "",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    className: `${inputCls} ${errors[name] ? "border-deal" : "border-[#888c8c]"}`,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-3">
      <Field name="country" label="Country/Region">
        <input id="country" value="Canada" readOnly className={`${inputCls} border-[#d5d9d9] bg-[#f7f8f8] text-muted`} />
      </Field>
      <Field name="fullName" label="Full name" error={errors.fullName}>
        <input {...props("fullName")} autoComplete="name" />
      </Field>
      <Field name="phone" label="Phone number" error={errors.phone} hint="May be used to assist delivery">
        <input {...props("phone")} type="tel" autoComplete="tel" inputMode="tel" />
      </Field>
      <Field name="street" label="Address" error={errors.street}>
        <input {...props("street")} autoComplete="address-line1" placeholder="Street address or P.O. Box" />
      </Field>
      <Field name="unit" label="Apt, suite, unit (optional)">
        <input {...props("unit")} autoComplete="address-line2" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_140px]">
        <Field name="city" label="City" error={errors.city}>
          <input {...props("city")} autoComplete="address-level2" />
        </Field>
        <Field name="province" label="Province/Territory" error={errors.province}>
          <select {...props("province")} autoComplete="address-level1">
            <option value="">Select</option>
            {PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field name="postalCode" label="Postal code" error={errors.postalCode}>
          <input {...props("postalCode")} autoComplete="postal-code" />
        </Field>
      </div>
      <button
        type="submit"
        className="mt-1 w-fit rounded-full bg-cta px-5 py-2 text-sm text-ink shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-cta-hover"
      >
        Use this address
      </button>
    </form>
  );
}
