<?php
// Niszczy sesję PHP i przekierowuje na stronę logowania.
session_start();
session_destroy();
header('Location: ../index.html');
exit;
