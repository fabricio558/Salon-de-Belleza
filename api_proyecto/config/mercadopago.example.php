<?php
// PLANTILLA de la configuración de Mercado Pago. NO pongas credenciales en este archivo.
//
// Copialo a C:\xampp\salon_config\mercadopago.php (fuera de htdocs, así Apache no lo sirve
// y no entra al repo) y completalo. Lo lee api_proyecto/services/mercadopago.php.
return [
    // Access Token de la cuenta de prueba VENDEDOR (APP_USR-...). En Mercado Pago Developers:
    // iniciá sesión con la cuenta de prueba vendedor → Tus integraciones → tu app → Credenciales.
    'access_token' => '',

    // Clave secreta del webhook: Tus integraciones → tu app → Webhooks → Configurar notificaciones.
    'webhook_secret' => '',

    // URL pública HTTPS de la API (ngrok), sin barra final. Ejemplo:
    // https://xxxx.ngrok-free.dev/salonBelleza/api_proyecto
    'public_base_url' => '',

    // Opcional: lo que aparece en el resumen de la tarjeta (hasta 22 caracteres).
    'statement_descriptor' => 'SALON MANDALA',
];
