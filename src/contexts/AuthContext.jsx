import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, rtdb } from "../firebase"; 
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";


const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    // Default to NOT loading, so we show the UI immediately.
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    // Manual Login
    async function login(email, password) {
        setLoading(true);
        try {
            return await signInWithEmailAndPassword(auth, email, password);
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth State Changed:", user ? user.uid : "No User");
            setCurrentUser(user);
            if (user) {
                try {
                    const userRef = ref(rtdb, `users/${user.uid}`);
                    const snapshot = await get(userRef);
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        if (data.role === 'disabled' || data.role === 'deleted') {
                            await signOut(auth);
                            setCurrentUser(null);
                            setUserData(null);
                        } else {
                            setUserData(data);
                        }
                    } else {
                        // If no record exists, only the legacy admin gets admin rights
                        if (user.email === 'joggicottage@gmail.com') {
                            setUserData({ role: 'admin' });
                        } else {
                            setUserData({ role: 'none' });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    if (user.email === 'joggicottage@gmail.com') {
                        setUserData({ role: 'admin' });
                    } else {
                        setUserData({ role: 'none' });
                    }
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);


    const value = {
        currentUser,
        userData,

        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex items-center justify-center h-screen">
                    Loading Session...
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}
