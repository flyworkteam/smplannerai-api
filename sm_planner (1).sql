-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1:3306
-- Üretim Zamanı: 23 May 2026, 21:25:20
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
  `project_id` int(11) NOT NULL,
  `message_role` enum('user','ai') NOT NULL,
  `message_text` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tablo döküm verisi `ai_chat_history`
--

INSERT INTO `ai_chat_history` (`id`, `user_id`, `project_id`, `message_role`, `message_text`, `image_url`, `created_at`) VALUES
(4, 3, 2, 'user', '[Format: post] Post for Instagram', NULL, '2026-05-22 17:53:28'),
(5, 3, 2, 'user', '[Format: post] merhaba\n', NULL, '2026-05-22 17:53:41'),
(6, 3, 2, 'user', '[Format: post] adsfasdfasd', NULL, '2026-05-22 17:56:32'),
(7, 3, 2, 'user', '[Format: post] dddddddddddddddddddddddddddddddd', NULL, '2026-05-22 17:59:01'),
(8, 3, 2, 'ai', 'Merhaba! Ben harika bir sosyal medya gönderisi hazırlamak için buradayım, ama galiba küçük bir karışıklık oldu çünkü \"dddddddddddddddddddddddddddddddd\" bana ne hakkında bir gönderi hazırlamam gerektiğini tam olarak anlatmıyor 😊\n\nHiç sorun değil! Bana sadece konuyu veya görseli kısaca anlatman yeterli. Mesela:\n\n*   \"Yeni çıkan kahve ürünümüz için bir post.\"\n*   \"Güneşli bir park fotoğrafı için motivasyonel bir caption.\"\n*   \"Bir kedinin tatlı hallerini gösteren bir video için komik bir metin.\"\n*   \"Bir yazılım lansmanı hakkında bilgilendirici bir gönderi.\"\n\nBana ne istediğini söylediğinde, hemen senin için harika bir metin ve en etkili hashtagleri hazırlayacağım! Hadi, dört gözle bekliyorum! ✨', NULL, '2026-05-22 17:59:07'),
(9, 3, 2, 'user', '[Format: post] sana grsel bilgisi sunsam bana yardmc olur musun\n', NULL, '2026-05-22 17:59:33'),
(10, 3, 2, 'ai', 'Tabii ki! Görsel bilgilerini benimle paylaşabilirsin, buna göre harika bir gönderi metni ve hashtag kombinasyonları hazırlamak için hemen yardımcı olurum. Görselin teması ve amacı hakkında bilgi verirsen, daha spesifik ve etkili bir içerik oluşturabilirim. Bekliyorum! 🌟', NULL, '2026-05-22 17:59:36'),
(11, 3, 2, 'user', '[Format: post] bana anneler gunu icin gorsel uret\n', NULL, '2026-05-22 18:00:03'),
(12, 3, 2, 'ai', 'Tabii ki! İşte Anneler Günü için harika bir gönderi metni (caption) ve kullanabileceğin hashtag kombinasyonları:\n\n🦋✨ Her günümüzü güzelleştiren, sevgisiyle bizi saran, en değerli varlığımız ANNE\'lerimizin günü kutlu olsun! 💖 Onların fedakarlıkları, sabrı ve sevgisi hayatımızın en önemli parçaları. Bu özel günde, tüm annelerimize olan sevgimizi ve minnettarlığımızı bir kez daha ifade edelim! 🌸🤗\n\nOnların gülümsemesi, dünyamızı aydınlatıyor. Annelik, bir sanattır ve her anne kendi eserini yaratıyor. Bu Anneler Günü’nde en güzel anılarla dolu bir gün geçirmenizi dilerim! 💐❤️\n\n👉 Annenize sevgi dolu bir not bırakmayı unutmayın! \n\n#AnnelerGünü #Sevgi #MinikNotlar #AnneSevgisi #Mutluluk #Anne #Aile #Teşekkür #ÖzelGünler\n\nBu metinle görselini destekleyerek güzel bir paylaşım yapabilirsin! 🌷', NULL, '2026-05-22 18:00:19'),
(13, 3, 2, 'user', '[Format: post] anneler grseli olutur\n', NULL, '2026-05-22 19:01:18'),
(14, 3, 2, 'ai', '🧡✨ Anneler, hayatımızın en özel köşe taşlarıdır! Onların sevgisi, sabrı ve cesareti bize her zaman yol gösterir. Bu özel günlerinde onlara olan minnetimizi bir kez daha hatırlayalım! \n\nBugün anneler için sadece bir gün değil, her anımızda yanımızda olan bu muhteşem kadınlara teşekkür etme zamanı! 🎉💕\n\nAnnenizle güzel bir anınızı paylaşmayı unutmayın! 👩‍👧‍👦\n\n#AnnelerGünü #Sevgi #Aile #Anne #MinikAnılar #TeşekkürlerAnne #HayatınAnlamı #AnneSevgisi #AnneninSıcaklığı', NULL, '2026-05-22 19:01:23'),
(15, 3, 2, 'user', '[Format: post] anneler gunu gorsel uret\n', NULL, '2026-05-22 19:05:08'),
(16, 3, 2, 'ai', 'Elbette! İşte Anneler Günü için harika bir gönderi metni ve hashtag kombinasyonları:\n\n---\n\n🌸🎉 Anneler Günü\'nüz kutlu olsun! 🎉🌸\n\nHayatımızdaki en özel kadınlar için bir gün değil, her an şükrediyoruz. Anne olmak, en zor ama en güzel yolculuk. Onların sevgisi, sabrı ve fedakarlıkları her şeyin üstünde! 💕 \n\nBugün, annelerimiz için küçük bir jest yapalım; sevgi dolu mesajlar, güzel bir kahvaltı veya içten bir gülümseme yeter! Siz de annelerinizi mutlu etmek için neler yapacaksınız? Yorumlarda bizimle paylaşın! 💐✨\n\n#AnnelerGünü #AnneSevgisi #Anne #BaşkaBirGüzel #Sevgi #Mutluluk #Aşk #Gülümse #TeşekkürlerAnne #AnnelerGünü2023 #BiziBüyütenler\n\n---\n\nUmarım beğenirsin! Bu gönderi ile annelerinize olan sevginizi ve minnettarlığınızı paylaşabilirsiniz. 💖', NULL, '2026-05-22 19:05:13'),
(17, 3, 2, 'user', '[Format: post] anneler gunu gorseliuret\n', NULL, '2026-05-22 19:08:34'),
(18, 3, 2, 'ai', 'Harika bir seçim! Anneler Günü için tabii ki bomba gibi bir gönderi metni ve hashtag kombinasyonu hazırlayalım! 🌸💖\n\nHazırlayacağımız görseli de şöyle hayal edelim: Belki anne ve çocuğunun sıcacık bir kucaklaşması, annenin gülen yüzüyle pasta kesmesi, ya da rengarenk çiçeklerle dolu, kalpleri ısıtan bir an... Gözlerinizden sevgi fışkıracak bir kare!\n\nİşte o görsel için cana yakın, içten ve dikkat çekici gönderi metnimiz:\n\n---\n\n**Gönderi Metni (Caption):**\n\nCanım annem, dünyanın en güzel kalbi, en güçlü elleri, en şefkatli bakışları... Bugün senin günün! 💖\n\nHayat yolculuğumdaki en büyük kahramanım, ilk öğretmenim, sarsılmaz destekçimsin. Koşulsuz sevginle her zaman yanı başımda oldun, en iyi arkadaşım, sırdaşım oldun. Seninle büyümek, senin sevginle yoğrulmak ne büyük bir şans! ✨\n\nGözlerindeki ışıltı hiç sönmesin, gülüşün yüzünden eksik olmasın. Hayatımıza kattığın her şey için sana minnettarız. İyi ki varsın annem! 🙏\n\nTüm annelerimizin, anne adaylarımızın ve yüreği annelikle atan herkesin Anneler Günü kutlu olsun! Bu özel günde annelerimizi kocaman sarılalım, öpücükler konduralım ve onları ne kadar sevdiğimizi bir kez daha fısıldayalım. 🥰\n\nSiz de kendi kahraman anneniz için bir kalp bırakmaya ne dersiniz? 👇\n\n#AnnelerGünüKutluOlsun #CanımAnnem\n\n---\n\n**Hashtag Kombinasyonları:**\n\n*   **Ana Hashtagler:**\n    *   #AnnelerGünüKutluOlsun\n    *   #CanımAnnem\n    *   #AnneSevgisi\n    *   #AnnemHerşeyim\n*   **Duygusal ve Destekleyici Hashtagler:**\n    *   #SüperAnne\n    *   #AnnelerGünü\n    *   #MutluAnnelerGünü\n    *   #Minnettarım\n    *   #HayatımınAnlamı\n*   **Genel ve Kapsayıcı Hashtagler:**\n    *   #Aile\n    *   #SevgiDolu\n    *   #ÖzelGünler\n    *   #İyiKiVarsın\n    *   #Motherhood (uluslararası erişim için)\n\nBu gönderiyle Anneler Günü\'nde tüm kalpleri ısıtacağınızdan eminim! Şimdiden kutlu olsun! 🎉', NULL, '2026-05-22 19:08:42'),
(19, 3, 2, 'user', '[Format: post] anneler gunu gorsel uret', NULL, '2026-05-22 19:11:17'),
(20, 3, 2, 'ai', 'Harika bir fikir! Anneler Günü için hazırladığınız görselle harika gidecek, kalpleri ısıtan bir gönderi metni ve hashtag kombinasyonları hazırladım bile. Seçiminize göre, görselinizin ruhuna en uygun olanı kullanabilirsiniz. 🥰\n\n---\n\n### **Gönderi Metni Seçenekleri (Lütfen görselinizin genel temasına göre birini seçin):**\n\n**Seçenek 1: Duygusal ve Minnettar**\n\n\"Hayatımızın her anına sevgi, sabır ve fedakarlık katan tüm annelerimizin Anneler Günü kutlu olsun! Onlar bizim ilk öğretmenimiz, en iyi arkadaşımız, sığınağımız ve ilham kaynağımız. Koşulsuz sevgileriyle dünyamızı güzelleştiren tüm annelerimize sonsuz teşekkürler! İyi ki varsınız, iyi ki bizim annemizsiniz. ❤️\"\n\n---\n\n**Seçenek 2: Neşeli ve Kutlama Odaklı**\n\n\"Bugün kalbi sevgiyle çarpan, şefkatli elleriyle bizi saran, yolumuza ışık tutan tüm annelerimizin günü! 🤗 Bizi biz yapan, düştüğümüzde kaldıran, her zaman yanımızda olan o eşsiz varlıklar; annelerimiz! Onların varlığına şükran, sevgilerine minnettarız. Anneler Günü\'nüz kutlu olsun, iyi ki varsınız canım annelerimiz! Bugün onları sımsıkı sarıp sarmalama günü! 🌸\"\n\n---\n\n**Seçenek 3: Kısa, Öz ve Etkileşimli**\n\n\"Bugün, bizi koşulsuz seven, her zorlukta yanımızda olan kahramanlarımızın günü: Anneler Günü! 💕 Hayatımızdaki en değerli hazinemiz, sımsıcak kucağıyla bizi saran, dualarıyla güç veren annelerimize... İyi ki varsınız! Annenize söylemek istediğiniz bir şey var mıydı? Yorumlarda paylaşın, sevgimizi çoğaltalım! 👇\"\n\n---\n\n### **Hashtag Kombinasyonları (Gönderi metninizle birlikte kullanabilirsiniz):**\n\n*   #AnnelerGünü\n*   #AnnelerGünüKutluOlsun\n*   #CanımAnnem\n*   #AnneSevgisi\n*   #SüperAnne\n*   #KahramanAnneler\n*   #Minnettarız\n*   #İyiKiVarsınAnne\n*   #ÖzelGün\n*   #Kutlama\n*   #AnnemHerŞeyim\n*   #KoşulsuzSevgi\n\n---\n\nUmarım bu seçenekler anneniz ve tüm takipçileriniz için harika bir Anneler Günü paylaşımı yapmanıza yardımcı olur! Harika bir gün dilerim! 💐', NULL, '2026-05-22 19:11:30'),
(21, 3, 2, 'user', '[Format: post] anneler gunu gorsel\nuret', NULL, '2026-05-22 19:13:30'),
(22, 3, 2, 'ai', 'Harika bir fikir! Anneler Günü görseli için içten, sıcak ve paylaşmaya değer bir gönderi hazırlayalım. Sosyal medya uzmanı şapkanı taktım ve işte sana harika bir gönderi metni ile hashtag kombinasyonları:\n\n---\n\n### **Gönderi Metni (Caption)**\n\n\"Kalplerimizin en derin köşesinde, hayatımızın her anında baş tacı olan eşsiz kahramanlarımız... Sevgili annelerimiz! 💖\n\nBugün, varlığınızla aydınlanan her an için size minnetimizi ve sonsuz sevgimizi bir kez daha haykırma günü. İlk adımlarımızdan bugüne, koşulsuz sevginiz, bitmeyen sabrınız ve her zaman yanımızda olan desteğinizle bizi biz yapan sizsiniz. İyi ki varsınız, iyi ki bizim annemizsiniz! ✨\n\nHayatımıza kattığınız tüm güzellikler, öğrettiğiniz tüm değerler ve yüzümüzde açtırdığınız her gülümseme için size sonsuz teşekkürler. 🙏\n\nTüm annelerin ve anne şefkatiyle kalpleri ısıtan özel kadınların Anneler Günü kutlu olsun! Bu özel günde, hayatımıza kattığınız tüm güzellikler için size minnettarız.\n\n**Şimdi sıra sende!** Bu gönderinin altına anneni etiketle ve ona ne kadar çok sevdiğini söyle! 👇 Annenle en güzel anını yorumlarda paylaşmaya ne dersin? 😊\"\n\n---\n\n### **Hashtag Kombinasyonları**\n\nİşte hem geniş kitlelere ulaşacak hem de gönderinin duygusunu pekiştirecek hashtag setleri:\n\n**1. Temel ve Popüler Hashtag\'ler:**\n*   #AnnelerGünü\n*   #AnnelerGünüKutluOlsun\n*   #CanımAnnem\n*   #AnneSevgisi\n*   #Minnettarım\n*   #SüperAnne\n\n**2. Duygusal ve İçten Hashtag\'ler:**\n*   #AnnemHerşeyim\n*   #HayatımınAnlamı\n*   #EnDeğerlim\n*   #KoşulsuzSevgi\n*   #KalbimdekiKahraman\n*   #EvlatSevgisi\n\n**3. Daha Geniş Kitlelere Yönelik ve İngilizce:**\n*   #MothersDay\n*   #HappyMothersDay\n*   #Anne\n*   #Aile\n*   #Sevgi\n*   #KadınGücü\n\n**Hepsini bir arada kullanmak istersen:**\n#AnnelerGünü #AnnelerGünüKutluOlsun #CanımAnnem #AnneSevgisi #Minnettarım #SüperAnne #AnnemHerşeyim #HayatımınAnlamı #EnDeğerlim #KoşulsuzSevgi #KalbimdekiKahraman #EvlatSevgisi #MothersDay #HappyMothersDay #Anne #Aile #Sevgi #KadınGücü\n\n---\n\nBu gönderi metni ve hashtag\'lerle annelerimizin yüzünde harika bir gülümseme oluşturacağımıza eminim! Görselinle birleşince çok beğenilecektir. 😊 Başka bir şeye ihtiyacın olursa çekinme, buradayım!', '[\"https://smplannerai.b-cdn.net/img_1779477230906_850.jpg\"]', '2026-05-22 19:13:51');

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
(1, 3, 'brandofficial', '[\"#DDA0DD\"]', 'E-commerce', 'Ages 18-25', 'https://example.com/logo.png', '2026-05-22 17:22:41'),
(2, 3, 'sdfsdfsdfsdfs', '[\"#00BFFF\"]', 'sfsdfsdf', 'Ages 18-57', 'https://smplannerai.b-cdn.net/profile_kJIJ4m7tqXQUkEXsIr3etmo8BZI3_1779470962584.jpg', '2026-05-22 17:29:31'),
(3, 3, 'fdsdsdfsd', '[\"#00BFFF\"]', 'sdfasdfsdfas', 'Ages 18-65', 'https://smplannerai.b-cdn.net/profile_kJIJ4m7tqXQUkEXsIr3etmo8BZI3_1779471659824.jpg', '2026-05-22 17:41:07');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tablo döküm verisi `projects`
--

