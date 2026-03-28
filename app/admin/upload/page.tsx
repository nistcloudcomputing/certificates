"use client";

import Card from "@/components/ui/Card";
import { FileUp, UploadCloud } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

type UploadResult = { fileName: string; fileKey: string };
type CsvPreviewUser = {
  id: string;
  email: string;
  name: string;
  fileKey: string;
};

export default function AdminUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [deletingFileKey, setDeletingFileKey] = useState<string | null>(null);
  const [deletingAllCertificates, setDeletingAllCertificates] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);

  const [importing, setImporting] = useState(false);
  const [deletingCsv, setDeletingCsv] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [deleteCsvMessage, setDeleteCsvMessage] = useState("");
  const [autoMap, setAutoMap] = useState(true);
  const [loadingCsvPreview, setLoadingCsvPreview] = useState(true);
  const [csvPreviewUsers, setCsvPreviewUsers] = useState<CsvPreviewUser[]>([]);
  const [csvPreviewMessage, setCsvPreviewMessage] = useState("");
  const [deletingCsvUserId, setDeletingCsvUserId] = useState<string | null>(null);
  const [deletingAllUsers, setDeletingAllUsers] = useState(false);
  const [savingManualEntry, setSavingManualEntry] = useState(false);
  const [manualEntryMessage, setManualEntryMessage] = useState("");

  const refreshUploadedFiles = useCallback(async () => {
    setLoadingFiles(true);

    try {
      const response = await fetch("/api/admin/upload", {
        cache: "no-store",
      });

      const data = (await response.json()) as {
        success: boolean;
        files?: UploadResult[];
        message?: string;
      };

      if (!response.ok || !data.success) {
        setUploadMessage(data.message || "Could not load uploaded files.");
        return;
      }

      setUploadedFiles(data.files || []);
    } catch {
      setUploadMessage("Could not load uploaded files.");
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const refreshCsvPreview = useCallback(async () => {
    setLoadingCsvPreview(true);
    setCsvPreviewMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const data = (await response.json()) as {
        success: boolean;
        users?: CsvPreviewUser[];
        message?: string;
      };

      if (!response.ok || !data.success) {
        setCsvPreviewMessage(data.message || "Could not load CSV verification data.");
        return;
      }

      setCsvPreviewUsers((data.users || []).slice(0, 5));
    } catch {
      setCsvPreviewMessage("Could not load CSV verification data.");
    } finally {
      setLoadingCsvPreview(false);
    }
  }, []);

  useEffect(() => {
    void refreshUploadedFiles();
    void refreshCsvPreview();
  }, [refreshUploadedFiles, refreshCsvPreview]);

  const handleCertificateUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadMessage("");

    const formElement = event.currentTarget;
    const input = formElement.elements.namedItem("files") as HTMLInputElement;
    if (!input.files?.length) {
      setUploadMessage("Select at least one file.");
      return;
    }

    const formData = new FormData();
    Array.from(input.files).forEach((file) => formData.append("files", file));

    setUploading(true);
    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        uploaded?: UploadResult[];
      };

      if (!response.ok || !data.success) {
        setUploadMessage(data.message || "Upload failed.");
        return;
      }

      await refreshUploadedFiles();
      setUploadMessage("Upload successful. File list refreshed.");
      formElement.reset();
    } catch {
      setUploadMessage("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleCsvImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImportMessage("");

    const formElement = event.currentTarget;
    const input = formElement.elements.namedItem("csv") as HTMLInputElement;
    if (!input.files?.length) {
      setImportMessage("Select a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", input.files[0]);
    formData.append("autoMap", String(autoMap));

    setImporting(true);
    try {
      const response = await fetch("/api/admin/import-csv", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        success: boolean;
        importedCount?: number;
        mappedCount?: number;
        skippedCount?: number;
        message?: string;
      };

      if (!response.ok || !data.success) {
        setImportMessage(data.message || "CSV import failed.");
        return;
      }

      setImportMessage(
        `Imported: ${data.importedCount || 0}, Auto-mapped: ${data.mappedCount || 0}, Skipped: ${data.skippedCount || 0}`,
      );
      await refreshCsvPreview();
      formElement.reset();
    } catch {
      setImportMessage("CSV import failed.");
    } finally {
      setImporting(false);
    }
  };

  const handleManualEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualEntryMessage("");

    const formElement = event.currentTarget;
    const nameInput = formElement.elements.namedItem("manual-name") as HTMLInputElement;
    const emailInput = formElement.elements.namedItem("manual-email") as HTMLInputElement;
    const keyIdInput = formElement.elements.namedItem("manual-keyid") as HTMLInputElement;
    const fileInput = formElement.elements.namedItem("manual-file") as HTMLInputElement;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const keyId = keyIdInput.value.trim();
    const selectedFile = fileInput.files?.[0] || null;

    if (!name) {
      setManualEntryMessage("Name is required.");
      return;
    }

    if (!email) {
      setManualEntryMessage("Email is required.");
      return;
    }

    if (!keyId && !selectedFile) {
      setManualEntryMessage("Provide keyId or upload a single certificate file.");
      return;
    }

    setSavingManualEntry(true);
    let uploadedFileKey = "";
    const cleanupUploadedFile = async (fileKey: string) => {
      try {
        await fetch("/api/admin/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileKey }),
        });
      } catch {
        // Ignore cleanup failures so we can return the original error message.
      }
    };

    try {
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("files", selectedFile);

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = (await uploadResponse.json()) as {
          success: boolean;
          message?: string;
          uploaded?: UploadResult[];
        };

        if (!uploadResponse.ok || !uploadData.success) {
          setManualEntryMessage(uploadData.message || "Certificate upload failed.");
          return;
        }

        uploadedFileKey = uploadData.uploaded?.[0]?.fileKey || "";
        if (!uploadedFileKey) {
          setManualEntryMessage("Certificate upload succeeded but no fileKey was returned.");
          return;
        }
      }

      const fileKeyToSave = uploadedFileKey || keyId;
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          fileKey: fileKeyToSave,
          keyId: fileKeyToSave,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        if (uploadedFileKey) {
          await cleanupUploadedFile(uploadedFileKey);
        }

        setManualEntryMessage(data.message || "Manual save failed.");
        return;
      }

      setManualEntryMessage(
        `Saved ${name} (${email}) with keyId: ${fileKeyToSave}`,
      );
      formElement.reset();
      await refreshCsvPreview();
      await refreshUploadedFiles();
    } catch {
      if (uploadedFileKey) {
        await cleanupUploadedFile(uploadedFileKey);
      }

      setManualEntryMessage("Manual save failed.");
    } finally {
      setSavingManualEntry(false);
    }
  };

  const handleDeleteUploadedFile = async (fileKey: string) => {
    setUploadMessage("");
    setDeletingFileKey(fileKey);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileKey }),
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok) {
        setUploadMessage(data.message || "File delete failed.");
        return;
      }

      await refreshUploadedFiles();
      setUploadMessage(data.message || "File deleted.");
    } catch {
      setUploadMessage("File delete failed.");
    } finally {
      setDeletingFileKey(null);
    }
  };

  const handleDeleteAllCertificates = async () => {
    const confirmed = window.confirm(
      "Delete all uploaded certificates? This will also clear certificate assignments from users.",
    );
    if (!confirmed) return;

    setUploadMessage("");
    setDeletingAllCertificates(true);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleteAll: true }),
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        deletedCount?: number;
        failedCount?: number;
      };

      if (!response.ok || !data.success) {
        setUploadMessage(data.message || "Delete all certificates failed.");
        return;
      }

      setUploadMessage(
        `${data.message || "Certificates deleted."} Deleted: ${data.deletedCount || 0}, Failed: ${data.failedCount || 0}`,
      );
      await refreshUploadedFiles();
      await refreshCsvPreview();
    } catch {
      setUploadMessage("Delete all certificates failed.");
    } finally {
      setDeletingAllCertificates(false);
    }
  };

  const handleCsvDelete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteCsvMessage("");

    const formElement = event.currentTarget;
    const input = formElement.elements.namedItem("csv-delete") as HTMLInputElement;
    if (!input.files?.length) {
      setDeleteCsvMessage("Select a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", input.files[0]);

    setDeletingCsv(true);
    try {
      const response = await fetch("/api/admin/delete-csv", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        success: boolean;
        deletedCount?: number;
        notFoundCount?: number;
        skippedCount?: number;
        message?: string;
      };

      if (!response.ok || !data.success) {
        setDeleteCsvMessage(data.message || "CSV delete failed.");
        return;
      }

      setDeleteCsvMessage(
        `Deleted: ${data.deletedCount || 0}, Not found: ${data.notFoundCount || 0}, Skipped: ${data.skippedCount || 0}`,
      );
      await refreshCsvPreview();
      formElement.reset();
    } catch {
      setDeleteCsvMessage("CSV delete failed.");
    } finally {
      setDeletingCsv(false);
    }
  };

  const handleDeleteCsvUser = async (id: string) => {
    setCsvPreviewMessage("");
    setDeletingCsvUserId(id);

    try {
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        setCsvPreviewMessage(data.message || "User delete failed.");
        return;
      }

      setCsvPreviewMessage(data.message || "User deleted.");
      await refreshCsvPreview();
    } catch {
      setCsvPreviewMessage("User delete failed.");
    } finally {
      setDeletingCsvUserId(null);
    }
  };

  const handleDeleteAllUsers = async () => {
    const confirmed = window.confirm("Delete all users? This action cannot be undone.");
    if (!confirmed) return;

    setCsvPreviewMessage("");
    setDeletingAllUsers(true);

    try {
      const response = await fetch("/api/admin/users?all=true", {
        method: "DELETE",
      });

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        deletedCount?: number;
      };

      if (!response.ok || !data.success) {
        setCsvPreviewMessage(data.message || "Delete all users failed.");
        return;
      }

      setCsvPreviewMessage(`${data.message || "Users deleted."} Deleted: ${data.deletedCount || 0}`);
      await refreshCsvPreview();
    } catch {
      setCsvPreviewMessage("Delete all users failed.");
    } finally {
      setDeletingAllUsers(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold sm:text-3xl">Upload & Import</h1>

      <Card>
        <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <UploadCloud className="size-4" />
            Upload Certificates
          </h2>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              disabled={loadingFiles}
              onClick={() => void refreshUploadedFiles()}
              className="w-full rounded-lg border border-white/20 px-3 py-1.5 text-xs text-zinc-200 transform-gpu transition hover:-translate-y-0.5 hover:border-white/35 hover:text-zinc-100 active:translate-y-0 disabled:opacity-60 sm:w-auto"
            >
              {loadingFiles ? "Refreshing..." : "Refresh List"}
            </button>
            <button
              type="button"
              disabled={deletingAllCertificates}
              onClick={() => void handleDeleteAllCertificates()}
              className="w-full rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-100 transform-gpu transition hover:-translate-y-0.5 hover:border-red-300/60 hover:text-red-50 active:translate-y-0 disabled:opacity-60 sm:w-auto"
            >
              {deletingAllCertificates ? "Deleting..." : "Delete All"}
            </button>
          </div>
        </div>
        <form className="space-y-3" onSubmit={handleCertificateUpload}>
          <input
            name="files"
            type="file"
            multiple
            className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-xl bg-zinc-800/80 px-4 py-2 text-sm transform-gpu transition hover:-translate-y-0.5 hover:bg-zinc-700/85 active:translate-y-0 disabled:opacity-60 sm:w-auto"
          >
            {uploading ? "Uploading..." : "Upload Certificates"}
          </button>
          {uploadMessage ? <p className="text-sm text-zinc-200">{uploadMessage}</p> : null}
        </form>

        <div className="mt-5 border-t border-white/10 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-200">Manual Single Certificate Entry</h3>
          <p className="mb-3 text-xs text-zinc-400">
            Add one user with `name`, `email`, and `keyId` manually. You can enter `keyId` directly or upload one file.
          </p>
          <form className="space-y-3" onSubmit={handleManualEntry}>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="manual-name"
                type="text"
                placeholder="Name"
                className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
              />
              <input
                name="manual-email"
                type="email"
                placeholder="Email"
                className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
              />
            </div>
            <input
              name="manual-keyid"
              type="text"
              placeholder="keyId (example: certificates/abc.pdf)"
              className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
            />
            <input
              name="manual-file"
              type="file"
              className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
            />
            <p className="text-xs text-zinc-400">
              If a file is selected, its generated S3 fileKey is used as `keyId`.
            </p>
            <button
              type="submit"
              disabled={savingManualEntry}
              className="w-full rounded-xl bg-zinc-800/80 px-4 py-2 text-sm transform-gpu transition hover:-translate-y-0.5 hover:bg-zinc-700/85 active:translate-y-0 disabled:opacity-60 sm:w-auto"
            >
              {savingManualEntry ? "Saving..." : "Save Single Entry"}
            </button>
            {manualEntryMessage ? <p className="text-sm text-zinc-200">{manualEntryMessage}</p> : null}
          </form>
        </div>

        {loadingFiles ? <p className="mt-4 text-sm text-zinc-300">Loading uploaded files...</p> : null}
        {!loadingFiles && !uploadedFiles.length ? <p className="mt-4 text-sm text-zinc-300">No uploaded files found.</p> : null}

        {uploadedFiles.length ? (
          <div className="mt-4 space-y-2 text-sm">
            <p className="font-medium text-zinc-200">Uploaded files</p>
            <ul className="space-y-1 text-zinc-300">
              {uploadedFiles.map((item) => (
                <li key={item.fileKey} className="flex flex-col items-start justify-between gap-2 rounded-lg border border-white/10 p-2 sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:p-0">
                  <span className="w-full text-xs sm:text-sm">
                    <span className="font-medium text-zinc-100">{item.fileName}</span>{" "}
                    <span className="text-zinc-300">→</span>{" "}
                    <span className="break-all text-zinc-200">{item.fileKey}</span>
                  </span>
                  <button
                    type="button"
                    disabled={deletingFileKey === item.fileKey}
                    onClick={() => void handleDeleteUploadedFile(item.fileKey)}
                    className="w-full rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-200 transform-gpu transition hover:-translate-y-0.5 hover:border-red-300/60 hover:text-red-100 active:translate-y-0 disabled:opacity-60 sm:w-auto"
                  >
                    {deletingFileKey === item.fileKey ? "Deleting..." : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card>
        <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileUp className="size-4" />
            Bulk User Import (CSV)
          </h2>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              disabled={loadingCsvPreview}
              onClick={() => void refreshCsvPreview()}
              className="w-full rounded-lg border border-white/20 px-3 py-1.5 text-xs text-zinc-200 transform-gpu transition hover:-translate-y-0.5 hover:border-white/35 hover:text-zinc-100 active:translate-y-0 disabled:opacity-60 sm:w-auto"
            >
              {loadingCsvPreview ? "Refreshing..." : "Refresh List"}
            </button>
            <button
              type="button"
              disabled={deletingAllUsers}
              onClick={() => void handleDeleteAllUsers()}
              className="w-full rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-100 transform-gpu transition hover:-translate-y-0.5 hover:border-red-300/60 hover:text-red-50 active:translate-y-0 disabled:opacity-60 sm:w-auto"
            >
              {deletingAllUsers ? "Deleting..." : "Delete All Users"}
            </button>
          </div>
        </div>
        <form className="space-y-3" onSubmit={handleCsvImport}>
          <input
            name="csv"
            type="file"
            accept=".csv,text/csv"
            className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
          />
          <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={autoMap} onChange={(event) => setAutoMap(event.target.checked)} />
            Auto-map `fileKey` by certificate filename patterns
          </label>
          <p className="text-xs text-zinc-400">CSV import supports `name` as required and `email` as optional.</p>
          <button
            type="submit"
            disabled={importing}
            className="w-full rounded-xl bg-zinc-800/80 px-4 py-2 text-sm transform-gpu transition hover:-translate-y-0.5 hover:bg-zinc-700/85 active:translate-y-0 disabled:opacity-60 sm:w-auto"
          >
            {importing ? "Importing..." : "Import CSV"}
          </button>
          {importMessage ? <p className="text-sm text-zinc-200">{importMessage}</p> : null}
        </form>

        <div className="mt-5 border-t border-white/10 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-200">Top 5 rows for verification</h3>
          {loadingCsvPreview ? <p className="text-sm text-zinc-300">Loading verification rows...</p> : null}
          {!loadingCsvPreview && !csvPreviewUsers.length ? (
            <p className="text-sm text-zinc-300">No user rows found.</p>
          ) : null}

          {csvPreviewUsers.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] text-left text-sm">
                <thead className="text-zinc-300">
                  <tr>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">fileKey</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreviewUsers.map((user) => (
                    <tr key={user.id} className="border-t border-white/10">
                      <td className="py-2 pr-3 text-zinc-100">{user.name}</td>
                      <td className="py-2 pr-3 text-zinc-300">{user.email}</td>
                      <td className="py-2 pr-3 text-zinc-300">{user.fileKey || "-"}</td>
                      <td className="py-2 pr-3">
                        <button
                          type="button"
                          disabled={deletingCsvUserId === user.id}
                          onClick={() => void handleDeleteCsvUser(user.id)}
                          className="w-full rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-200 transform-gpu transition hover:-translate-y-0.5 hover:border-red-300/60 hover:text-red-100 active:translate-y-0 disabled:opacity-60 sm:w-auto"
                        >
                          {deletingCsvUserId === user.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {csvPreviewMessage ? <p className="mt-2 text-sm text-zinc-200">{csvPreviewMessage}</p> : null}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-zinc-200">Delete Users via CSV</h3>
          <p className="mb-3 text-xs text-zinc-400">
            Upload a CSV with an `email` column to remove matching users.
          </p>
          <form className="space-y-3" onSubmit={handleCsvDelete}>
            <input
              name="csv-delete"
              type="file"
              accept=".csv,text/csv"
              className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={deletingCsv}
              className="w-full rounded-xl border border-red-400/30 px-4 py-2 text-sm text-red-100 transform-gpu transition hover:-translate-y-0.5 hover:border-red-300/60 hover:text-red-50 active:translate-y-0 disabled:opacity-60 sm:w-auto"
            >
              {deletingCsv ? "Deleting..." : "Delete From CSV"}
            </button>
            {deleteCsvMessage ? <p className="text-sm text-zinc-200">{deleteCsvMessage}</p> : null}
          </form>
        </div>
      </Card>
    </div>
  );
}
