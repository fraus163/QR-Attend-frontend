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
    Fade,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    IconButton,
    Tab,
    Tabs, TextField,
} from '@mui/material';
import {
    DatePicker,
    LocalizationProvider,
} from '@mui/x-date-pickers';
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
import StudentAttendanceTab from "./StudentAttendanceTab.tsx";
import TeacherAttendanceTab from "./TeacherAttendanceTab.tsx";

interface ScheduleComponentProps {
    pageSize?: number;
    onLessonClick?: (lesson: LessonResponse) => void;
    userRole?: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

interface GroupedLessons {
    [date: string]: LessonResponse[];
}

const ScheduleTab: React.FC<ScheduleComponentProps> = ({
                                                                 pageSize = 10,
                                                                 onLessonClick,
                                                                 userRole = 'STUDENT',
                                                             }) => {
    // ========== ОСНОВНЫЕ СОСТОЯНИЯ ==========
    const [lessons, setLessons] = useState<LessonResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalElements, setTotalElements] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<number>(0);

    // ========== QR ДИАЛОГ (ДЛЯ ПРЕПОДАВАТЕЛЯ) ==========
    const [qrDialogOpen, setQrDialogOpen] = useState<boolean>(false);
    const [selectedLesson, setSelectedLesson] = useState<LessonResponse | null>(null);
    const [qrTokenData, setQrTokenData] = useState<QRCodeResponse | null>(null);
    const [qrTimeLeft, setQrTimeLeft] = useState<number>(600);
    const [qrImageUrl, setQrImageUrl] = useState<string>('');
    const [isCompleting, setIsCompleting] = useState<boolean>(false);

