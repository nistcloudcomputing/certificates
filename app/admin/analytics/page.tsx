"use client";

import Card from "@/components/ui/Card";
import { FormEvent, useCallback, useEffect, useState } from "react";
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

type ActivityLog = {
  id: string;
  email: string;
  ip: string;
  status: "success" | "failure";
  timestamp: string;
};

type ActivityLogResponse = {
  success: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  logs: ActivityLog[];
  message?: string;
};

const LOG_PAGE_SIZE = 50;

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState("");
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsSearchInput, setLogsSearchInput] = useState("");
  const [logsSearch, setLogsSearch] = useState("");
  const [logsStatusInput, setLogsStatusInput] = useState<"all" | "success" | "failure">("all");
  const [logsStatus, setLogsStatus] = useState<"all" | "success" | "failure">("all");

  const loadLogs = useCallback(async (page: number, search: string, status: "all" | "success" | "failure") => {
    setLogsLoading(true);
    setLogsError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(LOG_PAGE_SIZE),
        status,
      });

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/admin/logs?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await response.json()) as ActivityLogResponse;

      if (!response.ok || !json.success) {
        setLogsError(json.message || "Could not load activity logs.");
        return;
      }

      setLogs(json.logs || []);
      setLogsTotal(json.total || 0);
      setLogsTotalPages(json.totalPages || 1);
    } catch {
      setLogsError("Could not load activity logs.");
    } finally {
      setLogsLoading(false);
    }
  }, []);

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

  useEffect(() => {
    void loadLogs(logsPage, logsSearch, logsStatus);
  }, [loadLogs, logsPage, logsSearch, logsStatus]);

  const handleApplyLogFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLogsPage(1);
    setLogsSearch(logsSearchInput.trim());
    setLogsStatus(logsStatusInput);
  };

  const handleResetLogFilters = () => {
    setLogsSearchInput("");
    setLogsSearch("");
    setLogsStatusInput("all");
    setLogsStatus("all");
    setLogsPage(1);
  };

  const canGoPrev = logsPage > 1;
  const canGoNext = logsPage < logsTotalPages;
  const startRow = logsTotal ? (logsPage - 1) * LOG_PAGE_SIZE + 1 : 0;
  const endRow = logsTotal ? Math.min(logsPage * LOG_PAGE_SIZE, logsTotal) : 0;

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

          <Card>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-lg font-semibold">All Activity Logs</h2>
              <form className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row" onSubmit={handleApplyLogFilters}>
                <input
                  type="text"
                  value={logsSearchInput}
                  onChange={(event) => setLogsSearchInput(event.target.value)}
                  placeholder="Search email or IP"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm sm:w-64"
                />
                <select
                  value={logsStatusInput}
                  onChange={(event) => setLogsStatusInput(event.target.value as "all" | "success" | "failure")}
                  className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                </select>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-800/80 px-4 py-2 text-sm transform-gpu transition hover:-translate-y-0.5 hover:bg-zinc-700/85 active:translate-y-0"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={handleResetLogFilters}
                  className="rounded-xl border border-white/20 px-4 py-2 text-sm transform-gpu transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
                >
                  Reset
                </button>
              </form>
            </div>

            {logsLoading ? <p className="text-sm text-zinc-300">Loading activity logs...</p> : null}
            {logsError ? <p className="mb-3 text-sm text-red-300">{logsError}</p> : null}

            {!logsLoading && !logs.length ? <p className="text-sm text-zinc-300">No logs found.</p> : null}

            {logs.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] text-left text-sm">
                  <thead className="text-zinc-300">
                    <tr>
                      <th className="py-2 pr-4">Log ID</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">IP</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((item) => (
                      <tr key={item.id} className="border-t border-white/10">
                        <td className="py-2 pr-4 text-zinc-400">{item.id}</td>
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
            ) : null}

            <div className="mt-4 flex flex-col items-start justify-between gap-2 text-sm text-zinc-300 sm:flex-row sm:items-center">
              <p>
                Showing {startRow}-{endRow} of {logsTotal}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!canGoPrev}
                  onClick={() => setLogsPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs transform-gpu transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => setLogsPage((prev) => prev + 1)}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs transform-gpu transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
