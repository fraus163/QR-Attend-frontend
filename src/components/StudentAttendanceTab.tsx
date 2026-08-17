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
import { staticApi } from '../api/axiosInstance';
import type { AttendanceResponse, AttendanceType } from '../types/Attendance';

interface StudentAttendanceTabProps {
    studentId?: number;
}

const StudentAttendanceTab: React.FC<StudentAttendanceTabProps> = () => {
    const [attendance, setAttendance] = useState<AttendanceResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);

    // Диалог редактирования
    const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceResponse | null>(null);
    const [editComment, setEditComment] = useState<string>('');
    const [editLink, setEditLink] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    // Уведомления
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const loadAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const response = await lessonsApi.getMyAttendance({
                page: page - 1,
                size: 10,
            });
            setAttendance(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Error loading attendance:', error);
        } finally {
            setLoading(false);
        }
    }, [page]);

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
        setEditDialogOpen(true);
    };

    const handleCloseEdit = () => {
        setEditDialogOpen(false);
        setSelectedRecord(null);
        setEditComment('');
        setEditLink('');
        setUploadProgress(0);
    };

    // Загрузка файла на сервер
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

    // Удалить прикрепленный файл
    const handleRemoveFile = () => {
        setEditLink('');
        setSnackbarMessage('Файл удален');
        setSnackbarOpen(true);
    };

    // Обновление (только комментарий и справка)
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

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Моя посещаемость
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : attendance.length === 0 ? (
                <Alert severity="info">У вас пока нет записей о посещаемости</Alert>
            ) : (
                <>
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Дата</TableCell>
                                    <TableCell>Время</TableCell>
                                    <TableCell>Занятие</TableCell>
                                    <TableCell>Отметка</TableCell>
                                    <TableCell>Комментарий</TableCell>
                                    <TableCell>Справка</TableCell>
                                    <TableCell>Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {attendance.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{record.lessonDate || '-'}</TableCell>
                                        <TableCell>
                                            {record.lessonTimeFrom && record.lessonTimeTo
                                                ? `${record.lessonTimeFrom} - ${record.lessonTimeTo}`
                                                : '-'}
                                        </TableCell>
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

            {/* Диалог редактирования */}
            <Dialog open={editDialogOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Редактирование записи
                    <Typography variant="body2" color="text.secondary">
                        {selectedRecord?.subjectName} - {selectedRecord?.lessonDate}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Отметка
                            </Typography>
                            <Chip
                                icon={selectedRecord ? getMarkIcon(selectedRecord.mark) : null}
                                label={selectedRecord ? getMarkLabel(selectedRecord.mark) : ''}
                                color={selectedRecord ? getMarkColor(selectedRecord.mark) : 'default'}
                                size="medium"
                                sx={{ fontWeight: 500 }}
                            />
                        </Box>

                        <TextField
                            fullWidth
                            label="Комментарий"
                            multiline
                            rows={3}
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            placeholder="Добавьте комментарий к посещению..."
                        />

                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Прикрепить справку (фото)
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
    );
};

export default StudentAttendanceTab;