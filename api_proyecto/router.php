<?php
// Deriva cada pedido a services/<archivo>.php según el método HTTP y ?action=.
// Se usa a través de index.php (que agrega CORS y JSON). Una acción desconocida
// responde 404: no hay destino por defecto.

$rutasGet = [
    'get_citas'                => 'get_citas.php',
    'get_cliente'              => 'get_clientes.php',
    'get_clientes'             => 'get_clientes.php',
    'get_servicios'            => 'get_servicios.php',
    'get_estilistas'           => 'get_estilistas.php',
    'get_estilista'            => 'get_estilista.php',
    'get_citas_dia'            => 'get_citas_dia.php',
    'get_citas_semana'         => 'get_citas_semana.php',
    'get_citasDiarias'         => 'get_citasDiarias.php',
    'get_citasSemanal'         => 'get_citasSemanal.php',
    'get_usuarios'             => 'get_usuarios.php',
    'get_perfil_recepcionista' => 'get_perfil_recepcionista.php',
    'get_citas_cliente'        => 'get_citas_cliente.php',
    'get_clientes_lista'       => 'get_clientes_lista.php',
    'get_productos'            => 'get_productos.php',
    'get_pedidos_cliente'      => 'get_pedidos_cliente.php',
    'get_estado_pago_cita'     => 'get_estado_pago_cita.php',
    'get_medios_pago'          => 'get_medios_pago.php',
    'get_estado_pago_pedido'   => 'get_estado_pago_pedido.php',
    'get_pagos_pendientes'     => 'get_pagos_pendientes.php',
    'get_disponibilidad'       => 'get_disponibilidad.php',
    'get_pedidos_salon'        => 'get_pedidos_salon.php',
    'retorno_pago'             => 'retorno_pago.php',
];

$rutasPost = [
    'login'                       => 'login.php',
    'logout'                      => 'logout.php',
    'crear_cita'                  => 'crear_cita.php',
    'iniciar_servicio'            => 'iniciar_servicio.php',
    'finalizar_servicio'          => 'finalizar_servicio.php',
    'update_servicios_cita'       => 'update_servicios_cita.php',
    'registrar_usuario'           => 'registrar_usuario.php',
    'update_rol_usuario'          => 'update_rol_usuario.php',
    'update_perfil_recepcionista' => 'update_perfil_recepcionista.php',
    'update_contrasena'           => 'update_contrasena.php',
    'update_cliente'              => 'update_cliente.php',
    'update_estilista'            => 'update_estilista.php',
    'cancelar_cita'               => 'cancelar_cita.php',
    'reprogramar_cita'            => 'reprogramar_cita.php',
    'cancelar_cita_salon'         => 'cancelar_cita_salon.php',
    'reprogramar_cita_salon'      => 'reprogramar_cita_salon.php',
    'crear_pedido'                => 'crear_pedido.php',
    'cancelar_pedido'             => 'cancelar_pedido.php',
    'crear_preferencia_cita'      => 'crear_preferencia_cita.php',
    'registrar_cobro_cita'        => 'registrar_cobro_cita.php',
    'crear_preferencia_pedido'    => 'crear_preferencia_pedido.php',
    'elegir_pago_local'           => 'elegir_pago_local.php',
    'entregar_pedido'             => 'entregar_pedido.php',
    'webhook_mp'                  => 'webhook_mp.php',
];

$metodo = $_SERVER['REQUEST_METHOD'] ?? '';
$action = isset($_GET['action']) ? (string)$_GET['action'] : '';

$rutas = $metodo === 'GET' ? $rutasGet : ($metodo === 'POST' ? $rutasPost : []);

if ($action !== '' && isset($rutas[$action])) {
    include __DIR__ . '/services/' . $rutas[$action];
} else {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'Acción no encontrada.']);
}
?>
