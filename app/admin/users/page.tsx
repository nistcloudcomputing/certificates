"use client";

import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Search } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

type UserItem = {
  id: string;
  email: string;
  name: string;
  fileKey: string;
  downloadCount: number;
  certificateStatus: "assigned" | "unassigned";
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [editUser, setEditUser] = useState<UserItem | null>(null);

  const fetchUsers = useCallback(async (value: string) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(value)}`);
      const data = (await response.json()) as { success: boolean; users?: UserItem[]; message?: string };

      if (!response.ok || !data.success) {
        setMessage(data.message || "Failed to load users.");
        return;
      }

      setUsers(data.users || []);
    } catch {
      setMessage("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers("");
  }, [fetchUsers]);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchUsers(search);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = (await response.json()) as { success: boolean; message?: string };

    if (!response.ok || !data.success) {
      setMessage(data.message || "Delete failed.");
      return;
    }

    setUsers((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!editUser) return;

    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser),
    });

    const data = (await response.json()) as { success: boolean; user?: UserItem; message?: string };

    if (!response.ok || !data.success || !data.user) {
      setMessage(data.message || "Update failed.");
      return;
    }

    setUsers((prev) => prev.map((item) => (item.id === data.user?.id ? data.user : item)));
    setEditUser(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold sm:text-3xl">Users</h1>

      <Card>
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
          <div className="flex-1">
            <Input
              id="search"
              label="Search by email"
              icon={<Search className="size-4" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button className="w-full rounded-xl bg-white/10 px-4 py-2 text-sm transform-gpu transition hover:-translate-y-0.5 hover:bg-white/20 active:translate-y-0 sm:w-auto" type="submit">
            Search
          </button>
        </form>
      </Card>

      <Card>
        {loading ? <p className="text-sm text-zinc-300">Loading users...</p> : null}
        {message ? <p className="mb-3 text-sm text-red-300">{message}</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-[760px] text-left text-sm">
            <thead className="text-zinc-300">
              <tr>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Certificate</th>
                <th className="py-2 pr-3">Downloads</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-white/10">
                  <td className="py-2 pr-3">{user.email}</td>
                  <td className="py-2 pr-3">{user.name}</td>
                  <td className="py-2 pr-3">
                    <span className={user.certificateStatus === "assigned" ? "text-zinc-100" : "text-zinc-400"}>
                      {user.certificateStatus}
                    </span>
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">{user.downloadCount}</td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg border border-white/20 px-2 py-1 text-xs transform-gpu transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
                        onClick={() => setEditUser(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg border border-red-400/40 px-2 py-1 text-xs text-red-300 transform-gpu transition hover:-translate-y-0.5 hover:bg-red-500/20 active:translate-y-0"
                        onClick={() => void handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editUser ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Edit User</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              id="edit-email"
              label="Email"
              value={editUser.email}
              onChange={(event) => setEditUser((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
            />
            <Input
              id="edit-name"
              label="Name"
              value={editUser.name}
              onChange={(event) => setEditUser((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
            />
            <Input
              id="edit-file-key"
              label="Certificate fileKey"
              value={editUser.fileKey}
              onChange={(event) => setEditUser((prev) => (prev ? { ...prev, fileKey: event.target.value } : prev))}
              className="md:col-span-2"
            />
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button className="w-full rounded-xl bg-zinc-800/80 px-4 py-2 text-sm transform-gpu transition hover:-translate-y-0.5 hover:bg-zinc-700/85 active:translate-y-0 sm:w-auto" onClick={() => void handleSave()}>
              Save Changes
            </button>
            <button className="w-full rounded-xl border border-white/20 px-4 py-2 text-sm transform-gpu transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 sm:w-auto" onClick={() => setEditUser(null)}>
              Cancel
            </button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
