import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Pagination,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Snackbar,
    Stack,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress,
} from '@mui/material';
import {
    Check,
    Close as CloseIcon,
    Warning,
    Info,
    Edit,
    PhotoCamera,
    Refresh,
    Visibility,
    Delete,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';
import { lessonsApi } from '../api/lessonsApi';
import type { AttendanceResponse, AttendanceType, UpdateAttendanceRequest, AttendanceFilterParams } from '../types/Attendance';
import {staticApi} from "../api/axiosInstance.ts";

const TeacherAttendanceTab: React.FC = () => {
    const [attendanceList, setAttendanceList] = useState<AttendanceResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    // Фильтры
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedLessonId, setSelectedLessonId] = useState<number | ''>('');

    // Диалог редактирования
    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceResponse | null>(null);
    const [editComment, setEditComment] = useState<string>('');
    const [editLink, setEditLink] = useState<string>('');
    const [editMark, setEditMark] = useState<AttendanceType>('PRESENT');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Загрузка файла
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    // Уведомления
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const loadAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const params: AttendanceFilterParams = {};
            if (selectedDate) {
                params.date = selectedDate.format('YYYY-MM-DD');
            }
            if (selectedLessonId) {
                params.lessonId = Number(selectedLessonId);
            }

            const response = await lessonsApi.getAttendanceForTeacher({
                ...params,
                page: page - 1,
                size: 10,
            });
            setAttendanceList(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Error loading attendance:', error);
        } finally {
            setLoading(false);
        }
    }, [page, selectedDate, selectedLessonId]);

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    // ========== ПРОСМОТР ФАЙЛА ЧЕРЕЗ AXIOS ==========

    const handleViewFile = async (link: string) => {
        if (!link) return;

        try {
            const response = await staticApi.get(link, {
                responseType: 'blob',
            });

            const url = URL.createObjectURL(response.data);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Error loading file:', error);
            setSnackbarMessage('Ошибка при загрузке файла');
            setSnackbarOpen(true);
        }
    };

    // ========== ЗАГРУЗКА ФАЙЛА ==========
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            setSnackbarMessage('Можно загружать только изображения');
            setSnackbarOpen(true);
            return;
        }

        // Проверка размера (макс 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setSnackbarMessage('Файл не должен превышать 5MB');
            setSnackbarOpen(true);
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Эмулируем прогресс загрузки
            const interval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await lessonsApi.uploadFile(formData);

            clearInterval(interval);
            setUploadProgress(100);

            await new Promise(resolve => setTimeout(resolve, 300));

            setEditLink(response.url);
            setSnackbarMessage('Файл успешно загружен');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error uploading file:', error);
            setSnackbarMessage('Ошибка при загрузке файла');
            setSnackbarOpen(true);
        } finally {
            setUploading(false);
            setUploadProgress(0);
            event.target.value = '';
        }
    };

    // ========== УДАЛИТЬ ФАЙЛ ==========
    const handleRemoveFile = () => {
        setEditLink('');
        setSnackbarMessage('Файл удален');
        setSnackbarOpen(true);
    };

    const getMarkLabel = (mark: AttendanceType): string => {
        const labels: Record<AttendanceType, string> = {
            PRESENT: 'Присутствовал',
            ABSENT: 'Отсутствовал',
            LATE: 'Опоздал',
            EXCUSED: 'Уважительная причина',
        };
        return labels[mark] || mark;
    };

    const getMarkColor = (mark: AttendanceType): 'success' | 'error' | 'warning' | 'info' => {
        const colors: Record<AttendanceType, 'success' | 'error' | 'warning' | 'info'> = {
            PRESENT: 'success',
            ABSENT: 'error',
            LATE: 'warning',
            EXCUSED: 'info',
        };
        return colors[mark] || 'info';
    };

    const getMarkIcon = (mark: AttendanceType) => {
        const icons: Record<AttendanceType, React.ReactNode> = {
            PRESENT: <Check />,
            ABSENT: <CloseIcon />,
            LATE: <Warning />,
            EXCUSED: <Info />,
        };
        return icons[mark] || null;
    };

    const handleOpenEdit = (record: AttendanceResponse) => {
        setSelectedRecord(record);
        setEditComment(record.comment || '');
        setEditLink(record.link || '');
        setEditMark(record.mark);
        setEditDialogOpen(true);
    };

    const handleCloseEdit = () => {
        setEditDialogOpen(false);
        setSelectedRecord(null);
        setEditComment('');
        setEditLink('');
        setEditMark('PRESENT');
    };

    const handleUpdateAttendance = async () => {
        if (!selectedRecord) return;

        setIsSubmitting(true);
        try {
            const data: UpdateAttendanceRequest = {
                mark: editMark,
                comment: editComment,
                link: editLink,
            };

            await lessonsApi.updateAttendance(selectedRecord.id, data);

            setAttendanceList(prev => prev.map(record =>
                record.id === selectedRecord.id
                    ? { ...record, ...data }
                    : record
            ));

            setSnackbarMessage('Запись успешно обновлена');
            setSnackbarOpen(true);
            handleCloseEdit();
            loadAttendance();
        } catch (error) {
            console.error('Error updating attendance:', error);
            setSnackbarMessage('Ошибка при обновлении');
            setSnackbarOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClearFilters = () => {
        setSelectedDate(null);
        setSelectedLessonId('');
        setPage(1);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Посещаемость студентов
                </Typography>

                {/* Фильтры */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <DatePicker
                                label="Фильтр по дате"
                                value={selectedDate}
                                onChange={(newDate) => {
                                    setSelectedDate(newDate);
                                    setPage(1);
                                }}
                                format="DD.MM.YYYY"
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        variant: 'outlined',
                                        size: 'small',
                                    },
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                size="small"
                                label="ID занятия"
                                type="number"
                                value={selectedLessonId}
                                onChange={(e) => {
                                    setSelectedLessonId(e.target.value ? Number(e.target.value) : '');
                                    setPage(1);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="outlined"
                                    onClick={handleClearFilters}
                                    startIcon={<Refresh />}
                                >
                                    Сбросить
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={loadAttendance}
                                    startIcon={<Refresh />}
                                >
                                    Применить
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Paper>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : attendanceList.length === 0 ? (
                    <Alert severity="info">Нет записей о посещаемости</Alert>
                ) : (
                    <>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Студент</TableCell>
                                        <TableCell>Дата</TableCell>
                                        <TableCell>Занятие</TableCell>
                                        <TableCell>Отметка</TableCell>
                                        <TableCell>Комментарий</TableCell>
                                        <TableCell>Справка</TableCell>
                                        <TableCell>Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {attendanceList.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>{record.studentFullName || `Студент #${record.studentId}`}</TableCell>
                                            <TableCell>{record.lessonDate || '-'}</TableCell>
                                            <TableCell>{record.subjectName || `Занятие #${record.lessonId}`}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={getMarkIcon(record.mark)}
                                                    label={getMarkLabel(record.mark)}
                                                    color={getMarkColor(record.mark)}
                                                    size="small"
                                                    sx={{ fontWeight: 500 }}
                                                />
                                            </TableCell>
                                            <TableCell>{record.comment || '-'}</TableCell>
                                            <TableCell>
                                                {record.link ? (
                                                    <Button
                                                        size="small"
                                                        onClick={() => handleViewFile(record.link)}
                                                        startIcon={<Visibility />}
                                                    >
                                                        Просмотр
                                                    </Button>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenEdit(record)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(_, p) => setPage(p)}
                                    color="primary"
                                />
                            </Box>
                        )}
                    </>
                )}

                {/* Диалог редактирования для преподавателя */}
                <Dialog open={editDialogOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        Редактирование посещаемости
                        <Typography variant="body2" color="text.secondary">
                            {selectedRecord?.studentFullName} - {selectedRecord?.subjectName}
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>Отметка</InputLabel>
                                <Select
                                    value={editMark}
                                    label="Отметка"
                                    onChange={(e) => setEditMark(e.target.value as AttendanceType)}
                                >
                                    <MenuItem value="PRESENT">Присутствовал</MenuItem>
                                    <MenuItem value="ABSENT">Отсутствовал</MenuItem>
                                    <MenuItem value="LATE">Опоздал</MenuItem>
                                    <MenuItem value="EXCUSED">Уважительная причина</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Комментарий"
                                multiline
                                rows={3}
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                            />

                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Справка (фото)
                                </Typography>

                                {editLink && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Button
                                            size="small"
                                            onClick={() => handleViewFile(editLink)}
                                            startIcon={<Visibility />}
                                        >
                                            Просмотреть текущий файл
                                        </Button>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={handleRemoveFile}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                )}

                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                    type="file"
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="file-upload">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<PhotoCamera />}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Загрузка...' : 'Загрузить новое фото'}
                                    </Button>
                                </label>

                                {uploading && (
                                    <Box sx={{ width: '100%', mt: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={uploadProgress}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {uploadProgress}% загружено
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseEdit}>Отмена</Button>
                        <Button
                            variant="contained"
                            onClick={handleUpdateAttendance}
                            disabled={isSubmitting || uploading}
                        >
                            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Уведомления */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={3000}
                    onClose={() => setSnackbarOpen(false)}
                    message={snackbarMessage}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                />
            </Box>
        </LocalizationProvider>
    );
};

export default TeacherAttendanceTab;