import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('mediscan_user');
        if (!saved) return null;
        try {
            const parsed = JSON.parse(saved);
            // Auto-logout if session is older than 24 hours
            if (parsed.loginAt && Date.now() - parsed.loginAt > SESSION_DURATION_MS) {
                localStorage.removeItem('mediscan_user');
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    });
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const login = (userData) => {
        const sessionData = { ...userData, loginAt: Date.now() };
        setUser(sessionData);
        localStorage.setItem('mediscan_user', JSON.stringify(sessionData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mediscan_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, showLoginPrompt, setShowLoginPrompt }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook for easy access
export function useAuth() {
    return useContext(AuthContext);
}
