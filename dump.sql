-- Plik SQL do tworzenia struktury bazy danych aplikacji AXIS.
-- Wygenerowany przez phpMyAdmin. Uruchamiany automatycznie przez Docker
-- przy pierwszym starcie kontenera bazy danych (folder docker-entrypoint-initdb.d/).

-- Konfiguracja trybu SQL i strefy czasowej dla tej sesji
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO"; -- zapobiega auto-inkrementacji od 0 (zaczyna od 1)
START TRANSACTION;                      -- wszystkie polecenia w jednej transakcji (albo wszystko albo nic)
SET time_zone = "+00:00";               -- UTC jako strefa czasowa


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;          -- utf8mb4 obsługuje polskie znaki i emoji

-- ── TABELA: categories ────────────────────────────────────────────────────────
-- Przechowuje kategorie zadań (np. "Praca", "Szkoła", "Sport").
-- Kategorie są wspólne dla wszystkich użytkowników (brak pola UserId).
CREATE TABLE `categories` (
  `CategoryId` int(10) UNSIGNED NOT NULL,   -- unikalny numer ID kategorii
  `Name` varchar(120) NOT NULL              -- nazwa kategorii (maks. 120 znaków)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TABELA: taskcategories ────────────────────────────────────────────────────
-- Tabela pośrednia łącząca zadania z kategoriami (relacja wiele-do-wielu).
-- Jedno zadanie może mieć wiele kategorii, jedna kategoria może być przypisana do wielu zadań.
CREATE TABLE `taskcategories` (
  `TaskCategoryId` int(10) UNSIGNED NOT NULL, -- ID wiersza powiązania
  `TaskId`         int(10) UNSIGNED NOT NULL, -- ID zadania (klucz obcy → tasks.TaskId)
  `CategoryId`     int(10) UNSIGNED NOT NULL  -- ID kategorii (klucz obcy → categories.CategoryId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TABELA: tasks ─────────────────────────────────────────────────────────────
-- Przechowuje zadania użytkowników (to/do items).
CREATE TABLE `tasks` (
  `TaskId`      int(10) UNSIGNED NOT NULL,         -- unikalny numer ID zadania
  `UserId`      int(10) UNSIGNED NOT NULL,         -- właściciel zadania (klucz obcy → users.UserId)
  `Title`       varchar(255) NOT NULL,             -- tytuł zadania (wymagany)
  `Description` text DEFAULT NULL,                 -- opis zadania (opcjonalny, NULL = brak opisu)
  `Date`        date NOT NULL,                     -- data zadania w formacie YYYY-MM-DD
  `Time`        time NOT NULL,                     -- godzina zadania (00:00:00 = brak godziny)
  `IsDone`      tinyint(1) NOT NULL DEFAULT 0,     -- czy wykonane: 0 = nie, 1 = tak
  `CreatedAt`   datetime DEFAULT current_timestamp() -- data i czas dodania (automatyczna)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TABELA: users ─────────────────────────────────────────────────────────────
-- Przechowuje konta użytkowników aplikacji.
CREATE TABLE `users` (
  `UserId`    int(10) UNSIGNED NOT NULL,         -- unikalny numer ID użytkownika
  `UserName`  varchar(80) NOT NULL,              -- nazwa użytkownika (unikalna)
  `Email`     varchar(80) NOT NULL,              -- adres e-mail (unikalny)
  `Password`  varchar(255) NOT NULL,             -- hash bcrypt hasła (255 znaków na hash)
  `CreatedAt` datetime DEFAULT current_timestamp() -- data rejestracji (automatyczna)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── INDEKSY ───────────────────────────────────────────────────────────────────
-- Indeksy przyspieszają wyszukiwanie w kolumnach. PRIMARY KEY = unikalny identyfikator wiersza.

-- categories: CategoryId jako klucz główny, Name jako unikalny (nie można mieć dwóch takich samych kategorii)
ALTER TABLE `categories`
  ADD PRIMARY KEY (`CategoryId`),
  ADD UNIQUE KEY `Name` (`Name`);

-- taskcategories: TaskCategoryId jako klucz główny,
-- para (TaskId, CategoryId) jako unikalny — to samo powiązanie nie może istnieć dwa razy
ALTER TABLE `taskcategories`
  ADD PRIMARY KEY (`TaskCategoryId`),
  ADD UNIQUE KEY `TaskId` (`TaskId`,`CategoryId`),
  ADD KEY `CategoryId` (`CategoryId`);       -- indeks przyspieszający wyszukiwanie po CategoryId

-- tasks: TaskId jako klucz główny, indeks na UserId (szybkie pobieranie zadań danego użytkownika)
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`TaskId`),
  ADD KEY `UserId` (`UserId`);

-- users: UserId jako klucz główny, UserName i Email jako unikalne (nie można mieć dwóch kont z tym samym loginem/mailem)
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserId`),
  ADD UNIQUE KEY `UserName` (`UserName`),
  ADD UNIQUE KEY `Email` (`Email`);

-- ── AUTO_INCREMENT ────────────────────────────────────────────────────────────
-- AUTO_INCREMENT = baza automatycznie nadaje kolejne ID (1, 2, 3...) przy dodawaniu wierszy

ALTER TABLE `categories`
  MODIFY `CategoryId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `taskcategories`
  MODIFY `TaskCategoryId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `tasks`
  MODIFY `TaskId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `UserId` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

-- ── KLUCZE OBCE (FOREIGN KEYS) ────────────────────────────────────────────────
-- Klucze obce wymuszają spójność danych: nie można wstawić TaskId który nie istnieje w tasks.

-- taskcategories: TaskId musi istnieć w tasks, CategoryId musi istnieć w categories
ALTER TABLE `taskcategories`
  ADD CONSTRAINT `taskcategories_ibfk_1` FOREIGN KEY (`TaskId`) REFERENCES `tasks` (`TaskId`),
  ADD CONSTRAINT `taskcategories_ibfk_2` FOREIGN KEY (`CategoryId`) REFERENCES `categories` (`CategoryId`);

-- tasks: UserId musi istnieć w users (zadanie musi należeć do istniejącego użytkownika)
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`);

COMMIT; -- zatwierdzamy całą transakcję — wszystkie tabele stworzone razem

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
