<?php
// Catálogo de productos para el cliente: solo activos y con stock.
// GET index.php?action=get_productos
// No devuelve porcentajeGanancia (margen interno del salón).
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL);

const PRODUCTO_ACTIVO = 1;

try {
    require_once __DIR__ . '/../db.php';
    global $conn;

    $sql = "SELECT idProductos, nombreProducto, marca, descripcion, imagenUrl, precioVenta, stock
            FROM productos
            WHERE estado = ? AND stock > 0
            ORDER BY nombreProducto";
    $activo = PRODUCTO_ACTIVO;
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $activo);
    $stmt->execute();
    $result = $stmt->get_result();

    $productos = [];
    while ($row = $result->fetch_assoc()) {
        $row['idProductos'] = (int)$row['idProductos'];
        $row['precioVenta'] = (float)$row['precioVenta'];
        $row['stock'] = (int)$row['stock'];
        $productos[] = $row;
    }

    echo json_encode(['success' => true, 'data' => $productos]);
} catch (mysqli_sql_exception $e) {
    error_log('get_productos: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos al cargar los productos']);
}
?>
