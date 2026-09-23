import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import LoginPage from '../modules/auth/pages/LoginPage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import SettingsPage from '../modules/settings/pages/SettingsPage';
import UsersPage from '../modules/users/pages/UsersPage';
import RolesPermissionsPage from '../modules/users/pages/RolesPermissionsPage';
import AuditLogPage from '../modules/users/pages/AuditLogPage';
import ReportsPage from '../modules/reports/pages/ReportsPage';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import HrPage from '../modules/hr/pages/HrPage';
import AttendancePage from '../modules/hr/pages/AttendancePage';
import LeavesPage from '../modules/hr/pages/LeavesPage';
import PayrollsPage from '../modules/hr/pages/PayrollsPage';
import ProductsPage from '../modules/inventory/pages/ProductsPage';
import CategoriesPage from '../modules/inventory/pages/CategoriesPage';
import WarehousesPage from '../modules/inventory/pages/WarehousesPage';
import StockTransferPage from '../modules/inventory/pages/StockTransferPage';
import CustomersPage from '../modules/sales/pages/CustomersPage';
import SalesPage from '../modules/sales/pages/SalesPage';
import CollectionPage from '../modules/sales/pages/CollectionPage';
import PosPage from '../modules/pos/pages/PosPage';
import PosSessionPage from '../modules/pos/pages/PosSessionPage';
import TablesPage from '../modules/pos/pages/TablesPage';
import SuppliersPage from '../modules/purchases/pages/SuppliersPage';
import PurchaseInvoicesPage from '../modules/purchases/pages/PurchaseInvoicesPage';
import PurchaseReturnsPage from '../modules/purchases/pages/PurchaseReturnsPage';
import PurchaseOrdersPage from '../modules/purchases/pages/PurchaseOrdersPage';
import AccountsPage from '../modules/accounting/pages/AccountsPage';
import QuotationsPage from '../modules/sales/pages/QuotationsPage';
import SalesReturnsPage from '../modules/sales/pages/SalesReturnsPage';
import BackupPage from '../modules/settings/pages/BackupPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        <LoadingSpinner text="جاري التحقق من الجلسة..." size={36} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        <LoadingSpinner size={36} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// POS session guard: blocks the selling screen until the cashier opens a shift.
// Any navigation to /pos without an open session is redirected to the open-shift screen.
const PosSessionGuard = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const response = await window.api?.pos?.activeSession({ cashier_id: user?.id });
      setHasSession(Boolean(response?.success && response.data));
    } catch {
      setHasSession(false);
    } finally {
      setChecking(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!checking && !hasSession) {
      navigate('/pos/session', { replace: true });
    }
  }, [checking, hasSession, navigate]);

  if (checking || !hasSession) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        <LoadingSpinner text="جاري التحقق من الوردية..." size={36} />
      </div>
    );
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Session-protected POS route: no selling without an open cashier shift */}
      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <PosSessionGuard>
              <PosPage />
            </PosSessionGuard>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/roles" element={<RolesPermissionsPage />} />
        <Route path="/audit-logs" element={<AuditLogPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/inventory" element={<ProductsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/stock-transfer" element={<StockTransferPage />} />

        {/* Future Phase Placeholders */}
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/collections" element={<CollectionPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/pos/session" element={<PosSessionPage />} />
        <Route path="/pos/tables" element={<TablesPage />} />
        <Route path="/purchases" element={<PurchaseInvoicesPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/purchase-returns" element={<PurchaseReturnsPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/sales-returns" element={<SalesReturnsPage />} />
        <Route path="/accounting" element={<AccountsPage />} />
        <Route path="/hr" element={<HrPage />} />
        <Route path="/hr/attendance" element={<AttendancePage />} />
        <Route path="/hr/leaves" element={<LeavesPage />} />
        <Route path="/hr/payrolls" element={<PayrollsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/backup" element={<BackupPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
