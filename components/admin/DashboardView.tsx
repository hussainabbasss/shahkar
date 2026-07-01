"use client";

import { useState } from "react";
import {
  Clock,
  RotateCcw,
  ShoppingBag,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { AlertBanner } from "@/components/admin/AlertBanner";
import { KpiHeroPanel } from "@/components/admin/KpiHeroPanel";
import { KpiStatTile } from "@/components/admin/KpiStatTile";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { NewMessagesCard } from "@/components/admin/messages/NewMessagesCard";
import { MyTicketsCard } from "@/components/admin/tickets/MyTicketsCard";
import { SegmentedControl } from "@/components/admin/SegmentedControl";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import type { DashboardKpiPayload, PeriodKey } from "@/lib/db/admin/analytics";
import type { UnreadSummaryItem } from "@/lib/db/admin/messages";
import type { TicketDepartmentRecord } from "@/lib/db/admin/ticket-departments";
import type { MyTicketSummary } from "@/lib/db/admin/tickets";
import type { Order, OrderStatus } from "@/lib/types";

type DashboardViewProps = {
  adminName: string;
  kpi: DashboardKpiPayload;
  recentOrders: Order[];
  allowedStatuses: OrderStatus[];
  unreadMessages?: UnreadSummaryItem[];
  myTickets?: MyTicketSummary[];
  ticketDepartments?: TicketDepartmentRecord[];
  showMyTickets?: boolean;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatPageDate(): string {
  return new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Karachi",
  });
}

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

export function DashboardView({
  adminName,
  kpi,
  recentOrders,
  allowedStatuses,
  unreadMessages = [],
  myTickets = [],
  ticketDepartments = [],
  showMyTickets = false,
}: DashboardViewProps) {
  const [period, setPeriod] = useState<PeriodKey>("today");
  const firstName = adminName.split(" ")[0] ?? adminName;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Here&apos;s how Shahkar.store is performing · {formatPageDate()} · PKT
          </p>
        </div>
        <SegmentedControl
          options={PERIOD_OPTIONS}
          value={period}
          onChange={setPeriod}
        />
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <KpiHeroPanel
          title="Orders"
          icon={ShoppingBag}
          metric={kpi.orders[period]}
          format="number"
          unitLabel="orders this period"
        />
        <KpiHeroPanel
          title="Revenue"
          icon={TrendingUp}
          metric={kpi.revenue[period]}
          format="currency"
        />
      </div>

      <div>
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: "var(--admin-text-subtle)" }}
        >
          Operations
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiStatTile
            label="Pending"
            value={kpi.pendingOrders}
            subtitle={
              kpi.pendingOrders === 1
                ? "1 awaiting action"
                : `${kpi.pendingOrders} awaiting action`
            }
            icon={Clock}
            href="/admin/orders?status=pending"
            accent="accent"
          />
          <KpiStatTile
            label="Delivered"
            value={kpi.deliveredOrders}
            subtitle="completed orders"
            icon={TrendingUp}
            href="/admin/orders?status=delivered"
            accent="success"
          />
          <KpiStatTile
            label="Returned"
            value={kpi.returnedOrders}
            subtitle="all time"
            icon={RotateCcw}
            href="/admin/orders?status=returned"
            accent="error"
          />
          <KpiStatTile
            label="Coupons"
            value={kpi.activeCoupons}
            subtitle="live promotions"
            icon={Ticket}
            href="/admin/coupons"
            accent="primary"
          />
        </div>
      </div>

      {kpi.lowStockCount > 0 && (
        <AlertBanner count={kpi.lowStockCount} products={kpi.lowStockProducts} />
      )}

      <NewMessagesCard items={unreadMessages} />

      {showMyTickets && (
        <MyTicketsCard items={myTickets} departments={ticketDepartments} />
      )}

      {recentOrders.length === 0 ? (
        <AdminEmptyState message="No orders yet — orders from checkout will appear here." />
      ) : (
        <RecentOrdersTable
          orders={recentOrders}
          allowedStatuses={allowedStatuses}
        />
      )}
    </div>
  );
}
