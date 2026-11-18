<?php
// Punto de entrada de la API: index.php?action=<accion>. Agrega CORS y JSON y deriva a router.php.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Session-Token, ngrok-skip-browser-warning");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Preflight de CORS (solo lo hace el navegador, por ejemplo con `npm run web`).
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// retorno_pago devuelve HTML (lo abre el navegador al volver de Mercado Pago) y pone su propio Content-Type.
header("Content-Type: application/json; charset=UTF-8");

include 'router.php';
?>
