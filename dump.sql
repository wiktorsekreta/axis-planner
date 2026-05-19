
DELETE FROM `taskcategories`;
DELETE FROM `tasks`;
DELETE FROM `users`;
DELETE FROM `categories`;



INSERT INTO `categories` (`CategoryId`,`Name`) VALUES
(1,'Praca'),
(2,'Studia'),
(3,'Dom'),
(4,'Zakupy'),
(5,'Zdrowie'),
(6,'Sport'),
(7,'Rozrywka'),
(8,'Finanse'),      
(9,'Podróże'),
(10,'Technologia');

INSERT INTO `users` (`UserId`,`UserName`,`Email`,`Password`,`CreatedAt`) VALUES
(1,'wiktor','sekretawiktor@gmail.com','$2y$10$PIzhyHf5UZ.28R6WMZtVteMzTudsrrBSGdTH1KTLIIIBiOavJ7fES','2026-05-11 08:07:17'),
(2,'jan_kowalski','jan.kowalski@gmail.com','$2y$10$h0QzfW/Gx8PrPBdRPv.TM.iDSkRmdnIr1XHQAZLbDOZBK9gnpVMDS','2026-05-11 17:41:33'),
(3,'anna_nowak','anna.nowak@gmail.com','$2y$10$hslHcqaI3BqWplPf6HT4Bea8WQn1dt4AdwV15xPNgqwR872Xz1fk6','2026-05-11 17:41:33'),
(4,'piotr_zielinski','piotr.zielinski@wp.pl','PiotrZiel2020','2026-05-11 17:41:33'),
(5,'katarzyna_wisniewska','k.wisniewska@gmail.com','KasiaWis11','2026-05-11 17:41:33'),
(6,'tomasz_kaczmarek','t.kaczmarek@wp.pl','TomekKacz95','2026-05-11 17:41:33'),
(7,'magdalena_mazur','magda.mazur@gmail.com','MagdaMazur88','2026-05-11 17:41:33'),
(8,'pawel_dabrowski','pawel.dabrowski@wp.pl','PawelDabrowski7','2026-05-11 17:41:33'),
(9,'aleksandra_piotrowska','ola.piotrowska@gmail.com','OlaPiotr2021','2026-05-11 17:41:33'),
(10,'lukasz_grabowski','lukasz.grabowski@wp.pl','LukaszGrab12','2026-05-11 17:41:33'),
(11,'ewa_pawlak','ewa.pawlak@gmail.com','EwaPawlak34','2026-05-11 17:41:33'),
(12,'marek_kowalczyk','marek.kowalczyk@gmail.com','$2y$10$LlZeSjY.6DclCvtwLc5Hv.xExbv5A4BvFIgjkLm5cIFYAvb4xEBNi','2026-05-13 17:10:19'),
(13,'igor','igorkow@gmail.com','$2y$10$TEfyRmQ4bEWtG3OEcyAHXOyBNJfO4roLjmmocxRownKy08EId5AeK','2026-05-14 07:11:40');

