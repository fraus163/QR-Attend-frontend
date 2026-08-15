import { useState } from 'react';
import { Container, Box, TextField, Button, Typography } from '@mui/material';
import {authApi} from "../api/authApi.ts";
import {useNavigate} from "react-router-dom";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const role = await authApi.login({email: email, password: password});
        if (role === 'ADMIN') {
            navigate('/admin');
        } else if (role === 'STUDENT') {
            navigate('/student');
        } else if (role === 'TEACHER') {
            navigate('/teacher');
        } else {
            navigate('/login');
        }
        console.log('Email:', email, 'Password:', password);
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
                <Typography variant="h5">Учет успеваемости</Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                        fullWidth
                        label="Email"
                        autoComplete="email"
                        autoFocus
                    />
                    <TextField
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        required
                        fullWidth
                        label="Password"
                        type="password"
                    />
                    {/*<Checkbox value="remember">Remember me</Checkbox>*/}
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                        <Button type="submit" variant="contained">Войти</Button>
                    </Box>
                    {/*<Link href="/forgot-password">Forgot password?</Link>*/}
                </form>
            </Box>
        </Container>
    );
}
