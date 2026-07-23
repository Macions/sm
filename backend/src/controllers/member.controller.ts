// backend/src/controllers/member.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient() as any;

// ============================================================
// FUNKCJE POMOCNICZE
// ============================================================

function mapRoleId(roleId: number | null): string {
    const roleMap: Record<number, string> = {
        1: "admin",
        2: "coordinator",
        3: "coordinator",
        4: "member",
    };
    return roleMap[roleId || 4] || "member";
}

// ============================================================
// KONTROLERY
// ============================================================

// 📥 GET - pobierz wszystkich członków
// backend/src/controllers/member.controller.ts

export const getMembers = async (req: Request, res: Response) => {
    try {
        const members = await prisma.user.findMany({
            where: { is_active: true },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                role_id: true,
                team: true,
                province: true,
                status: true,
                join_date: true,
                functional_role: true,
                onboarding_data: {
                    select: {
                        development_areas: true,
                        skills: true,
                        experience: true,
                        availability: true,
                        description: true,
                        sala_contacts: true,
                        mp_contacts: true,
                        institution_contacts: true,
                        other_contacts: true,
                    }
                },
                // ⭐ DODAJ TO - pobieranie zespołów z team_members
                team_members: {
                    select: {
                        team_id: true,
                        role: true,
                        is_leader: true,
                        team: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: { first_name: 'asc' },
        });

        const mappedMembers = members.map((user: any) => {
            const onboarding = user.onboarding_data?.[0] || {};

            // ⭐ POBIERZ ZESPOŁY Z team_members
            const teams = user.team_members?.map((tm: any) => ({
                id: tm.team_id,
                name: tm.team?.name || 'Brak nazwy',
                role: tm.role || 'Członek',
                isLeader: tm.is_leader || false,
            })) || [];

            // ⭐ ZESPOŁY JAKO STRING (do wyświetlenia)
            const teamNames = teams.map((t: any) => t.name).join(', ') || 'Brak zespołu';

            const developmentAreas = onboarding.development_areas ? JSON.parse(onboarding.development_areas) : [];
            const skills = onboarding.skills ? JSON.parse(onboarding.skills) : [];
            const salaContacts = onboarding.sala_contacts ? JSON.parse(onboarding.sala_contacts) : [];
            const mpContacts = onboarding.mp_contacts ? JSON.parse(onboarding.mp_contacts) : [];
            const institutionContacts = onboarding.institution_contacts ? JSON.parse(onboarding.institution_contacts) : [];
            const otherContacts = onboarding.other_contacts ? JSON.parse(onboarding.other_contacts) : [];

            return {
                id: user.id.toString(),
                firstName: user.first_name,
                lastName: user.last_name,
                function: user.functional_role || "Członek",
                team: teamNames,  // ⭐ WSZYSTKIE ZESPOŁY
                teams: teams,     // ⭐ SZCZEGÓŁY ZESPOŁÓW
                teamId: teams.length > 0 ? teams[0].id.toString() : "",
                province: user.province || "Nieznane",
                status: user.status || "trial",
                interests: developmentAreas,
                skills: skills,
                smAreas: developmentAreas,
                email: user.email || "",
                phone: user.phone || "",
                joinDate: user.join_date ? user.join_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                contacts: {
                    salaContacts: salaContacts,
                    mpContacts: mpContacts,
                    otherContacts: [...institutionContacts, ...otherContacts],
                },
                trainingAreas: skills,
                contributionInfo: {
                    status: "paid",
                    arrears: 0,
                },
                formData: onboarding,
            };
        });

        res.json(mappedMembers);
    } catch (error) {
        console.error("❌ Błąd pobierania członków:", error);
        res.status(500).json({ error: "Nie udało się pobrać członków" });
    }
};

// 📥 GET - pobierz pojedynczego członka
export const getMemberById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id as string);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Nieprawidłowe ID" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                role_id: true,
                team: true,
                province: true,
                status: true,
                join_date: true,
                functional_role: true,
                onboarding_data: {
                    select: {
                        development_areas: true,
                        skills: true,
                        experience: true,
                        availability: true,
                        description: true,
                        sala_contacts: true,
                        mp_contacts: true,
                        institution_contacts: true,
                        other_contacts: true,
                    }
                }
            },
        });

        if (!user) {
            return res.status(404).json({ error: "Nie znaleziono użytkownika" });
        }

        const onboarding = user.onboarding_data?.[0] || {};

        const developmentAreas = onboarding.development_areas ? JSON.parse(onboarding.development_areas) : [];
        const skills = onboarding.skills ? JSON.parse(onboarding.skills) : [];
        const salaContacts = onboarding.sala_contacts ? JSON.parse(onboarding.sala_contacts) : [];
        const mpContacts = onboarding.mp_contacts ? JSON.parse(onboarding.mp_contacts) : [];
        const institutionContacts = onboarding.institution_contacts ? JSON.parse(onboarding.institution_contacts) : [];
        const otherContacts = onboarding.other_contacts ? JSON.parse(onboarding.other_contacts) : [];

        const mappedMember = {
            id: user.id.toString(),
            firstName: user.first_name,
            lastName: user.last_name,
            function: user.functional_role || "Członek",
            team: user.team || "Brak zespołu",
            teamId: "",
            province: user.province || "Nieznane",
            status: user.status || "trial",
            interests: developmentAreas,
            skills: skills,
            smAreas: developmentAreas,
            email: user.email || "",
            phone: user.phone || "",
            joinDate: user.join_date ? user.join_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            contacts: {
                salaContacts: salaContacts,
                mpContacts: mpContacts,
                otherContacts: [...institutionContacts, ...otherContacts],
            },
            trainingAreas: skills,
            contributionInfo: {
                status: "paid",
                arrears: 0,
            },
            formData: onboarding,
        };

        res.json(mappedMember);
    } catch (error) {
        console.error("❌ Błąd pobierania członka:", error);
        res.status(500).json({ error: "Nie udało się pobrać członka" });
    }
};

