-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Lip 23, 2026 at 04:29 PM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `silamlodych`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `guides`
--

CREATE TABLE `guides` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `access` varchar(50) DEFAULT 'all',
  `author_id` int(11) DEFAULT NULL,
  `content` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_published` tinyint(4) DEFAULT 1,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `functional_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`functional_roles`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `guides`
--

INSERT INTO `guides` (`id`, `title`, `description`, `category`, `access`, `author_id`, `content`, `created_at`, `updated_at`, `is_published`, `attachments`, `functional_roles`) VALUES
(1, 'Poradnik nowych członków', 'Kompleksowy przewodnik dla nowych członków organizacji. Zawiera informacje o strukturze, zasadach działania, komunikacji oraz podstawowych obowiązkach.', 'new_member', 'all', 1, 'Witaj w Sile Młodych! Ten poradnik pomoże Ci rozpocząć przygodę z naszą organizacją...', '2026-07-21 20:55:31', '2026-07-23 09:44:52', 0, NULL, NULL),
(2, 'Poradnik koordynatorów', 'Materiał dostępny wyłącznie dla osób pełniących funkcję koordynatora. Zawiera informacje o zarządzaniu zespołem, prowadzeniu projektów i obowiązkach.', 'coordinator', 'coordinator', 1, 'Jako koordynator jesteś odpowiedzialny za...', '2026-07-21 20:55:31', '2026-07-21 20:55:31', 1, NULL, NULL),
(3, 'Wytyczne projektoweeee', 'Dokument opisujący sposób zgłaszania, planowania oraz realizacji projektów w organizacji.', 'project_guidelines', 'all', 1, 'Proces tworzenia projektu w Siły Młodych składa się z kilku etapów...', '2026-07-21 20:55:31', '2026-07-23 09:44:06', 0, NULL, '[]'),
(4, 'Test z konsoli', 'Test opis', 'new_member', 'all', 1, 'Test treść', '2026-07-22 18:15:55', '2026-07-23 09:44:56', 0, NULL, NULL),
(5, 'dasdas', 'dasdasdsa', 'statute', 'functional', 1, 'dasd', '2026-07-22 18:16:57', '2026-07-22 18:16:57', 1, NULL, NULL),
(6, 'dasds', 'das', 'new_member', 'all', 1, NULL, '2026-07-22 18:17:11', '2026-07-23 09:44:58', 0, NULL, NULL),
(9, 'test1232', 'dashdasdy63273', 'new_member', 'all', 1, NULL, '2026-07-23 09:21:49', '2026-07-23 09:29:43', 1, '[{\"id\":\"mrxf8jaqxl452rm\",\"name\":\"Logo Siły Młodych (1).png\",\"url\":\"/uploads/tutorials/mrxf8j8upyj9y2w.png\",\"size\":\"0.3 MB\"},{\"id\":\"mrxfipf7av0engn\",\"name\":\"Notatka ze spotkania podzespołu ds promocji savoir-vivr.pdf\",\"url\":\"/uploads/tutorials/mrxfip7acw3qoxd.pdf\",\"size\":\"3.9 MB\",\"mimeType\":\"application/pdf\"}]', '[]');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) NOT NULL CHECK (`type` in ('info','success','warning','error')),
  `read` tinyint(1) DEFAULT 0,
  `link` varchar(255) DEFAULT NULL,
  `target` varchar(50) DEFAULT 'all' CHECK (`target` in ('all','member','coordinator','admin','board','social_media')),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `read`, `link`, `target`, `created_at`, `updated_at`) VALUES
