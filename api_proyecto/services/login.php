<?php

include 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['correo']) || !isset($data['contrasena'])){
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit();
}

$correo = $conn->real_escape_string($data['correo']);
$contrasena = $data['contrasena'];

$sql = "SELECT * FROM usuarios WHERE correo = '$correo'";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $usuario = $result->fetch_assoc();

    if ($contrasena === $usuario['contrasena']){
        echo json_encode(['success' => true, 'message' => 'Inicio de Sesión completado con exito']);
    }else{
        echo json_encode(['success' => false, 'message' => 'Contraseña Incorrecta']);
    }
    }else{
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    }
?>