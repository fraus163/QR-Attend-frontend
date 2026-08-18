import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layouts/Layout.tsx";
import VConsole from 'vconsole';

function App() {
    if (import.meta.env.DEV) {
        new VConsole();
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                    <Route path="/student" element={<Layout role="STUDENT" />}/>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
                    <Route path="/teacher" element={<Layout role="TEACHER" />}/>
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;