// backend/src/controllers/member.controller.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

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

// member.controller.ts
export const getMembers = async (req: Request, res: Response) => {
	try {
		const members = await prisma.user.findMany({
			where: {
				is_active: true,
			},
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
				// ⭐ DODAJ TO:
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
					},
					orderBy: {
						created_at: "desc",
					},
					take: 1,
				},
				team_members: {
					select: {
						team_id: true,
						role: true,
						is_leader: true,
						team: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
			orderBy: {
				first_name: "asc",
			},
		});

		// Mapuj dane - weź pierwszy (najnowszy) rekord onboarding_data
		const mappedMembers = members.map((member: any) => ({
			...member,
			onboarding_data: member.onboarding_data[0] || null,
		}));

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
					},
				},
			},
		});

		if (!user) {
			return res.status(404).json({ error: "Nie znaleziono użytkownika" });
		}

		const onboarding = user.onboarding_data?.[0] || {};

		const developmentAreas = onboarding.development_areas
			? JSON.parse(onboarding.development_areas)
			: [];
		const skills = onboarding.skills ? JSON.parse(onboarding.skills) : [];
		const salaContacts = onboarding.sala_contacts
			? JSON.parse(onboarding.sala_contacts)
			: [];
		const mpContacts = onboarding.mp_contacts
			? JSON.parse(onboarding.mp_contacts)
			: [];
		const institutionContacts = onboarding.institution_contacts
			? JSON.parse(onboarding.institution_contacts)
			: [];
		const otherContacts = onboarding.other_contacts
			? JSON.parse(onboarding.other_contacts)
			: [];

		const mappedMember = {
			id: user.id.toString(),
			firstName: user.first_name,
			lastName: user.last_name,
			function: user.functional_role || "Członek",
			team: user.team || "Brak zespołu",
			teamId: "",
			province: user.province || "",
			status: user.status || "trial",
			interests: developmentAreas,
			skills: skills,
			smAreas: developmentAreas,
			email: user.email || "",
			phone: user.phone || "",
			// W mapowaniu danych (około linii 1420)
			joinDate: user.join_date
				? new Date(user.join_date).toISOString().split("T")[0] // ✅ format YYYY-MM-DD
				: new Date().toISOString().split("T")[0],
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
// 📤 POST - utwórz nowego członka
export const createMember = async (req: Request, res: Response) => {
	try {
		console.log("📥 [createMember] - START");
		console.log("📥 [createMember] - body:", JSON.stringify(req.body, null, 2));

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

		// Walidacja
		if (!firstName || !lastName || !email) {
			console.log("❌ [createMember] - Brak wymaganych pól");
			return res.status(400).json({
				error: "Imię, nazwisko i email są wymagane",
			});
		}

		// Sprawdź czy email istnieje
		const existingUser = await prisma.user.findUnique({
			where: { email: email },
		});

		if (existingUser) {
			console.log("❌ [createMember] - Email już istnieje:", email);

			// Sprawdź czy jest już w zespole
			const existingTeamMember = await prisma.teamMember.findFirst({
				where: {
					user_id: existingUser.id,
					team: {
						name: team,
					},
				},
			});

			if (existingTeamMember) {
				return res.status(400).json({
					error: `Użytkownik ${existingUser.first_name} ${existingUser.last_name} jest już przypisany do zespołu "${team}"`,
				});
			}

			// Jeśli nie jest w zespole, dodaj go do zespołu
			if (team) {
				const teamRecord = await prisma.team.findFirst({
					where: { name: team },
				});

				if (teamRecord) {
					await prisma.teamMember.create({
						data: {
							team_id: teamRecord.id,
							user_id: existingUser.id,
							role: func || "Członek",
							is_leader: false,
						},
					});

					// Zwróć zaktualizowanego użytkownika
					return res.status(200).json({
						message: `Użytkownik został dodany do zespołu "${team}"`,
						// ... dane użytkownika
					});
				}
			}

			return res.status(400).json({
				error: "Użytkownik z tym emailem już istnieje",
			});
		}

		// Generuj unikalny username
		let username = email.split("@")[0];
		let counter = 1;
		let userExists = await prisma.user.findUnique({
			where: { username: username },
		});

		while (userExists) {
			username = `${email.split("@")[0]}${counter}`;
			userExists = await prisma.user.findUnique({
				where: { username: username },
			});
			counter++;
		}

		// Znajdź ID zespołu
		let teamId = null;
		if (team) {
			const teamRecord = await prisma.team.findFirst({
				where: { name: team },
			});
			if (teamRecord) {
				teamId = teamRecord.id;
			}
		}

		// ✅ Tworzenie użytkownika z zespołem - TYLKO TUTAJ
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
				username: username,
				password_hash: await bcrypt.hash("temporary123", 10),
				is_active: true,
				// ✅ TYLKO TUTAJ - dodaj do zespołu podczas tworzenia
				team_members: teamId
					? {
							create: {
								team_id: teamId,
								role: func || "Członek",
								is_leader: false,
							},
						}
					: undefined,
			},
		});

		// ❌ USUŃ TEN BLOK - to duplikat!:
		// if (team) {
		//     const teamRecord = await prisma.team.findFirst({ where: { name: team } });
		//     if (teamRecord) {
		//         await prisma.teamMember.create({ ... });
		//     }
		// }

		// Tworzenie wpisu w onboarding_data
		await prisma.onboarding_data.create({
			data: {
				first_name: firstName,
				last_name: lastName,
				email: email,
				phone: phone || null,
				province: province || "",
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
				users: {
					connect: { id: user.id },
				},
			},
		});

		// Mapowanie danych
		const mappedMember = {
			id: user.id.toString(),
			firstName: user.first_name,
			lastName: user.last_name,
			function: user.functional_role || func || "Członek",
			team: user.team || team || "Brak zespołu",
			teamId: "",
			province: user.province || province || "",
			status: user.status || status || "trial",
			interests: interests || [],
			skills: skills || [],
			smAreas: smAreas || [],
			email: user.email,
			phone: user.phone || "",
			joinDate: user.join_date
				? user.join_date.toISOString().split("T")[0]
				: new Date().toISOString().split("T")[0],
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

		console.log("✅ [createMember] - SUKCES!");
		res.status(201).json(mappedMember);
	} catch (error) {
		console.error("❌ [createMember] - BŁĄD:", error);
		res.status(500).json({
			error: "Nie udało się utworzyć członka",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
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
			where: { id: userId },
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
			where: { user_id: userId },
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
			province: user.province || province || "",
			status: user.status || status || "trial",
			interests: interests || [],
			skills: skills || [],
			smAreas: smAreas || [],
			email: user.email,
			phone: user.phone || "",
			joinDate: user.join_date
				? user.join_date.toISOString().split("T")[0]
				: new Date().toISOString().split("T")[0],
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
			where: { id: userId },
		});

		if (!existingUser) {
			return res.status(404).json({ error: "Nie znaleziono użytkownika" });
		}

		// ✅ ZMIEŃ 0 na false
		await prisma.user.update({
			where: { id: userId },
			data: { is_active: false }, // Boolean - false
		});

		res.status(204).send();
	} catch (error) {
		console.error("❌ Błąd usuwania członka:", error);
		res.status(500).json({ error: "Nie udało się usunąć członka" });
	}
};
