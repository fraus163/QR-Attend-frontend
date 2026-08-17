import { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { authApi } from "../api/authApi.ts";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { token, role } = await authApi.login({ email, password });

            // Токен и роль уже сохранились в authApi, но для уверенности:
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', role);

            // Редирект в зависимости от роли
            if (role === 'STUDENT') {
                navigate('/student/schedule');
            } else if (role === 'TEACHER') {
                navigate('/teacher/schedule');
            } else {
                navigate('/login');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка входа. Проверьте email и пароль.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
                <Typography variant="h5" gutterBottom>
                    Учет успеваемости
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <TextField
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                        fullWidth
                        label="Email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        disabled={loading}
                    />
                    <TextField
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        required
                        fullWidth
                        label="Пароль"
                        type="password"
                        value={password}
                        disabled={loading}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{ minWidth: 120 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Войти'}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Container>
    );
}