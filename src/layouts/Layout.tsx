import {
    AppBar,
    Box,
    Button,
    Drawer,
    IconButton,
    Stack,
    Toolbar,
    Typography
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import {type FC, useState} from "react";
import DrawerList from "../components/DrawerList.tsx";
import {Outlet} from "react-router-dom";

interface LayoutProps {
    role: string;
}

const Layout: FC<LayoutProps> = ({ role }) => {
    const [open, setOpen] = useState(false);

    const toggleDrawer = (newOpen: boolean) => {
        setOpen(newOpen);
    };

    return (
        <>
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton
                            onClick={() => toggleDrawer(true)}
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Учет посещаемости
                        </Typography>
                        <Button color="inherit">Выйти</Button>
                    </Toolbar>
                </AppBar>
            </Box>
            <Stack direction="column" spacing={2}>
                <Drawer open={open} onClose={() => toggleDrawer(false)}>
                    <DrawerList toggleDrawer={toggleDrawer} role={role}/>
                </Drawer>
            </Stack>
            <Outlet/>
        </>
    );
};

export default Layout;