import {
    AppBar,
    Box,
    Button,
    Toolbar,
    Typography
} from "@mui/material";
import {type FC} from "react";
import {Outlet, useNavigate} from "react-router-dom";
import {authApi} from "../api/authApi.ts";
import ScheduleTab from "../components/ScheduleTab.tsx";

interface LayoutProps {
    role: 'STUDENT' | 'TEACHER';
}

const Layout: FC<LayoutProps> = ({ role }) => {
    const navigate = useNavigate();

    const onLogout = () => {
        authApi.logout();
        navigate("/login")
    }

    return (
        <>
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Учет посещаемости
                        </Typography>
                        <Button onClick={onLogout} color="inherit">Выйти</Button>
                    </Toolbar>
                </AppBar>
            </Box>
            <ScheduleTab userRole={role}/>
        </>
    );
};

export default Layout;