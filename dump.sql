SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE `categories` (
  `CategoryId` int(10) UNSIGNED NOT NULL,
  `Name` varchar(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `taskcategories` (
  `TaskCategoryId` int(10) UNSIGNED NOT NULL,
  `TaskId`         int(10) UNSIGNED NOT NULL,
  `CategoryId`     int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tasks` (
  `TaskId`      int(10) UNSIGNED NOT NULL,
  `UserId`      int(10) UNSIGNED NOT NULL,
  `Title`       varchar(255) NOT NULL,
  `Description` text DEFAULT NULL,
  `Date`        date NOT NULL,
  `Time`        time NOT NULL,
  `IsDone`      tinyint(1) NOT NULL DEFAULT 0,
  `CreatedAt`   datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `UserId`    int(10) UNSIGNED NOT NULL,
  `UserName`  varchar(80) NOT NULL,
  `Email`     varchar(80) NOT NULL,
  `Password`  varchar(255) NOT NULL,
  `CreatedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `categories`
  ADD PRIMARY KEY (`CategoryId`),
  ADD UNIQUE KEY `Name` (`Name`);

ALTER TABLE `taskcategories`
  ADD PRIMARY KEY (`TaskCategoryId`),
  ADD UNIQUE KEY `TaskId` (`TaskId`,`CategoryId`),
  ADD KEY `CategoryId` (`CategoryId`);

ALTER TABLE `tasks`
  ADD PRIMARY KEY (`TaskId`),
  ADD KEY `UserId` (`UserId`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`UserId`),
  ADD UNIQUE KEY `UserName` (`UserName`),
  ADD UNIQUE KEY `Email` (`Email`);

ALTER TABLE `categories`
  MODIFY `CategoryId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `taskcategories`
  MODIFY `TaskCategoryId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `tasks`
  MODIFY `TaskId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `UserId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `taskcategories`
  ADD CONSTRAINT `taskcategories_ibfk_1` FOREIGN KEY (`TaskId`) REFERENCES `tasks` (`TaskId`),
  ADD CONSTRAINT `taskcategories_ibfk_2` FOREIGN KEY (`CategoryId`) REFERENCES `categories` (`CategoryId`);

ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
