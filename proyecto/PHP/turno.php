<?php
session_start();
require("conexion.php");
$idUsuario=$_SESSION['idUsuarios'];
$idEstilista= (int)$_POST['idEstilista'];
$servicio= (int)$_POST['idServicio'];
$fecha= $_POST['fecha'];
$horainicio=$_POST['horaInicio'];
$horafin=$_POST['horaFin'];
$fechaHora= $fecha . ' ' . $horainicio . ':00';
$horaFin2= $fecha . ' ' . $horafin . ':00';
$sql="INSERT INTO citas (fechaHora, estado_cita_idEstado, clientes, estilistas, horaInicio, horaFin) VALUES ('$fechaHora',1,'$idUsuario','$idEstilista','$fechaHora','$horaFin2')";
$mandar=$mysqli->query($sql);
$sql2="INSERT INTO estilistas_servicios (idUsuarios, idServicios) VALUES ('$idEstilista','$servicio')";
$enviar=$mysqli->query($sql2);
echo '<script language=javascript>
alert ("turno registrado")
self.location = "../../proyecto/PHP/cliente.php"
</script>';
?>