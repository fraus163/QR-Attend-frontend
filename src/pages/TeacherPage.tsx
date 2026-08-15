import type {JSX} from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PlayLessonIcon from '@mui/icons-material/PlayLesson';
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import Layout from "../layouts/Layout.tsx";

const TeacherPage = ()=> {
    const teacherTabs = new Map<string, JSX.Element>([
        ["Расписание", <CalendarMonthIcon/>],
        ["Посещаемость", <AssessmentIcon/>],
        ["Занятия", <PlayLessonIcon/>],
        ["Профиль", <AccountBoxIcon/>],
    ]);

    return (
        <Layout tabs={teacherTabs}/>
    );
};

export default TeacherPage;