-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1:3306
-- Üretim Zamanı: 11 Haz 2026, 19:01:59
-- Sunucu sürümü: 10.4.24-MariaDB
-- PHP Sürümü: 7.4.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `sm_planner`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `ai_chat_history`
--

CREATE TABLE `ai_chat_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `session_id` varchar(36) DEFAULT NULL,
  `message_role` enum('user','ai') NOT NULL,
  `message_text` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tablo döküm verisi `ai_chat_history`
--

INSERT INTO `ai_chat_history` (`id`, `user_id`, `project_id`, `session_id`, `message_role`, `message_text`, `image_url`, `created_at`) VALUES
(223, 4, NULL, 'c9fe317c-7e60-4d71-9b6e-ba2791906930', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 11:11:27'),
(224, 4, NULL, '224acd6e-938d-45a7-96e2-1b2605c4cec1', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 11:14:54'),
(225, 4, NULL, 'c66270bb-502e-45fe-8d51-9eb7c0900a08', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 11:16:46'),
(226, 4, NULL, '842f4bd6-f8bf-473a-8279-f0279c795a63', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 11:24:01'),
(227, 4, NULL, 'e896205a-8864-4f15-82ce-69e3d04d3451', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 11:38:21'),
(228, 4, NULL, '4a495e43-3281-4729-a044-1ca53aad8bec', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 11:43:03'),
(229, 4, NULL, '60cb07ba-7c60-4f26-a9b5-cdce3aab3cfd', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 11:46:21'),
(230, 4, NULL, '250388f0-fcce-40be-9586-c162ff23bc89', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 11:48:28'),
(231, 4, NULL, '553fa920-9640-423b-bc25-05c767cf3979', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 13:02:50'),
(232, 4, NULL, '878c9e4e-f219-40c5-949e-e7058441fdd9', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 13:19:24'),
(233, 4, NULL, '6f4ff0ae-6af5-48ea-bc48-a452872bafdb', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 13:28:05'),
(234, 4, NULL, 'cd08e250-c026-4d15-b580-1ffab9839812', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 13:31:47'),
(235, 4, NULL, '5937ee96-d1d5-443f-967f-ab338cafae6b', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 13:43:17'),
(236, 4, NULL, '490bfe02-f758-4914-9fb8-6b5ef5912d42', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 13:45:48'),
(237, 4, NULL, 'de97c89b-c44e-4565-8d62-a6b00bd64a76', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 13:47:06'),
(238, 4, NULL, 'de801e48-9db6-4094-9ece-3c9e1ada2818', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 13:48:49'),
(239, 4, NULL, '3f9e12c5-7144-4fdd-957f-c28157a0987d', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 13:55:44'),
(240, 4, NULL, 'd261fd4d-a2d2-4d87-a174-c6fee60a5d7a', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 13:58:51'),
(241, 4, NULL, 'dd9dbcf8-e713-420b-b243-2a07581bf0a9', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 14:19:06'),
(242, 4, NULL, '4a06a833-d7be-4f6f-bead-1b5f464700a4', 'user', '[Format: reels] Babalar Günü için Reels', NULL, '2026-06-11 14:46:12'),
(243, 4, NULL, '4a70982c-5a09-4026-a44f-77c7479bcf08', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 14:48:36'),
(244, 4, NULL, '9feecb60-f23e-4d40-a65a-2364f5fcd02d', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 16:14:56'),
(245, 4, NULL, '363f401b-895f-4aab-8792-44ff427d85eb', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 16:17:20'),
(246, 4, NULL, '117c85eb-8687-4ccc-a92f-48c53c8e58e0', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 16:25:01'),
(247, 4, NULL, 'b12d9de2-c1e6-4722-b301-968d3ca18bc8', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 16:31:29'),
(248, 4, NULL, '86b6da41-9441-49a4-87ff-b9b8b3eb1e7c', 'user', '[Format: reels] Perşembe günü paylaşmak için viral olabilecek, dikkat çekici ve enerjik bir Reels videosu için içerik ve caption üret.', NULL, '2026-06-11 16:54:00'),
(249, 4, NULL, NULL, 'ai', '🎬 Reels videon hazır!', '[\"https://smplannerai.b-cdn.net/media_1781197009865_609.mp4\"]', '2026-06-11 16:56:51');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `brand_kits`
--

CREATE TABLE `brand_kits` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `brand_name` varchar(255) NOT NULL,
  `brand_colors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`brand_colors`)),
  `sector` varchar(255) DEFAULT NULL,
  `target_audience` varchar(255) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tablo döküm verisi `brand_kits`
