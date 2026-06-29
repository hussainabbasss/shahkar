import { CodBadge } from "@/components/ui/CodBadge";

export function ProductTrust() {
  return (
    <div className="mt-6 space-y-3 rounded-2xl border border-border bg-primary-light p-4">
      <CodBadge />
      <p className="text-sm text-body">
        <span className="font-semibold text-heading">Delivery:</span> 2–3 business
        days poore Pakistan mein
      </p>
      <p className="text-sm text-body">
        <span className="font-semibold text-heading">Returns:</span> 7 din ke
        andar agar product theek na ho
      </p>
    </div>
  );
}