// 📤 POST - utwórz nowego członka
export const createMember = async (req: Request, res: Response) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            function: func,
            team,
            province,
            status,
            joinDate,
            interests,
            skills,
            smAreas,
            contacts,
            trainingAreas,
            contributionInfo,
        } = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                error: "Imię, nazwisko i email są wymagane"
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingUser) {
            return res.status(400).json({ error: "Użytkownik z tym emailem już istnieje" });
        }

        // Tworzenie użytkownika
        const user = await prisma.user.create({
            data: {
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone || null,
                functional_role: func || null,
                team: team || null,
                province: province || null,
                status: status || "trial",
                join_date: joinDate ? new Date(joinDate) : new Date(),
                role_id: 4,
                username: email.split('@')[0],
                password_hash: await bcrypt.hash('temporary123', 10),
                is_active: true,
            },
        });

        // Tworzenie wpisu w onboarding_data
        await prisma.onboarding_data.create({
            data: {
                user_id: user.id,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone || null,
                province: province || null,
                development_areas: JSON.stringify(interests || []),
                skills: JSON.stringify(skills || []),
                experience: "none",
                availability: null,
                description: null,
                sala_contacts: JSON.stringify(contacts?.salaContacts || []),
                mp_contacts: JSON.stringify(contacts?.mpContacts || []),
                institution_contacts: JSON.stringify(contacts?.otherContacts || []),
                other_contacts: JSON.stringify(contacts?.otherContacts || []),
                completed: true,
            },
        });

        const mappedMember = {
            id: user.id.toString(),
            firstName: user.first_name,
            lastName: user.last_name,
            function: user.functional_role || func || "Członek",
            team: user.team || team || "Brak zespołu",
            teamId: "",
            province: user.province || province || "Nieznane",
            status: user.status || status || "trial",
            interests: interests || [],
            skills: skills || [],
            smAreas: smAreas || [],
            email: user.email,
            phone: user.phone || "",
            joinDate: user.join_date ? user.join_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            contacts: {
                salaContacts: contacts?.salaContacts || [],
                mpContacts: contacts?.mpContacts || [],
                otherContacts: contacts?.otherContacts || [],
            },
            trainingAreas: trainingAreas || [],
            contributionInfo: {
                status: contributionInfo?.status || "paid",
                arrears: contributionInfo?.arrears || 0,
            },
        };

        res.status(201).json(mappedMember);
    } catch (error) {
        console.error("❌ Błąd tworzenia członka:", error);
        res.status(500).json({ error: "Nie udało się utworzyć członka" });
    }
};

