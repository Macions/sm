

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import multer from 'multer';


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
        fileSize: 10 * 1024 * 1024,
        files: 5
    },
    fileFilter: fileFilter
});






export const getTutorials = async (req: Request, res: Response) => {
    try {







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


export const getTutorialById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;











        res.json({ id, message: 'Pobrano poradnik' });
    } catch (error) {
        console.error('❌ Błąd pobierania poradnika:', error);
        res.status(500).json({ error: 'Błąd pobierania poradnika' });
    }
};


export const createTutorial = async (req: Request, res: Response) => {
    try {
        console.log('📥 Otrzymano żądanie POST /tutorials');
        console.log('📁 Pliki:', (req.files as Express.Multer.File[])?.length || 0);


        let tutorialData;
        try {
            tutorialData = JSON.parse(req.body.data);
        } catch (e) {
            tutorialData = req.body;
        }


        if (!tutorialData.title || !tutorialData.description) {
            return res.status(400).json({
                error: 'Tytuł i opis są wymagane'
            });
        }

        const tutorialId = tutorialData.id || uuidv4();


















        const attachments = [];
        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            for (const file of files) {
                const attachmentId = uuidv4();













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


export const updateTutorial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`📥 Otrzymano żądanie PUT /tutorials/${id}`);


        let tutorialData;
        try {
            tutorialData = JSON.parse(req.body.data);
        } catch (e) {
            tutorialData = req.body;
        }


























        const attachments = [];
        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            for (const file of files) {
                const attachmentId = uuidv4();













                attachments.push({
                    id: attachmentId,
                    name: file.originalname,
                    url: `/uploads/tutorials/${file.filename}`,
                    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                    mimeType: file.mimetype
                });
            }
        }






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


export const deleteTutorial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Usuwanie poradnika: ${id}`);



















        console.log('✅ Usunięto poradnik');
        res.json({ success: true });

    } catch (error) {
        console.error('❌ Błąd usuwania poradnika:', error);
        res.status(500).json({ error: 'Błąd usuwania poradnika' });
    }
};


export const deleteAttachment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Usuwanie załącznika: ${id}`);





















        console.log('✅ Usunięto załącznik');
        res.json({ success: true });

    } catch (error) {
        console.error('❌ Błąd usuwania załącznika:', error);
        res.status(500).json({ error: 'Błąd usuwania załącznika' });
    }
};


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