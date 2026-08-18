import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/auth/AuthContext';
import { ProtectedRoute } from './modules/auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginView } from './modules/auth/LoginView';
import { DashboardView } from './modules/dashboard/DashboardView';
import { RawMaterialView } from './modules/raw-material/RawMaterialView';
import { PulpMillView } from './modules/pulp-mill/PulpMillView';
import { MachineView } from './modules/machine/MachineView';
import { RewindingReelConversionView } from './modules/rewinder/RewindingReelConversionView';
import { UtilitiesEtpView } from './modules/boiler/UtilitiesEtpView';
import { FinishedStockDispatchView } from './modules/dispatch/FinishedStockDispatchView';
import { StoreView } from './modules/store/StoreView';
import { ReportsView } from './modules/reports/ReportsView';
import { LabelStudioView } from './modules/label-studio/LabelStudioView';
import { AdminMasters } from './modules/admin/AdminMasters';
import { UserManagementView } from './modules/admin/UserManagementView';
import { QRScannerView } from './modules/rewinder/QRScannerView';
import { QRTraceabilityView } from './modules/rewinder/QRTraceabilityView';
import { OrdersView } from './modules/orders/OrdersView';
import { LabView } from './modules/lab/LabView';
import { ExperimentView } from './modules/experiment/ExperimentView';


import { DateFilterProvider } from './context/DateFilterContext';

import { OperatorProfileView } from './modules/profile/OperatorProfileView';
import { AdminProfileView } from './modules/profile/AdminProfileView';
import { useAuth } from './modules/auth/AuthContext';

function ProfileRouteWrapper({ defaultTab }: { defaultTab?: 'profile' | 'roles' | 'users' }) {
  const { user } = useAuth();
  if (user?.role === 'Admin') {
    return <AdminProfileView defaultTab={defaultTab} />;
  }
  return <OperatorProfileView />;
}

// Initialize i18n
import './i18n';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <DateFilterProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginView />} />

          {/* Protected Routes inside Layout Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute moduleName="dashboard">
                <Layout>
                  <DashboardView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute moduleName="dashboard">
                <Layout>
                  <ProfileRouteWrapper />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/role-management"
            element={
              <ProtectedRoute moduleName="admin_panel_audit">
                <Layout>
                  <ProfileRouteWrapper defaultTab="roles" />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/qr-scanner"
            element={
              <ProtectedRoute moduleName="dashboard">
                <Layout>
                  <QRScannerView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/traceability"
            element={
              <ProtectedRoute moduleName="dashboard">
                <Layout>
                  <QRTraceabilityView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/raw-material-stock"
            element={
              <ProtectedRoute moduleName="raw_material_stock">
                <Layout>
                  <RawMaterialView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute moduleName="orders">
                <Layout>
                  <OrdersView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pulp-mill-operations"
            element={
              <ProtectedRoute moduleName="pulp_mill_operations">
                <Layout>
                  <PulpMillView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/machine-production"
            element={
              <ProtectedRoute moduleName="machine_production">
                <Layout>
                  <MachineView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/rewinding-reel-conversion"
            element={
              <ProtectedRoute moduleName="rewinding_reel_conversion">
                <Layout>
                  <RewindingReelConversionView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/utilities-etp"
            element={
              <ProtectedRoute moduleName="utilities_etp">
                <Layout>
                  <UtilitiesEtpView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/stock-categorization"
            element={
              <ProtectedRoute moduleName="finished_stock_dispatch">
                <Layout>
                  <FinishedStockDispatchView />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/finished-stock-dispatch" element={<Navigate to="/stock-categorization" replace />} />

          <Route
            path="/spareparts-management"
            element={
              <ProtectedRoute moduleName="spareparts_management">
                <Layout>
                  <StoreView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/lab"
            element={
              <ProtectedRoute moduleName="lab">
                <Layout>
                  <LabView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/label-studio"
            element={
              <ProtectedRoute moduleName="label_studio">
                <Layout>
                  <LabelStudioView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/monthly-yearly-reporting"
            element={
              <ProtectedRoute moduleName="monthly_yearly_reporting">
                <Layout>
                  <ReportsView />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-panel-audit"
            element={
              <ProtectedRoute moduleName="admin_panel_audit">
                <Layout>
                  <AdminMasters />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/experiment"
            element={
              <ProtectedRoute moduleName="admin_panel_audit">
                <Layout>
                  <ExperimentView />
                </Layout>
              </ProtectedRoute>
            }
          />



          <Route
            path="/user-management"
            element={
              <ProtectedRoute moduleName="admin_panel_audit">
                <Layout>
                  <UserManagementView />
                </Layout>
              </ProtectedRoute>
            }
          />


          <Route
            path="/admin-profile"
            element={
              <ProtectedRoute moduleName="admin_panel_audit">
                <Layout>
                  <AdminProfileView />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </DateFilterProvider>
      </AuthProvider>
    </Router>
  );
}
