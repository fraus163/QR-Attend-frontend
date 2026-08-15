import AdminPage from "./pages/AdminPage.tsx";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import StudentPage from "./pages/StudentPage.tsx";
import TeacherPage from "./pages/TeacherPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SubjectTab from "./components/SubjectTab.tsx";

function App() {
  return (
      <BrowserRouter>
        <Routes>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/student" element={<StudentPage/>}/>
            <Route path="/admin" element={<AdminPage/>}>
                <Route path="subjects" element={<SubjectTab/>}/>
            </Route>
            <Route path="/teacher" element={<TeacherPage/>}/>
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App
