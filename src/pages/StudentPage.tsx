import type {JSX} from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssessmentIcon from "@mui/icons-material/Assessment";
import QrCodeIcon from '@mui/icons-material/QrCode';
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import Layout from "../layouts/Layout.tsx";

const StudentPage = () => {
    const studentTabs = new Map<string, JSX.Element>([
        ["Расписание", <CalendarMonthIcon/>],
        ["Посещаемость", <AssessmentIcon/>],
        ["Сканировать QR-код", <QrCodeIcon/>],
        ["Профиль", <AccountBoxIcon/>],
    ]);

    return (
        <Layout tabs={studentTabs}/>
    );
};

export default StudentPage;