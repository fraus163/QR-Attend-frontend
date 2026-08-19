import React, { FC } from 'react';
import { AppBar, Box, Button, Toolbar, Typography, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import ScheduleTab from '../components/ScheduleTab';

interface LayoutProps {
    role: 'STUDENT' | 'TEACHER';
}

const Layout: FC<LayoutProps> = ({ role }) => {
    const navigate = useNavigate();

    const onLogout = () => {
        authApi.logout();
        navigate('/login');
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="sticky" elevation={1}>
                <Toolbar>
                    <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
                        QR Attend
                    </Typography>

                    <Chip
                        label={role === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                        color="secondary"
                        size="small"
                        sx={{ mr: 'auto', fontWeight: 500 }}
                    />

                    <Button onClick={onLogout} color="inherit" variant="outlined" size="small">
                        Выйти
                    </Button>
                </Toolbar>
            </AppBar>

            <ScheduleTab userRole={role} />
        </Box>
    );
};

export default Layout;