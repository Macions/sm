// backend/src/controllers/tutorial.controller.ts

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// Konfiguracja multer
const uploadDir = path.join(__dirname, '../uploads/tutorials');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req: any, file: any, cb: any) => {
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
    } else {
        cb(new Error(`Niedozwolony typ pliku: ${file.mimetype}`), false);
    }
};

export const upload = multer({
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
export const getTutorials = async (req: Request, res: Response) => {
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
    } catch (error) {
        console.error('❌ Błąd pobierania poradników:', error);
        res.status(500).json({ error: 'Błąd pobierania poradników' });
    }
};

// GET - pobierz pojedynczy poradnik
export const getTutorialById = async (req: Request, res: Response) => {
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
    } catch (error) {
        console.error('❌ Błąd pobierania poradnika:', error);
        res.status(500).json({ error: 'Błąd pobierania poradnika' });
    }
};

// POST - utwórz nowy poradnik z plikami
export const createTutorial = async (req: Request, res: Response) => {
    try {
        console.log('📥 Otrzymano żądanie POST /tutorials');
        console.log('📁 Pliki:', (req.files as Express.Multer.File[])?.length || 0);

        // Parsuj dane
        let tutorialData;
        try {
            tutorialData = JSON.parse(req.body.data);
        } catch (e) {
            tutorialData = req.body;
        }

        // Walidacja
        if (!tutorialData.title || !tutorialData.description) {
            return res.status(400).json({
                error: 'Tytuł i opis są wymagane'
            });
        }

        const tutorialId = tutorialData.id || uuidv4();

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
        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            for (const file of files) {
                const attachmentId = uuidv4();

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

    } catch (error) {
        console.error('❌ Błąd tworzenia poradnika:', error);

        // Usuń przesłane pliki w przypadku błędu
        const files = req.files as Express.Multer.File[];
        if (files) {
            for (const file of files) {
                const filePath = path.join(uploadDir, file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        res.status(500).json({ error: 'Błąd tworzenia poradnika' });
    }
};

// PUT - aktualizuj poradnik
export const updateTutorial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`📥 Otrzymano żądanie PUT /tutorials/${id}`);

        // Parsuj dane
        let tutorialData;
        try {
            tutorialData = JSON.parse(req.body.data);
        } catch (e) {
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
        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            for (const file of files) {
                const attachmentId = uuidv4();

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

        const existingAttachments: any[] = [];
        const allAttachments = [...existingAttachments, ...attachments];

        const result = {
            id: id,
            ...tutorialData,
            attachments: allAttachments,
            updatedAt: new Date().toISOString()
        };

        console.log('✅ Zaktualizowano poradnik:', result);
        res.json(result);

    } catch (error) {
        console.error('❌ Błąd aktualizacji poradnika:', error);
        res.status(500).json({ error: 'Błąd aktualizacji poradnika' });
    }
};

// DELETE - usuń poradnik
export const deleteTutorial = async (req: Request, res: Response) => {
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

    } catch (error) {
        console.error('❌ Błąd usuwania poradnika:', error);
        res.status(500).json({ error: 'Błąd usuwania poradnika' });
    }
};

// DELETE - usuń pojedynczy załącznik
export const deleteAttachment = async (req: Request, res: Response) => {
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

    } catch (error) {
        console.error('❌ Błąd usuwania załącznika:', error);
        res.status(500).json({ error: 'Błąd usuwania załącznika' });
    }
};

// GET - pobierz plik
export const getFile = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Nie znaleziono pliku' });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error('❌ Błąd pobierania pliku:', error);
        res.status(500).json({ error: 'Błąd pobierania pliku' });
    }
};