(1, 1, 'Witaj w SM!', 'Cieszymy się, że dołączyłeś do Siły Młodych!', 'success', 1, NULL, 'all', '2026-07-21 20:55:31', '2026-07-22 18:26:42'),
(2, 1, 'Nowy poradnik', 'Dodano nowy poradnik dla członków', 'info', 1, '/guides', 'all', '2026-07-21 20:55:31', '2026-07-22 18:26:42'),
(3, 1, 'Przypomnienie', 'Spotkanie zarządu w piątek o 18:00', 'warning', 1, NULL, 'all', '2026-07-21 20:55:31', '2026-07-22 18:26:42'),
(4, 1, 'Nowy członek dołączył', 'Anna Nowak dołączyła do Filaru Projektowego', 'success', 1, '/members', 'admin', '2026-07-21 20:55:31', '2026-07-22 18:26:42'),
(5, 1, 'Wniosek urlopowy', 'Maja Kądziela złożyła wniosek urlopowy', 'info', 1, '/leave', 'coordinator', '2026-07-21 20:55:31', '2026-07-22 18:26:42'),
(6, 1, 'Projekt zatwierdzony', 'Projekt Letnia Akademia Liderów został zatwierdzony', 'success', 1, '/projects', 'admin', '2026-07-21 20:55:31', '2026-07-21 20:55:31'),
(7, 1, 'Nowe możliwości współpracy', 'Nawiązano współpracę z Fundacją Rozwoju Młodzieży', 'success', 1, '/dashboard', 'board', '2026-07-21 20:55:31', '2026-07-21 20:55:31');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `onboarding_data`
--

CREATE TABLE `onboarding_data` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `province` varchar(100) NOT NULL,
  `development_areas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`development_areas`)),
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `experience` varchar(50) DEFAULT 'none' CHECK (`experience` in ('none','beginner','intermediate','advanced')),
  `availability` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sala_contacts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`sala_contacts`)),
  `mp_contacts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mp_contacts`)),
  `institution_contacts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`institution_contacts`)),
  `other_contacts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`other_contacts`)),
  `completed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `onboarding_data`
--

INSERT INTO `onboarding_data` (`id`, `user_id`, `first_name`, `last_name`, `email`, `phone`, `province`, `development_areas`, `skills`, `experience`, `availability`, `description`, `sala_contacts`, `mp_contacts`, `institution_contacts`, `other_contacts`, `completed`, `created_at`, `updated_at`) VALUES
(1, 1, 'Maciej', 'Czarnecki', 'maciej.czarnecki@silamlodych.pl', '+48573221560', 'Łódzkie', '[\"Projekty\",\"Konferencje\"]', '[\"Project Management\",\"Leadership\",\"Administracja\"]', 'advanced', 'Poniedziałek-Piątek 16:00-20:00', 'Doświadczony administrator', '[]', '[]', '[]', '[]', 1, '2026-07-21 20:55:30', '2026-07-23 14:17:46');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `pillar` varchar(100) DEFAULT NULL,
  `coordinator_id` int(11) DEFAULT NULL,
  `team` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'planning' CHECK (`status` in ('planning','in_progress','promotion','completed')),
  `estimated_end` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(4) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `name`, `description`, `pillar`, `coordinator_id`, `team`, `status`, `estimated_end`, `created_at`, `updated_at`, `is_active`) VALUES
