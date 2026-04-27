<?php
// Ten plik wylogowuje użytkownika.
// Niszczy sesję PHP (usuwa zapamiętane dane o zalogowanym użytkowniku)
// i przekierowuje na stronę główną (ekran logowania).

// Uruchamiamy sesję PHP — musimy ją najpierw uruchomić, żeby ją zniszczyć
session_start();

// Niszczymy sesję — od tej chwili użytkownik nie jest już zalogowany
session_destroy();

// Przekierowujemy przeglądarkę na stronę logowania
// "../" oznacza katalog wyżej niż folder /api/, czyli /www/
header('Location: ../index.html');
exit;
