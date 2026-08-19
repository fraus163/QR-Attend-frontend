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
    LinearProgress,
} from '@mui/material';
import {
    Check,
    Close as CloseIcon,
    Warning,
    Info,
    Edit,
    PhotoCamera,
    Delete,
    Visibility,
} from '@mui/icons-material';
import { lessonsApi } from '../api/lessonsApi';
import { staticApi, api } from '../api/axiosInstance';
import type { AttendanceResponse, AttendanceType } from '../types/Attendance';

const formatTime = (time?: string): string => (time ? time.substring(0, 5) : '');

const StudentAttendanceTab: React.FC = () => {
    const [attendance, setAttendance] = useState<AttendanceResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceResponse | null>(null);
    const [editComment, setEditComment] = useState<string>('');
    const [editLink, setEditLink] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const loadAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const response = await lessonsApi.getMyAttendance({
                page: page - 1,
                size: 10,
            });
            setAttendance(response.content || []);
            setTotalPages(response.totalPages || 1);
        } catch (error) {
            console.error('Ошибка загрузки посещаемости:', error);
            setSnackbarMessage('Ошибка при загрузке списка посещений');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    const handleViewFile = async (link: string) => {
        if (!link) return;

        try {
            const response = await staticApi.get(link, {
                responseType: 'blob',
            });

            const url = URL.createObjectURL(response.data);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 15000);
        } catch (error) {
            console.error('Ошибка открытия файла:', error);
            setSnackbarMessage('Не удалось загрузить файл справки');
            setSnackbarOpen(true);
        }
    };

    const getMarkLabel = (mark: AttendanceType): string => {
        const labels: Record<AttendanceType, string> = {
            PRESENT: 'Присутствовал',
            ABSENT: 'Отсутствовал',
            LATE: 'Опоздал',
            EXCUSED: 'Уважительная',
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
        setEditDialogOpen(true);
    };

    const handleCloseEdit = () => {
        setEditDialogOpen(false);
        setSelectedRecord(null);
        setEditComment('');
        setEditLink('');
        setUploadProgress(0);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setSnackbarMessage('Разрешены только изображения (JPEG, PNG)');
            setSnackbarOpen(true);
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setSnackbarMessage('Максимальный размер файла — 5 МБ');
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
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percent);
                    }
                },
            });

            setEditLink(response.data.url);
            setSnackbarMessage('Файл успешно прикреплен');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
            setSnackbarMessage('Не удалось загрузить файл на сервер');
            setSnackbarOpen(true);
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleUpdateAttendance = async () => {
        if (!selectedRecord) return;

        setIsSubmitting(true);
        try {
            await lessonsApi.updateAttendance(selectedRecord.id, {
                comment: editComment,
                link: editLink,
            });

            setAttendance(prev => prev.map(record =>
                record.id === selectedRecord.id
                    ? { ...record, comment: editComment, link: editLink }
                    : record
            ));

            setSnackbarMessage('Данные успешно сохранены');
            setSnackbarOpen(true);
            handleCloseEdit();
        } catch (error) {
            console.error('Ошибка обновления данных:', error);
            setSnackbarMessage('Ошибка при сохранении');
            setSnackbarOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
                История посещений
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : attendance.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    У вас пока нет отметок о посещаемости.
                </Alert>
            ) : (
                <>
                    <TableContainer component={Paper} elevation={1} sx={{ mt: 2, borderRadius: 2 }}>
                        <Table sx={{ minWidth: 700 }}>
                            <TableHead sx={{ bgcolor: 'grey.100' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Дата</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Время</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Дисциплина</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Преподаватель</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Комментарий</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Документ</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {attendance.map((record) => (
                                    <TableRow key={record.id} hover>
                                        <TableCell>{record.lessonDate || '—'}</TableCell>
                                        <TableCell>
                                            {record.lessonTimeFrom && record.lessonTimeTo
                                                ? `${formatTime(record.lessonTimeFrom)} — ${formatTime(record.lessonTimeTo)}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600} color="primary.main">
                                                {record.subjectName || `Пара #${record.lessonId}`}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{record.teacherFullName || '—'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getMarkIcon(record.mark) || undefined}
                                                label={getMarkLabel(record.mark)}
                                                color={getMarkColor(record.mark)}
                                                size="small"
                                                sx={{ fontWeight: 500 }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {record.comment || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {record.link ? (
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    onClick={() => handleViewFile(record.link!)}
                                                    startIcon={<Visibility />}
                                                >
                                                    Фото
                                                </Button>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenEdit(record)}
                                                title="Добавить справку или комментарий"
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
                    Информация о посещении
                    <Typography variant="body2" color="text.secondary">
                        {selectedRecord?.subjectName} ({selectedRecord?.lessonDate})
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                Текущий статус
                            </Typography>
                            {selectedRecord && (
                                <Chip
                                    icon={getMarkIcon(selectedRecord.mark) || undefined}
                                    label={getMarkLabel(selectedRecord.mark)}
                                    color={getMarkColor(selectedRecord.mark)}
                                    size="small"
                                />
                            )}
                        </Box>

                        <TextField
                            fullWidth
                            label="Комментарий к пропуску/занятию"
                            multiline
                            rows={3}
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            placeholder="Например: Был у врача / опоздал из-за транспорта"
                        />

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Документ / Справка
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
                                id="upload-student-doc"
                                type="file"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="upload-student-doc">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<PhotoCamera />}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Загрузка...' : editLink ? 'Заменить фото' : 'Прикрепить фото справки'}
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
                    <Button onClick={handleCloseEdit} color="inherit">
                        Отмена
                    </Button>
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
    );
};

export default StudentAttendanceTab;