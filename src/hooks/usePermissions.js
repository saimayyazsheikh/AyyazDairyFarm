import { useAuth } from "../contexts/AuthContext";

export default function usePermissions(moduleName) {
    const { userData } = useAuth();

    if (!userData) {
        return { canView: false, canEdit: false, isAdmin: false };
    }

    const isAdmin = !userData.role || userData.role === 'admin';

    if (isAdmin) {
        return { canView: true, canEdit: true, isAdmin: true };
    }

    const perms = userData.permissions || {};
    const modulePerm = perms[moduleName];

    return {
        canView: modulePerm === 'view' || modulePerm === 'edit',
        canEdit: modulePerm === 'edit',
        isAdmin: false
    };
}
