import React, { useCallback, useEffect, useState } from "react";
import { CloudDownload, CloudUpload, Trash2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../context/ToastContext";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Table from "../../../components/ui/Table";

const BackupPage = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadBackups = useCallback(async () => {
    const response = await window.api?.backup?.list();
    if (response?.success) setBackups(response.data);
  }, []);

  useEffect(() => { loadBackups(); }, [loadBackups]);

  const createBackup = async () => {
    setCreating(true);
    const response = await window.api?.backup?.create();
    if (response?.success) { toast.success(response.message); loadBackups(); }
    else toast.error(response?.error);
    setCreating(false);
  };

  const doRestore = async (filePath) => {
    setRestoringId(filePath);
    const response = await window.api?.backup?.restore(filePath);
    if (response?.success) {
      toast.success(response.message || t('backup.restoreCompleted'));
      // The restore replaces the whole database (settings, products, everything),
      // so every cached screen is now stale. Reload the app to pick up the
      // restored data instead of showing a mix of old and new rows.
      setTimeout(() => window.location.reload(), 900);
    } else {
      toast.error(response?.error);
      setRestoringId(null);
    }
  };

  const doDelete = async (filePath) => {
    setDeletingId(filePath);
    const response = await window.api?.backup?.delete(filePath);
    if (response?.success) { toast.success(response.message); loadBackups(); }
    else toast.error(response?.error);
    setDeletingId(null);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns = [
    { key: 'file_name', header: t('backup.fileName'), render: (value) => <strong>{value}</strong> },
    { key: 'size', header: t('backup.size'), render: (value) => formatSize(value) },
    { key: 'created_at', header: t('backup.date') },
    {
      key: 'actions', header: '', align: 'end',
      render: (_, row) => (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => doRestore(row.file_path)} loading={restoringId === row.file_path} title={t('backup.restore')} />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => doDelete(row.file_path)} style={{ color: "#ef4444" }} loading={deletingId === row.file_path} title={t('backup.delete')} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)" }}>{t('backup.title')}</h1><p style={{ color: "var(--text-muted)", marginTop: 4 }}>{t('backup.subtitle')}</p></div>
        <Button icon={CloudUpload} onClick={createBackup} loading={creating}>{t('backup.createBackup')}</Button>
      </div>
      <Card title={`${t('backup.title')} (${backups.length})`}>
        <Table columns={columns} data={backups} loading={loading} emptyMessage={t('backup.empty')} />
      </Card>
    </div>
  );
};

export default BackupPage;
