<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php'; 
global $conn;

$input = json_decode(file_get_contents('php://input'), true);

$idEstilistas     = isset($input['idEstilistas']) ? intval($input['idEstilistas']) : 0;
$nombres          = isset($input['nombres']) ? trim($input['nombres']) : '';
$apellido         = isset($input['apellido']) ? trim($input['apellido']) : '';
$correo           = isset($input['correo']) ? trim($input['correo']) : '';
$contrasena       = isset($input['contrasena']) ? trim($input['contrasena']) : '';
$fechaNacimiento  = isset($input['fechaNacimiento']) ? trim($input['fechaNacimiento']) : null;
$horaEntrada      = isset($input['horaEntrada']) ? trim($input['horaEntrada']) : null;
$horaSalida       = isset($input['horaSalida']) ? trim($input['horaSalida']) : null;

if ($idEstilistas <= 0) {
    echo json_encode([
        'success' => false, 
        'message' => 'ID de estilista inválido'
    ]);
    exit;
}

try {
    $conn->begin_transaction();

    // 1. Actualizar datos principales en la tabla 'usuarios'
    $sqlUsuarios = "UPDATE usuarios SET nombres = ?, apellido = ?, correo = ?, contrasena = ?, fechaNacimiento = ? WHERE idUsuarios = ?";
    $stmtU = $conn->prepare($sqlUsuarios);
    $stmtU->bind_param("sssssi", $nombres, $apellido, $correo, $contrasena, $fechaNacimiento, $idEstilistas);
    $stmtU->execute();

    // 2. Actualizar horarios en la tabla 'estilistas'
    $sqlEstilistas = "UPDATE estilistas SET horaEntrada = ?, horaSalida = ? WHERE idEstilistas = ?";
    $stmtE = $conn->prepare($sqlEstilistas);
    $stmtE->bind_param("ssi", $horaEntrada, $horaSalida, $idEstilistas);
    $stmtE->execute();

    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Perfil de estilista actualizado correctamente'
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar: ' . $e->getMessage()
    ]);
}
?>