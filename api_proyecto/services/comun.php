<?php
// Utilidades comunes a los endpoints. No es un endpoint: no la registres en router.php.

// Lee el body JSON. Si no es JSON válido (por ejemplo, texto que no está en UTF-8)
// responde el error y termina, para no confundirlo con "faltan datos".
function leerJsonBody() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        echo json_encode(['success' => false, 'message' => 'Los datos enviados no son válidos (JSON en UTF-8).']);
        exit;
    }
    return $input;
}
?>
