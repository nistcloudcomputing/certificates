"use client";

import Card from "@/components/ui/Card";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AnalyticsData = {
  success: boolean;
  totals: {
    totalDownloads: number;
    successfulDownloads: number;
    failedAttempts: number;
    uniqueUsers: number;
  };
  downloadsOverTime: Array<{
    day: string;
    total: number;
    success: number;
    failure: number;
  }>;
  recentActivity: Array<{
    id: string;
    email: string;
    ip: string;
    status: "success" | "failure";
    timestamp: string;
  }>;
};

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch("/api/admin/analytics", { cache: "no-store" });
        const json = (await response.json()) as AnalyticsData;

        if (!response.ok || !json.success) {
          setError("Could not load analytics.");
          return;
        }

        setData(json);
      } catch {
        setError("Could not load analytics.");
      } finally {
        setLoading(false);
      }
    }

    void loadAnalytics();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold sm:text-3xl">Analytics</h1>
      {loading ? <p className="text-sm text-zinc-300">Loading analytics...</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card><p className="text-sm text-zinc-300">Total</p><p className="mt-2 text-2xl font-semibold">{data.totals.totalDownloads}</p></Card>
            <Card><p className="text-sm text-zinc-300">Success</p><p className="mt-2 text-2xl font-semibold text-zinc-100">{data.totals.successfulDownloads}</p></Card>
            <Card><p className="text-sm text-zinc-300">Failure</p><p className="mt-2 text-2xl font-semibold text-zinc-300">{data.totals.failedAttempts}</p></Card>
            <Card><p className="text-sm text-zinc-300">Unique</p><p className="mt-2 text-2xl font-semibold text-zinc-200">{data.totals.uniqueUsers}</p></Card>
          </div>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Downloads Over Time (Last 14 Days)</h2>
            <div className="h-64 w-full sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.downloadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="success" fill="#d4d4d8" />
                  <Bar dataKey="failure" fill="#52525b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Recent Activity</h2>
            <div className="overflow-x-auto">
              <table className="min-w-[680px] text-left text-sm">
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
                      <td className="py-2 pr-4 whitespace-nowrap text-zinc-400">{item.ip}</td>
                      <td className={`py-2 pr-4 ${item.status === "success" ? "text-zinc-100" : "text-zinc-400"}`}>
                        {item.status}
                      </td>
                      <td className="py-2 whitespace-nowrap text-zinc-400">{new Date(item.timestamp).toLocaleString()}</td>
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
