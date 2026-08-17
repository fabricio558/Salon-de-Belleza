<?php

include 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$nombres = $data['nombres'];
$apellido = $data['apellido'];
$nombreUsuario = $data['nombreUsuario'];
$fechaNacimiento = $data['fechaNacimiento'];
$correo = $data['correo'];

$sql = "INSERT INTO usuarios (nombres, apellido, nombreUsuario, fechaNacimiento, correo) VALUES ('$nombres', '$apellido', '$nombreUsuario', '$fechaNacimiento', '$correo')";

if ($conn->query($sql) == TRUE) {
    echo json_encode(array('massage' => 'Usuario creado con exito'));
}else{
    echo json_encode(array('massage' => 'Error al crear el usuario'. $conn->error));
}

?>