<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../db.php'; 

global $conn;

$input = json_decode(file_get_contents('php://input'), true);

$correo = $input['correo'] ?? '';
$contrasena = $input['contrasena'] ?? '';

if (empty($correo) || empty($contrasena)) {
    echo json_encode([
        'success' => false,
        'message' => 'Por favor complete todos los campos.'
    ]);
    exit;
}

if (!isset($conn) || $conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: No se pudo cargar la variable $conn. Verifica la ruta de db.php'
    ]);
    exit;
}

$sql = "SELECT idUsuarios, nombres, apellido, idRol FROM usuarios WHERE correo = ? AND contrasena = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $correo, $contrasena);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        'success' => true,
        'message' => 'Inicio de Sesión completado con éxito',
        'data' => [
            'idUsuarios'    => $row['idUsuarios'], 
            'idEstilistas'  => $row['idUsuarios'], 
            'nombres'       => $row['nombres'],
            'apellido'      => $row['apellido'],
            'idRol'         => $row['idRol']
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Correo o contraseña incorrectos.'
    ]);
}
?>