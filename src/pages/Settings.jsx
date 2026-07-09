import React, { useState, useEffect } from "react";
import { rtdb, createSecondaryApp } from "../firebase";
import { ref, get, set, remove, onValue } from "firebase/database";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { deleteApp } from "firebase/app";
import { Trash2, UserPlus, Save, Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import Layout from "../components/Layout";

const modules = [
    { key: "dashboard", label: "Dashboard" },
    { key: "cattle", label: "Cattle" },
    { key: "milk", label: "Milk Management" },
    { key: "health", label: "Health Records" },
    { key: "inventory", label: "Inventory" },
    { key: "hr", label: "HR Management" },
    { key: "finance", label: "Finance / Expenses" }
];

export default function Settings() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { addToast } = useToast();

    // Form state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [permissions, setPermissions] = useState({
        dashboard: 'none',
        cattle: 'none',
        milk: 'none',
        health: 'none',
        inventory: 'none',
        hr: 'none',
        finance: 'none'
    });

    useEffect(() => {
        const usersRef = ref(rtdb, "users");
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const usersList = Object.keys(data).map(uid => ({
                    uid,
                    ...data[uid]
                }));
                // Filter out legacy admins (no role) and explicitly 'admin'
                const rbacUsers = usersList.filter(u => u.role !== 'admin' && u.role);
                setUsers(rbacUsers);
            } else {
                setUsers([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handlePermissionChange = (modKey, val) => {
        setPermissions(prev => ({ ...prev, [modKey]: val }));
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            addToast("Email and password are required.", "error");
            return;
        }

        setIsCreating(true);
        let secondaryApp = null;
        let existingUid = null;

        // Check if user already exists in our local DB list (e.g. they were soft-deleted)
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            existingUid = existingUser.uid;
        }

        try {
            let targetUid = existingUid;

            // Only attempt to create a new Auth account if they don't already exist in our DB
            if (!existingUid) {
                secondaryApp = createSecondaryApp();
                const sAuth = getAuth(secondaryApp);
                const userCredential = await createUserWithEmailAndPassword(sAuth, email, password);
                targetUid = userCredential.user.uid;
            }

            // Save or Reactivate in DB
            await set(ref(rtdb, `users/${targetUid}`), {
                email,
                role: 'custom',
                permissions: permissions,
                createdAt: existingUser ? existingUser.createdAt : new Date().toISOString()
            });

            addToast(existingUser ? "User reactivated and permissions updated!" : "User created successfully!", "success");
            setEmail("");
            setPassword("");
            setPermissions({
                dashboard: 'none',
                cattle: 'none',
                milk: 'none',
                health: 'none',
                inventory: 'none',
                hr: 'none',
                finance: 'none'
            });
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                addToast("Email is already used in Authentication. To recreate, delete it from the Firebase Console first.", "error");
            } else {
                addToast("Failed to create user: " + error.message, "error");
            }
        } finally {
            if (secondaryApp) {
                try {
                    await deleteApp(secondaryApp);
                } catch (e) {
                    console.error("Failed to cleanup secondary app", e);
                }
            }
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (uid) => {
        if (!window.confirm("Are you sure you want to revoke this user's access?")) return;
        
        try {
            // We set role to 'deleted' to ensure they lose access but don't accidentally become admin
            const userRef = ref(rtdb, `users/${uid}`);
            const snapshot = await get(userRef);
            if(snapshot.exists()){
                const data = snapshot.val();
                await set(userRef, {
                    ...data,
                    role: 'deleted',
                    permissions: {}
                });
                addToast("User access revoked.", "success");
            }
        } catch (error) {
            console.error(error);
            addToast("Failed to revoke access.", "error");
        }
    };

    return (
        <Layout>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Shield className="mr-3 text-primary" /> Settings & RBAC
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create User Form */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <UserPlus size={18} className="mr-2" /> Create Custom User
                    </h2>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="doctor@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full border rounded-lg pl-3 pr-10 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="Min 6 characters"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-primary transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Module Permissions</h3>
                            <div className="space-y-3">
                                {modules.map(mod => (
                                    <div key={mod.key} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">{mod.label}</span>
                                        <select
                                            value={permissions[mod.key] || 'none'}
                                            onChange={(e) => handlePermissionChange(mod.key, e.target.value)}
                                            className="text-sm border rounded p-1 outline-none focus:ring-1 focus:ring-primary bg-gray-50"
                                        >
                                            <option value="none">None</option>
                                            <option value="view">View</option>
                                            <option value="edit">Edit</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full mt-4 bg-primary text-white py-2 rounded-lg flex items-center justify-center hover:bg-primary/90 transition disabled:opacity-50"
                        >
                            <Save size={18} className="mr-2" />
                            {isCreating ? "Creating..." : "Save User"}
                        </button>
                    </form>
                </div>

                {/* Users List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold">Active Custom Users</h2>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading users...</div>
                    ) : users.filter(u => u.role !== 'deleted').length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No custom users created yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="p-4 font-medium">Email</th>
                                        <th className="p-4 font-medium">Permissions</th>
                                        <th className="p-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.filter(u => u.role !== 'deleted').map(user => (
                                        <tr key={user.uid} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-800">{user.email}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(user.permissions || {}).map(([key, val]) => {
                                                        if (val === 'none') return null;
                                                        const m = modules.find(x => x.key === key);
                                                        return (
                                                            <span key={key} className={`text-xs px-2 py-1 rounded-full ${val === 'edit' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {m?.label || key}: {val.toUpperCase()}
                                                            </span>
                                                        )
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser(user.uid)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                                                    title="Revoke Access"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </Layout>
    );
}
