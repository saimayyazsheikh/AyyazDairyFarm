import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import usePermissions from "../hooks/usePermissions";

export default function PrivateRoute({ children, module }) {
    const { currentUser, userData } = useAuth();
    const { canView, isAdmin } = usePermissions(module);

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (module && !canView && !isAdmin) {
        if (userData?.permissions) {
            const allowedModules = Object.keys(userData.permissions).filter(k => userData.permissions[k] !== 'none');
            if (allowedModules.length > 0) {
                const modPaths = {
                    dashboard: '/',
                    cattle: '/cattle',
                    milk: '/milk',
                    health: '/health',
                    inventory: '/inventory',
                    hr: '/hr',
                    finance: '/finance',
                    admin: '/settings'
                };
                for (let mod of allowedModules) {
                    if (modPaths[mod] && mod !== module) {
                         return <Navigate to={modPaths[mod]} />;
                    }
                }
            }
        }
        return <Navigate to="/login" />;
    }

    return children;
}
