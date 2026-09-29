"use client";

import { useCallback, useState } from "react";
import { Loader2, ShieldCheck, Trash2, User } from "lucide-react";
import type { PublicAdminUser } from "@/lib/content/schema";
import { adminRequest } from "./api";
import Notice, { type NoticeState } from "./Notice";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "Asia/Kolkata",
});

export default function UsersManager({
  owner,
  initial,
  currentUserId,
  ownerId,
}: {
  owner: string | null;
  initial: PublicAdminUser[];
  currentUserId: string;
  ownerId: string;
}) {
  const [users, setUsers] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const dismiss = useCallback(() => setNotice(null), []);

  async function remove(user: PublicAdminUser) {
    if (!confirm(`Remove ${user.username}? They'll be signed out and can't sign in again.`)) return;
    setPendingId(user.id);
    try {
      await adminRequest(`/api/admin/users/${user.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setNotice({ type: "success", message: `${user.username} was removed.` });
    } catch (err) {
      setNotice({ type: "error", message: (err as Error).message });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <Notice notice={notice} onDismiss={dismiss} />
      <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
        {owner && (
          <Row
            icon={<ShieldCheck size={18} />}
            name={owner}
            detail="Owner · set in environment variables, can't be removed here"
            you={currentUserId === ownerId}
          />
        )}
        {users.map((user) => (
          <Row
            key={user.id}
            icon={<User size={18} />}
            name={user.username}
            detail={`Joined ${dateFormat.format(new Date(user.createdAt))}`}
            you={currentUserId === user.id}
            action={
              currentUserId !== user.id && (
                <button
                  type="button"
                  onClick={() => remove(user)}
                  disabled={pendingId === user.id}
                  className="rounded-md p-2 text-stone-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  aria-label={`Remove ${user.username}`}
                  title="Remove"
                >
                  {pendingId === user.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )
            }
          />
        ))}
      </ul>
      {users.length === 0 && (
        <p className="text-sm text-stone-500">No one else has signed up yet.</p>
      )}
    </div>
  );
}

function Row({
  icon,
  name,
  detail,
  you,
  action,
}: {
  icon: React.ReactNode;
  name: string;
  detail: string;
  you: boolean;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {name}
          {you && (
            <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs font-normal text-stone-600">
              You
            </span>
          )}
        </p>
        <p className="truncate text-sm text-stone-500">{detail}</p>
      </div>
      {action}
    </li>
  );
}
