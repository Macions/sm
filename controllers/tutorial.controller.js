"use strict";
// backend/src/controllers/tutorial.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFile = exports.deleteAttachment = exports.deleteTutorial = exports.updateTutorial = exports.createTutorial = exports.getTutorialById = exports.getTutorials = exports.upload = void 0;
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
// Konfiguracja multer
const uploadDir = path_1.default.join(__dirname, '../uploads/tutorials');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const uniqueName = `${(0, uuid_1.v4)()}${ext}`;
        cb(null, uniqueName);
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'text/csv',
        'application/zip'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Niedozwolony typ pliku: ${file.mimetype}`), false);
    }
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5
    },
    fileFilter: fileFilter
});
// ════════════════════════════════════════════
// KONTROLERY
// ════════════════════════════════════════════
// GET - pobierz wszystkie poradniki
const getTutorials = async (req, res) => {
    try {
        // TODO: Podłącz swoją bazę danych
        // const tutorials = await prisma.tutorial.findMany({
        //     include: { attachments: true },
        //     orderBy: { updatedAt: 'desc' }
        // });
        // Tymczasowe dane
        const tutorials = [
            {
                id: '1',
                title: 'Przykładowy poradnik',
                description: 'Opis poradnika',
                category: 'new_member',
                access: 'all',
                author: 'Admin',
                content: 'Treść poradnika...',
                functionalRoles: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                attachments: []
            }
        ];
        res.json(tutorials);
    }
    catch (error) {
        console.error('❌ Błąd pobierania poradników:', error);
        res.status(500).json({ error: 'Błąd pobierania poradników' });
    }
};
exports.getTutorials = getTutorials;
// GET - pobierz pojedynczy poradnik
const getTutorialById = async (req, res) => {
    try {
        const { id } = req.params;
        // TODO: Pobierz z bazy
        // const tutorial = await prisma.tutorial.findUnique({
        //     where: { id },
        //     include: { attachments: true }
        // });
        // if (!tutorial) {
        //     return res.status(404).json({ error: 'Nie znaleziono poradnika' });
        // }
        res.json({ id, message: 'Pobrano poradnik' });
    }
    catch (error) {
        console.error('❌ Błąd pobierania poradnika:', error);
        res.status(500).json({ error: 'Błąd pobierania poradnika' });
    }
};
exports.getTutorialById = getTutorialById;
// POST - utwórz nowy poradnik z plikami
const createTutorial = async (req, res) => {
    try {
        console.log('📥 Otrzymano żądanie POST /tutorials');
        console.log('📁 Pliki:', req.files?.length || 0);
        // Parsuj dane
        let tutorialData;
        try {
            tutorialData = JSON.parse(req.body.data);
        }
        catch (e) {
            tutorialData = req.body;
        }
        // Walidacja
        if (!tutorialData.title || !tutorialData.description) {
            return res.status(400).json({
                error: 'Tytuł i opis są wymagane'
            });
        }
        const tutorialId = tutorialData.id || (0, uuid_1.v4)();
        // TODO: Zapisz w bazie
        // const tutorial = await prisma.tutorial.create({
        //     data: {
        //         id: tutorialId,
        //         title: tutorialData.title,
        //         description: tutorialData.description,
        //         category: tutorialData.category,
        //         access: tutorialData.access,
        //         author: tutorialData.author,
        //         content: tutorialData.content || '',
        //         functionalRoles: tutorialData.functionalRoles || [],
        //         createdAt: new Date(tutorialData.createdAt || Date.now()),
        //         updatedAt: new Date(tutorialData.updatedAt || Date.now())
        //     }
        // });
        // Zapisz pliki
        const attachments = [];
        const files = req.files;
        if (files && files.length > 0) {
            for (const file of files) {
                const attachmentId = (0, uuid_1.v4)();
                // TODO: Zapisz w bazie
                // await prisma.attachment.create({
                //     data: {
                //         id: attachmentId,
                //         tutorialId: tutorialId,
                //         name: file.originalname,
                //         url: `/uploads/tutorials/${file.filename}`,
                //         size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                //         mimeType: file.mimetype
                //     }
                // });
                attachments.push({
                    id: attachmentId,
                    name: file.originalname,
                    url: `/uploads/tutorials/${file.filename}`,
                    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                    mimeType: file.mimetype
                });
            }
        }
        const result = {
            id: tutorialId,
            ...tutorialData,
            attachments: attachments,
            createdAt: tutorialData.createdAt || new Date().toISOString(),
            updatedAt: tutorialData.updatedAt || new Date().toISOString()
        };
        console.log('✅ Utworzono poradnik:', result);
        res.status(201).json(result);
    }
    catch (error) {
        console.error('❌ Błąd tworzenia poradnika:', error);
        // Usuń przesłane pliki w przypadku błędu
        const files = req.files;
        if (files) {
            for (const file of files) {
                const filePath = path_1.default.join(uploadDir, file.filename);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
        }
        res.status(500).json({ error: 'Błąd tworzenia poradnika' });
    }
};
exports.createTutorial = createTutorial;
// PUT - aktualizuj poradnik
const updateTutorial = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 Otrzymano żądanie PUT /tutorials/${id}`);
        // Parsuj dane
        let tutorialData;
        try {
            tutorialData = JSON.parse(req.body.data);
        }
        catch (e) {
            tutorialData = req.body;
        }
        // TODO: Sprawdź czy istnieje
        // const existing = await prisma.tutorial.findUnique({
        //     where: { id }
        // });
        // if (!existing) {
        //     return res.status(404).json({ error: 'Nie znaleziono poradnika' });
        // }
        // TODO: Aktualizuj w bazie
        // const tutorial = await prisma.tutorial.update({
        //     where: { id },
        //     data: {
        //         title: tutorialData.title,
        //         description: tutorialData.description,
        //         category: tutorialData.category,
        //         access: tutorialData.access,
        //         author: tutorialData.author,
        //         content: tutorialData.content || '',
        //         functionalRoles: tutorialData.functionalRoles || [],
        //         updatedAt: new Date()
        //     }
        // });
        // Zapisz nowe pliki
        const attachments = [];
        const files = req.files;
        if (files && files.length > 0) {
            for (const file of files) {
                const attachmentId = (0, uuid_1.v4)();
                // TODO: Zapisz w bazie
                // await prisma.attachment.create({
                //     data: {
                //         id: attachmentId,
                //         tutorialId: id,
                //         name: file.originalname,
                //         url: `/uploads/tutorials/${file.filename}`,
                //         size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                //         mimeType: file.mimetype
                //     }
                // });
                attachments.push({
                    id: attachmentId,
                    name: file.originalname,
                    url: `/uploads/tutorials/${file.filename}`,
                    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                    mimeType: file.mimetype
                });
            }
        }
        // TODO: Pobierz istniejące załączniki
        // const existingAttachments = await prisma.attachment.findMany({
        //     where: { tutorialId: id }
        // });
        const existingAttachments = [];
        const allAttachments = [...existingAttachments, ...attachments];
        const result = {
            id: id,
            ...tutorialData,
            attachments: allAttachments,
            updatedAt: new Date().toISOString()
        };
        console.log('✅ Zaktualizowano poradnik:', result);
        res.json(result);
    }
    catch (error) {
        console.error('❌ Błąd aktualizacji poradnika:', error);
        res.status(500).json({ error: 'Błąd aktualizacji poradnika' });
    }
};
exports.updateTutorial = updateTutorial;
// DELETE - usuń poradnik
const deleteTutorial = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Usuwanie poradnika: ${id}`);
        // TODO: Pobierz załączniki
        // const attachments = await prisma.attachment.findMany({
        //     where: { tutorialId: id }
        // });
        // Usuń fizyczne pliki
        // for (const attachment of attachments) {
        //     const filePath = path.join(__dirname, '..', attachment.url);
        //     if (fs.existsSync(filePath)) {
        //         fs.unlinkSync(filePath);
        //     }
        // }
        // TODO: Usuń z bazy
        // await prisma.tutorial.delete({
        //     where: { id }
        // });
        console.log('✅ Usunięto poradnik');
        res.json({ success: true });
    }
    catch (error) {
        console.error('❌ Błąd usuwania poradnika:', error);
        res.status(500).json({ error: 'Błąd usuwania poradnika' });
    }
};
exports.deleteTutorial = deleteTutorial;
// DELETE - usuń pojedynczy załącznik
const deleteAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Usuwanie załącznika: ${id}`);
        // TODO: Pobierz załącznik
        // const attachment = await prisma.attachment.findUnique({
        //     where: { id }
        // });
        // if (!attachment) {
        //     return res.status(404).json({ error: 'Nie znaleziono załącznika' });
        // }
        // Usuń fizyczny plik
        // const filePath = path.join(__dirname, '..', attachment.url);
        // if (fs.existsSync(filePath)) {
        //     fs.unlinkSync(filePath);
        // }
        // TODO: Usuń z bazy
        // await prisma.attachment.delete({
        //     where: { id }
        // });
        console.log('✅ Usunięto załącznik');
        res.json({ success: true });
    }
    catch (error) {
        console.error('❌ Błąd usuwania załącznika:', error);
        res.status(500).json({ error: 'Błąd usuwania załącznika' });
    }
};
exports.deleteAttachment = deleteAttachment;
// GET - pobierz plik
const getFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(uploadDir, filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'Nie znaleziono pliku' });
        }
        res.sendFile(filePath);
    }
    catch (error) {
        console.error('❌ Błąd pobierania pliku:', error);
        res.status(500).json({ error: 'Błąd pobierania pliku' });
    }
};
exports.getFile = getFile;