// 📝 PUT - aktualizuj członka
export const updateMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id as string);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Nieprawidłowe ID" });
        }

        const {
            firstName,
            lastName,
            email,
            phone,
            function: func,
            team,
            province,
            status,
            joinDate,
            interests,
            skills,
            smAreas,
            contacts,
            trainingAreas,
            contributionInfo,
        } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({ error: "Nie znaleziono użytkownika" });
        }

        // Aktualizacja użytkownika
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone || null,
                functional_role: func || null,
                team: team || null,
                province: province || null,
                status: status || existingUser.status,
                join_date: joinDate ? new Date(joinDate) : undefined,
            },
        });

        // Aktualizacja lub utworzenie wpisu w onboarding_data
        const existingOnboarding = await prisma.onboarding_data.findFirst({
            where: { user_id: userId }
        });

        if (existingOnboarding) {
            await prisma.onboarding_data.update({
                where: { id: existingOnboarding.id },
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone: phone || null,
                    province: province || null,
                    development_areas: JSON.stringify(interests || []),
                    skills: JSON.stringify(skills || []),
                    sala_contacts: JSON.stringify(contacts?.salaContacts || []),
                    mp_contacts: JSON.stringify(contacts?.mpContacts || []),
                    institution_contacts: JSON.stringify(contacts?.otherContacts || []),
                    other_contacts: JSON.stringify(contacts?.otherContacts || []),
                },
            });
        } else {
            await prisma.onboarding_data.create({
                data: {
                    user_id: userId,
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone: phone || null,
                    province: province || null,
                    development_areas: JSON.stringify(interests || []),
                    skills: JSON.stringify(skills || []),
                    experience: "none",
                    sala_contacts: JSON.stringify(contacts?.salaContacts || []),
                    mp_contacts: JSON.stringify(contacts?.mpContacts || []),
                    institution_contacts: JSON.stringify(contacts?.otherContacts || []),
                    other_contacts: JSON.stringify(contacts?.otherContacts || []),
                    completed: true,
                },
            });
        }

        const mappedMember = {
            id: user.id.toString(),
            firstName: user.first_name,
            lastName: user.last_name,
            function: user.functional_role || func || "Członek",
            team: user.team || team || "Brak zespołu",
            teamId: "",
            province: user.province || province || "Nieznane",
            status: user.status || status || "trial",
            interests: interests || [],
            skills: skills || [],
            smAreas: smAreas || [],
            email: user.email,
            phone: user.phone || "",
            joinDate: user.join_date ? user.join_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            contacts: {
                salaContacts: contacts?.salaContacts || [],
                mpContacts: contacts?.mpContacts || [],
                otherContacts: contacts?.otherContacts || [],
            },
            trainingAreas: trainingAreas || [],
            contributionInfo: {
                status: contributionInfo?.status || "paid",
                arrears: contributionInfo?.arrears || 0,
            },
        };

        res.json(mappedMember);
    } catch (error) {
        console.error("❌ Błąd aktualizacji członka:", error);
        res.status(500).json({ error: "Nie udało się zaktualizować członka" });
    }
};

// 🗑️ DELETE - usuń członka (soft delete)
export const deleteMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id as string);

        if (isNaN(userId)) {
            return res.status(400).json({ error: "Nieprawidłowe ID" });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({ error: "Nie znaleziono użytkownika" });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { is_active: false },
        });

        res.status(204).send();
    } catch (error) {
        console.error("❌ Błąd usuwania członka:", error);
        res.status(500).json({ error: "Nie udało się usunąć członka" });
    }
};