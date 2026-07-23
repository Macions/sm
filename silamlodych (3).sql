-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Lip 23, 2026 at 10:00 PM
-- Wersja serwera: 10.4.32-MariaDB
-- Wersja PHP: 8.0.30

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
(1, 1, 'Maciej', 'Czarnecki', 'maciej.czarnecki@silamlodych.pl', '+48573221560', 'Łódzkie', '[\"Projekty\",\"Konferencje\"]', '[\"Project Management\",\"Leadership\",\"Administracja\"]', 'advanced', 'Poniedziałek-Piątek 16:00-20:00', 'Doświadczony administrator', '[]', '[]', '[]', '[]', 1, '2026-07-21 20:55:30', '2026-07-23 14:17:46'),
(3, 46, 'dasd', 'dasda', 'dasdas@dsda.pl', NULL, 'dasd', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 13:35:58', '2026-07-23 13:35:58'),
(4, 49, 'das', 'das', 'das.das@silamlodych.pl', 'das', '', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 13:59:16', '2026-07-23 13:59:16'),
(5, 50, 'ddddd', 'ddd', 'ddddd.ddd@silamlodych.pl', 'd', '', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 13:59:47', '2026-07-23 13:59:47'),
(6, 23, 'Mai Lan', 'Nguyen', 'mai.lan.nguyen@silamlodych.pl', NULL, 'Brak', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 14:27:44', '2026-07-23 14:27:44'),
(7, 51, 'fds', 'fsdf', 'fds.fsdf@silamlodych.pl', NULL, '', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 14:27:56', '2026-07-23 14:27:56'),
(8, 52, 'DASD', 'DAS', 'dasd.das@silamlodych.pl', 'DSAD', '', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 14:45:30', '2026-07-23 14:45:30'),
(9, 53, 'dasdsadasddsd', 'das', 'dasdsadasddsd.das@silamlodych.pl', 'das', '', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 14:49:24', '2026-07-23 14:49:24'),
(10, 54, 'dsadsad', 'dasdasdsad', 'dsadsad.dasdasdsad@silamlodych.pl', 'dasd', '', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 14:58:41', '2026-07-23 14:58:41'),
(11, 55, 'dsagds', 'fsddsafdsa', 'dsagds.fsddsafdsa@silamlodych.pl', 'fdsfas', '', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 15:01:13', '2026-07-23 15:01:13'),
(12, 56, 'dsadfgfgdf', 'gfdgfddfsd', 'dsadfgfgdf.gfdgfddfsd@silamlodych.pl', 'fds', '', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 15:05:04', '2026-07-23 15:05:04'),
(13, 57, 'dasdsadsdsadadsada', 'dasdasdad', 'dasdsadsdsadadsada.dasdasdad@silamlodych.pl', 'dasdas', '', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 15:09:30', '2026-07-23 15:09:30'),
(14, 61, 'test', 'etsttdstadas', 'test.etsttdstadas@silamlodych.pl', NULL, '', '[]', '[]', 'none', NULL, NULL, '[]', '[]', '[]', '[]', 1, '2026-07-23 15:32:25', '2026-07-23 15:32:25');

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
(14, 'Instagram', 'Zespół Instagrama', NULL, 'Users', 'active', NULL, NULL, '2026-07-23 13:10:43'),
(15, 'TEST ZESPÓŁ', 'Zespół', NULL, 'Users', 'active', NULL, NULL, '2026-07-23 14:45:29'),
(16, 'test', 'Zespół', NULL, 'Users', 'active', NULL, NULL, '2026-07-23 14:49:03'),
(17, 'das', 'Zespół', NULL, 'Users', 'active', NULL, NULL, '2026-07-23 14:49:24'),
(18, '343243', 'Zespół', NULL, 'Users', 'active', NULL, NULL, '2026-07-23 14:50:46'),
(19, 'testzespol', 'Zespół', 'das', 'GraduationCap', 'active', NULL, 'dasdasdass@dsad.pl', '2026-07-23 14:58:41'),
(20, 'tetszdasdas', 'Zespółd', 'dasdsas', 'Megaphone', 'active', 15, 'dasdsadsadasdas@dsad.pl', '2026-07-23 15:01:13'),
(21, 'zespoldsadsad', 'Zespół', 'fsdfdsf', 'GraduationCap', 'active', NULL, 'dsadasdsadssada@dsad.pl', '2026-07-23 15:05:04'),
(22, 'nowyzespol', 'Zespół', 'dasdsadsa', 'Calendar', 'active', 4, 'dsads@dasdassdsa.pl', '2026-07-23 15:09:29'),
(23, 'zespol testowy', 'Zespół', 'test zespołu', 'Settings', 'active', 4, 'dsaddasdass@dasdassdsa.pl', '2026-07-23 15:13:10'),
(24, 'dasdssda', 'Zespół', 'dasdasd', 'Megaphone', 'active', 4, 'dsadsadas@dasdassda.pl', '2026-07-23 15:16:20'),
(25, 'testowy zepsołdx', 'Zespół', 'dsa', 'Settings', 'active', 7, 'dasdasda@dsdas.pl', '2026-07-23 15:30:35'),
(26, 'testdsad', 'Zespół', 'dsadasd', 'Settings', 'active', 7, 'dsadasd@ds.pl', '2026-07-23 15:32:25');

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
(90, 14, 45, 'Opiekun Instagrama', '2026-07-23 13:10:43', 0),
(91, 23, 58, 'hgfhgfg', '2026-07-23 15:13:10', 0),
(93, 24, 59, 'dasdad', '2026-07-23 15:16:20', 0),
(95, 25, 60, 'esdsadas', '2026-07-23 15:30:35', 0),
(97, 26, 61, 'Członek', '2026-07-23 15:32:25', 0);

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
(23, 'mailan.nguyen', 'mai.lan.nguyen@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Mai Lan', 'Nguyen', 1, '2026-07-21 21:20:51', 'Brak zespołu', 'active', 'Brak', NULL, NULL, 'Członek Zarządu - Media', 2, '2026-07-23', 0, 92.00, NULL),
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
(45, 'nadia.filipiak', 'nadia.filipiak@silamlodych.pl', '$2b$10$lW6nJTDLmHNxpu8lvFwzA.KOvvRuMW8b1tVfZGdk3d1...', 'Nadia', 'Filipiak', 1, '2026-07-23 13:10:12', NULL, 'active', NULL, NULL, NULL, 'Opiekun Instagrama', 4, NULL, 0, 92.00, NULL),
(46, 'dasdas', 'dasdas@dsda.pl', '$2b$10$oXRcvN/P5yxLPaG8PorZxODP27Mub4d.fsqZUVPtGOhsJat1flWJO', 'dasd', 'dasda', 0, '2026-07-23 13:35:58', 'dasdsd', 'trial', 'dasd', NULL, NULL, 'dasda', 4, '2026-07-23', 0, 92.00, NULL),
(47, 'dsa.das', 'dsa.das@silamlodych.pl', '$2b$10$NZDpHwMDuiM4d5YJZfzrc.mB1HP6mA0Ln4Dx.ZWDsAxQK3fRRne/i', 'dsa', 'das', 1, '2026-07-23 13:57:23', 'das', 'active', NULL, 'das', NULL, 'das', 4, '2026-07-23', 0, 92.00, NULL),
(48, 'dasdas.dasd', 'dasdas.dasd@silamlodych.pl', '$2b$10$Rox670U5lxNcgPo4mtEWB.yjucLoP57NxXp4BeRoHLv97lc./IC4a', 'dasdas', 'dasd', 0, '2026-07-23 13:58:20', 'das', 'mentor', NULL, 'das', NULL, 'das', 4, '2026-07-23', 0, 92.00, NULL),
(49, 'das.das', 'das.das@silamlodych.pl', '$2b$10$zV4f5CAh5kEMCuGPszSr0.c5kTal/.ROLzmOh1EeYvRkmUPaqT4jW', 'das', 'das', 0, '2026-07-23 13:59:16', 'das', 'active', NULL, 'das', NULL, 'das', 4, '2026-07-23', 0, 92.00, NULL),
(50, 'ddddd.ddd', 'ddddd.ddd@silamlodych.pl', '$2b$10$JYdUcfo5ayhVUZadPZtMoOt07sUKnvc8XFPUNvShLDHVFtdXSA/ja', 'ddddd', 'ddd', 0, '2026-07-23 13:59:47', 'd', 'trial', NULL, 'd', NULL, 'dd', 4, '2026-07-23', 0, 92.00, NULL),
(51, 'fds.fsdf', 'fds.fsdf@silamlodych.pl', '$2b$10$HlE929bjyvE2oyVN5ZiSVuvCq8jfdsfD6AqELG9r.S13s1xc8vG8O', 'fds', 'fsdf', 1, '2026-07-23 14:27:56', 'fsd', 'mentor', NULL, NULL, NULL, 'fsd', 4, '2026-07-23', 0, 92.00, NULL),
(52, 'dasd.das', 'dasd.das@silamlodych.pl', '$2b$10$UzjgC7lMRSlanv7MFl8Da.EHlzhVpe5t2KFbLW0sn1EzkK1Elez1e', 'DASD', 'DAS', 1, '2026-07-23 14:45:30', 'TEST ZESPÓŁ', 'active', NULL, 'DSAD', NULL, 'DAS', 4, '2026-07-23', 0, 92.00, NULL),
(53, 'dasdsadasddsd.das', 'dasdsadasddsd.das@silamlodych.pl', '$2b$10$FblAjQalb7TkRLdEiqQQZeZ54AcCWl5ZL.TWCMdLx3eeXLDVp53iS', 'dasdsadasddsd', 'das', 1, '2026-07-23 14:49:24', 'das', 'trial', NULL, 'das', NULL, 'das', 4, '2026-07-23', 0, 92.00, NULL),
(54, 'dsadsad.dasdasdsad', 'dsadsad.dasdasdsad@silamlodych.pl', '$2b$10$jH1s0thTLzxRPkUqBCWv1OKt2b2b1tu9KFSX4Bu.LTADVBrIKmRGK', 'dsadsad', 'dasdasdsad', 1, '2026-07-23 14:58:41', 'testzespol', 'active', NULL, 'dasd', NULL, 'dasd', 4, '2026-07-23', 0, 92.00, NULL),
(55, 'dsagds.fsddsafdsa', 'dsagds.fsddsafdsa@silamlodych.pl', '$2b$10$YXbW.Nz6U9r3rFvguGX4WuLDBfD5nkpDM0UP08j2HvGA3Vw/JWDXa', 'dsagds', 'fsddsafdsa', 1, '2026-07-23 15:01:13', 'tetszdasdas', 'mentor', NULL, 'fdsfas', NULL, NULL, 4, '2026-07-23', 0, 92.00, NULL),
(56, 'dsadfgfgdf.gfdgfddfsd', 'dsadfgfgdf.gfdgfddfsd@silamlodych.pl', '$2b$10$4cFXzesLQYcOHkIjiMJq0uekIm81nRZirAMMcX.FMPdYm2pGgro6u', 'dsadfgfgdf', 'gfdgfddfsd', 1, '2026-07-23 15:05:04', 'zespoldsadsad', 'active', NULL, 'fds', NULL, 'fsd', 4, '2026-07-23', 0, 92.00, NULL),
(57, 'dasdsadsdsadadsada.dasdasdad', 'dasdsadsdsadadsada.dasdasdad@silamlodych.pl', '$2b$10$jaJ6oIjlIyK0JPd6faW1ZO4Xx/r7me78.oGA1n/RaMAwh54iGQXAC', 'dasdsadsdsadadsada', 'dasdasdad', 1, '2026-07-23 15:09:30', 'nowyzespol', 'active', NULL, 'dasdas', NULL, 'asd', 4, '2026-07-23', 0, 92.00, NULL),
(58, 'gfhgfdhg.hgfh', 'gfhgfdhg.hgfh@silamlodych.pl', '$2b$10$KoFk6u5C.U4AnMEIDxJUY.WgmtTCkEOT.rsBPrB0cz6Go8mk2EHBy', 'gfhgfdhg', 'hgfh', 1, '2026-07-23 15:13:10', 'zespol testowy', 'active', NULL, 'hgfhg', NULL, 'hgfhgfg', 4, '2026-07-23', 0, 92.00, NULL),
(59, 'dsadasdsdsad.dsadasddsdsasdsadhggg', 'dsadasdsdsad.dsadasddsdsasdsadhggg@silamlodych.pl', '$2b$10$oBDhmSfGgbMampt0b8FjaO3s6JdaZIsjrmjvxVZ3AXXYoYWaFYHmm', 'dsadasdsdsad', 'dsadasddsdsasdsadhggg', 1, '2026-07-23 15:16:20', 'dasdssda', 'active', NULL, 'dsadas', NULL, 'dasdad', 4, '2026-07-23', 0, 92.00, NULL),
(60, 'dsadsadsadsdsad.dsadsadsadsgghghgf', 'dsadsadsadsdsad.dsadsadsadsgghghgf@silamlodych.pl', '$2b$10$QKlA/NXfbziVmK4tVLTKee3xJIvYV/5cutkuIHV5/2EMOolC6TPce', 'dsadsadsadsdsad', 'dsadsadsadsgghghgf', 1, '2026-07-23 15:30:35', 'testowy zepsołdx', 'active', NULL, '434342432423', NULL, 'esdsadas', 4, '2026-07-23', 0, 92.00, NULL),
(61, 'test.etsttdstadas', 'test.etsttdstadas@silamlodych.pl', '$2b$10$y.3KPbRXzO.uknrYa/Mi2.RXSRcyGqU3mMDhh96XnQm87Wy44Zjs6', 'test', 'etsttdstadas', 1, '2026-07-23 15:32:25', 'testdsad', 'active', NULL, NULL, NULL, NULL, 4, '2026-07-23', 0, 92.00, NULL);

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

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `vacancies`
--

CREATE TABLE `vacancies` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `icon` varchar(50) DEFAULT 'Briefcase',
  `description` text NOT NULL,
  `responsibilities` longtext DEFAULT NULL,
  `requirements` longtext DEFAULT NULL,
  `nice_to_have` longtext DEFAULT NULL,
  `team` varchar(100) DEFAULT NULL,
  `team_id` varchar(100) DEFAULT NULL,
  `pillar` varchar(100) DEFAULT NULL,
  `contact_person_id` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `recruitment_type` varchar(50) DEFAULT 'internal',
  `recruitment_deadline` datetime(3) DEFAULT NULL,
  `recruitment_form_url` varchar(500) DEFAULT NULL,
  `recruitment_messenger_contact` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vacancies`
--

INSERT INTO `vacancies` (`id`, `title`, `icon`, `description`, `responsibilities`, `requirements`, `nice_to_have`, `team`, `team_id`, `pillar`, `contact_person_id`, `status`, `recruitment_type`, `recruitment_deadline`, `recruitment_form_url`, `recruitment_messenger_contact`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Koordynator Filaru Projektowego', 'Target', 'Osoba odpowiedzialna za koordynację działań w ramach Filaru Projektowego, nadzorująca realizację projektów i inicjatyw organizacyjnych.', '[\"Koordynacja prac zespołów projektowych\", \"Nadzór nad harmonogramami i terminami realizacji\", \"Raportowanie postępów do Zarządu\", \"Organizacja spotkań i warsztatów projektowych\"]', '[\"Doświadczenie w zarządzaniu projektami\", \"Umiejętność pracy zespołowej\", \"Dobra organizacja pracy\", \"Komunikatywność\"]', '[\"Certyfikat zarządzania projektami (PRINCE2, Agile)\", \"Znajomość narzędzi do zarządzania projektami\"]', 'Filar Projektowy', 'project', 'Filar Projektowy', NULL, 'active', 'internal', '2026-12-31 23:59:59.000', NULL, NULL, 1, '2026-07-23 18:56:49', '2026-07-23 18:56:49'),
(2, 'Opiekun TikToka', 'Video', 'Osoba odpowiedzialna za prowadzenie i rozwój profilu Siły Młodych na TikToku, tworzenie angażujących treści i budowanie społeczności.', '[\"Tworzenie i planowanie contentu na TikToka\", \"Monitorowanie trendów i nowości na platformie\", \"Analiza statystyk i optymalizacja treści\", \"Współpraca z zespołem Social Media\"]', '[\"Znajomość platformy TikTok\", \"Umiejętność tworzenia angażujących treści wideo\", \"Kreatywność\", \"Znajomość podstaw montażu wideo\"]', '[\"Doświadczenie w prowadzeniu profili na TikTok\", \"Umiejętność obsługi programów do montażu\"]', 'Zespół TikToka', 'tiktok', 'Zespół TikToka', NULL, 'recruiting', 'internal', '2026-12-31 23:59:59.000', NULL, NULL, 1, '2026-07-23 18:56:49', '2026-07-23 18:56:49'),
(3, 'Opiekun Instagrama', 'Smartphone', 'Osoba odpowiedzialna za prowadzenie profilu Siły Młodych na Instagramie, tworzenie atrakcyjnych wizualnie treści i budowanie zaangażowania społeczności.', '[\"Planowanie i tworzenie contentu na Instagram\", \"Tworzenie Stories i Reels\", \"Interakcja z obserwującymi\", \"Współpraca z zespołem Social Media\"]', '[\"Znajomość platformy Instagram\", \"Umiejętność tworzenia atrakcyjnych wizualnie treści\", \"Kreatywność\", \"Znajomość Canvy lub podobnych narzędzi\"]', '[\"Doświadczenie w prowadzeniu profili na Instagram\", \"Umiejętność obsługi programów graficznych\"]', 'Social Media', 'social-media', 'Social Media', NULL, 'active', 'internal', '2026-12-31 23:59:59.000', NULL, NULL, 1, '2026-07-23 18:56:49', '2026-07-23 18:56:49'),
(4, 'dsadsad', 'Sparkles', 'dsadsadas', '\"[\\\"das\\\"]\"', '\"[\\\"dasd\\\"]\"', '\"[\\\"dsad\\\"]\"', 'Social Media', 'social-media', 'Filar Rzeczniczy', NULL, 'active', 'messenger', '2026-07-25 19:10:00.000', NULL, 'dsadasdsad', 1, '2026-07-23 17:10:46', '2026-07-23 17:10:46'),
(5, 'fdsfsdd', 'Smartphone', 'fdsfdsfs', '\"[\\\"fds\\\"]\"', '\"[\\\"fdsf\\\"]\"', '\"[\\\"fdsf\\\"]\"', 'Social Media', 'social-media', 'Filar Projektowy', NULL, 'active', 'form', '2026-07-25 19:35:00.000', 'https://zsp2lowicz.pl/', NULL, 1, '2026-07-23 17:35:15', '2026-07-23 17:35:15'),
(6, 'fdsfds', 'Star', 'fdsfsf', '\"[\\\"fd\\\"]\"', '\"[\\\"fdsf\\\"]\"', '\"[\\\"fds\\\"]\"', 'Social Media', 'social-media', 'Filar Projektowy', NULL, 'active', 'internal', '2026-07-31 19:38:00.000', NULL, NULL, 1, '2026-07-23 17:38:45', '2026-07-23 17:38:45');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `vacancy_answers`
--

CREATE TABLE `vacancy_answers` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `answer` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vacancy_answers`
--

INSERT INTO `vacancy_answers` (`id`, `application_id`, `question_id`, `answer`) VALUES
(1, 3, 1, 'dsa'),
(2, 3, 2, 'dasda'),
(3, 3, 3, 'nie');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `vacancy_applications`
--

CREATE TABLE `vacancy_applications` (
  `id` int(11) NOT NULL,
  `vacancy_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vacancy_applications`
--

INSERT INTO `vacancy_applications` (`id`, `vacancy_id`, `user_id`, `message`, `status`, `created_at`) VALUES
(1, 1, 1, 'ddasd', 'pending', '2026-07-23 17:32:05'),
(2, 2, 1, 'dsadsda', 'pending', '2026-07-23 17:34:18'),
(3, 6, 1, 'dsadas', 'pending', '2026-07-23 17:39:00');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `vacancy_attachments`
--

CREATE TABLE `vacancy_attachments` (
  `id` int(11) NOT NULL,
  `vacancy_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `url` varchar(500) NOT NULL,
  `size` int(11) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `vacancy_questions`
--

CREATE TABLE `vacancy_questions` (
  `id` int(11) NOT NULL,
  `vacancy_id` int(11) NOT NULL,
  `question` text NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'text',
  `required` tinyint(1) DEFAULT 0,
  `options` longtext DEFAULT NULL,
  `order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vacancy_questions`
--

INSERT INTO `vacancy_questions` (`id`, `vacancy_id`, `question`, `type`, `required`, `options`, `order`) VALUES
(1, 6, 'co robisz', 'text', 1, NULL, 0),
(2, 6, 'dsadasd', 'textarea', 1, NULL, 0),
(3, 6, 'dsadsa', 'select', 1, '[\"tak\",\"nie\",\"moze\"]', 0);

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
-- Indeksy dla tabeli `vacancies`
--
ALTER TABLE `vacancies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vacancies_contact_person_id_fkey` (`contact_person_id`);

--
-- Indeksy dla tabeli `vacancy_answers`
--
ALTER TABLE `vacancy_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vacancy_answers_application_id_fkey` (`application_id`),
  ADD KEY `vacancy_answers_question_id_fkey` (`question_id`);

--
-- Indeksy dla tabeli `vacancy_applications`
--
ALTER TABLE `vacancy_applications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vacancy_applications_vacancy_id_fkey` (`vacancy_id`),
  ADD KEY `vacancy_applications_user_id_fkey` (`user_id`);

--
-- Indeksy dla tabeli `vacancy_attachments`
--
ALTER TABLE `vacancy_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vacancy_attachments_vacancy_id_fkey` (`vacancy_id`);

--
-- Indeksy dla tabeli `vacancy_questions`
--
ALTER TABLE `vacancy_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vacancy_questions_vacancy_id_fkey` (`vacancy_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `team_members`
--
ALTER TABLE `team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `vacancies`
--
ALTER TABLE `vacancies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `vacancy_answers`
--
ALTER TABLE `vacancy_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vacancy_applications`
--
ALTER TABLE `vacancy_applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vacancy_attachments`
--
ALTER TABLE `vacancy_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vacancy_questions`
--
ALTER TABLE `vacancy_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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

--
-- Constraints for table `vacancies`
--
ALTER TABLE `vacancies`
  ADD CONSTRAINT `vacancies_contact_person_id_fkey` FOREIGN KEY (`contact_person_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `vacancy_answers`
--
ALTER TABLE `vacancy_answers`
  ADD CONSTRAINT `vacancy_answers_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `vacancy_applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `vacancy_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `vacancy_questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vacancy_applications`
--
ALTER TABLE `vacancy_applications`
  ADD CONSTRAINT `vacancy_applications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `vacancy_applications_vacancy_id_fkey` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vacancy_attachments`
--
ALTER TABLE `vacancy_attachments`
  ADD CONSTRAINT `vacancy_attachments_vacancy_id_fkey` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vacancy_questions`
--
ALTER TABLE `vacancy_questions`
  ADD CONSTRAINT `vacancy_questions_vacancy_id_fkey` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
