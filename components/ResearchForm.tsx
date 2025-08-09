"use client";

import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const schema = z.object({
  industry: z.string().min(2, "Required"),
  companyName: z.string().min(2, "Required"),
  researchDepth: z.enum(["surface-level", "moderate", "in-depth"]),
  geographicalFocus: z.string().min(2, "Required"),
  timeFrame: z.string().min(2, "Required"),
});

type FormValues = z.infer<typeof schema>;

const depths: FormValues["researchDepth"][] = [
  "surface-level",
  "moderate",
  "in-depth",
];

export default function ResearchForm({ className }: { className?: string }) {
  const [values, setValues] = useState<FormValues>({
    industry: "FinTech",
    companyName: "Stripe",
    researchDepth: "in-depth",
    geographicalFocus: "North America & Europe",
    timeFrame: "Last 3 years",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const canSubmit = useMemo(() => !isLoading, [isLoading]);

  const onChange = (
    field: keyof FormValues,
    value: string | FormValues["researchDepth"]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value } as FormValues));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult("");
    setErrors({});
    const parse = schema.safeParse(values);
    if (!parse.success) {
      const errs: Record<string, string> = {};
      for (const issue of parse.error.issues) {
        errs[issue.path.join(".")] = issue.message;
      }
      setErrors(errs);
      return;
    }
    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);

      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || "Failed to generate");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let output = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        output += decoder.decode(value, { stream: true });
        setResult(output);
      }
      setResult(output);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setErrors({ global: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={onSubmit}
        className="backdrop-blur bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-lg space-y-5"
      >
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Industry" error={errors.industry}>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., FinTech, Healthcare"
              value={values.industry}
              onChange={(e) => onChange("industry", e.target.value)}
            />
          </Field>
          <Field label="Company Name" error={errors.companyName}>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Stripe"
              value={values.companyName}
              onChange={(e) => onChange("companyName", e.target.value)}
            />
          </Field>
          <Field label="Geographical Focus" error={errors.geographicalFocus}>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., North America, EU, APAC"
              value={values.geographicalFocus}
              onChange={(e) => onChange("geographicalFocus", e.target.value)}
            />
          </Field>
          <Field label="Time Frame" error={errors.timeFrame}>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Last 3 years, Current year"
              value={values.timeFrame}
              onChange={(e) => onChange("timeFrame", e.target.value)}
            />
          </Field>
          <Field label="Research Depth" error={errors.researchDepth}>
            <div className="flex gap-2">
              {depths.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChange("researchDepth", d)}
                  className={cn(
                    "px-3 py-2 rounded-md border transition-colors",
                    values.researchDepth === d
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {errors.global && (
          <p className="text-sm text-red-600">{errors.global}</p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={!canSubmit} className="h-11 px-6">
            {isLoading ? "Generating…" : "Generate Report"}
          </Button>
          {isLoading && (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white underline"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 p-6 shadow-inner">
        {result ? (
          <article className="prose prose-slate dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap break-words text-sm leading-6">{result}</pre>
          </article>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Your generated market research report will appear here.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}


