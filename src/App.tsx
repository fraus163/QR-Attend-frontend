import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layouts/Layout";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                    path="/student"
                    element={
                        <ProtectedRoute allowedRoles={['STUDENT']}>
                            <Layout role="STUDENT" />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/teacher"
                    element={
                        <ProtectedRoute allowedRoles={['TEACHER']}>
                            <Layout role="TEACHER" />
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;