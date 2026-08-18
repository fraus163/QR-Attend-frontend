import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
    onScan: (data: string) => void;
    onError?: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerId = useRef(`qr-reader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const isMounted = useRef(true);
    const isStopping = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        isStopping.current = false;

        const startScanner = async () => {
            try {
                // Проверяем DOM элемент
                const element = document.getElementById(containerId.current);
                if (!element) {
                    throw new Error('DOM элемент не найден');
                }

                // Проверяем камеру
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                stream.getTracks().forEach(track => track.stop());
                console.log('✅ Камера доступна');

                const html5QrCode = new Html5Qrcode(containerId.current);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (isMounted.current && !isStopping.current) {
                            console.log('✅ QR отсканирован');
                            onScan(decodedText);
                        }
                    },
                    () => {}
                );

                if (isMounted.current) {
                    setLoading(false);
                }
            } catch (err: any) {
                console.error('❌ Ошибка сканера:', err);
                if (isMounted.current) {
                    setError(err?.message || 'Не удалось открыть камеру');
                    setLoading(false);
                    onError?.(err?.message || 'Не удалось открыть камеру');
                }
            }
        };

        // Ждем рендера DOM
        setTimeout(startScanner, 300);

        return () => {
            isMounted.current = false;
            isStopping.current = true;

            if (scannerRef.current) {
                // Останавливаем сканер с обработкой ошибок
                scannerRef.current.stop()
                    .then(() => {
                        if (scannerRef.current) {
                            scannerRef.current.clear();
                        }
                    })
                    .catch((err) => {
                        console.warn('Ошибка остановки сканера:', err);
                    });
                scannerRef.current = null;
            }
        };
    }, [onScan, onError]);

    if (error) {
        return (
            <Alert severity="error" sx={{ width: '100%' }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
            {loading && (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 300,
                    flexDirection: 'column',
                    gap: 2
                }}>
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary">
                        Запуск камеры...
                    </Typography>
                </Box>
            )}
            <Box
                id={containerId.current}
                sx={{
                    width: '100%',
                    minHeight: 300,
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: '#000',
                    display: loading ? 'none' : 'block',
                    '& video': {
                        width: '100% !important',
                        height: 'auto !important',
                        borderRadius: 2,
                    }
                }}
            />
        </Box>
    );
};

export default QRScanner;