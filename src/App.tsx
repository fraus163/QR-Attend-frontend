import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import StudentAttendanceTab from "./components/StudentAttendanceTab";
import TeacherAttendanceTab from "./components/TeacherAttendanceTab";
import ScheduleTab from "./components/ScheduleTab";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                    <Route path="/student" element={<MainPage role="STUDENT" />}>
                        <Route path="schedule" element={<ScheduleTab userRole="STUDENT" />} />
                        <Route path="attendance" element={<StudentAttendanceTab />} />
                        <Route index element={<Navigate to="schedule" replace />} />
                    </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
                    <Route path="/teacher" element={<MainPage role="TEACHER" />}>
                        <Route path="schedule" element={<ScheduleTab userRole="TEACHER" />} />
                        <Route path="attendance" element={<TeacherAttendanceTab />} />
                        <Route index element={<Navigate to="schedule" replace />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;