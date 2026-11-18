<?php
// Página a la que vuelve Mercado Pago después del checkout (back_urls de la preferencia).
// GET index.php?action=retorno_pago&resultado=success|failure|pending[&r=<url de la app>]
//
// Solo muestra un mensaje y un botón para volver a la app (r: exp://, exps:// o
// salonbelleza://, validado contra una lista blanca). NO modifica nada: el estado real del
// pago lo registra el webhook y lo consulta la app con get_estado_pago_cita.
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: text/html; charset=utf-8');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'");
header('Referrer-Policy: no-referrer');

require_once __DIR__ . '/mercadopago.php';

$resultado = $_GET['resultado'] ?? '';
$urlApp = $_GET['r'] ?? '';
if (!urlRetornoAppValida($urlApp)) {
    $urlApp = '';
}

$mensajes = [
    'success' => ['¡Listo!', 'Recibimos tu pago. En unos segundos lo vas a ver confirmado en la app.'],
    'pending' => ['Pago en proceso', 'Mercado Pago está procesando tu pago. Te avisamos en la app cuando se confirme.'],
    'failure' => ['No se pudo completar el pago', 'No se realizó ningún cobro. Podés intentarlo de nuevo desde la app.'],
];
[$titulo, $texto] = $mensajes[$resultado] ?? ['Volvé a la app', 'Revisá el estado de tu pago en la app.'];

$e = fn($s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= $e($titulo) ?></title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #fff; color: #000;
         display: flex; min-height: 100vh; align-items: center; justify-content: center; }
  .caja { max-width: 360px; padding: 24px; text-align: center; }
  h1 { font-size: 22px; margin: 0 0 12px; }
  p { color: #444; line-height: 1.4; }
  a.boton { display: inline-block; margin-top: 16px; padding: 12px 20px; border-radius: 10px;
            background: #000; color: #fff; text-decoration: none; font-weight: 700; }
</style>
</head>
<body>
<div class="caja">
  <h1><?= $e($titulo) ?></h1>
  <p><?= $e($texto) ?></p>
  <?php if ($urlApp !== ''): ?>
    <a class="boton" href="<?= $e($urlApp) ?>">Volver a la app</a>
    <script>setTimeout(function () { window.location.href = <?= json_encode($urlApp, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>; }, 800);</script>
  <?php else: ?>
    <p>Ya podés cerrar esta ventana y volver a la app.</p>
  <?php endif; ?>
</div>
</body>
</html>
