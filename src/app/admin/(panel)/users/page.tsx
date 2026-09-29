import UsersManager from "@/components/admin/UsersManager";
import { requireAdminPage } from "@/lib/auth/guard";
import { OWNER_ID } from "@/lib/auth/session";
import { listAdminUsers } from "@/lib/content/store";

export default async function AdminUsersPage() {
  const session = await requireAdminPage();
  const users = await listAdminUsers();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-stone-500">
        Everyone who can sign in to this admin panel. Anyone with the link to
        /admin/signup can create an account, so remove anyone you don&apos;t
        recognise.
      </p>
      <UsersManager
        owner={
          process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH
            ? process.env.ADMIN_USERNAME
            : null
        }
        initial={users}
        currentUserId={session.uid}
        ownerId={OWNER_ID}
      />
    </div>
  );
}
