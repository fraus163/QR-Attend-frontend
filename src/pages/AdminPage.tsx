import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssessmentIcon from "@mui/icons-material/Assessment";
import GroupIcon from "@mui/icons-material/Group";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SubjectIcon from "@mui/icons-material/Subject";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import Layout from "../layouts/Layout.tsx";
import {ListItem, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";
import {NavLink} from "react-router-dom";

const AdminPage = () => {
    const tabs = [
        <ListItem disablePadding>
            <ListItemButton>
                <ListItemIcon><CalendarMonthIcon/></ListItemIcon>
                <ListItemText primary="Расписание"/>
            </ListItemButton>
        </ListItem>,
        <ListItem disablePadding>
            <ListItemButton>
                <ListItemIcon><AssessmentIcon/></ListItemIcon>
                <ListItemText primary="Посещаемость"/>
            </ListItemButton>
        </ListItem>,
        <ListItem disablePadding>
            <ListItemButton>
                <ListItemIcon><GroupIcon/></ListItemIcon>
                <ListItemText primary="Группы"/>
            </ListItemButton>
        </ListItem>,
        <ListItem disablePadding>
            <ListItemButton component={NavLink} to="/admin/subjects">
                <ListItemIcon><SubjectIcon/></ListItemIcon>
                <ListItemText primary="Дисциплины"/>
            </ListItemButton>
        </ListItem>,
        <ListItem disablePadding>
            <ListItemButton>
                <ListItemIcon><ManageAccountsIcon/></ListItemIcon>
                <ListItemText primary="Пользователи"/>
            </ListItemButton>
        </ListItem>,
        <ListItem disablePadding>
            <ListItemButton>
                <ListItemIcon><AccountBoxIcon/></ListItemIcon>
                <ListItemText primary="Профиль"/>
            </ListItemButton>
        </ListItem>
    ];

    return (
        <Layout tabs={tabs}/>
    );
};

export default AdminPage;