    // ========== СКАНЕР (ДЛЯ СТУДЕНТА) ==========
    const [scannerDialogOpen, setScannerDialogOpen] = useState<boolean>(false);
    const [scannerLesson, setScannerLesson] = useState<LessonResponse | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scannedToken, setScannedToken] = useState<string>('');

    // ========== УВЕДОМЛЕНИЯ ==========
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    // ========== REFS ==========
    const qrIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ========== ЗАГРУЗКА РАСПИСАНИЯ ==========
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
            setLessons(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (err) {
            console.error('Error loading lessons:', err);
            setError('Ошибка при загрузке расписания');
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, selectedDate]);

    useEffect(() => {
        loadLessons();
    }, [loadLessons]);

    // ========== ОЧИСТКА ИНТЕРВАЛОВ ==========
    useEffect(() => {
        return () => {
            if (qrIntervalRef.current) {
                clearInterval(qrIntervalRef.current);
                qrIntervalRef.current = null;
            }
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, []);

    // ========== ГЕНЕРАЦИЯ QR ==========
    const generateQRCode = useCallback(async (text: string) => {
        try {
            const url = await QRCode.toDataURL(text, {
                width: 250,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'H',
            });
            setQrImageUrl(url);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }, []);

    useEffect(() => {
        if (qrTokenData) {
            const qrText = JSON.stringify({
                token: qrTokenData.token,
                lessonId: qrTokenData.lessonId,
            });
            generateQRCode(qrText);
        }
    }, [qrTokenData, generateQRCode]);

    // ========== ОБРАБОТЧИКИ ==========
    const handleDateChange = (newDate: Dayjs | null) => {
        setSelectedDate(newDate);
        setCurrentPage(1);
    };

    const handleClearDate = () => {
        setSelectedDate(null);
        setCurrentPage(1);
    };

    const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        loadLessons();
    };

    // ========== ПРОВЕРКИ ДЛЯ ПРЕПОДАВАТЕЛЯ ==========
    const canStartLesson = (lesson: LessonResponse): boolean => {
        if (userRole !== 'TEACHER') return false;
        if (lesson.status !== 'IN_WAITING') return false;

        const today = dayjs().format('YYYY-MM-DD');
        if (lesson.date !== today) return false;

        const now = dayjs();
        const lessonStart = dayjs(`${lesson.date}T${lesson.timeFrom}`);
        const diffMinutes = now.diff(lessonStart, 'minutes');

        return diffMinutes >= -15 && diffMinutes <= 15;
    };

    // ========== ПРОВЕРКИ ДЛЯ СТУДЕНТА ==========
    const canScanLesson = (lesson: LessonResponse): boolean => {
        if (userRole !== 'STUDENT') return false;
        if (lesson.status !== 'IN_PROGRESS') return false;
        if (lesson.isMarked) return false; // ✅ Уже отметился
        return true;
    };

    // ========== НАЧАТЬ ЗАНЯТИЕ (ПРЕПОДАВАТЕЛЬ) ==========
    const handleStartLesson = async (lesson: LessonResponse) => {
        setSelectedLesson(lesson);
        setQrDialogOpen(true);

        try {
            const response = await lessonsApi.startLesson(lesson.id);
            setQrTokenData(response);
            setQrTimeLeft(response.ttl);

            setLessons(prev => prev.map(l =>
                l.id === lesson.id ? { ...l, status: 'IN_PROGRESS' } : l
            ));

            // Таймер
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            const timer = setInterval(() => {
                setQrTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleCloseQRDialog();
                        setSnackbarMessage('Время сессии истекло');
                        setSnackbarOpen(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            timerIntervalRef.current = timer;

            // Обновление QR
            if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
            const qrUpdateInterval = setInterval(async () => {
                try {
                    const newResponse = await lessonsApi.startLesson(lesson.id);
                    if (newResponse.token !== qrTokenData?.token) {
                        setQrTokenData(newResponse);
                        setQrTimeLeft(newResponse.ttl);
                    }
                } catch (error) {
                    console.error('Error refreshing QR:', error);
                }
            }, 5000);
            qrIntervalRef.current = qrUpdateInterval;

            setSnackbarMessage('Занятие начато! QR код готов');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error starting lesson:', error);
            setSnackbarMessage('Ошибка при начале занятия');
            setSnackbarOpen(true);
            handleCloseQRDialog();
        }
    };

    // ========== ЗАВЕРШИТЬ ЗАНЯТИЕ (ПРЕПОДАВАТЕЛЬ) ==========
    const handleCompleteLesson = async () => {
        if (!selectedLesson) return;

        setIsCompleting(true);
        try {
            await lessonsApi.completeLesson(selectedLesson.id);
            setLessons(prev => prev.map(l =>
                l.id === selectedLesson.id ? { ...l, status: 'DONE' } : l
            ));
            handleCloseQRDialog();
            setSnackbarMessage('Занятие успешно завершено');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error completing lesson:', error);
            setSnackbarMessage('Ошибка при завершении занятия');
            setSnackbarOpen(true);
        } finally {
            setIsCompleting(false);
        }
    };

    // ========== ЗАКРЫТЬ QR ДИАЛОГ ==========
    const handleCloseQRDialog = () => {
        setQrDialogOpen(false);
        setSelectedLesson(null);
        setQrTokenData(null);
        setQrImageUrl('');
        setQrTimeLeft(600);

        if (qrIntervalRef.current) {
            clearInterval(qrIntervalRef.current);
            qrIntervalRef.current = null;
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };

    // ========== ОТКРЫТЬ СКАНЕР (СТУДЕНТ) ==========
    const handleOpenScanner = (lesson: LessonResponse) => {
        setScannerLesson(lesson);
        setScannerDialogOpen(true);
        setScanError(null);
        setScannedToken('');
    };

    // ========== ЗАКРЫТЬ СКАНЕР ==========
    const handleCloseScanner = () => {
        setScannerDialogOpen(false);
        setScannerLesson(null);
        setScanError(null);
        setScannedToken('');
        setIsScanning(false);
    };

    // ========== СКАНИРОВАТЬ QR (СТУДЕНТ) ==========
    const handleScanQR = async () => {
        if (!scannerLesson || !scannedToken) {
            setScanError('Введите или отсканируйте QR код');
            return;
        }

        setIsScanning(true);
        setScanError(null);

        try {
            await lessonsApi.scanQR({
                token: scannedToken,
                lessonId: scannerLesson.id,
            });

            // ✅ Обновляем статус - студент отметился
            setLessons(prev => prev.map(l =>
                l.id === scannerLesson.id ? { ...l, isMarked: true } : l
            ));

            setSnackbarMessage('Вы успешно отметились на занятии!');
            setSnackbarOpen(true);
            handleCloseScanner();
            loadLessons();
        } catch (error: any) {
            console.error('Error scanning QR:', error);

            if (error?.response?.status === 400) {
                setScanError(error.response.data?.message || 'Недействительный QR код');
            } else if (error?.response?.status === 404) {
                setScanError('Сессия истекла. Занятие уже завершено');
            } else if (error?.response?.status === 403) {
                setScanError('Вы не записаны на это занятие');
            } else {
                setScanError('Ошибка при сканировании QR кода');
            }
        } finally {
            setIsScanning(false);
        }
    };

    // ========== ФОРМАТИРОВАНИЕ ==========
    const formatTime = (time: string): string => time.substring(0, 5);
    const formatTimer = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    const formatDate = (date: string): string => {
        return dayjs(date).locale('ru').format('DD MMMM YYYY, dddd');
    };
    const isToday = (date: string): boolean => {
        return dayjs(date).isSame(dayjs(), 'day');
    };

    // ========== СТАТУСЫ ==========
    const getStatusColor = (status: LessonStatus): string => {
        switch (status) {
            case 'IN_PROGRESS': return 'warning';
            case 'DONE': return 'success';
            default: return 'default';
        }
    };
    const getStatusLabel = (status: LessonStatus): string => {
        switch (status) {
            case 'IN_PROGRESS': return 'Идет';
            case 'DONE': return 'Завершено';
            default: return 'Ожидание';
        }
    };

    // ========== ГРУППИРОВКА ==========
    const groupLessonsByDate = (lessons: LessonResponse[]): GroupedLessons => {
        const groups: GroupedLessons = {};
        lessons.forEach((lesson) => {
            const date = lesson.date;
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(lesson);
        });
        return groups;
    };

    const groupedLessons = groupLessonsByDate(lessons);

    // ========== РЕНДЕР КОНТЕНТА ==========
    const renderScheduleContent = () => (
        <>
            {/* Фильтры */}
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <DatePicker
                            label="Фильтр по дате"
                            value={selectedDate}
                            onChange={handleDateChange}
                            format="DD.MM.YYYY"
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    variant: 'outlined',
                                    slotProps: {
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarToday />
                                                </InputAdornment>
                                            ),
                                        },
                                    },
                                },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                            {selectedDate && (
                                <Button variant="outlined" onClick={handleClearDate} startIcon={<Clear />}>
                                    Очистить фильтр
                                </Button>
                            )}
                            <Button variant="contained" onClick={handleRefresh} startIcon={<Refresh />}>
                                Обновить
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            {/* Статистика */}
            {!loading && !error && lessons.length > 0 && (
                <Fade in={!loading}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Найдено: <strong>{totalElements}</strong> занятий
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Страница {currentPage} из {totalPages}
                        </Typography>
                    </Box>
                </Fade>
            )}

            {/* Список занятий */}
            <Box sx={{ position: 'relative', minHeight: 200 }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                        <CircularProgress size={60} thickness={4} />
                    </Box>
                )}

                {error && (
                    <Fade in={!!error}>
                        <Alert severity="error" sx={{ mb: 2 }} action={
                            <Button color="inherit" size="small" onClick={handleRefresh}>Повторить</Button>
                        }>
                            {error}
                        </Alert>
                    </Fade>
                )}

                {!loading && !error && lessons.length === 0 && (
                    <Fade in={!loading}>
                        <Alert severity="info" icon={<Schedule />} sx={{ mb: 2 }}>
                            {selectedDate
                                ? `Нет занятий на ${selectedDate.format('DD.MM.YYYY')}`
                                : 'Нет занятий на выбранный период'}
                        </Alert>
                    </Fade>
                )}

                {!loading && !error && Object.keys(groupedLessons).length > 0 && (
                    <Fade in={!loading}>
                        <Stack spacing={3}>
                            {Object.entries(groupedLessons).map(([date, dayLessons]) => (
                                <Card
                                    key={date}
                                    elevation={3}
                                    sx={{
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        border: isToday(date) ? '2px solid' : 'none',
                                        borderColor: 'primary.main',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 6,
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            p: 2,
                                            backgroundColor: isToday(date) ? 'primary.main' : 'grey.100',
                                            color: isToday(date) ? 'white' : 'text.primary',
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="h6" fontWeight={600} sx={{ color: isToday(date) ? 'white' : 'inherit' }}>
                                                {formatDate(date)}
                                            </Typography>
                                            {isToday(date) && (
                                                <Chip
                                                    label="Сегодня"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            )}
                                        </Stack>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: isToday(date) ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                                                mt: 0.5,
                                            }}
                                        >
                                            {dayLessons.length} {dayLessons.length === 1 ? 'занятие' : dayLessons.length < 5 ? 'занятия' : 'занятий'}
                                        </Typography>
                                    </Box>

                                    <CardContent sx={{ p: 2 }}>
                                        <Stack spacing={2}>
                                            {dayLessons.map((lesson) => {
                                                const canStart = canStartLesson(lesson);
                                                const canScan = canScanLesson(lesson);
                                                const isDone = lesson.status === 'DONE';
                                                const isInProgress = lesson.status === 'IN_PROGRESS';
                                                const isMarked = lesson.isMarked;

                                                return (
                                                    <Box
                                                        key={lesson.id}
                                                        onClick={() => onLessonClick?.(lesson)}
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: 1,
                                                            backgroundColor: isDone ? '#c8e6c9' : isInProgress ? '#fff3e0' : '#f5f5f5',
                                                            cursor: onLessonClick ? 'pointer' : 'default',
                                                            transition: 'all 0.2s',
                                                            border: '1px solid',
                                                            borderColor: isDone ? '#4caf50' : isInProgress ? '#ff9800' : 'transparent',
                                                            '&:hover': {
                                                                backgroundColor: isDone ? '#c8e6c9' : isInProgress ? '#fff3e0' : '#eeeeee',
                                                                transform: 'scale(1.01)',
                                                            },
                                                        }}
                                                    >
                                                        <Grid container spacing={2} alignItems="center">
                                                            <Grid item xs={12} md={4}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Время
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Typography variant="body1" fontWeight={600}>
                                                                        {formatTime(lesson.timeFrom)}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        —
                                                                    </Typography>
                                                                    <Typography variant="body1" fontWeight={600}>
                                                                        {formatTime(lesson.timeTo)}
                                                                    </Typography>
                                                                </Box>
                                                            </Grid>

                                                            <Grid item xs={12} md={4}>
                                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                                    Предмет
                                                                </Typography>
                                                                <Typography variant="body1" fontWeight={700} color="primary.main">
                                                                    {lesson.subjectName}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {lesson.teacherLastName} {lesson.teacherFirstName?.charAt(0)}.
                                                                    {lesson.teacherPatronymic?.charAt(0)}.
                                                                </Typography>
                                                            </Grid>

                                                            <Grid item xs={12} md={4}>
                                                                <Stack spacing={1} alignItems="flex-end">
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                                                                        <Typography variant="subtitle2" color="text.secondary">
                                                                            Аудитория:
                                                                        </Typography>
                                                                        <Typography variant="body1" fontWeight={500}>
                                                                            {lesson.audience}
                                                                        </Typography>
                                                                    </Box>

                                                                    <Chip
                                                                        label={getStatusLabel(lesson.status)}
                                                                        color={getStatusColor(lesson.status) as any}
                                                                        size="small"
                                                                        sx={{ fontWeight: 500 }}
                                                                    />

                                                                    {/* ===== ДЛЯ ПРЕПОДАВАТЕЛЯ ===== */}
                                                                    {userRole === 'TEACHER' && (
                                                                        <>
                                                                            {isDone ? (
                                                                                <Chip icon={<CheckCircle />} label="Завершено" color="success" size="small" />
                                                                            ) : canStart ? (
                                                                                <Button
                                                                                    variant="contained"
                                                                                    color="primary"
                                                                                    size="small"
                                                                                    startIcon={<QrCodeScanner />}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleStartLesson(lesson);
                                                                                    }}
                                                                                    sx={{ minWidth: '120px' }}
                                                                                >
                                                                                    Начать
                                                                                </Button>
                                                                            ) : isInProgress ? (
                                                                                <Chip icon={<AccessTime />} label="Идет занятие" color="warning" size="small" />
                                                                            ) : null}
                                                                        </>
                                                                    )}

                                                                    {/* ===== ДЛЯ СТУДЕНТА ===== */}
                                                                    {userRole === 'STUDENT' && (
                                                                        <>
                                                                            {isDone ? (
                                                                                <Chip icon={<CheckCircle />} label="Завершено" color="success" size="small" />
                                                                            ) : isMarked ? (
                                                                                <Chip icon={<CheckCircle />} label="Отмечено" color="success" size="small" />
                                                                            ) : canScan ? (
                                                                                <Button
                                                                                    variant="contained"
                                                                                    color="primary"
                                                                                    size="small"
                                                                                    startIcon={<CameraAlt />}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleOpenScanner(lesson);
                                                                                    }}
                                                                                    sx={{ minWidth: '120px' }}
                                                                                >
                                                                                    Сканировать
                                                                                </Button>
                                                                            ) : lesson.status === 'IN_WAITING' ? (
                                                                                <Chip icon={<AccessTime />} label="Ожидание" color="default" size="small" />
                                                                            ) : null}
                                                                        </>
                                                                    )}
                                                                </Stack>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </Fade>
                )}
            </Box>

            {/* Пагинация */}
            {!loading && !error && totalPages > 1 && (
                <Fade in={!loading}>
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                            size="large"
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                </Fade>
            )}
        </>
    );

    // ========== ОСНОВНОЙ РЕНДЕР ==========
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
                {/* Заголовок */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Schedule sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Расписание занятий
                    </Typography>
                    {userRole === 'TEACHER' && (
                        <Chip label="Преподаватель" color="primary" size="small" sx={{ ml: 2 }} />
                    )}
                    {userRole === 'STUDENT' && (
                        <Chip label="Студент" color="secondary" size="small" sx={{ ml: 2 }} />
                    )}
                </Box>

                {userRole === 'STUDENT' && (
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                            <Tab label="Расписание" icon={<Schedule />} iconPosition="start" />
                            <Tab label="Посещаемость" icon={<EventNote />} iconPosition="start" />
                        </Tabs>
                    </Box>
                )}

                {/* Для преподавателя тоже добавляем вкладки */}
                {userRole === 'TEACHER' && (
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                            <Tab label="Расписание" icon={<Schedule />} iconPosition="start" />
                            <Tab label="Посещаемость студентов" icon={<EventNote />} iconPosition="start" />
                        </Tabs>
                    </Box>
                )}

                {/* Контент */}
                {userRole === 'STUDENT' && activeTab === 1 ? (
                    <StudentAttendanceTab />
                ) : userRole === 'TEACHER' && activeTab === 1 ? (
                    <TeacherAttendanceTab />
                ) : (
                    renderScheduleContent()
                )}

            </Box>

            {/* ===== QR ДИАЛОГ (ДЛЯ ПРЕПОДАВАТЕЛЯ) ===== */}
            <Dialog
                open={qrDialogOpen}
                onClose={handleCloseQRDialog}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown
                sx={{ '& .MuiDialog-paper': { borderRadius: 3, padding: 2 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6">QR код для посещения</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {selectedLesson?.subjectName} - {formatTime(selectedLesson?.timeFrom || '')}
                        </Typography>
                        {qrTokenData && (
                            <Typography variant="caption" color="text.secondary">
                                TTL: {qrTokenData.ttl} сек
                            </Typography>
                        )}
                    </Box>
                    <Chip
                        icon={<AccessTime />}
                        label={formatTimer(qrTimeLeft)}
                        color={qrTimeLeft < 60 ? 'error' : 'primary'}
                        sx={{ fontWeight: 600 }}
                    />
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                        {qrImageUrl && (
                            <>
                                <Box sx={{ padding: 3, backgroundColor: 'white', borderRadius: 2, boxShadow: 1, mb: 3 }}>
                                    <img src={qrImageUrl} alt="QR Code" style={{ width: 250, height: 250, display: 'block' }} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    QR код обновляется каждые 5 секунд
                                </Typography>
                                {qrTokenData && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                        Токен: {qrTokenData.token.substring(0, 20)}...
                                    </Typography>
                                )}
                            </>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ justifyContent: 'center', paddingBottom: 2 }}>
                    <Button variant="contained" color="success" onClick={handleCompleteLesson} disabled={isCompleting}>
                        {isCompleting ? 'Завершение...' : 'Завершить занятие'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ===== СКАНЕР (ДЛЯ СТУДЕНТА) ===== */}
            <Dialog open={scannerDialogOpen} onClose={handleCloseScanner} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Сканирование QR кода</Typography>
                        <IconButton onClick={handleCloseScanner}><Close /></IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {scannerLesson?.subjectName} - {formatTime(scannerLesson?.timeFrom || '')}
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                        {/* Заглушка сканера */}
                        <Box sx={{ width: 300, height: 200, backgroundColor: '#000', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                            <CameraAlt sx={{ fontSize: 60, color: 'white', opacity: 0.5 }} />
                        </Box>

                        <TextField
                            fullWidth
                            label="Введите токен (для тестирования)"
                            value={scannedToken}
                            onChange={(e) => setScannedToken(e.target.value)}
                            placeholder="Вставьте токен из QR кода"
                            sx={{ mb: 2 }}
                        />

                        {scanError && (
                            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{scanError}</Alert>
                        )}

                        <Typography variant="body2" color="text.secondary" align="center">
                            Наведите камеру на QR код или введите токен вручную
                        </Typography>

                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleScanQR}
                            disabled={isScanning || !scannedToken}
                            sx={{ mt: 2 }}
                        >
                            {isScanning ? 'Отправка...' : 'Отметиться'}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Уведомления */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </LocalizationProvider>
    );
};

export default ScheduleTab;