import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import bcrypt from "bcrypt";

const prisma = new PrismaClient() as any;

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

		const mappedMembers = members.map((member: any) => ({
			...member,
			onboarding_data: member.onboarding_data[0] || null,
		}));

		res.json(mappedMembers);
	} catch (error) {
		logger.error("❌ Błąd pobierania członków:", error);
		res.status(500).json({ error: "Nie udało się pobrać członków" });
	}
};

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

			joinDate: user.join_date
				? new Date(user.join_date).toISOString().split("T")[0]
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
		logger.error("❌ Błąd pobierania członka:", error);
		res.status(500).json({ error: "Nie udało się pobrać członka" });
	}
};

export const createMember = async (req: Request, res: Response) => {
	try {
		logger.debug("📥 [createMember] - START");
		logger.debug(
			"📥 [createMember] - body:",
			JSON.stringify(req.body, null, 2),
		);

		const {
			firstName,
			lastName,
			email,
			phone,
			function: func,
			team,
			pillars,
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

		// 🔥 DODAJ TUTAJ - WALIDACJA FILARÓW
		if (!pillars || pillars.trim() === "") {
			logger.debug("❌ [createMember] - Brak filarów");
			return res.status(400).json({
				error: "Członek musi być przypisany do przynajmniej jednego filaru",
			});
		}

		const pillarsArray = pillars.split(", ").filter(Boolean);
		if (pillarsArray.length > 2) {
			logger.debug(
				`❌ [createMember] - Za dużo filarów: ${pillarsArray.length}`,
			);
			return res.status(400).json({
				error: "Członek może być przypisany do maksymalnie 2 filarów",
			});
		}

		if (!firstName || !lastName || !email) {
			logger.debug("❌ [createMember] - Brak wymaganych pól");
			return res.status(400).json({
				error: "Imię, nazwisko i email są wymagane",
			});
		}

		const existingUser = await prisma.user.findUnique({
			where: { email: email },
		});

		if (existingUser) {
			logger.debug("❌ [createMember] - Email już istnieje:", email);

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

					return res.status(200).json({
						message: `Użytkownik został dodany do zespołu "${team}"`,
					});
				}
			}

			return res.status(400).json({
				error: "Użytkownik z tym emailem już istnieje",
			});
		}

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

		let teamId = null;
		if (team) {
			const teamRecord = await prisma.team.findFirst({
				where: { name: team },
			});
			if (teamRecord) {
				teamId = teamRecord.id;
			}
		}

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

		logger.debug("✅ [createMember] - SUKCES!");
		res.status(201).json(mappedMember);
	} catch (error) {
		logger.error("❌ [createMember] - BŁĄD:", error);
		res.status(500).json({
			error: "Nie udało się utworzyć członka",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
	}
};

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
			pillars,
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

		// 🔥🔥🔥 WALIDACJA NA POCZĄTKU - PRZED WSZYSTKIM 🔥🔥🔥
		// SPRAWDŹ CZY SĄ FILARY
		if (!pillars || pillars.trim() === "") {
			logger.debug("❌ [updateMember] - Brak filarów");
			return res.status(400).json({
				error: "Członek musi być przypisany do przynajmniej jednego filaru",
			});
		}

		// SPRAWDŹ CZY NIE MA WIĘCEJ NIŻ 2 FILARY
		const pillarsArray = pillars.split(", ").filter(Boolean);
		if (pillarsArray.length > 2) {
			logger.debug(
				`❌ [updateMember] - Za dużo filarów: ${pillarsArray.length}`,
			);
			return res.status(400).json({
				error: "Członek może być przypisany do maksymalnie 2 filarów",
			});
		}

		// DOPIERO TERAZ SPRAWDŹ CZY UŻYTKOWNIK ISTNIEJE
		const existingUser = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!existingUser) {
			return res.status(404).json({ error: "Nie znaleziono użytkownika" });
		}

		// 1. Aktualizacja usera
		// 1. Aktualizacja usera
		const user = await prisma.user.update({
			where: { id: userId },
			data: {
				first_name: firstName,
				last_name: lastName,
				email: email,
				phone: phone || null,
				functional_role: func || null,
				team: team || null, // 🔥 DODAJ TĘ LINIĘ
				pillars: pillars || null,
				province: province || null,
				status: status || existingUser.status,
				join_date: joinDate ? new Date(joinDate) : undefined,
			},
		});

		// 2. Obsługa onboarding_data
		try {
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
						// ❌ USUŃ TĘ LINIĘ:
						// pillars: pillars || null,
						province: province || "",
						development_areas: JSON.stringify(interests || []),
						skills: JSON.stringify(skills || []),
						sala_contacts: JSON.stringify(contacts?.salaContacts || []),
						mp_contacts: JSON.stringify(contacts?.mpContacts || []),
						institution_contacts: JSON.stringify(contacts?.otherContacts || []),
						other_contacts: JSON.stringify(contacts?.otherContacts || []),
					},
				});
			} else {
				// Utwórz nowe - BEZ user_id
				await prisma.onboarding_data.create({
					data: {
						first_name: firstName,
						last_name: lastName,
						email: email,
						phone: phone || null,
						// pillars: pillars || null, // ❌ USUNIĘTE - pole nie istnieje w onboarding_data
						province: province || "",
						development_areas: JSON.stringify(interests || []),
						skills: JSON.stringify(skills || []),
						experience: "none",
						sala_contacts: JSON.stringify(contacts?.salaContacts || []),
						mp_contacts: JSON.stringify(contacts?.mpContacts || []),
						institution_contacts: JSON.stringify(contacts?.otherContacts || []),
						other_contacts: JSON.stringify(contacts?.otherContacts || []),
						completed: true,
						users: {
							connect: { id: userId },
						},
					},
				});
			}
		} catch (onboardingError) {
			// Loguj błąd ale nie przerywaj - user już jest zaktualizowany
			logger.error("❌ Błąd przy zapisie onboarding_data:", onboardingError);
			// Kontynuuj - ważne że user się zaktualizował
		}

		// 3. Zwróć odpowiedź
		const mappedMember = {
			id: user.id.toString(),
			firstName: user.first_name,
			lastName: user.last_name,
			function: user.functional_role || func || "Członek",
			team: user.team || team || "Brak zespołu",
			teamId: "",
			pillars: user.pillars || pillars || "", // 🔥 DODAJ TĘ LINIĘ
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
		logger.error("❌ Błąd aktualizacji członka:", error);
		res.status(500).json({
			error: "Nie udało się zaktualizować członka",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
	}
};

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

		await prisma.user.update({
			where: { id: userId },
			data: { is_active: false },
		});

		res.status(204).send();
	} catch (error) {
		logger.error("❌ Błąd usuwania członka:", error);
		res.status(500).json({ error: "Nie udało się usunąć członka" });
	}
};
