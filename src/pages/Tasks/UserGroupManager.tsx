import { useState, useEffect } from "react";
import {
	Plus,
	X,
	Edit,
	Trash2,
	Users,
	User,
	Save,
	Globe,
	Lock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import styles from "./UserGroupManager.module.css";

interface UserGroup {
	id: string;
	name: string;
	description: string | null;
	is_public: boolean;
	created_by: string;
	created_by_name: string;
	users: { id: string; name: string; email: string }[];
	user_ids: string[];
	created_at: string;
	updated_at: string;
}

interface UserGroupManagerProps {
	members: { id: string; name: string; email?: string }[];
	onGroupsChange?: (groups: UserGroup[]) => void;
	selectedGroupId?: string;
	onSelectGroup?: (groupId: string) => void;
}

export function UserGroupManager({
	members,
	onGroupsChange,
	selectedGroupId,
	onSelectGroup,
}: UserGroupManagerProps) {
	const [groups, setGroups] = useState<UserGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		user_ids: [] as string[],
		is_public: false,
	});
	const [searchUser, setSearchUser] = useState("");
	const [userSuggestions, setUserSuggestions] = useState<
		{ id: string; name: string }[]
	>([]);
	const [selectedUsers, setSelectedUsers] = useState<
		{ id: string; name: string }[]
	>([]);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchGroups = async () => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/user-groups", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				setGroups(data);
				onGroupsChange?.(data);
			}
		} catch (error) {
			console.error("Błąd pobierania grup:", error);
			toast.error("Nie udało się pobrać grup");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchGroups();
	}, []);

	const handleOpenModal = (group?: UserGroup) => {
		if (group) {
			setEditingGroup(group);
			setFormData({
				name: group.name,
				description: group.description || "",
				user_ids: group.user_ids,
				is_public: group.is_public,
			});
			setSelectedUsers(group.users.map((u) => ({ id: u.id, name: u.name })));
		} else {
			setEditingGroup(null);
			setFormData({
				name: "",
				description: "",
				user_ids: [],
				is_public: false,
			});
			setSelectedUsers([]);
		}
		setSearchUser("");
		setUserSuggestions([]);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingGroup(null);
		setFormData({ name: "", description: "", user_ids: [], is_public: false });
		setSelectedUsers([]);
		setSearchUser("");
		setUserSuggestions([]);
	};

	const handleSaveGroup = async () => {
		if (!formData.name.trim()) {
			toast.error("Nazwa grupy jest wymagana");
			return;
		}

		if (selectedUsers.length === 0) {
			toast.error("Wybierz przynajmniej jednego użytkownika");
			return;
		}

		try {
			const token = localStorage.getItem("accessToken");
			const payload = {
				name: formData.name.trim(),
				description: formData.description.trim() || null,
				user_ids: selectedUsers.map((u) => u.id),
				is_public: formData.is_public,
			};

			const url = editingGroup
				? `/api/user-groups/${editingGroup.id}`
				: "/api/user-groups";
			const method = editingGroup ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (response.ok) {
				toast.success(
					editingGroup ? "Grupa zaktualizowana" : "Grupa utworzona",
				);
				await fetchGroups();
				handleCloseModal();
			} else {
				const error = await response.json();
				toast.error(error.error || "Błąd zapisu");
			}
		} catch (error) {
			console.error("Błąd zapisu grupy:", error);
			toast.error("Nie udało się zapisać grupy");
		}
	};

	const handleDeleteGroup = async (group: UserGroup) => {
		if (!confirm(`Czy na pewno chcesz usunąć grupę "${group.name}"?`)) return;

		setIsDeleting(true);
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/user-groups/${group.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.ok) {
				toast.success("Grupa usunięta");
				await fetchGroups();
			} else {
				const error = await response.json();
				toast.error(error.error || "Błąd usuwania");
			}
		} catch (error) {
			console.error("Błąd usuwania:", error);
			toast.error("Nie udało się usunąć grupy");
		} finally {
			setIsDeleting(false);
		}
	};

	const handleUserSearch = (query: string) => {
		setSearchUser(query);
		if (query.length > 1) {
			const filtered = members.filter(
				(m) =>
					m.name.toLowerCase().includes(query.toLowerCase()) &&
					!selectedUsers.find((u) => u.id === m.id),
			);
			setUserSuggestions(filtered.slice(0, 10));
		} else {
			setUserSuggestions([]);
		}
	};

	const addUser = (user: { id: string; name: string }) => {
		if (!selectedUsers.find((u) => u.id === user.id)) {
			setSelectedUsers([...selectedUsers, user]);
		}
		setSearchUser("");
		setUserSuggestions([]);
	};

	const removeUser = (userId: string) => {
		setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
	};

	if (loading) {
		return <div className={styles.loading}>Ładowanie grup...</div>;
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h3 className={styles.title}>Reguły przypisywania</h3>
				<button className={styles.addBtn} onClick={() => handleOpenModal()}>
					<Plus size={16} />
					Utwórz regułę
				</button>
			</div>

			{groups.length === 0 ? (
				<div className={styles.empty}>
					<Users size={32} />
					<p>Brak utworzonych reguł</p>
					<span>Utwórz regułę aby szybko przypisywać grupy użytkowników</span>
				</div>
			) : (
				<div className={styles.groupList}>
					{groups.map((group) => (
						<div
							key={group.id}
							className={`${styles.groupItem} ${selectedGroupId === group.id ? styles.groupItemSelected : ""}`}
							onClick={() => onSelectGroup?.(group.id)}
						>
							<div className={styles.groupInfo}>
								<div className={styles.groupName}>
									{group.is_public ? <Globe size={14} /> : <Lock size={14} />}
									{group.name}
									<span className={styles.groupCount}>
										{group.users.length}{" "}
										{group.users.length === 1 ? "osoba" : "osób"}
									</span>
								</div>
								{group.description && (
									<div className={styles.groupDescription}>
										{group.description}
									</div>
								)}
								<div className={styles.groupUsers}>
									{group.users.slice(0, 3).map((u) => (
										<span key={u.id} className={styles.groupUser}>
											{u.name}
										</span>
									))}
									{group.users.length > 3 && (
										<span className={styles.groupUserMore}>
											+{group.users.length - 3} więcej
										</span>
									)}
								</div>
							</div>
							<div className={styles.groupActions}>
								<button
									className={styles.groupActionBtn}
									onClick={(e) => {
										e.stopPropagation();
										handleOpenModal(group);
									}}
								>
									<Edit size={14} />
								</button>
								<button
									className={`${styles.groupActionBtn} ${styles.groupActionBtnDanger}`}
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteGroup(group);
									}}
									disabled={isDeleting}
								>
									<Trash2 size={14} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{isModalOpen && (
				<div className={styles.modalOverlay} onClick={handleCloseModal}>
					<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h2>{editingGroup ? "Edytuj regułę" : "Utwórz nową regułę"}</h2>
							<button className={styles.modalClose} onClick={handleCloseModal}>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modalBody}>
							<div className={styles.field}>
								<label>Nazwa reguły *</label>
								<input
									type="text"
									className={styles.input}
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="np. Warszawa, Koordynatorzy, IT..."
								/>
							</div>

							<div className={styles.field}>
								<label>Opis (opcjonalnie)</label>
								<textarea
									className={styles.textarea}
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Krótki opis reguły..."
									rows={2}
								/>
							</div>

							<div className={styles.field}>
								<label>Użytkownicy w regule *</label>
								<div className={styles.userSearch}>
									<input
										type="text"
										className={styles.input}
										placeholder="Szukaj użytkowników..."
										value={searchUser}
										onChange={(e) => handleUserSearch(e.target.value)}
									/>
									{userSuggestions.length > 0 && (
										<div className={styles.suggestions}>
											{userSuggestions.map((user) => (
												<div
													key={user.id}
													className={styles.suggestionItem}
													onClick={() => addUser(user)}
												>
													<User size={14} />
													{user.name}
												</div>
											))}
										</div>
									)}
								</div>
								<div className={styles.selectedUsers}>
									{selectedUsers.map((user) => (
										<span key={user.id} className={styles.selectedUser}>
											{user.name}
											<button onClick={() => removeUser(user.id)}>
												<X size={12} />
											</button>
										</span>
									))}
									{selectedUsers.length === 0 && (
										<span className={styles.noUsers}>
											Brak wybranych użytkowników
										</span>
									)}
								</div>
							</div>
						</div>

						<div className={styles.modalFooter}>
							<button className={styles.cancelBtn} onClick={handleCloseModal}>
								Anuluj
							</button>
							<button className={styles.saveBtn} onClick={handleSaveGroup}>
								<Save size={16} />
								{editingGroup ? "Zapisz zmiany" : "Utwórz regułę"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
