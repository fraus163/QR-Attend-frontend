import React from 'react';
import { Navigate } from 'react-router-dom';
import { authApi } from '../api/authApi';

type AllowedRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

interface ProtectedRouteProps {
    allowedRoles?: AllowedRole[];
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
    const token = authApi.getToken() || localStorage.getItem('token');
    const rawRole = authApi.getRole() || localStorage.getItem('userRole');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const normalizedRole = rawRole
        ? (rawRole.replace('ROLE_', '').toUpperCase() as AllowedRole)
        : null;

    if (allowedRoles && allowedRoles.length > 0) {
        if (!normalizedRole || !allowedRoles.includes(normalizedRole)) {
            const fallbackPath = normalizedRole === 'TEACHER' ? '/teacher' : '/student';
            return <Navigate to={fallbackPath} replace />;
        }
    }

    return children;
};

export default ProtectedRoute;