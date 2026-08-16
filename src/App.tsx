import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import MainPage from "./pages/MainPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import {StudentScheduleTab} from "./components/StudentScheduleTab.tsx";
import StudentAttendanceTab from "./components/StudentAttendanceTab.tsx";
import TeacherScheduleTab from "./components/TeacherScheduleTab.tsx";
import TeacherAttendanceTab from "./components/TeacherAttendanceTab.tsx";

function App() {
  return (
      <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/student" element={<MainPage role='STUDENT'/>}>
                <Route path="schedule" element={<StudentScheduleTab/>}/>
                <Route path="attendance" element={<StudentAttendanceTab/>}/>
            </Route>
            <Route path="/teacher" element={<MainPage role='TEACHER'/>}>
                <Route path="schedule" element={<TeacherScheduleTab/>}/>
                <Route path="attendance" element={<TeacherAttendanceTab/>}/>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App
