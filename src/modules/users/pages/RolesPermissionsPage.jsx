import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckSquare,
  Square,
  Users,
} from 'lucide-react';

const RolesPermissionsPage = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [roles, setRoles] = useState([]);
  const [permissionsGrouped, setPermissionsGrouped] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Role Edit/Create Modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const [deleteRoleId, setDeleteRoleId] = useState(null);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      if (window.api?.roles && window.api?.permissions) {
        const [rolesRes, permsRes] = await Promise.all([
          window.api.roles.list(),
          window.api.permissions.list(),
        ]);

        if (rolesRes.success) {
          setRoles(rolesRes.data);
          if (!selectedRole && rolesRes.data.length > 0) {
            setSelectedRole(rolesRes.data[0]);
            setSelectedPermissionIds(new Set(rolesRes.data[0].permissionIds || []));
          } else if (selectedRole) {
            const fresh = rolesRes.data.find((r) => r.id === selectedRole.id);
            if (fresh) {
              setSelectedRole(fresh);
              setSelectedPermissionIds(new Set(fresh.permissionIds || []));
            }
          }
        }

        if (permsRes.success) {
          setPermissionsGrouped(permsRes.data);
        }
      }
    } catch (err) {
      console.error('Error fetching roles/permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setSelectedPermissionIds(new Set(role.permissionIds || []));
  };

  const handleTogglePermission = (permId) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  const handleToggleModuleRow = (modulePerms) => {
    const allModuleSelected = modulePerms.every((p) => selectedPermissionIds.has(p.id));
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (allModuleSelected) {
        modulePerms.forEach((p) => next.delete(p.id));
      } else {
        modulePerms.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = [];
    Object.values(permissionsGrouped).forEach((group) => {
      group.forEach((p) => allIds.push(p.id));
    });
    setSelectedPermissionIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedPermissionIds(new Set());
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await window.api.roles.save({
        id: selectedRole.id,
        name: selectedRole.name,
        description: selectedRole.description,
        permissionIds: Array.from(selectedPermissionIds),
        currentUserId: currentUser?.id,
      });

      if (res.success) {
        toast.success('تم حفظ وتحديث مصفوفة الصلاحيات بنجاح');
        setRoles(res.data);
      } else {
        toast.error(res.error || 'فشل حفظ الصلاحيات');
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRoleModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ name: role.name, description: role.description || '' });
    } else {
      setEditingRole(null);
      setRoleForm({ name: '', description: '' });
    }
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      toast.error('اسم الدور مطلوب');
      return;
    }

    try {
      setSaving(true);
      const res = await window.api.roles.save({
        id: editingRole?.id,
        name: roleForm.name.trim(),
        description: roleForm.description ? roleForm.description.trim() : '',
        permissionIds: editingRole ? editingRole.permissionIds : [],
        currentUserId: currentUser?.id,
      });

      if (res.success) {
        toast.success(res.message);
        setRoleModalOpen(false);
        setRoles(res.data);
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleId) return;
    try {
      setSaving(true);
      const res = await window.api.roles.delete({
        id: deleteRoleId,
        currentUserId: currentUser?.id,
      });

      if (res.success) {
        toast.success(res.message);
        setDeleteRoleId(null);
        fetchRolesAndPermissions();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const moduleTitles = {
    dashboard: 'لوحة التحكم الرئيسية',
    users: 'إدارة المستخدمين',
    roles: 'الأدوار ومصفوفة الصلاحيات',
    settings: 'الإعدادات العامة والهوية',
    audit_logs: 'سجل تتبع العمليات',
    products: 'المنتجات والأصناف',
    inventory: 'المخزون والمستودعات',
    sales: 'المبيعات وعروض الأسعار',
    purchases: 'المشتريات وطلبات الشراء',
    pos: 'نقطة البيع (POS)',
    accounting: 'الحسابات ودفتر الأستاذ',
    hr: 'الموارد البشرية والرواتب',
    reports: 'التقارير المالية والتشغيلية',
    backup: 'النسخ الاحتياطي والاستعادة',
  };

  const actionTitles = {
    view: 'عرض',
    create: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    print: 'طباعة',
    export: 'تصدير',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('users.rolesManagement')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            تحديد الصلاحيات الدقيقة لكل دور وظيفي في كافة أقسام وعمليات النظام
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => handleOpenRoleModal()}>
          {t('users.addRole')}
        </Button>
      </div>

      {/* Two Column Layout: Roles List + Permissions Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 320px) 1fr',
          gap: '24px',
          alignItems: 'flex-start',
        }}
      >
        {/* Roles List */}
        <Card title="الأدوار الوظيفية المسجلة" noPadding>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', gap: '8px' }}>
            {roles.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--border-subtle)',
                    border: isSelected ? '1px solid var(--primary-color)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck
                        size={18}
                        style={{ color: isSelected ? 'var(--primary-color)' : 'var(--text-muted)' }}
                      />
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: isSelected ? 'var(--primary-color)' : 'var(--text-main)',
                        }}
                      >
                        {role.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Badge variant="default" size="sm">
                        <Users size={12} />
                        {role.user_count || 0}
                      </Badge>
                      {!role.is_system && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRoleModal(role);
                            }}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteRoleId(role.id);
                            }}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {role.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {role.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Permissions Matrix */}
        <Card
          title={`مصفوفة الصلاحيات: ${selectedRole?.name || 'اختر دوراً'}`}
          subtitle="فعّل الصلاحيات المسموح بها لهذا الدور في كل وحدة"
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                {t('users.selectAll')}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDeselectAll}>
                {t('users.deselectAll')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Save}
                loading={saving}
                onClick={handleSavePermissions}
              >
                {t('common.save')}
              </Button>
            </div>
          }
          noPadding
        >
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--border-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '14px 20px', textAlign: 'start', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    الوحدة / القسم
                  </th>
                  {['view', 'create', 'edit', 'delete', 'print', 'export'].map((actionKey) => (
                    <th
                      key={actionKey}
                      style={{
                        padding: '12px 10px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {actionTitles[actionKey]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionsGrouped).map(([moduleKey, perms]) => {
                  const allSelected = perms.every((p) => selectedPermissionIds.has(p.id));

                  return (
                    <tr
                      key={moduleKey}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleModuleRow(perms)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: allSelected ? 'var(--primary-color)' : 'var(--text-muted)',
                            }}
                            title="تحديد / إلغاء تحديد كامل القسم"
                          >
                            {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                          <span>{moduleTitles[moduleKey] || moduleKey}</span>
                        </div>
                      </td>

                      {['view', 'create', 'edit', 'delete', 'print', 'export'].map((actionKey) => {
                        const perm = perms.find((p) => p.action === actionKey);
                        if (!perm) {
                          return (
                            <td key={actionKey} style={{ textAlign: 'center', color: 'var(--border-color)' }}>
                              —
                            </td>
                          );
                        }

                        const isChecked = selectedPermissionIds.has(perm.id);

                        return (
                          <td key={actionKey} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(perm.id)}
                              style={{
                                width: '18px',
                                height: '18px',
                                accentColor: 'var(--primary-color)',
                                cursor: 'pointer',
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add / Edit Role Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={editingRole ? 'تعديل الدور' : t('users.addRole')}
      >
        <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label={t('users.roleName')}
            value={roleForm.name}
            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
            required
            autoFocus
          />

          <Input
            label={t('users.roleDescription')}
            value={roleForm.description}
            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setRoleModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Role */}
      <ConfirmDialog
        isOpen={!!deleteRoleId}
        onClose={() => setDeleteRoleId(null)}
        onConfirm={handleDeleteRole}
        title="تأكيد حذف الدور"
        message="هل أنت متأكد من رغبتك في حذف هذا الدور؟"
        loading={saving}
      />
    </div>
  );
};

export default RolesPermissionsPage;
