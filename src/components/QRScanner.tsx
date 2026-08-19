import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert, Typography, Button } from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    onScan: (data: string) => void;
    onError?: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannedRef = useRef<boolean>(false);
    const isMounted = useRef<boolean>(true);
    const containerId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`);

    useEffect(() => {
        isMounted.current = true;
        scannedRef.current = false;

        const startScanner = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error(
                        'Камера недоступна. Браузер требует безопасное соединение (HTTPS) или доступ заблокирован.'
                    );
                }

                const element = document.getElementById(containerId.current);
                if (!element) {
                    return;
                }

                const html5QrCode = new Html5Qrcode(containerId.current);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                };

                await html5QrCode.start(
                    { facingMode: 'environment' },
                    config,
                    (decodedText) => {
                        // Блокируем множественные срабатывания
                        if (isMounted.current && !scannedRef.current) {
                            scannedRef.current = true;
                            onScan(decodedText);
                        }
                    },
                    () => {}
                );

                if (isMounted.current) {
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('Ошибка инициализации камеры:', err);
                if (isMounted.current) {
                    const message = err?.message || 'Не удалось получить доступ к камере';
                    setError(message);
                    setLoading(false);
                    onError?.(message);
                }
            }
        };

        const timer = setTimeout(startScanner, 200);

        return () => {
            isMounted.current = false;
            clearTimeout(timer);

            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current
                            .stop()
                            .then(() => scannerRef.current?.clear())
                            .catch((err) => console.warn('Ошибка при остановке камеры:', err));
                    } else {
                        scannerRef.current.clear();
                    }
                } catch (e) {
                    console.warn('Ошибка очистки сканера:', e);
                }
                scannerRef.current = null;
            }
        };
    }, [onScan, onError]);

    if (error) {
        return (
            <Alert
                severity="error"
                action={
                    <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                        Повторить
                    </Button>
                }
                sx={{ width: '100%', my: 2 }}
            >
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
            {loading && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 280,
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    <CircularProgress size={36} />
                    <Typography variant="body2" color="text.secondary">
                        Подключение камеры...
                    </Typography>
                </Box>
            )}

            <Box
                id={containerId.current}
                sx={{
                    width: '100%',
                    minHeight: 280,
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: '#000',
                    display: loading ? 'none' : 'block',
                    boxShadow: 2,
                    '& video': {
                        width: '100% !important',
                        height: 'auto !important',
                        borderRadius: 2,
                    },
                }}
            />

            {!loading && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                    Наведите камеру на динамический QR-код на экране преподавателя
                </Typography>
            )}
        </Box>
    );
};

export default QRScanner;