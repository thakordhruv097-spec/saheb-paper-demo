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
import { DispatchView } from './modules/dispatch/DispatchView';


import { DateFilterProvider } from './context/DateFilterContext';

import { OperatorProfileView } from './modules/profile/OperatorProfileView';
import { AdminProfileView } from './modules/profile/AdminProfileView';
import { MobileProfileView } from './modules/profile/MobileProfileView';
import { useAuth } from './modules/auth/AuthContext';

function ProfileRouteWrapper({ defaultTab }: { defaultTab?: 'profile' | 'roles' | 'users' }) {
  const { user } = useAuth();

  if (defaultTab === 'roles') {
    return user?.role === 'Admin' ? <AdminProfileView defaultTab="roles" /> : <OperatorProfileView />;
  }
  if (defaultTab === 'users') {
    return user?.role === 'Admin' ? <AdminProfileView defaultTab="users" /> : <OperatorProfileView />;
  }

  return (
    <>
      {/* Mobile Version: Exact pattern matching the reference screenshot */}
      <div className="block md:hidden w-full">
        <MobileProfileView />
      </div>

      {/* Desktop Version: Full multi-tab dashboard layout */}
      <div className="hidden md:block w-full">
        {user?.role === 'Admin' ? <AdminProfileView defaultTab={defaultTab} /> : <OperatorProfileView />}
      </div>
    </>
  );
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

            {/* Utilities & ETP Routes */}
            <Route
              path="/utilities-&-etp/boiler-operations"
              element={
                <ProtectedRoute moduleName="boiler">
                  <Layout>
                    <UtilitiesEtpView initialTab="boiler" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/utilites-&-etp/boiler-operations"
              element={<Navigate to="/utilities-&-etp/boiler-operations" replace />}
            />

            <Route
              path="/utilities-&-etp/etp-water-&-chemicals"
              element={
                <ProtectedRoute moduleName="etp">
                  <Layout>
                    <UtilitiesEtpView initialTab="etp_chemicals" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/utilities-&-etp/electricity-&-power-grid"
              element={
                <ProtectedRoute moduleName="electricity">
                  <Layout>
                    <UtilitiesEtpView initialTab="electricity" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Aliases & Fallbacks */}
            <Route
              path="/utilities-&-etp"
              element={<Navigate to="/utilities-&-etp/boiler-operations" replace />}
            />
            <Route
              path="/utilites-&-etp"
              element={<Navigate to="/utilities-&-etp/boiler-operations" replace />}
            />
            <Route
              path="/utilities-etp"
              element={<Navigate to="/utilities-&-etp/boiler-operations" replace />}
            />
            <Route
              path="/utilities-etp/boiler-operations"
              element={<Navigate to="/utilities-&-etp/boiler-operations" replace />}
            />
            <Route
              path="/utilities-etp/etp-water-&-chemicals"
              element={<Navigate to="/utilities-&-etp/etp-water-&-chemicals" replace />}
            />
            <Route
              path="/utilities-etp/electricity-&-power-grid"
              element={<Navigate to="/utilities-&-etp/electricity-&-power-grid" replace />}
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
              path="/dispatch-receipt"
              element={<Navigate to="/dispatch-receipt/draft-packing-slip" replace />}
            />

            <Route
              path="/dispatch-receipt/draft-packing-slip"
              element={
                <ProtectedRoute moduleName="dispatch_receipt">
                  <Layout>
                    <DispatchView initialTab="create_slip" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dispatch-receipt/packing-slips-&-challans"
              element={
                <ProtectedRoute moduleName="dispatch_receipt">
                  <Layout>
                    <DispatchView initialTab="slips_list" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dispatch-receipt/dispatched-reels"
              element={
                <ProtectedRoute moduleName="dispatch_receipt">
                  <Layout>
                    <DispatchView initialTab="dispatched_vault" />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dispatch-receipt/packing-slips-and-challans"
              element={<Navigate to="/dispatch-receipt/packing-slips-&-challans" replace />}
            />
            <Route
              path="/dispatch-receipt/packing-slips-challans"
              element={<Navigate to="/dispatch-receipt/packing-slips-&-challans" replace />}
            />
            <Route
              path="/experiment"
              element={<Navigate to="/dispatch-receipt/draft-packing-slip" replace />}
            />
            <Route
              path="/dispatch"
              element={<Navigate to="/dispatch-receipt/draft-packing-slip" replace />}
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
