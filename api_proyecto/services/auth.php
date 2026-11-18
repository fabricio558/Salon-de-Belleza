<?php
// Sesiones por token y contraseñas. No es un endpoint: no la registres en router.php.
//
// El login (login.php) crea una sesión y le devuelve a la app un token aleatorio.
// La app lo manda en cada pedido en el header X-Session-Token (no se usa
// Authorization porque Apache/XAMPP a veces lo descarta antes de llegar a PHP).
// En la tabla `sesiones` (migración 005) solo se guarda el SHA-256 del token.

const DURACION_SESION_DIAS = 30;
const ROL_CLIENTE_AUTH = 1;
const ROL_ESTILISTA_AUTH = 2;
const ROL_RECEPCIONISTA_AUTH = 3;

function leerTokenSesion() {
    $token = $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
    return preg_match('/^[a-f0-9]{64}$/', $token) ? $token : '';
}

// Crea la sesión y devuelve el token en claro (es la única vez que se conoce).
function crearSesion($conn, $idUsuario) {
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $dias = DURACION_SESION_DIAS;
    $stmt = $conn->prepare("INSERT INTO sesiones (usuarios_idUsuarios, tokenHash, expiraEl)
                            VALUES (?, ?, NOW() + INTERVAL ? DAY)");
    $stmt->bind_param("isi", $idUsuario, $hash, $dias);
    $stmt->execute();
    return $token;
}

function revocarSesion($conn, $token) {
    $hash = hash('sha256', $token);
    $stmt = $conn->prepare("UPDATE sesiones SET revocadaEl = NOW() WHERE tokenHash = ? AND revocadaEl IS NULL");
    $stmt->bind_param("s", $hash);
    $stmt->execute();
}

// ['idUsuarios' => int, 'idRol' => int] del usuario de la sesión, o null si no hay
// sesión válida (sin token, vencida, revocada o usuario inactivo).
function usuarioDeSesion($conn) {
    $token = leerTokenSesion();
    if ($token === '') {
        return null;
    }
    $hash = hash('sha256', $token);
    $stmt = $conn->prepare("SELECT u.idUsuarios, u.idRol
                            FROM sesiones s
                            INNER JOIN usuarios u ON u.idUsuarios = s.usuarios_idUsuarios
                            WHERE s.tokenHash = ? AND s.revocadaEl IS NULL AND s.expiraEl > NOW()
                              AND u.estado = 1");
    $stmt->bind_param("s", $hash);
    $stmt->execute();
    $fila = $stmt->get_result()->fetch_assoc();
    if (!$fila) {
        return null;
    }
    return ['idUsuarios' => (int)$fila['idUsuarios'], 'idRol' => (int)$fila['idRol']];
}

// Igual que usuarioDeSesion pero responde 401 y termina si no hay sesión válida.
// `sesionInvalida` le indica a la app que tiene que volver a iniciar sesión.
function requerirSesion($conn, $rolesPermitidos = null) {
    $usuario = usuarioDeSesion($conn);
    if (!$usuario) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'sesionInvalida' => true,
            'message' => 'Tu sesión expiró. Volvé a iniciar sesión.',
        ]);
        exit;
    }
    if ($rolesPermitidos !== null && !in_array($usuario['idRol'], $rolesPermitidos, true)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tenés permiso para esta acción.']);
        exit;
    }
    return $usuario;
}

function hashearContrasena($contrasena) {
    return password_hash($contrasena, PASSWORD_DEFAULT);
}

// Verifica la contraseña ingresada contra la guardada. Las contraseñas viejas están
// en texto plano: si coincide, se reemplaza por su hash en ese momento, así se
// migran solas a medida que la gente inicia sesión.
function verificarContrasena($conn, $idUsuario, $guardada, $ingresada) {
    $guardada = (string)$guardada;
    if (password_get_info($guardada)['algo'] !== null) {
        if (!password_verify($ingresada, $guardada)) {
            return false;
        }
        if (password_needs_rehash($guardada, PASSWORD_DEFAULT)) {
            guardarContrasena($conn, $idUsuario, $ingresada);
        }
        return true;
    }
    if ($guardada === '' || !hash_equals($guardada, $ingresada)) {
        return false;
    }
    guardarContrasena($conn, $idUsuario, $ingresada);
    return true;
}

function guardarContrasena($conn, $idUsuario, $contrasena) {
    $hash = hashearContrasena($contrasena);
    $stmt = $conn->prepare("UPDATE usuarios SET contrasena = ? WHERE idUsuarios = ?");
    $stmt->bind_param("si", $hash, $idUsuario);
    $stmt->execute();
}
?>
