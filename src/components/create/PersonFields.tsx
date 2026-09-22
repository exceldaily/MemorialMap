"use client";

import { useId } from "react";
import { Heart, Sun } from "lucide-react";
import type { DateMode, FieldErrors, PersonValues } from "./wizardTypes";
import { cn } from "@/lib/utils";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-danger-400" role="alert">
      {message}
    </p>
  );
}

function DateField({
  label,
  mode,
  date,
  year,
  onMode,
  onDate,
  onYear,
  errors,
  prefix,
  unknownLabel,
}: {
  label: string;
  mode: DateMode;
  date: string;
  year: string;
  onMode: (m: DateMode) => void;
  onDate: (v: string) => void;
  onYear: (v: string) => void;
  errors: FieldErrors;
  prefix: "birth" | "death";
  unknownLabel: string;
}) {
  const id = useId();
  const dateErr = errors[`${prefix}_date`];
  const yearErr = errors[`${prefix}_year`];
  const options: { value: DateMode; label: string }[] = [
    { value: "date", label: "Full date" },
    { value: "year", label: "Year only" },
    { value: "unknown", label: unknownLabel },
  ];
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="mb-2 inline-flex rounded-full border border-white/10 bg-navy-950/60 p-0.5" role="radiogroup" aria-label={`${label} format`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={mode === o.value}
            onClick={() => onMode(o.value)}
            className={cn("rounded-full px-3 py-1 text-xs transition", mode === o.value ? "bg-gold-400 text-navy-950" : "text-ivory-300 hover:text-ivory-50")}
          >
            {o.label}
          </button>
        ))}
      </div>
      {mode === "date" && (
        <>
          <input
            id={`${id}-date`}
            type="date"
            className="input"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => onDate(e.target.value)}
            aria-label={label}
            aria-invalid={Boolean(dateErr)}
            aria-describedby={dateErr ? `${id}-date-err` : undefined}
          />
          <FieldError id={`${id}-date-err`} message={dateErr} />
        </>
      )}
      {mode === "year" && (
        <>
          <input
            id={`${id}-year`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            placeholder="e.g. 1948"
            className="input max-w-[10rem]"
            value={year}
            onChange={(e) => onYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
            aria-label={`${label} (year)`}
            aria-invalid={Boolean(yearErr)}
            aria-describedby={yearErr ? `${id}-year-err` : undefined}
          />
          <FieldError id={`${id}-year-err`} message={yearErr} />
        </>
      )}
      {mode === "unknown" && <p className="text-sm text-ivory-500">We&apos;ll show this gracefully without a date.</p>}
    </fieldset>
  );
}

export function PersonFields({ value, onChange, errors = {}, showType = true }: { value: PersonValues; onChange: (v: PersonValues) => void; errors?: FieldErrors; showType?: boolean }) {
  const id = useId();
  const set = <K extends keyof PersonValues>(k: K, v: PersonValues[K]) => onChange({ ...value, [k]: v });
  const living = value.memorial_type === "living";

  return (
    <div className="space-y-6">
      {showType && (
        <fieldset>
          <legend className="label">Memorial type</legend>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Memorial type">
            {[
              { v: "deceased" as const, title: "In memory of", body: "A lasting place for someone who has passed.", Icon: Heart },
              { v: "living" as const, title: "Living memorial", body: "Celebrate a life still being lived.", Icon: Sun },
            ].map(({ v, title, body, Icon }) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={value.memorial_type === v}
                onClick={() => set("memorial_type", v)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                  value.memorial_type === v ? "border-gold-400/70 bg-gold-400/10 shadow-glow" : "border-white/10 bg-navy-950/40 hover:border-white/25",
                )}
              >
                <Icon size={20} className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
                <span>
                  <span className="block font-medium text-ivory-100">{title}</span>
                  <span className="block text-xs text-ivory-400">{body}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${id}-first`}>
            First name <span className="text-gold-400">*</span>
          </label>
          <input id={`${id}-first`} className="input" autoComplete="off" value={value.first_name} onChange={(e) => set("first_name", e.target.value)} aria-invalid={Boolean(errors.first_name)} aria-describedby={errors.first_name ? `${id}-first-err` : undefined} required />
          <FieldError id={`${id}-first-err`} message={errors.first_name} />
        </div>
        <div>
          <label className="label" htmlFor={`${id}-middle`}>
            Middle name
          </label>
          <input id={`${id}-middle`} className="input" autoComplete="off" value={value.middle_name} onChange={(e) => set("middle_name", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor={`${id}-last`}>
            Last name <span className="text-gold-400">*</span>
          </label>
          <input id={`${id}-last`} className="input" autoComplete="off" value={value.last_name} onChange={(e) => set("last_name", e.target.value)} aria-invalid={Boolean(errors.last_name)} aria-describedby={errors.last_name ? `${id}-last-err` : undefined} required />
          <FieldError id={`${id}-last-err`} message={errors.last_name} />
        </div>
        <div>
          <label className="label" htmlFor={`${id}-nick`}>
            Nickname
          </label>
          <input id={`${id}-nick`} className="input" autoComplete="off" placeholder="What friends called them" value={value.nickname} onChange={(e) => set("nickname", e.target.value)} />
        </div>
      </div>

      <div className={cn("grid gap-6", !living && "sm:grid-cols-2")}>
        <DateField
          label="Date of birth"
          prefix="birth"
          mode={value.birth_mode}
          date={value.birth_date}
          year={value.birth_year}
          onMode={(m) => set("birth_mode", m)}
          onDate={(v) => set("birth_date", v)}
          onYear={(v) => set("birth_year", v)}
          errors={errors}
          unknownLabel="Unknown"
        />
        {!living && (
          <DateField
            label="Date of passing"
            prefix="death"
            mode={value.death_mode}
            date={value.death_date}
            year={value.death_year}
            onMode={(m) => set("death_mode", m)}
            onDate={(v) => set("death_date", v)}
            onYear={(v) => set("death_year", v)}
            errors={errors}
            unknownLabel="Unknown"
          />
        )}
      </div>
    </div>
  );
}
