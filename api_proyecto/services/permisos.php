<?php
// Verificación de permisos compartida. No es un endpoint: no la registres en router.php.
//
// OJO: la API no tiene autenticación por token. El id del solicitante lo manda la app
// desde su sesión, así que esto evita errores de uso pero no frena a alguien que arme
// la petición a mano.

const ROL_RECEPCIONISTA = 3;

// true si el usuario existe, está activo y tiene rol recepcionista.
function esRecepcionista($conn, $idUsuario) {
    $stmt = $conn->prepare("SELECT 1 FROM usuarios WHERE idUsuarios = ? AND idRol = ? AND estado = 1");
    $rol = ROL_RECEPCIONISTA;
    $stmt->bind_param("ii", $idUsuario, $rol);
    $stmt->execute();
    return (bool)$stmt->get_result()->fetch_row();
}

function responderSinPermiso($mensaje = 'No tenés permiso para gestionar usuarios.') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => $mensaje]);
    exit;
}
?>
