<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php'; 
global $conn;

// Obtener los datos JSON enviados desde React Native
$input = json_decode(file_get_contents('php://input'), true);

$idClientes       = isset($input['idClientes']) ? intval($input['idClientes']) : 0;
$nombres          = isset($input['nombres']) ? trim($input['nombres']) : '';
$apellido         = isset($input['apellido']) ? trim($input['apellido']) : '';
$correo           = isset($input['correo']) ? trim($input['correo']) : '';
$contrasena       = isset($input['contrasena']) ? trim($input['contrasena']) : '';
$fechaNacimiento  = isset($input['fechaNacimiento']) ? trim($input['fechaNacimiento']) : null;
$notaAlergias     = isset($input['notaAlergias']) ? trim($input['notaAlergias']) : '';
$notaPreferencias = isset($input['notaPreferencias']) ? trim($input['notaPreferencias']) : '';

if ($idClientes <= 0) {
    echo json_encode([
        'success' => false, 
        'message' => 'ID de cliente inválido'
    ]);
    exit;
}

try {
    // Iniciamos una transacción para actualizar ambas tablas de manera segura
    $conn->begin_transaction();

    // 1. Actualizar los datos principales en la tabla 'usuarios'
    $sqlUsuarios = "UPDATE usuarios SET nombres = ?, apellido = ?, correo = ?, contrasena = ?, fechaNacimiento = ? WHERE idUsuarios = ?";
    $stmtU = $conn->prepare($sqlUsuarios);
    $stmtU->bind_param("sssssi", $nombres, $apellido, $correo, $contrasena, $fechaNacimiento, $idClientes);
    $stmtU->execute();

    // 2. Actualizar las notas específicas en la tabla 'clientes'
    $sqlClientes = "UPDATE clientes SET notaAlergias = ?, notaPreferencias = ? WHERE idClientes = ?";
    $stmtC = $conn->prepare($sqlClientes);
    $stmtC->bind_param("ssi", $notaAlergias, $notaPreferencias, $idClientes);
    $stmtC->execute();

    // Confirmar los cambios en la base de datos
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Perfil actualizado correctamente'
    ]);

} catch (Exception $e) {
    // Si ocurre algún error, revertimos los cambios para no corromper la BD
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar: ' . $e->getMessage()
    ]);
}
?>