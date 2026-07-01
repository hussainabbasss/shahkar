"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import {
  fetchActiveStaffAction,
  fetchAuditConversationsAction,
  fetchConversationMembersAction,
  fetchConversationMetaAction,
  fetchMyConversationsAction,
  openDmAction,
} from "@/app/actions/admin/messages";
import { ConversationList } from "@/components/admin/messages/ConversationList";
import { CreateGroupModal } from "@/components/admin/messages/CreateGroupModal";
import { MessageThread } from "@/components/admin/messages/MessageThread";
import { adminInputClass } from "@/components/admin/AdminUI";
import type {
  ConversationListItem,
  ConversationMember,
  StaffMember,
} from "@/lib/db/admin/messages";

type MessagesLayoutProps = {
  currentUserId: string;
  isSuperAdmin: boolean;
  canCreateGroups: boolean;
  canShareProducts: boolean;
  canShareOrders: boolean;
  canShareTickets: boolean;
  canManageProducts: boolean;
  canViewTickets: boolean;
  canManageTickets: boolean;
  initialConversationId?: string;
  initialConversation?: ConversationListItem;
  initialMembers?: ConversationMember[];
  initialCreatedById?: string | null;
  withUserId?: string;
};

type Tab = "chats" | "audit";

export function MessagesLayout({
  currentUserId,
  isSuperAdmin,
  canCreateGroups,
  canShareProducts,
  canShareOrders,
  canShareTickets,
  canManageProducts,
  canViewTickets,
  canManageTickets,
  initialConversationId,
  initialConversation,
  initialMembers = [],
  initialCreatedById = null,
  withUserId,
}: MessagesLayoutProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("chats");
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    initialConversation ? [initialConversation] : [],
  );
  const [auditConversations, setAuditConversations] = useState<
    ConversationListItem[]
  >([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activeId, setActiveId] = useState<string | null>(
    initialConversationId ?? null,
  );
  const [members, setMembers] = useState<ConversationMember[]>(initialMembers);
  const [createdById, setCreatedById] = useState<string | null>(
    initialCreatedById,
  );
  const [staffSearch, setStaffSearch] = useState("");
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(!!initialConversationId);
  const [pinnedConversation, setPinnedConversation] =
    useState<ConversationListItem | null>(initialConversation ?? null);

  const refreshLists = useCallback(async () => {
    const [mine, audit] = await Promise.all([
      fetchMyConversationsAction(),
      isSuperAdmin ? fetchAuditConversationsAction() : Promise.resolve([]),
    ]);
    setConversations(mine);
    setAuditConversations(audit);
    setPinnedConversation((pinned) => {
      if (!pinned) return null;
      return mine.some((c) => c.id === pinned.id) ? null : pinned;
    });
  }, [isSuperAdmin]);

  useEffect(() => {
    void refreshLists();
  }, [refreshLists]);

  useEffect(() => {
    void fetchActiveStaffAction().then(setStaff);
  }, []);

  useEffect(() => {
    if (!withUserId) return;
    openDmAction(withUserId).then((result) => {
      if (result.success && result.data) {
        const { conversationId } = result.data;
        const staffMember = staff.find((s) => s.id === withUserId);
        if (staffMember) {
          const stub: ConversationListItem = {
            id: conversationId,
            type: "dm",
            name: null,
            label: staffMember.name,
            preview: null,
            lastMessageAt: null,
            unreadCount: 0,
            otherUserId: withUserId,
          };
          setPinnedConversation(stub);
          setConversations((prev) =>
            prev.some((c) => c.id === conversationId) ? prev : [stub, ...prev],
          );
        }
        setActiveId(conversationId);
        setMobileShowThread(true);
        router.replace(`/admin/messages/${conversationId}`);
      }
    });
  }, [withUserId, router, staff]);

  useEffect(() => {
    if (!activeId) {
      setMembers([]);
      setCreatedById(null);
      return;
    }
    if (activeId === initialConversationId && initialMembers.length) {
      setMembers(initialMembers);
      setCreatedById(initialCreatedById);
      return;
    }
    fetchConversationMembersAction(activeId).then(setMembers);
    fetchConversationMetaAction(activeId).then((meta) => {
      setCreatedById(meta?.createdBy ?? null);
    });
  }, [
    activeId,
    initialConversationId,
    initialMembers,
    initialCreatedById,
  ]);

  const activeConversation =
    tab === "audit"
      ? auditConversations.find((c) => c.id === activeId)
      : conversations.find((c) => c.id === activeId) ??
        (pinnedConversation?.id === activeId ? pinnedConversation : null) ??
        (initialConversation?.id === activeId ? initialConversation : null) ??
        auditConversations.find((c) => c.id === activeId);

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileShowThread(true);
    router.replace(`/admin/messages/${id}`);
  }

  function openDmWithStaff(member: StaffMember) {
    void openDmAction(member.id).then((result) => {
      if (!result.success || !result.data) return;
      const { conversationId } = result.data;
      const stub: ConversationListItem = {
        id: conversationId,
        type: "dm",
        name: null,
        label: member.name,
        preview: null,
        lastMessageAt: null,
        unreadCount: 0,
        otherUserId: member.id,
      };
      setPinnedConversation(stub);
      setConversations((prev) =>
        prev.some((c) => c.id === conversationId) ? prev : [stub, ...prev],
      );
      selectConversation(conversationId);
      void refreshLists();
    });
    setStaffSearch("");
  }

  const filteredStaff = staff.filter(
    (s) =>
      !staffSearch.trim() ||
      s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(staffSearch.toLowerCase()),
  );

  const listItems = tab === "audit" ? auditConversations : conversations;

  return (
    <div
      className="flex h-[calc(100vh-140px)] min-h-[500px] overflow-hidden rounded-xl"
      style={{
        border: "1px solid var(--admin-border)",
        background: "var(--admin-surface)",
      }}
    >
      {/* Left panel */}
      <div
        className={`flex w-full flex-col border-r md:w-[340px] md:shrink-0 ${
          mobileShowThread ? "hidden md:flex" : "flex"
        }`}
        style={{ borderColor: "var(--admin-border)" }}
      >
        <div
          className="border-b p-3"
          style={{ borderColor: "var(--admin-border)" }}
        >
          <div className="mb-3 flex gap-1">
            <button
              type="button"
              onClick={() => setTab("chats")}
              className="flex-1 rounded-lg py-2 text-sm font-semibold"
              style={{
                background:
                  tab === "chats"
                    ? "color-mix(in srgb, var(--admin-primary) 12%, transparent)"
                    : "transparent",
                color:
                  tab === "chats"
                    ? "var(--admin-primary)"
                    : "var(--admin-text-muted)",
              }}
            >
              Chats
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setTab("audit")}
                className="flex-1 rounded-lg py-2 text-sm font-semibold"
                style={{
                  background:
                    tab === "audit"
                      ? "color-mix(in srgb, var(--admin-accent) 12%, transparent)"
                      : "transparent",
                  color:
                    tab === "audit"
                      ? "var(--admin-accent)"
                      : "var(--admin-text-muted)",
                }}
              >
                Audit
              </button>
            )}
          </div>

          {tab === "chats" && (
            <>
              {canCreateGroups && (
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(true)}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
                  style={{ background: "var(--admin-primary)" }}
                >
                  <Users size={16} />
                  New group
                </button>
              )}

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--admin-text-subtle)" }}
                />
                <input
                  type="search"
                  placeholder="Search staff to start a DM"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className={`${adminInputClass} pl-9`}
                />
              </div>

              {staffSearch.trim() && (
                <div
                  className="mt-2 max-h-32 overflow-y-auto rounded-lg"
                  style={{ border: "1px solid var(--admin-border)" }}
                >
                  {filteredStaff.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => openDmWithStaff(s)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={listItems}
            activeId={activeId}
            onSelect={(id) => selectConversation(id)}
            emptyMessage={
              tab === "audit"
                ? "No conversations for audit"
                : "No chats yet — search staff to start a DM"
            }
          />
        </div>
      </div>

      {/* Right panel — thread */}
      <div
        className={`min-w-0 flex-1 ${
          mobileShowThread ? "flex flex-col" : "hidden md:flex md:flex-col"
        }`}
      >
        {activeConversation ? (
          <MessageThread
            conversation={activeConversation}
            currentUserId={currentUserId}
            members={members}
            staff={staff}
            createdById={createdById}
            canShareProducts={canShareProducts}
            canShareOrders={canShareOrders}
            canShareTickets={canShareTickets}
            canManageProducts={canManageProducts}
            canViewTickets={canViewTickets}
            canManageTickets={canManageTickets}
            showBack
            onBack={() => {
              setMobileShowThread(false);
              router.replace("/admin/messages");
            }}
          />
        ) : (
          <div
            className="flex flex-1 items-center justify-center p-8 text-center text-sm"
            style={{ color: "var(--admin-text-muted)" }}
          >
            Select a conversation or search staff to start a new DM
          </div>
        )}
      </div>

      <CreateGroupModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        staff={staff}
        onCreated={(id) => {
          void refreshLists();
          selectConversation(id);
        }}
      />
    </div>
  );
}
