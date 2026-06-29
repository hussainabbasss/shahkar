import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContinueShoppingButton } from "@/components/order/ContinueShoppingButton";
import { DeliveryEstimate } from "@/components/order/DeliveryEstimate";
import { OrderDetailsSummary } from "@/components/order/OrderDetailsSummary";
import { OrderNumberDisplay } from "@/components/order/OrderNumberDisplay";
import { OrderSuccessHeader } from "@/components/order/OrderSuccessHeader";
import { WhatsAppSupport } from "@/components/order/WhatsAppSupport";
import { getOrderByNumber } from "@/lib/db/orders";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = {
  params: Promise<{ orderNumber: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderNumber } = await params;

  if (!orderNumber.startsWith("SHA-")) {
    notFound();
  }

  const order = await getOrderByNumber(orderNumber);

  // Without Supabase, order details aren't persisted — show success shell
  if (!order && isSupabaseConfigured()) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-12 md:px-8">
      <OrderSuccessHeader />
      <OrderNumberDisplay orderNumber={orderNumber} />
      {order && <OrderDetailsSummary order={order} />}
      <DeliveryEstimate />
      <WhatsAppSupport />
      <ContinueShoppingButton />
    </div>
  );
}
