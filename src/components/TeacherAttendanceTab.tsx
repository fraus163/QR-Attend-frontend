import React, { useState, useEffect, useCallback, useTransition } from 'react';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress,
    Autocomplete,
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
import { api, staticApi } from '../api/axiosInstance';
import type { AttendanceResponse, AttendanceType, UpdateAttendanceRequest } from '../types/Attendance';

const TeacherAttendanceTab: React.FC = () => {
    const [attendanceList, setAttendanceList] = useState<AttendanceResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<string[]>([]);

    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceResponse | null>(null);
    const [editComment, setEditComment] = useState<string>('');
    const [editLink, setEditLink] = useState<string>('');
    const [editMark, setEditMark] = useState<AttendanceType>('PRESENT');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const loadAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const response = await lessonsApi.getAttendanceForTeacher({
                page: page - 1,
                size: 10,
                date: selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined,
                subjectName: selectedSubject || undefined,
            });
            setAttendanceList(response.content || []);
            setTotalPages(response.totalPages || 1);
        } catch (error) {
            console.error('Error loading attendance:', error);
            setSnackbarMessage('Ошибка при загрузке журнала');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    }, [page, selectedDate, selectedSubject]);

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    useEffect(() => {
        const loadSubjects = async () => {
            try {
                setLoadingSubjects(true);
                const subjectList = await lessonsApi.getMySubjects();
                setSubjects(subjectList || []);
            } catch (error) {
                console.error('Error loading subjects:', error);
                setSubjects([]);
            } finally {
                setLoadingSubjects(false);
            }
        };
        loadSubjects();
    }, []);

    const handleViewFile = async (link: string) => {
        if (!link) return;

        try {
            const response = await staticApi.get(link, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 15000);
        } catch (error) {
            console.error('Error viewing file:', error);
            setSnackbarMessage('Ошибка при загрузке файла справки');
            setSnackbarOpen(true);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setSnackbarMessage('Можно загружать только изображения');
            setSnackbarOpen(true);
            return;
        }

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

            const response = await api.post<{ url: string }>('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    }
                },
            });

            setEditLink(response.data.url);
            setSnackbarMessage('Файл успешно загружен');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error uploading file:', error);
            setSnackbarMessage('Ошибка при загрузке файла');
            setSnackbarOpen(true);
        } finally {
            setUploading(false);
            event.target.value = '';
        }
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
        switch (mark) {
            case 'PRESENT': return <Check fontSize="small" />;
            case 'ABSENT': return <CloseIcon fontSize="small" />;
            case 'LATE': return <Warning fontSize="small" />;
            case 'EXCUSED': return <Info fontSize="small" />;
            default: return null;
        }
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
        setSelectedSubject(null);
        setPage(1);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <Box sx={{ p: 1 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                    Журнал посещаемости студентов
                </Typography>

                <Paper elevation={1} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <DatePicker
                            label="Фильтр по дате"
                            value={selectedDate}
                            onChange={(newDate) => {
                                setSelectedDate(newDate);
                                setPage(1);
                            }}
                            format="DD.MM.YYYY"
                            sx={{ flex: 1, width: '100%' }}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    fullWidth: true,
                                },
                            }}
                        />

                        <Autocomplete
                            options={subjects}
                            value={selectedSubject}
                            onChange={(_, newValue) => {
                                setSelectedSubject(newValue);
                                setPage(1);
                            }}
                            loading={loadingSubjects}
                            sx={{ flex: 1, width: '100%' }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Дисциплина"
                                    size="small"
                                    fullWidth
                                    placeholder="Выберите предмет"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingSubjects && <CircularProgress color="inherit" size={18} />}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />

                        <Button
                            variant="outlined"
                            onClick={handleClearFilters}
                            startIcon={<Refresh />}
                            sx={{ height: 40, px: 3, flexShrink: 0 }}
                        >
                            Сбросить
                        </Button>
                    </Stack>
                </Paper>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : attendanceList.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {selectedDate || selectedSubject
                            ? 'По выбранным критериям записей не найдено'
                            : 'Журнал пуст'}
                    </Alert>
                ) : (
                    <>
                        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
                            <Table sx={{ minWidth: 700 }}>
                                <TableHead sx={{ bgcolor: 'grey.100' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Студент</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Дата</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Дисциплина</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Комментарий</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Справка</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {attendanceList.map((record) => (
                                        <TableRow key={record.id} hover>
                                            <TableCell sx={{ fontWeight: 500 }}>
                                                {record.studentFullName || `Студент #${record.studentId}`}
                                            </TableCell>
                                            <TableCell>{record.lessonDate || '—'}</TableCell>
                                            <TableCell>{record.subjectName || `Пара #${record.lessonId}`}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={getMarkIcon(record.mark) || undefined}
                                                    label={getMarkLabel(record.mark)}
                                                    color={getMarkColor(record.mark)}
                                                    size="small"
                                                    sx={{ fontWeight: 500 }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {record.comment || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {record.link ? (
                                                    <Button
                                                        size="small"
                                                        onClick={() => handleViewFile(record.link!)}
                                                        startIcon={<Visibility />}
                                                    >
                                                        Справка
                                                    </Button>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenEdit(record)}
                                                    title="Изменить статус посещаемости"
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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

                <Dialog open={editDialogOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        Редактирование посещаемости
                        <Typography variant="body2" color="text.secondary">
                            {selectedRecord?.studentFullName} — {selectedRecord?.subjectName}
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Отметка присутствия</InputLabel>
                                <Select
                                    value={editMark}
                                    label="Отметка присутствия"
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
                                label="Комментарий преподавателя"
                                multiline
                                rows={3}
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                            />

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Справка / Документ
                                </Typography>

                                {editLink && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                        <Button
                                            size="small"
                                            onClick={() => handleViewFile(editLink)}
                                            startIcon={<Visibility />}
                                        >
                                            Посмотреть прикрепленный файл
                                        </Button>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => setEditLink('')}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                )}

                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="upload-teacher-file"
                                    type="file"
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="upload-teacher-file">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<PhotoCamera />}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Загрузка...' : editLink ? 'Заменить файл' : 'Загрузить файл'}
                                    </Button>
                                </label>

                                {uploading && (
                                    <Box sx={{ width: '100%', mt: 1.5 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={uploadProgress}
                                            sx={{ height: 6, borderRadius: 3 }}
                                        />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            {uploadProgress}%
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleCloseEdit} color="inherit">Отмена</Button>
                        <Button
                            variant="contained"
                            onClick={handleUpdateAttendance}
                            disabled={isSubmitting || uploading}
                        >
                            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </DialogActions>
                </Dialog>

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