(1, 'Letnia Akademia Liderów dasda', 'Szkolenia dla młodych liderów', 'Filar Projektowy', 28, 'Filar Projektowy', 'in_progress', '2026-09-30', '2026-07-21 20:55:31', '2026-07-22 15:49:38', 1),
(2, 'Debata Młodych 2026', 'Ogólnopolska debata młodzieżowa', 'Filar Konferencji i Debat', NULL, 'Filar Konferencji i Debat', 'planning', '2026-11-15', '2026-07-21 20:55:31', '2026-07-21 20:55:31', 1),
(3, 'Innowacje 2026', 'Projekt innowacyjny', 'Filar Projektowy', NULL, 'Filar Projektowy', 'promotion', '2026-08-31', '2026-07-21 20:55:31', '2026-07-21 20:55:31', 1),
(4, 'TEST123', 'TEST OPIS', 'Filar Rzeczniczy', 1, '4', 'in_progress', '2026-07-24', '2026-07-22 14:58:35', '2026-07-22 15:46:14', 0),
(12, 'dfsd', 'fsdfsd', 'Filar Rzeczniczy', 28, '4', 'in_progress', '2026-07-31', '2026-07-22 15:47:03', '2026-07-22 15:47:32', 0),
(13, 'test sym', 'test sym', 'Filar Symulacyjny', 30, NULL, 'planning', '2026-07-23', '2026-07-22 15:47:21', '2026-07-22 15:47:30', 0);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(512) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `token`, `expires_at`, `created_at`) VALUES
(1, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg0NjY3NjI1LCJleHAiOjE3ODU4NzcyMjV9.dB7kjbcSiVGsacbxXLoN7o5LSW40OFCa4UzzT5p-SP8', '2026-08-04 23:00:25', '2026-07-21 21:00:25'),
(2, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzg0NzMyNDE1LCJleHAiOjE3ODU5NDIwMTV9.3P9MGZI74JK-45F2NNey3-R2OJnvAeB95wPEIuBdOKI', '2026-08-05 17:00:15', '2026-07-22 15:00:15');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'admin', 'Administrator główny - pełny dostęp', '2026-07-21 20:55:30'),
(2, 'board', 'Zarząd - zarządzanie projektami', '2026-07-21 20:55:30'),
(3, 'coordinator', 'Koordynator - zarządzanie projektami i zespołami', '2026-07-21 20:55:30'),
(4, 'member', 'Członek - podstawowy dostęp', '2026-07-21 20:55:30'),
(5, 'mentor', 'Mentor - dostęp do danych członków', '2026-07-21 20:55:30');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `teams`
--

CREATE TABLE `teams` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT 'Users',
  `status` varchar(20) DEFAULT 'active',
  `parent_id` int(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teams`
--

INSERT INTO `teams` (`id`, `name`, `role`, `description`, `icon`, `status`, `parent_id`, `email`, `created_at`) VALUES
(1, 'Siła Młodych', 'Struktura organizacyjna', 'Organizacja młodzieżowa', 'Users', 'active', NULL, 'kontakt@silamlodych.pl', '2026-07-22 19:40:10'),
(2, 'Zarząd', 'Najwyższy organ zarządzający', 'Kierowanie organizacją', 'UserCog', 'active', 1, 'zarzad@silamlodych.pl', '2026-07-22 19:40:10'),
(3, 'Dyrekcja', 'Zarządzanie operacyjne', 'Nadzór nad funkcjonowaniem', 'Building2', 'active', 1, NULL, '2026-07-22 19:40:10'),
(4, 'Organy kontrolne', 'Niezależny nadzór', 'Kontrola i rozwiązywanie sporów', 'Building2', 'active', 1, NULL, '2026-07-22 19:40:10'),
(5, 'Komisja Rewizyjna', 'Kontrola działalności', 'Sprawowanie kontroli', 'Building2', 'active', 4, 'kr@silamlodych.pl', '2026-07-22 19:40:10'),
(6, 'Sąd Koleżeński', 'Rozwiązywanie sporów', 'Sprawy członkowskie', 'Building2', 'active', 4, 'sk@silamlodych.pl', '2026-07-22 19:40:10'),
(7, 'Filary organizacji', 'Główne obszary działalności', 'Obszary realizacji działań', 'Briefcase', 'active', 1, NULL, '2026-07-22 19:40:10'),
(8, 'Filar Projektowy', 'Projekty i inicjatywy', 'Tworzenie projektów', 'Briefcase', 'active', 7, NULL, '2026-07-22 19:40:10'),
(9, 'Filar Konferencyjny', 'Konferencje i debaty', 'Organizacja debat', 'Users', 'active', 7, NULL, '2026-07-22 19:40:10'),
(10, 'Filar Rzeczniczy', 'Rzecznictwo', 'Komunikacja i reprezentowanie', 'Megaphone', 'active', 7, NULL, '2026-07-22 19:40:10'),
(11, 'Filar Symulacyjny', 'Symulacje', 'Symulacje edukacyjne', 'GraduationCap', 'active', 7, NULL, '2026-07-22 19:40:10'),
(13, 'TikTok', 'Zespół TikToka', NULL, 'Users', 'active', NULL, NULL, '2026-07-23 13:10:43'),
(14, 'Instagram', 'Zespół Instagrama', NULL, 'Users', 'active', NULL, NULL, '2026-07-23 13:10:43');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `team_members`
--

CREATE TABLE `team_members` (
  `id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_leader` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `team_members`
--

INSERT INTO `team_members` (`id`, `team_id`, `user_id`, `role`, `created_at`, `is_leader`) VALUES
(23, 2, 21, 'Wiceprezes - rekrutacja', '2026-07-22 19:46:04', 0),
(24, 2, 22, 'Wiceprezes - dokumenty', '2026-07-22 19:46:04', 0),
(25, 2, 23, 'Członek Zarządu - media', '2026-07-22 19:46:04', 0),
(26, 3, 24, 'Główny Dyrektor Operacyjny', '2026-07-22 19:46:04', 0),
(27, 3, 25, 'Rzecznik - frekwencja', '2026-07-22 19:46:04', 0),
(28, 5, 26, 'Członek Komisji Rewizyjnej', '2026-07-22 19:46:04', 0),
(29, 5, 27, 'Członek Komisji Rewizyjnej', '2026-07-22 19:46:04', 0),
(30, 5, 28, 'Członek Komisji Rewizyjnej', '2026-07-22 19:46:04', 0),
(31, 6, 29, 'Członek Sądu Koleżeńskiego', '2026-07-22 19:46:04', 0),
(32, 6, 30, 'Członek Sądu Koleżeńskiego', '2026-07-22 19:46:04', 0),
(35, 8, 31, 'Koordynator Filaru Projektowego', '2026-07-22 19:46:04', 0),
(36, 8, 32, 'Koordynator Filaru Projektowego', '2026-07-22 19:46:04', 0),
(38, 9, 33, 'Koordynator Filaru Konferencyjnego', '2026-07-22 19:46:04', 0),
(39, 9, 29, 'Koordynator Filaru Konferencyjnego', '2026-07-22 19:46:04', 0),
(41, 10, 34, 'Koordynator Filaru Rzeczniczego', '2026-07-22 19:46:04', 0),
(42, 10, 30, 'Koordynator Filaru Rzeczniczego', '2026-07-22 19:46:04', 0),
(43, 11, 35, 'Członek Filaru Symulacyjnego', '2026-07-22 19:46:04', 0),
(45, 2, 36, 'Prezes Zarządu', '2026-07-22 19:49:45', 1),
(53, 8, 1, 'Członek', '2026-07-23 13:07:44', 0),
(54, 9, 1, 'Członek', '2026-07-23 13:07:44', 0),
(67, 8, 36, 'Członek', '2026-07-23 13:10:42', 0),
(71, 11, 36, 'Członek', '2026-07-23 13:10:42', 0),
(85, 13, 41, 'Opiekun TikToka', '2026-07-23 13:10:43', 0),
(86, 13, 42, 'Opiekun TikToka', '2026-07-23 13:10:43', 0),
(87, 13, 43, 'Opiekun TikToka', '2026-07-23 13:10:43', 0),
(88, 14, 32, 'Opiekun Instagrama', '2026-07-23 13:10:43', 0),
(89, 14, 44, 'Opiekun Instagrama', '2026-07-23 13:10:43', 0),
(90, 14, 45, 'Opiekun Instagrama', '2026-07-23 13:10:43', 0);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `team` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active' CHECK (`status` in ('active','trial','mentor','vacation')),
  `province` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `functional_role` varchar(100) DEFAULT NULL,
  `role_id` int(11) DEFAULT NULL,
  `join_date` date DEFAULT NULL,
  `is_trial` tinyint(1) DEFAULT 0,
  `attendance_percentage` decimal(5,2) DEFAULT 92.00,
  `form_data` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `is_active`, `created_at`, `team`, `status`, `province`, `phone`, `avatar`, `functional_role`, `role_id`, `join_date`, `is_trial`, `attendance_percentage`, `form_data`) VALUES
(1, 'admin', 'maciej.czarnecki@silamlodych.pl', '$2b$10$yg2jdEHeXi0s7cbz5J8uA.wgLituq1Nfo7/tADOr32FL.fIPpYCOm', 'Maciej', 'Czarnecki', 1, '2026-07-21 20:55:30', 'Filar Projektowy, Filar Konferencyjny', 'active', 'Łódzkie', '+48573221560', NULL, 'Administrator / Pełnomocnik ds. Stacjonarnych Spotkań', 1, '2024-01-01', 0, 95.50, NULL),
(21, 'krzysztof.korbut', 'krzysztof.korbut@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Krzysztof', 'Korbut', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Wiceprezes - Rekrutacja', 2, NULL, 0, 92.00, NULL),
(22, 'kasper.brudniewicz', 'kasper.brudniewicz@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Kasper', 'Brudniewicz', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Wiceprezes - Dokumenty i składki', 2, NULL, 0, 92.00, NULL),
(23, 'mailan.nguyen', 'mailan.nguyen@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Mai Lan', 'Nguyen', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Członek Zarządu - Media', 2, NULL, 0, 92.00, NULL),
(24, 'jakub.patrowicz', 'jakub.patrowicz@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Jakub', 'Patrowicz', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Główny Dyrektor Operacyjny', 3, NULL, 0, 92.00, NULL),
(25, 'oliwier.szulejko', 'oliwier.szulejko@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Oliwier', 'Szulejko', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Dyrektor - Frekwencja', 2, NULL, 0, 92.00, NULL),
(26, 'adam.kowalczyk', 'adam.kowalczyk@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Adam', 'Kowalczyk', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Członek Komisji Rewizyjnej', 4, NULL, 0, 92.00, NULL),
(27, 'wiktoria.brys', 'wiktoria.brys@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Wiktoria', 'Bryś', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Członek Komisji Rewizyjnej', 4, NULL, 0, 92.00, NULL),
(28, 'iga.drzewiecka', 'iga.drzewiecka@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Iga', 'Drzewiecka', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Członek Komisji Rewizyjnej', 4, NULL, 0, 92.00, NULL),
(29, 'adrian.wroblewski', 'adrian.wroblewski@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Adrian', 'Wróblewski', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Członek Sądu Koleżeńskiego', 4, NULL, 0, 92.00, NULL),
(30, 'jan.augustyniak', 'jan.augustyniak@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Jan', 'Augustyniak', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Członek Sądu Koleżeńskiego', 4, NULL, 0, 92.00, NULL),
(31, 'zosia.wartacz', 'zosia.wartacz@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Zosia', 'Wartacz', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Koordynator Filaru Projektowego', 3, NULL, 0, 92.00, NULL),
(32, 'zuzanna.wojtusiak', 'zuzanna.wojtusiak@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Zuzanna', 'Wojtusiak', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Opiekun Instagrama', 3, NULL, 0, 92.00, NULL),
(33, 'wojciech.podolski', 'wojciech.podolski@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Wojciech', 'Podolski', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Koordynator Filaru Konferencyjnego', 3, NULL, 0, 92.00, NULL),
(34, 'nikola.socha', 'nikola.socha@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Nikola', 'Socha', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Koordynator Filaru Rzeczniczego', 3, NULL, 0, 92.00, NULL),
(35, 'igor.piskorz', 'igor.piskorz@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Igor', 'Piskórz', 1, '2026-07-21 21:20:51', NULL, 'active', NULL, NULL, NULL, 'Koordynator Filaru Symulacyjnego', 4, NULL, 0, 92.00, NULL),
(36, 'maksym.marczak', 'maksym.marczak@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Maksym', 'Marczak', 1, '2026-07-21 21:25:19', 'Zarząd', 'active', 'Mazowieckie', '+48500123456', NULL, 'Prezes Zarządu', 1, '2024-01-15', 0, 92.00, NULL),
(37, 'emilia.dobias', 'emilia.dobias@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Emilia', 'Dobias', 1, '2026-07-23 13:10:12', NULL, 'active', NULL, NULL, NULL, 'Pełnomocnik ds. Szkoleń', 4, NULL, 0, 92.00, NULL),
(38, 'oliwia.romanek', 'oliwia.romanek@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Oliwia', 'Romanek', 1, '2026-07-23 13:10:12', NULL, 'active', NULL, NULL, NULL, 'Pełnomocnik ds. Szkoleń', 4, NULL, 0, 92.00, NULL),
(39, 'maja.melerska', 'maja.melerska@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Maja', 'Melerska', 1, '2026-07-23 13:10:12', NULL, 'active', NULL, NULL, NULL, 'Pełnomocnik ds. Onboardingu i Rozwoju Członków', 4, NULL, 0, 92.00, NULL),
(40, 'dawid.brzeski', 'dawid.brzeski@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Dawid', 'Brzeski', 1, '2026-07-23 13:10:12', NULL, 'active', NULL, NULL, NULL, 'Pełnomocnik ds. Wizyt w Telewizjach', 4, NULL, 0, 92.00, NULL),
(41, 'maja.kadziela', 'maja.kadziela@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Maja', 'Kądziela', 1, '2026-07-23 13:10:12', NULL, 'active', NULL, NULL, NULL, 'Opiekun TikToka', 4, NULL, 0, 92.00, NULL),
(42, 'karol.kowalczyk', 'karol.kowalczyk@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Karol', 'Kowalczyk', 1, '2026-07-23 13:10:12', NULL, 'active', NULL, NULL, NULL, 'Opiekun TikToka', 4, NULL, 0, 92.00, NULL),
(43, 'amelia.belczowska', 'amelia.belczowska@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Amelia', 'Bełczowska', 1, '2026-07-23 13:10:12', NULL, 'active', NULL, NULL, NULL, 'Opiekun TikToka', 4, NULL, 0, 92.00, NULL),
(44, 'paulina.pastwa', 'paulina.pastwa@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Paulina', 'Pastwa', 1, '2026-07-23 13:10:12', NULL, 'active', NULL, NULL, NULL, 'Opiekun Instagrama', 4, NULL, 0, 92.00, NULL),
(45, 'nadia.filipiak', 'nadia.filipiak@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Nadia', 'Filipiak', 1, '2026-07-23 13:10:12', NULL, 'active', NULL, NULL, NULL, 'Opiekun Instagrama', 4, NULL, 0, 92.00, NULL);

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `user_notifications`
--

CREATE TABLE `user_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_notifications`
--

INSERT INTO `user_notifications` (`id`, `user_id`, `notification_id`, `read`, `read_at`, `created_at`) VALUES
(1, 1, 1, 1, '2026-07-22 16:57:04', '2026-07-21 20:55:31'),
(2, 1, 2, 1, '2026-07-22 16:57:04', '2026-07-21 20:55:31'),
(3, 1, 3, 1, '2026-07-22 16:57:04', '2026-07-21 20:55:31'),
(4, 1, 4, 1, '2026-07-22 16:57:04', '2026-07-21 20:55:31'),
(5, 1, 5, 1, '2026-07-22 16:57:04', '2026-07-21 20:55:31'),
(6, 1, 6, 1, '2026-07-22 16:57:04', '2026-07-21 20:55:31'),
(7, 1, 7, 1, '2026-07-22 16:57:04', '2026-07-21 20:55:31');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `guides`
--
ALTER TABLE `guides`
  ADD PRIMARY KEY (`id`),
  ADD KEY `author_id` (`author_id`),
  ADD KEY `idx_guides_created_at` (`created_at`);

--
-- Indeksy dla tabeli `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user_id` (`user_id`),
  ADD KEY `idx_notifications_read` (`read`),
  ADD KEY `idx_notifications_created_at` (`created_at`);

--
-- Indeksy dla tabeli `onboarding_data`
--
ALTER TABLE `onboarding_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_onboarding_user_id` (`user_id`),
  ADD KEY `idx_onboarding_completed` (`completed`);

--
-- Indeksy dla tabeli `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `coordinator_id` (`coordinator_id`),
  ADD KEY `idx_projects_status` (`status`);

--
-- Indeksy dla tabeli `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeksy dla tabeli `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indeksy dla tabeli `teams`
--
ALTER TABLE `teams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indeksy dla tabeli `team_members`
--
ALTER TABLE `team_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_team_user` (`team_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeksy dla tabeli `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_role_id` (`role_id`),
  ADD KEY `idx_users_status` (`status`);

--
-- Indeksy dla tabeli `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_notification` (`user_id`,`notification_id`),
  ADD KEY `notification_id` (`notification_id`),
  ADD KEY `idx_user_notifications_user_read` (`user_id`,`read`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `guides`
--
ALTER TABLE `guides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `onboarding_data`
--
ALTER TABLE `onboarding_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `teams`
--
ALTER TABLE `teams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `team_members`
--
ALTER TABLE `team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `guides`
--
ALTER TABLE `guides`
  ADD CONSTRAINT `guides_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `onboarding_data`
--
ALTER TABLE `onboarding_data`
  ADD CONSTRAINT `onboarding_data_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`coordinator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teams`
--
ALTER TABLE `teams`
  ADD CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `team_members`
--
ALTER TABLE `team_members`
  ADD CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `team_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD CONSTRAINT `user_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_notifications_ibfk_2` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