INSERT INTO `projects` (`id`, `user_id`, `name`, `created_at`) VALUES
(2, 3, 'Genel Klasör', '2026-05-22 17:53:22');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tablo döküm verisi `users`
--

INSERT INTO `users` (`id`, `firebase_uid`, `auth_type`, `email`, `full_name`, `profile_image`, `is_premium`, `subscription_plan`, `premium_expire_date`, `created_at`) VALUES
(2, 'guest_0rue3hf1rppo', 'guest', 'guest_0rue3hf1rppo@smplanner.local', 'Misafir Kullanıcı', NULL, 1, 'trial', '2026-05-22 16:54:32', '2026-05-21 13:54:32'),
(3, 'kJIJ4m7tqXQUkEXsIr3etmo8BZI3', 'google', 'lunara0126@gmail.com', 'lunaraaa', 'https://smplannerai.b-cdn.net/profile_kJIJ4m7tqXQUkEXsIr3etmo8BZI3_1779471659824.jpg', 0, 'none', '2026-05-22 17:11:39', '2026-05-21 14:11:39');

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `ai_chat_history`
--
ALTER TABLE `ai_chat_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `project_id` (`project_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Tablo için AUTO_INCREMENT değeri `brand_kits`
--
ALTER TABLE `brand_kits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Tablo için AUTO_INCREMENT değeri `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Tablo için AUTO_INCREMENT değeri `scheduled_posts`
--
ALTER TABLE `scheduled_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
