import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../context/SettingsContext';
import { useToast } from '../../../context/ToastContext';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Filter,
  RefreshCw,
  User,
  Shield,
  Building,
} from 'lucide-react';

const accountingDirectory = {
  SA: {
    name: 'الدليل المحاسبي السعودي',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية وما في حكمها', type: 'asset' },
          { code: '112', name: 'الاستثمارات قصيرة الأجل', type: 'asset' },
          { code: '113', name: 'الحسابات المدينة', type: 'asset' },
          { code: '114', name: 'المخزون', type: 'asset' },
          { code: '115', name: 'المصروفات المدفوعة مقدماً', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
          { code: '123', name: 'الاستثمارات طويلة الأجل', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'الأوراق الدائنة', type: 'liability' },
          { code: '213', name: 'المستحقات المستحقة', type: 'liability' },
          { code: '214', name: 'الإيرادات المقدمة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
          { code: '222', name: 'السندات', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
        { code: '43', name: 'إيرادات أخرى', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات البيع والتسويق', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية وعمومية', type: 'expense' },
        { code: '54', name: 'مصروفات تمويلية', type: 'expense' },
        { code: '55', name: 'مصروفات أخرى', type: 'expense' },
      ]},
    ],
  },
  EG: {
    name: 'الدليل المحاسبي المصري',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'الصندوق والبنوك', type: 'asset' },
          { code: '112', name: 'الأوراق المالية', type: 'asset' },
          { code: '113', name: 'العملاء', type: 'asset' },
          { code: '114', name: 'المخازن', type: 'asset' },
          { code: '115', name: 'المصروفات المقدمة', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول الثابتة', type: 'asset', children: [
          { code: '121', name: 'الأراضي والمباني', type: 'asset' },
          { code: '122', name: 'المعدات والآلات', type: 'asset' },
          { code: '123', name: 'وسائل النقل', type: 'asset' },
          { code: '124', name: 'الأثاث والتجهيزات', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الموردون', type: 'liability' },
          { code: '212', name: 'الأوراق الدائنة', type: 'liability' },
          { code: '213', name: 'الدائنون الآخرون', type: 'liability' },
          { code: '214', name: 'المستحقات الحكومية', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم طويلة الأجل', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطي القانوني', type: 'equity' },
        { code: '33', name: 'الأرباح المرحلة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'صافي المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
        { code: '43', name: 'إيرادات متنوعة', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة المبيعات', type: 'expense' },
        { code: '52', name: 'مصروفات بيعية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
        { code: '54', name: 'مصروفات تمويلية', type: 'expense' },
      ]},
    ],
  },
  AE: {
    name: 'الدليل المحاسبي الإماراتي',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية والبنوك', type: 'asset' },
          { code: '112', name: 'الاستثمارات قصيرة الأجل', type: 'asset' },
          { code: '113', name: 'الحسابات المدينة', type: 'asset' },
          { code: '114', name: 'المخزون', type: 'asset' },
          { code: '115', name: 'المصروفات المدفوعة مقدماً', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
          { code: '123', name: 'الاستثمارات طويلة الأجل', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'المستحقات المستحقة', type: 'liability' },
          { code: '213', name: 'الإيرادات المقدمة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
        { code: '43', name: 'إيرادات أخرى', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات تشغيلية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
        { code: '54', name: 'مصروفات تمويلية', type: 'expense' },
      ]},
    ],
  },
  BH: {
    name: 'الدليل المحاسبي البحريني',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية وما في حكمها', type: 'asset' },
          { code: '112', name: 'الحسابات المدينة', type: 'asset' },
          { code: '113', name: 'المخزون', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'المستحقات المستحقة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات تشغيلية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
      ]},
    ],
  },
  OM: {
    name: 'الدليل المحاسبي العماني',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية والبنوك', type: 'asset' },
          { code: '112', name: 'الحسابات المدينة', type: 'asset' },
          { code: '113', name: 'المخزون', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'المستحقات المستحقة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات تشغيلية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
      ]},
    ],
  },
  KW: {
    name: 'الدليل المحاسبي الكويتي',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية وما في حكمها', type: 'asset' },
          { code: '112', name: 'الحسابات المدينة', type: 'asset' },
          { code: '113', name: 'المخزون', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'المستحقات المستحقة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات تشغيلية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
      ]},
    ],
  },
  QA: {
    name: 'الدليل المحاسبي القطري',
    accounts: [
      { code: '1', name: 'الأصول', type: 'asset', children: [
        { code: '11', name: 'الأصول المتداولة', type: 'asset', children: [
          { code: '111', name: 'النقدية والبنوك', type: 'asset' },
          { code: '112', name: 'الحسابات المدينة', type: 'asset' },
          { code: '113', name: 'المخزون', type: 'asset' },
        ]},
        { code: '12', name: 'الأصول غير المتداولة', type: 'asset', children: [
          { code: '121', name: 'الأصول الثابتة', type: 'asset' },
          { code: '122', name: 'الأصول غير الملموسة', type: 'asset' },
        ]},
      ]},
      { code: '2', name: 'الخصوم', type: 'liability', children: [
        { code: '21', name: 'الخصوم المتداولة', type: 'liability', children: [
          { code: '211', name: 'الحسابات الدائنة', type: 'liability' },
          { code: '212', name: 'المستحقات المستحقة', type: 'liability' },
        ]},
        { code: '22', name: 'الخصوم غير المتداولة', type: 'liability', children: [
          { code: '221', name: 'القروض طويلة الأجل', type: 'liability' },
        ]},
      ]},
      { code: '3', name: 'حقوق الملكية', type: 'equity', children: [
        { code: '31', name: 'رأس المال', type: 'equity' },
        { code: '32', name: 'الاحتياطيات', type: 'equity' },
        { code: '33', name: 'الأرباح المحتجزة', type: 'equity' },
      ]},
      { code: '4', name: 'الإيرادات', type: 'revenue', children: [
        { code: '41', name: 'إيرادات المبيعات', type: 'revenue' },
        { code: '42', name: 'إيرادات الخدمات', type: 'revenue' },
      ]},
      { code: '5', name: 'المصروفات', type: 'expense', children: [
        { code: '51', name: 'تكلفة البضاعة المباعة', type: 'expense' },
        { code: '52', name: 'مصروفات تشغيلية', type: 'expense' },
        { code: '53', name: 'مصروفات إدارية', type: 'expense' },
      ]},
    ],
  },
};