--

INSERT INTO `brand_kits` (`id`, `user_id`, `brand_name`, `brand_colors`, `sector`, `target_audience`, `logo_url`, `created_at`) VALUES
(8, 4, 'brandofficial', '[\"#E6E6E6\"]', 'sdfs', 'Ages 18-35', 'https://smplannerai.b-cdn.net/profile_kJIJ4m7tqXQUkEXsIr3etmo8BZI3_1781084152703.jpg', '2026-06-10 09:36:14');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `image_url` varchar(255) DEFAULT NULL,
  `caption` text DEFAULT NULL,
  `hashtags` text DEFAULT NULL,
  `format` varchar(50) DEFAULT 'post'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tablo döküm verisi `projects`
--

INSERT INTO `projects` (`id`, `user_id`, `name`, `created_at`, `image_url`, `caption`, `hashtags`, `format`) VALUES
(92, 4, 'ssssssss', '2026-06-05 02:22:19', 'https://smplannerai.b-cdn.net/media_1780626118602_709.jpg', NULL, NULL, 'post'),
(93, 4, 'Yeni İçerik', '2026-06-05 02:50:23', 'https://smplannerai.b-cdn.net/media_1780627892976_668.jpg', NULL, NULL, 'post'),
(94, 4, 'Yeni İçerik', '2026-06-05 02:50:28', 'https://smplannerai.b-cdn.net/media_1780627897814_450.jpg', NULL, NULL, 'post'),
(95, 4, '6565dfgdfgdfgdfg', '2026-06-05 02:58:49', 'https://smplannerai.b-cdn.net/media_1780628261313_681.jpg', NULL, NULL, 'post'),
(96, 4, 'pppppppppppppppppppppppppppppppppp', '2026-06-05 03:17:19', 'https://smplannerai.b-cdn.net/media_1780629420117_133.jpg', NULL, NULL, 'post'),
(97, 4, 'Yeni İçerik', '2026-06-10 11:18:51', 'https://smplannerai.b-cdn.net/media_1781090409863_54.jpg', NULL, NULL, 'post');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `project_items`
--

