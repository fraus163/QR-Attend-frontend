import {Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";
import type {FC} from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssessmentIcon from "@mui/icons-material/Assessment";
import {NavLink} from "react-router-dom";

interface DrawerProps {
    toggleDrawer: (open: boolean) => void;
    role: string;
}

const DrawerList: FC<DrawerProps> = ({ toggleDrawer, role }) => {
    return (
        <Box sx={{ width: 250 }} role="presentation" onClick={() => toggleDrawer(false)}>
            <List>
                <ListItem disablePadding>
                    <ListItemButton
                        component={NavLink}
                        to={role === 'STUDENT'? "/student/schedule" : "/teacher/schedule"}
                    >
                        <ListItemIcon><CalendarMonthIcon/></ListItemIcon>
                        <ListItemText primary="Расписание"/>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        component={NavLink}
                        to={role === 'STUDENT'? "/student/attendance" : "/teacher/attendance"}
                    >
                        <ListItemIcon><AssessmentIcon/></ListItemIcon>
                        <ListItemText primary="Посещаемость"/>
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );
};

export default DrawerList;