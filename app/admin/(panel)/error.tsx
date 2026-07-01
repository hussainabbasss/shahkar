"use client";

type AdminPanelErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminPanelError({ error, reset }: AdminPanelErrorProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <h2
        className="text-lg font-bold"
        style={{ color: "var(--admin-text-heading)" }}
      >
        Something went wrong
      </h2>
      <p
        className="mt-2 max-w-md text-sm"
        style={{ color: "var(--admin-text-muted)" }}
      >
        {error.message || "This page failed to load. Try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg px-4 py-2 text-sm font-semibold text-white"
        style={{ background: "var(--admin-primary)" }}
      >
        Try again
      </button>
    </div>
  );
}