CREATE TABLE `project_items` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ai_chat_id` int(11) DEFAULT NULL,
  `media_url` varchar(500) NOT NULL,
  `caption` text DEFAULT NULL,
  `hashtags` text DEFAULT NULL,
  `format` varchar(50) DEFAULT 'post',
  `source` enum('ai_generated','editor','uploaded') DEFAULT 'ai_generated',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tablo döküm verisi `project_items`
--

INSERT INTO `project_items` (`id`, `project_id`, `user_id`, `ai_chat_id`, `media_url`, `caption`, `hashtags`, `format`, `source`, `created_at`) VALUES
(11, 92, 4, NULL, 'https://smplannerai.b-cdn.net/media_1780626118602_709.jpg', '🌟 शुक्रवार की शुभकामनाएँ! आज का दिन है खुशी का और नए सपनों की शुरुआत का। अपने सप्ताहांत की योजनाओं को बनाएं और अपने प्रियजनों के साथ बिताएं। छोटी-छोटी खुशियों का आनंद लें और खुद को खुश रखें! \n\n#शुक्रवार #खुशियाँ #सप्ताहांत #मौका #प्रेरणा', NULL, 'post', 'editor', '2026-06-05 02:22:19'),
(12, 95, 4, NULL, 'https://smplannerai.b-cdn.net/media_1780628261313_681.jpg', '🌟 Freitag ist da! Lasst uns das Wochenende mit positiver Energie und strahlendem Lächeln begrüßen. Was sind eure Pläne für die nächsten Tage? Genießt die Zeit mit euren Liebsten und hebt eure Gläser auf das Leben! 🥳\n\n#Freitag #Wochenende #Positivität #Gemeinschaft #Lächeln', NULL, 'post', 'editor', '2026-06-05 02:58:49'),
(13, 96, 4, NULL, 'https://smplannerai.b-cdn.net/media_1780629420117_133.jpg', '✨ Freitagsfreude! Lass uns das Wochenende richtig einläuten! Was sind eure Pläne für die kommenden Tage? Geht ihr auf Abenteuer oder entspannt ihr lieber zu Hause? Kommentiert unten und lasst uns gemeinsam die Freude teilen! \n\n#FreitagVibes #Wochenendpläne #Gemeinschaft #FreundeZusammen', NULL, 'post', 'editor', '2026-06-05 03:17:19');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `scheduled_posts`
--

CREATE TABLE `scheduled_posts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `brand_kit_id` int(11) DEFAULT NULL,
  `platform` enum('instagram','tiktok','linkedin','facebook','all') NOT NULL,
  `account_handle` varchar(255) DEFAULT NULL,
  `caption` text DEFAULT NULL,
  `media_url` varchar(500) NOT NULL,
  `status` enum('draft','scheduled','published','failed') DEFAULT 'scheduled',
  `scheduled_date` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `firebase_uid` varchar(255) NOT NULL,
  `auth_type` enum('apple','google','guest') NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `is_premium` tinyint(1) DEFAULT 1,
  `subscription_plan` enum('trial','monthly','yearly','none') DEFAULT 'trial',
  `premium_expire_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `language` enum('en','de','it','fr','tr','ja','es','ru','ko','hi','pt','zh') DEFAULT 'en'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`id`, `firebase_uid`, `auth_type`, `email`, `full_name`, `profile_image`, `is_premium`, `subscription_plan`, `premium_expire_date`, `created_at`, `language`) VALUES
(2, 'guest_0rue3hf1rppo', 'guest', 'guest_0rue3hf1rppo@smplanner.local', 'Misafir Kullanıcı', NULL, 1, 'trial', '2026-05-22 16:54:32', '2026-05-21 13:54:32', 'en'),
(4, 'kJIJ4m7tqXQUkEXsIr3etmo8BZI3', 'google', 'lunara0126@gmail.com', 'lunara', 'https://smplannerai.b-cdn.net/profile_kJIJ4m7tqXQUkEXsIr3etmo8BZI3_1781084152703.jpg', 1, 'trial', '2026-05-04 23:40:59', '2026-05-27 20:40:59', 'tr'),
(5, 'guest_u3pca3y9f0ns', 'guest', 'guest_u3pca3y9f0ns@smplanner.local', 'Misafir Kullanıcı', NULL, 1, 'trial', '2026-06-01 00:02:26', '2026-05-30 21:02:26', 'en'),
(6, 'test123', 'google', 'test@test.com', 'Test User', NULL, 1, 'trial', '2026-06-04 16:19:39', '2026-06-03 13:19:39', 'en');

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `ai_chat_history`
--
ALTER TABLE `ai_chat_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `ai_chat_history_ibfk_2` (`project_id`),
  ADD KEY `idx_session_id` (`session_id`);

--
-- Tablo için indeksler `brand_kits`
--
ALTER TABLE `brand_kits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Tablo için indeksler `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Tablo için indeksler `project_items`
--
ALTER TABLE `project_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_project_item_chat` (`ai_chat_id`);

--
-- Tablo için indeksler `scheduled_posts`
--
ALTER TABLE `scheduled_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `brand_kit_id` (`brand_kit_id`);

--
-- Tablo için indeksler `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `firebase_uid` (`firebase_uid`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `ai_chat_history`
--
ALTER TABLE `ai_chat_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=250;

--
-- Tablo için AUTO_INCREMENT değeri `brand_kits`
--
ALTER TABLE `brand_kits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Tablo için AUTO_INCREMENT değeri `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- Tablo için AUTO_INCREMENT değeri `project_items`
--
ALTER TABLE `project_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Tablo için AUTO_INCREMENT değeri `scheduled_posts`
--
ALTER TABLE `scheduled_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `ai_chat_history`
--
ALTER TABLE `ai_chat_history`
  ADD CONSTRAINT `ai_chat_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ai_chat_history_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `brand_kits`
--
ALTER TABLE `brand_kits`
  ADD CONSTRAINT `brand_kits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `project_items`
--
ALTER TABLE `project_items`
  ADD CONSTRAINT `fk_project_item_chat` FOREIGN KEY (`ai_chat_id`) REFERENCES `ai_chat_history` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `pi_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pi_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Tablo kısıtlamaları `scheduled_posts`
--
ALTER TABLE `scheduled_posts`
  ADD CONSTRAINT `scheduled_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `scheduled_posts_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `scheduled_posts_ibfk_3` FOREIGN KEY (`brand_kit_id`) REFERENCES `brand_kits` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
