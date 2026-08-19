import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
    Pagination,
    Paper,
    Grid,
    CircularProgress,
    Alert,
    InputAdornment,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    IconButton,
    Tab,
    Tabs,
    TextField,
    LinearProgress,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';
import {
    CalendarToday,
    Clear,
    Refresh,
    Schedule,
    QrCodeScanner,
    CheckCircle,
    AccessTime,
    Close,
    CameraAlt,
    EventNote,
} from '@mui/icons-material';
import { lessonsApi } from '../api/lessonsApi';
import type {
    FetchLessonsParams,
    LessonResponse,
    LessonStatus,
    QRCodeResponse,
} from '../types/Lesson';
import QRCode from 'qrcode';
import QRScanner from './QRScanner';
import StudentAttendanceTab from './StudentAttendanceTab';
import TeacherAttendanceTab from './TeacherAttendanceTab';

interface ScheduleComponentProps {
    pageSize?: number;
    onLessonClick?: (lesson: LessonResponse) => void;
    userRole?: 'STUDENT' | 'TEACHER' | string;
}

interface GroupedLessons {
    [date: string]: LessonResponse[];
}

const QR_TTL_SECONDS = 5;

const ScheduleTab: React.FC<ScheduleComponentProps> = ({
                                                           pageSize = 10,
                                                           onLessonClick,
                                                           userRole = 'STUDENT',
                                                       }) => {
    const isTeacher = userRole.toUpperCase().includes('TEACHER');

    const [lessons, setLessons] = useState<LessonResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<number>(0);

    const [qrDialogOpen, setQrDialogOpen] = useState<boolean>(false);
    const [selectedLesson, setSelectedLesson] = useState<LessonResponse | null>(null);
    const [qrTokenData, setQrTokenData] = useState<QRCodeResponse | null>(null);
    const [qrTimeLeft, setQrTimeLeft] = useState<number>(QR_TTL_SECONDS);
    const [qrImageUrl, setQrImageUrl] = useState<string>('');
    const [isCompleting, setIsCompleting] = useState<boolean>(false);

    const [scannerDialogOpen, setScannerDialogOpen] = useState<boolean>(false);
    const [scannerLesson, setScannerLesson] = useState<LessonResponse | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scannedToken, setScannedToken] = useState<string>('');

    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const activeLessonIdRef = useRef<number | null>(null);

    const stopQrRotation = useCallback(() => {
        if (qrIntervalRef.current) {
            clearInterval(qrIntervalRef.current);
            qrIntervalRef.current = null;
        }
        activeLessonIdRef.current = null;
    }, []);

    useEffect(() => {
        return () => stopQrRotation();
    }, [stopQrRotation]);

    const loadLessons = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: FetchLessonsParams = {
                page: currentPage - 1,
                size: pageSize,
            };

            if (selectedDate) {
                params.date = selectedDate.format('YYYY-MM-DD');
            }

            const response = await lessonsApi.getLessonsByFilter(params);
            setLessons(response.content || []);
            setTotalPages(response.totalPages || 1);
            setTotalElements(response.totalElements || 0);
        } catch (err) {
            console.error('Ошибка загрузки расписания:', err);
            setError('Ошибка при загрузке расписания');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, selectedDate]);

    useEffect(() => {
        loadLessons();
    }, [loadLessons]);

    const generateQRCode = useCallback(async (token: string, lessonId: number) => {
        try {
            const qrPayload = JSON.stringify({ token, lessonId });
            const url = await QRCode.toDataURL(qrPayload, {
                width: 260,
                margin: 2,
                color: { dark: '#111827', light: '#ffffff' },
                errorCorrectionLevel: 'M',
            });
            setQrImageUrl(url);
        } catch (err) {
            console.error('Ошибка генерации QR:', err);
        }
    }, []);

    const fetchNextToken = useCallback(async (lessonId: number) => {
        try {
            let response: QRCodeResponse;
            try {
                response = await lessonsApi.getNextQrToken(lessonId);
            } catch {
                // Fallback, если на бэкенде старт и обновление идут через один endpoint
                response = await lessonsApi.startLesson(lessonId);
            }
            setQrTokenData(response);
            setQrTimeLeft(response.ttl || QR_TTL_SECONDS);
            generateQRCode(response.token, lessonId);
        } catch (err) {
            console.error('Ошибка обновления QR-токена:', err);
        }
    }, [generateQRCode]);

    const startQrRotation = useCallback((lessonId: number) => {
        stopQrRotation();
        activeLessonIdRef.current = lessonId;
        setQrTimeLeft(QR_TTL_SECONDS);

        let countdown = QR_TTL_SECONDS;

        qrIntervalRef.current = setInterval(() => {
            countdown -= 1;
            if (countdown <= 0) {
                countdown = QR_TTL_SECONDS;
                if (activeLessonIdRef.current) {
                    fetchNextToken(activeLessonIdRef.current);
                }
            }
            setQrTimeLeft(countdown);
        }, 1000);
    }, [stopQrRotation, fetchNextToken]);

    const handleStartLesson = async (lesson: LessonResponse) => {
        setSelectedLesson(lesson);
        setQrDialogOpen(true);

        try {
            const response = await lessonsApi.startLesson(lesson.id);
            setQrTokenData(response);
            generateQRCode(response.token, lesson.id);

            setLessons((prev) =>
                prev.map((l) => (l.id === lesson.id ? { ...l, status: 'IN_PROGRESS' } : l))
            );

            startQrRotation(lesson.id);
            setSnackbarMessage('Занятие начато!');
            setSnackbarOpen(true);
        } catch (err) {
            console.error('Ошибка начала занятия:', err);
            setSnackbarMessage('Ошибка при начале занятия');
            setSnackbarOpen(true);
            handleCloseQRDialog();
        }
    };

    const handleCloseQRDialog = () => {
        stopQrRotation();
        setQrDialogOpen(false);
        setSelectedLesson(null);
        setQrTokenData(null);
        setQrImageUrl('');
        setQrTimeLeft(QR_TTL_SECONDS);
    };

    const handleCompleteLesson = async () => {
        if (!selectedLesson) return;

        setIsCompleting(true);
        try {
            await lessonsApi.completeLesson(selectedLesson.id);
            setLessons((prev) =>
                prev.map((l) => (l.id === selectedLesson.id ? { ...l, status: 'DONE' } : l))
            );
            handleCloseQRDialog();
            setSnackbarMessage('Занятие завершено');
            setSnackbarOpen(true);
        } catch (err) {
            console.error('Ошибка завершения занятия:', err);
            setSnackbarMessage('Ошибка при завершении занятия');
            setSnackbarOpen(true);
        } finally {
            setIsCompleting(false);
        }
    };

    const handleScanQR = async (tokenToSubmit: string) => {
        const cleanToken = tokenToSubmit.trim();
        if (!scannerLesson) {
            setScanError('Ошибка: занятие не выбрано');
            return;
        }

        if (!cleanToken) {
            setScanError('Введите или отсканируйте валидный токен');
            return;
        }

        setIsScanning(true);
        setScanError(null);

        try {
            await lessonsApi.scanQR({
                token: cleanToken,
                lessonId: scannerLesson.id,
            });

            setLessons((prev) =>
                prev.map((l) => (l.id === scannerLesson.id ? { ...l, isMarked: true } : l))
            );

            setSnackbarMessage('Вы успешно отметились!');
            setSnackbarOpen(true);
            handleCloseScanner();
            loadLessons();
        } catch (err: any) {
            const status = err?.response?.status;
            const message = err?.response?.data?.message;

            if (status === 400) {
                setScanError(message || 'QR-код истек или недействителен');
            } else if (status === 404) {
                setScanError('Занятие не найдено или уже завершено');
            } else if (status === 403) {
                setScanError('Вы не состоите в группе для этого занятия');
            } else {
                setScanError('Ошибка при отметке посещаемости');
            }
        } finally {
            setIsScanning(false);
        }
    };

    const handleScan = (rawText: string) => {
        if (!rawText) return;
        try {
            const parsed = JSON.parse(rawText);
            if (parsed.token) {
                handleScanQR(parsed.token);
                return;
            }
        } catch {}
        handleScanQR(rawText);
    };

    const handleOpenScanner = (lesson: LessonResponse) => {
        setScannerLesson(lesson);
        setScannerDialogOpen(true);
        setScanError(null);
        setScannedToken('');
    };

    const handleCloseScanner = () => {
        setScannerDialogOpen(false);
        setScannerLesson(null);
        setScanError(null);
        setScannedToken('');
        setIsScanning(false);
    };

    const canStartLesson = (lesson: LessonResponse): boolean => {
        if (!isTeacher || lesson.status !== 'IN_WAITING') return false;
        const today = dayjs().format('YYYY-MM-DD');
        return lesson.date === today;
    };

    const canScanLesson = (lesson: LessonResponse): boolean => {
        return !isTeacher && lesson.status === 'IN_PROGRESS' && !lesson.isMarked;
    };

    const formatTime = (time: string): string => (time ? time.substring(0, 5) : '');
    const formatDate = (date: string): string => dayjs(date).locale('ru').format('DD MMMM YYYY, dddd');
    const isToday = (date: string): boolean => dayjs(date).isSame(dayjs(), 'day');

    const getStatusChip = (status: LessonStatus) => {
        switch (status) {
            case 'IN_PROGRESS':
                return <Chip label="Идет пара" color="warning" size="small" icon={<AccessTime />} />;
            case 'DONE':
                return <Chip label="Завершено" color="success" size="small" icon={<CheckCircle />} />;
            default:
                return <Chip label="Ожидание" color="default" size="small" />;
        }
    };

    const groupLessonsByDate = (items: LessonResponse[]): GroupedLessons => {
        return items.reduce((acc, lesson) => {
            acc[lesson.date] = acc[lesson.date] || [];
            acc[lesson.date].push(lesson);
            return acc;
        }, {} as GroupedLessons);
    };

    const groupedLessons = groupLessonsByDate(lessons);

    const renderScheduleContent = () => (
        <>
            <Paper elevation={1} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <DatePicker
                            label="Фильтр по дате"
                            value={selectedDate}
                            onChange={(val) => {
                                setSelectedDate(val);
                                setCurrentPage(1);
                            }}
                            format="DD.MM.YYYY"
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    slotProps: {
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarToday fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        },
                                    },
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 8 }}>
                        <Stack direction="row" spacing={1.5}>
                            {selectedDate && (
                                <Button
                                    variant="outlined"
                                    size="medium"
                                    onClick={() => {
                                        setSelectedDate(null);
                                        setCurrentPage(1);
                                    }}
                                    startIcon={<Clear />}
                                >
                                    Сбросить
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                size="medium"
                                onClick={loadLessons}
                                startIcon={<Refresh />}
                            >
                                Обновить
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            <Box sx={{ minHeight: 250 }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress size={48} />
                    </Box>
                )}

                {error && !loading && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        action={
                            <Button color="inherit" onClick={loadLessons}>
                                Повторить
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {!loading && !error && lessons.length === 0 && (
                    <Alert severity="info" icon={<Schedule />}>
                        {selectedDate
                            ? `На ${selectedDate.format('DD.MM.YYYY')} занятий не запланировано`
                            : 'Расписание пусто'}
                    </Alert>
                )}

                {!loading &&
                    !error &&
                    Object.keys(groupedLessons).map((date) => (
                        <Card key={date} elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                            <Box
                                sx={{
                                    p: 1.5,
                                    px: 2.5,
                                    bgcolor: isToday(date) ? 'primary.light' : 'grey.100',
                                    color: isToday(date) ? 'primary.contrastText' : 'inherit',
                                }}
                            >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        {formatDate(date)}
                                    </Typography>
                                    {isToday(date) && <Chip label="Сегодня" size="small" color="primary" />}
                                </Stack>
                            </Box>

                            <CardContent sx={{ p: 2 }}>
                                <Stack spacing={2}>
                                    {groupedLessons[date].map((lesson) => (
                                        <Paper
                                            key={lesson.id}
                                            variant="outlined"
                                            onClick={() => onLessonClick?.(lesson)}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                cursor: onLessonClick ? 'pointer' : 'default',
                                                bgcolor:
                                                    lesson.status === 'IN_PROGRESS'
                                                        ? 'warning.50'
                                                        : 'background.paper',
                                            }}
                                        >
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid size={{ xs: 12, sm: 3 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Время
                                                    </Typography>
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {formatTime(lesson.timeFrom)} — {formatTime(lesson.timeTo)}
                                                    </Typography>
                                                </Grid>

                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Дисциплина
                                                    </Typography>
                                                    <Typography variant="subtitle1" fontWeight={600} color="primary">
                                                        {lesson.subjectName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {lesson.teacherFullName ||
                                                            `${lesson.teacherLastName || ''} ${lesson.teacherFirstName || ''}`}
                                                    </Typography>
                                                </Grid>

                                                <Grid size={{ xs: 6, sm: 2 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Аудитория
                                                    </Typography>
                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                        {lesson.audience}
                                                    </Typography>
                                                </Grid>

                                                <Grid size={{ xs: 6, sm: 3 }} sx={{ textAlign: 'right' }}>
                                                    <Stack spacing={1} alignItems="flex-end">
                                                        {getStatusChip(lesson.status)}

                                                        {isTeacher && canStartLesson(lesson) && (
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                startIcon={<QrCodeScanner />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStartLesson(lesson);
                                                                }}
                                                            >
                                                                Начать пару
                                                            </Button>
                                                        )}

                                                        {!isTeacher && canScanLesson(lesson) && (
                                                            <Button
                                                                variant="contained"
                                                                color="success"
                                                                size="small"
                                                                startIcon={<CameraAlt />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenScanner(lesson);
                                                                }}
                                                            >
                                                                Отметиться
                                                            </Button>
                                                        )}

                                                        {!isTeacher && lesson.isMarked && (
                                                            <Chip
                                                                label="Вы отмечены"
                                                                color="success"
                                                                size="small"
                                                                icon={<CheckCircle />}
                                                            />
                                                        )}
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
            </Box>

            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={(_, p) => setCurrentPage(p)}
                        color="primary"
                    />
                </Box>
            )}
        </>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1.5, md: 3 } }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                        <Tab label="Расписание" icon={<Schedule />} iconPosition="start" />
                        <Tab
                            label={isTeacher ? 'Журнал пар' : 'Моя посещаемость'}
                            icon={<EventNote />}
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {activeTab === 0 && renderScheduleContent()}
                {activeTab === 1 && (isTeacher ? <TeacherAttendanceTab /> : <StudentAttendanceTab />)}
            </Box>

            <Dialog
                open={qrDialogOpen}
                onClose={handleCloseQRDialog}
                maxWidth="xs"
                fullWidth
                sx={{ '& .MuiDialog-paper': { borderRadius: 3, p: 2 } }}
            >
                <DialogTitle component="div" sx={{ textAlign: 'center', pb: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                        {selectedLesson?.subjectName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Динамический QR-код для студентов
                    </Typography>
                </DialogTitle>

                <DialogContent sx={{ textAlign: 'center', py: 2 }}>
                    {qrImageUrl ? (
                        <Box sx={{ my: 1 }}>
                            <Box
                                component="img"
                                src={qrImageUrl}
                                alt="QR Code"
                                sx={{
                                    width: 250,
                                    height: 250,
                                    borderRadius: 2,
                                    boxShadow: 2,
                                    p: 1,
                                    bgcolor: '#fff',
                                }}
                            />
                            <Box sx={{ width: '80%', mx: 'auto', mt: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={(qrTimeLeft / QR_TTL_SECONDS) * 100}
                                    color={qrTimeLeft <= 1 ? 'warning' : 'primary'}
                                    sx={{ height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    Обновление через {qrTimeLeft} сек.
                                </Typography>
                            </Box>
                        </Box>
                    ) : (
                        <CircularProgress sx={{ my: 4 }} />
                    )}
                </DialogContent>

                <DialogActions sx={{ justifyContent: 'center', pb: 1 }}>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleCompleteLesson}
                        disabled={isCompleting}
                    >
                        {isCompleting ? 'Завершение...' : 'Завершить пару'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог сканера студента */}
            <Dialog open={scannerDialogOpen} onClose={handleCloseScanner} maxWidth="xs" fullWidth>
                <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Отметка посещаемости</Typography>
                    <IconButton size="small" onClick={handleCloseScanner}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <QRScanner onScan={handleScan} onError={(e) => setScanError(e)} />

                    {scanError && <Alert severity="error" sx={{ mt: 2 }}>{scanError}</Alert>}

                    <Box sx={{ mt: 2.5 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Или введите токен вручную"
                            value={scannedToken}
                            onChange={(e) => setScannedToken(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            fullWidth
                            sx={{ mt: 1.5 }}
                            onClick={() => handleScanQR(scannedToken)}
                            disabled={isScanning || !scannedToken.trim()}
                        >
                            {isScanning ? 'Проверка...' : 'Отправить'}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </LocalizationProvider>
    );
};

export default ScheduleTab;