const UsersPage = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { branches } = useSettings();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    roleId: '',
    branchId: 1,
    isActive: true,
  });
  const [deleteUserId, setDeleteUserId] = useState(null);

  // Load Roles
  useEffect(() => {
    const fetchRoles = async () => {
      if (window.api?.roles) {
        const res = await window.api.roles.list();
        if (res.success) setRoles(res.data);
      }
    };
    fetchRoles();
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        if (window.api?.users) {
          const res = await window.api.users.search({
            query: searchQuery,
            role_id: selectedRole ? Number(selectedRole) : undefined,
            is_active: selectedStatus !== '' ? Number(selectedStatus) : undefined,
            page,
            limit: pagination.limit,
          });

          if (res.success) {
            setUsers(res.data.items);
            setPagination({
              page: res.data.page,
              limit: res.data.limit,
              total: res.data.total,
              totalPages: res.data.totalPages,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, selectedRole, selectedStatus, pagination.limit]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleOpenModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setUserForm({
        fullName: userToEdit.full_name,
        username: userToEdit.username,
        password: '',
        email: userToEdit.email || '',
        phone: userToEdit.phone || '',
        roleId: String(userToEdit.role_id),
        branchId: userToEdit.branch_id || 1,
        isActive: !!userToEdit.is_active,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        fullName: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        roleId: roles.length > 0 ? String(roles[0].id) : '',
        branchId: 1,
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userForm.fullName || !userForm.username || (!editingUser && !userForm.password) || !userForm.roleId) {
      toast.error('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    try {
      setLoading(true);
      if (editingUser) {
        const res = await window.api.users.update({
          id: editingUser.id,
          ...userForm,
          currentUserId: currentUser?.id,
        });
        if (res.success) {
          toast.success(res.message);
          setModalOpen(false);
          fetchUsers(pagination.page);
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await window.api.users.create({
          ...userForm,
          currentUserId: currentUser?.id,
        });
        if (res.success) {
          toast.success(res.message);
          setModalOpen(false);
          fetchUsers(1);
        } else {
          toast.error(res.error);
        }
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      setLoading(true);
      const res = await window.api.users.delete({
        id: deleteUserId,
        currentUserId: currentUser?.id,
      });
      if (res.success) {
        toast.success(res.message);
        setDeleteUserId(null);
        fetchUsers(pagination.page);
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error(err.message || 'فشل حذف المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: '#', key: 'id', width: '60px' },
    {
      header: t('users.fullName'),
      key: 'full_name',
      render: (name, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            {name ? name.charAt(0) : 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{row.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: t('users.role'),
      key: 'role_name',
      render: (roleName) => <Badge variant="primary">{roleName || 'غير محدد'}</Badge>,
    },
    { header: t('users.email'), key: 'email', render: (val) => val || '—' },
    { header: t('users.phone'), key: 'phone', render: (val) => val || '—' },
    {
      header: t('users.userBranch'),
      key: 'branch_name',
      render: (val) => val || 'الفرع الرئيسي',
    },
    {
      header: t('common.status'),
      key: 'is_active',
      render: (isActive) => (
        <Badge variant={isActive ? 'success' : 'default'} dot>
          {isActive ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      header: t('common.actions'),
      key: 'actions',
      align: 'end',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            onClick={() => handleOpenModal(row)}
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-main)',
              cursor: 'pointer',
            }}
            title={t('common.edit')}
          >
            <Edit2 size={15} />
          </button>
          {row.username !== 'admin' && (
            <button
              onClick={() => setDeleteUserId(row.id)}
              style={{
                padding: '6px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: '#ef4444',
                cursor: 'pointer',
              }}
              title={t('common.delete')}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('users.title')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            إدارة حسابات المستخدمين وصلاحيات الدخول والفروع المسندة
          </p>
        </div>

        <Button variant="primary" icon={UserPlus} onClick={() => handleOpenModal()}>
          {t('users.addUser')}
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card noPadding>
        <div
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ flex: 1, minWidth: '240px' }}>
            <Input
              placeholder={t('common.search')}
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              placeholder="كل الأدوار"
              options={roles.map((r) => ({ value: String(r.id), label: r.name }))}
            />
          </div>

          <div style={{ width: '150px' }}>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              placeholder="كل الحالات"
              options={[
                { value: '1', label: t('common.active') },
                { value: '0', label: t('common.inactive') },
              ]}
            />
          </div>

          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={loading}
            onClick={() => fetchUsers(pagination.page)}
          >
            {t('common.refresh')}
          </Button>
        </div>

        {/* Table View */}
        <Table columns={columns} data={users} loading={loading} />

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={fetchUsers}
        />
      </Card>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? t('users.editUser') : t('users.addUser')}
      >
        <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label={t('users.fullName')}
            icon={User}
            value={userForm.fullName}
            onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
            required
            autoFocus
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label={t('users.username')}
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              disabled={!!editingUser}
              required
            />

            <Input
              label={t('users.password')}
              type="password"
              placeholder={editingUser ? t('users.passwordHint') : 'أدخل كلمة المرور'}
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required={!editingUser}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select
              label={t('users.role')}
              value={userForm.roleId}
              onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
              options={roles.map((r) => ({ value: String(r.id), label: r.name }))}
              required
            />

            <Select
              label={t('users.userBranch')}
              value={userForm.branchId}
              onChange={(e) => setUserForm({ ...userForm, branchId: Number(e.target.value) })}
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label={t('users.email')}
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            />

            <Input
              label={t('users.phone')}
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <input
              type="checkbox"
              id="is_active_user"
              checked={userForm.isActive}
              onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
            />
            <label htmlFor="is_active_user" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
              الحساب نشط ويمكنه تسجيل الدخول
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title={t('common.confirmDelete')}
        message={t('common.confirmDeleteMsg')}
        loading={loading}
      />
    </div>
  );
};

export default UsersPage;
