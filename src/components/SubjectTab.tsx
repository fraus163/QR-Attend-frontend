import {
    Box,
    Button,
    CircularProgress,
    Pagination,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Alert,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem, FormHelperText
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { subjectsApi } from "../api/subjectsApi.ts";
import type { SubjectResponse, SubjectRequest } from "../types/Subject.ts";

const SubjectTab = () => {
    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedCourse, setSelectedCourse] = useState<number>(0); // 0 = все курсы
    const [name, setName] = useState("");

    // Состояния для диалога
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<SubjectResponse | null>(null);
    const [formData, setFormData] = useState<SubjectRequest>({
        name: '',
        course: 0
    });
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

    // Состояния для уведомлений
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    const loadSubjects = async (params?: { name?: string; course?: number; page?: number }) => {
        setLoading(true);
        try {
            const data = await subjectsApi.getSubjectsByFilter({
                page: params?.page !== undefined ? params.page : page,
                size: pageSize,
                name: params?.name !== undefined ? (params.name || undefined) : (name || undefined),
                course: params?.course !== undefined
                    ? (params.course === 0 ? undefined : params.course)
                    : (selectedCourse === 0 ? undefined : selectedCourse)
            });
            setSubjects(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            showSnackbar('Ошибка при загрузке дисциплин', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubjects();
    }, [page, pageSize]);

    // CRUD операции
    const handleCreate = () => {
        setEditingSubject(null);
        setFormData({ name: '', course: 0 });
        setFormErrors({});
        setDialogOpen(true);
    };

    const handleEdit = (subject: SubjectResponse) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name,
            course: subject.course
        });
        setFormErrors({});
        setDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту дисциплину?')) return;

        try {
            await subjectsApi.deleteSubject(id);
            showSnackbar('Дисциплина успешно удалена', 'success');
            loadSubjects();
        } catch (error: any) {
            if (error.response?.status === 409) {
                showSnackbar('Невозможно удалить: дисциплина используется в других записях', 'error');
            } else {
                showSnackbar('Ошибка при удалении', 'error');
            }
        }
    };

    const handleSave = async () => {
        const errors: {[key: string]: string} = {};
        if (!formData.name.trim()) {
            errors.name = 'Название обязательно';
        }
        if (formData.course < 1 || formData.course > 4) {
            errors.course = 'Курс должен быть от 1 до 4';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            if (editingSubject) {
                await subjectsApi.putSubject(editingSubject.id, formData);
                showSnackbar('Дисциплина обновлена', 'success');
            } else {
                await subjectsApi.createSubject(formData);
                showSnackbar('Дисциплина создана', 'success');
            }
            setDialogOpen(false);
            loadSubjects();
        } catch (error) {
            showSnackbar('Ошибка при сохранении', 'error');
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    // Обработчики фильтров
    const handleCourseChange = (event: any) => {
        setSelectedCourse(event.target.value);
    };

    const handleSubmit = () => {
        loadSubjects({ name, course: selectedCourse, page: 0 });
        setPage(0);
    };

    const handleClear = () => {
        setName('');
        setSelectedCourse(0);
        loadSubjects({ name: '', course: 0, page: 0 });
        setPage(0);
    };

    return (
        <Stack sx={{ pt: 2 }} spacing={2} alignItems="center">
            <Stack direction="row" spacing={2} width="100%" justifyContent="center" flexWrap="wrap">
                <TextField
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    variant="outlined"
                    size="small"
                    placeholder="Поиск по названию"
                    sx={{ minWidth: 200 }}
                />

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Курс</InputLabel>
                    <Select
                        value={selectedCourse}
                        onChange={handleCourseChange}
                        label="Курс"
                    >
                        <MenuItem value={0}>Все курсы</MenuItem>
                        <MenuItem value={1}>1 курс</MenuItem>
                        <MenuItem value={2}>2 курс</MenuItem>
                        <MenuItem value={3}>3 курс</MenuItem>
                        <MenuItem value={4}>4 курс</MenuItem>
                    </Select>
                </FormControl>

                <Button onClick={handleSubmit} variant="contained">Поиск</Button>
                <Button onClick={handleClear} variant="contained" color="error">Очистить</Button>
                <Button
                    onClick={handleCreate}
                    variant="contained"
                    color="success"
                    startIcon={<Add />}
                >
                    Добавить
                </Button>
            </Stack>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Название</TableCell>
                            <TableCell>Курс</TableCell>
                            <TableCell align="center">Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : subjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    Нет данных
                                </TableCell>
                            </TableRow>
                        ) : (
                            subjects.map((subject) => (
                                <TableRow key={subject.id}>
                                    <TableCell>{subject.id}</TableCell>
                                    <TableCell>{subject.name}</TableCell>
                                    <TableCell>{subject.course}</TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleEdit(subject)}
                                            size="small"
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDelete(subject.id)}
                                            size="small"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={(_, value) => setPage(value - 1)}
                    color="primary"
                />
            </Box>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingSubject ? 'Редактирование дисциплины' : 'Создание дисциплины'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            label="Название дисциплины"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={!!formErrors.name}
                            helperText={formErrors.name}
                            fullWidth
                            autoFocus
                        />
                        <FormControl fullWidth error={!!formErrors.course}>
                            <InputLabel>Курс</InputLabel>
                            <Select
                                value={formData.course}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    course: Number(e.target.value)
                                })}
                                label="Курс"
                            >
                                <MenuItem value={0}>Выберите курс</MenuItem>
                                <MenuItem value={1}>1 курс</MenuItem>
                                <MenuItem value={2}>2 курс</MenuItem>
                                <MenuItem value={3}>3 курс</MenuItem>
                                <MenuItem value={4}>4 курс</MenuItem>
                            </Select>
                            {formErrors.course && (
                                <FormHelperText>{formErrors.course}</FormHelperText>
                            )}
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        {editingSubject ? 'Сохранить' : 'Создать'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Stack>
    );
};

export default SubjectTab;