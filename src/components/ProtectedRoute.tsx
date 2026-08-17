import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    allowedRoles?: Array<'STUDENT' | 'TEACHER' | 'ADMIN'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole') as 'STUDENT' | 'TEACHER' | 'ADMIN' | null;

    console.log('ProtectedRoute check:', { token: !!token, userRole });

    if (!token) {
        console.log('No token, redirect to login');
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!userRole || !allowedRoles.includes(userRole)) {
            console.log(`Role ${userRole} not allowed, redirect to login`);
            return <Navigate to="/login" replace />;
        }
    }

    console.log('Access granted');
    return <Outlet />;
};

export default ProtectedRoute;