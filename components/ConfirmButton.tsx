"use client";

import { useTransition } from "react";

export function ConfirmButton({
  action,
  confirmText,
  hiddenFields,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  confirmText: string;
  hiddenFields: Record<string, string>;
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        const formData = new FormData();
        Object.entries(hiddenFields).forEach(([key, value]) => formData.append(key, value));
        startTransition(() => {
          action(formData);
        });
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