INSERT INTO `tasks` (`TaskId`,`UserId`,`Title`,`Description`,`Date`,`Time`,`IsDone`,`CreatedAt`) VALUES
(1,1,'sprawdzian z historii','sprawdzian historia dzial 4','2026-05-22','13:30:00',0,'2026-05-11 08:08:39'),
(2,1,'Spotkanie z klientem','Omówienie wymagań nowej strony internetowej','2026-04-22','10:00:00',0,'2026-05-11 17:41:33'),
(3,2,'Przygotowanie do egzaminu','Powtórka z normalizacji baz danych i JOIN','2026-04-23','18:00:00',0,'2026-05-11 17:41:33'),
(4,3,'Sprzątanie mieszkania','Odkurzanie, mycie podłóg i wyniesienie śmieci','2026-04-24','09:00:00',1,'2026-05-11 17:41:33'),
(5,4,'Zakupy spożywcze','Kup mleko, pieczywo, warzywa i makaron','2026-04-25','16:30:00',0,'2026-05-11 17:41:33'),
(6,5,'Trening na siłowni','FBW + 20 minut cardio','2026-04-26','19:00:00',0,'2026-05-11 17:41:33'),
(7,6,'Czytanie książki','Przeczytać dwa rozdziały "Władcy Pierścieni"','2026-04-27','20:00:00',0,'2026-05-11 17:41:33'),
(8,7,'Opłacenie rachunków','Zapłacić czynsz i rachunek za internet','2026-04-28','17:00:00',1,'2026-05-11 17:41:33'),
(9,8,'Rezerwacja hotelu','Zarezerwować nocleg w Barcelonie na wakacje','2026-04-29','12:00:00',0,'2026-05-11 17:41:33'),
(10,9,'Wizyta u dentysty','Kontrolna wizyta i czyszczenie zębów','2026-04-30','15:00:00',1,'2026-05-11 17:41:33'),
(11,11,'GitHub','Aktualizacja repozytoriów i organizacji na GitHubie','2026-05-25','11:00:00',0,'2026-05-13 16:32:26'),
(12,11,'Kurs SQL','Lekcja dotycząca JOIN i indeksów','2026-05-28','18:30:00',0,'2026-05-13 16:32:26'),
(13,12,'Przegląd budżetu domowego na maj','Podsumowanie wydatków z kwietnia, zaplanowanie limitu wydatków na maj, aktualizacja arkusza finansowego.','2026-05-05','09:00:00',1,'2026-05-01 07:30:00'),
(14,12,'Umówienie przeglądu samochodu','Zadzwonić do serwisu i umówić przegląd techniczny – auto jeździ 60 000 km, wymiana oleju i filtrów.','2026-05-07','11:00:00',0,'2026-05-01 07:30:00'),
(15,12,'Wysłanie raportu miesięcznego do klienta','Przygotować i wysłać raport z postępów projektu za kwiecień do klienta ABC Sp. z o.o.','2026-05-09','10:00:00',0,'2026-05-01 07:30:00'),
(16,12,'Opłacenie rachunków za mieszkanie','Przelew za czynsz, prąd i internet – łączna kwota ok. 1800 zł. Termin płatności 12 maja.','2026-05-12','08:30:00',0,'2026-05-01 07:30:00'),
(17,12,'Prezentacja wyników Q1 dla zarządu','Przygotować slajdy i przedstawić wyniki sprzedaży za Q1 2026 na spotkaniu zarządu o 13:00.','2026-05-15','13:00:00',0,'2026-05-01 07:30:00'),
(18,12,'Wizyta u stomatologa','Kontrolna wizyta u dr Nowak – gabinet przy ul. Marszałkowskiej 12. Potwierdzić wizytę dzień wcześniej.','2026-05-19','16:00:00',0,'2026-05-01 07:30:00'),
(19,12,'Szkolenie online – Excel dla zaawansowanych','Udział w 3-godzinnym webinarze na platformie Udemy – tabele przestawne i makra VBA.','2026-05-22','10:00:00',0,'2026-05-01 07:30:00'),
(20,12,'Backup danych służbowych','Wykonać kopię zapasową projektów na dysku zewnętrznym i w chmurze Google Drive.','2026-05-26','15:00:00',0,'2026-05-01 07:30:00'),
(21,12,'Podsumowanie maja – przegląd celów','Ocenić realizację celów wyznaczonych na maj: budżet, projekty, zdrowie. Zapisać wnioski do dziennika.','2026-05-29','09:00:00',0,'2026-05-01 07:30:00'),
(22,12,'Planowanie zadań i celów na czerwiec','Ustalić priorytety na czerwiec, wpisać ważne daty do kalendarza, podzielić duże zadania na mniejsze kroki.','2026-05-31','17:00:00',0,'2026-05-01 07:30:00'),
(23,10,'Aktualizacja CV','Uzupełnić CV o ostatnie doświadczenia i wysłać do 3 firm.','2026-05-14','10:00:00',0,'2026-05-13 17:24:42'),
(24,11,'Przegląd skrzynki email','Posprzątać inbox, odpisać na zaległe wiadomości.','2026-05-14','09:00:00',0,'2026-05-13 17:24:42'),
(25,3,'Wycieczka do Krakowa','Wycieczka jednodniowa Kraków','2026-05-17','07:00:00',0,'2026-05-13 19:09:13'),
(26,3,'rozmowa o prace','rozmowa o prace w firmie startupowej','2026-05-26','11:00:00',0,'2026-05-13 19:11:57'),
(27,12,'zadanie matma','funkcja liniowa 4.30','2026-06-01','13:40:00',0,'2026-05-14 07:28:03');

INSERT INTO `taskcategories` (`TaskCategoryId`,`TaskId`,`CategoryId`) VALUES
(1,1,1),
(2,2,2),
(3,3,3),
(4,4,4),
(5,5,6),
(6,6,7),
(7,7,8),
(8,8,9),
(9,9,5),
(10,10,10),
(11,13,8),
(12,14,3),
(13,15,1),
(14,16,8),
(15,17,1),
(16,18,5),
(17,19,1),
(18,20,10),
(19,21,1),
(20,22,1),
(21,25,9),
(22,26,1),
(23,27,1);