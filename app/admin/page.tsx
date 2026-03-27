"use client";

import Card from "@/components/ui/Card";
import { useEffect, useState } from "react";

type AnalyticsResponse = {
  success: boolean;
  totals: {
    totalDownloads: number;
    successfulDownloads: number;
    failedAttempts: number;
    uniqueUsers: number;
  };
  recentActivity: Array<{
    id: string;
    email: string;
    ip: string;
    status: "success" | "failure";
    timestamp: string;
  }>;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/analytics", { cache: "no-store" });
        const json = (await response.json()) as AnalyticsResponse;

        if (!response.ok || !json.success) {
          setError("Could not load dashboard analytics.");
          return;
        }

        setData(json);
      } catch {
        setError("Could not load dashboard analytics.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {loading ? <p className="text-sm text-zinc-300">Loading dashboard...</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card><p className="text-sm text-zinc-300">Total Attempts</p><p className="mt-2 text-2xl font-semibold">{data.totals.totalDownloads}</p></Card>
            <Card><p className="text-sm text-zinc-300">Successful</p><p className="mt-2 text-2xl font-semibold text-zinc-100">{data.totals.successfulDownloads}</p></Card>
            <Card><p className="text-sm text-zinc-300">Failed</p><p className="mt-2 text-2xl font-semibold text-zinc-300">{data.totals.failedAttempts}</p></Card>
            <Card><p className="text-sm text-zinc-300">Unique Users</p><p className="mt-2 text-2xl font-semibold text-zinc-200">{data.totals.uniqueUsers}</p></Card>
          </div>

          <Card>
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-zinc-300">
                  <tr>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">IP</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity.map((item) => (
                    <tr key={item.id} className="border-t border-white/10">
                      <td className="py-2 pr-4">{item.email}</td>
                      <td className="py-2 pr-4 text-zinc-400">{item.ip}</td>
                      <td className={`py-2 pr-4 ${item.status === "success" ? "text-zinc-100" : "text-zinc-400"}`}>
                        {item.status}
                      </td>
                      <td className="py-2 text-zinc-400">{new Date(item.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
