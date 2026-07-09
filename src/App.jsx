import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ConfirmationProvider } from "./contexts/ConfirmationContext";
import PrivateRoute from "./components/PrivateRoute";

// Lazy Load Pages to isolate crashes
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Cattle = lazy(() => import("./pages/Cattle"));
const Milk = lazy(() => import("./pages/Milk"));
const Health = lazy(() => import("./pages/Health"));
const Inventory = lazy(() => import("./pages/Inventory"));
const HR = lazy(() => import("./pages/HR"));
const Finance = lazy(() => import("./pages/Finance"));
const Settings = lazy(() => import("./pages/Settings"));


const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8 text-gray-500">
    Loading Component...
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <ConfirmationProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute module="dashboard">
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/cattle"
                  element={
                    <PrivateRoute module="cattle">
                      <Cattle />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/milk"
                  element={
                    <PrivateRoute module="milk">
                      <Milk />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/health"
                  element={
                    <PrivateRoute module="health">
                      <Health />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <PrivateRoute module="inventory">
                      <Inventory />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/hr"
                  element={
                    <PrivateRoute module="hr">
                      <HR />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/finance"
                  element={
                    <PrivateRoute module="finance">
                      <Finance />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute module="admin">
                      <Settings />
                    </PrivateRoute>
                  }
                />

                {/* Default redirect for unknown routes */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </ConfirmationProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
