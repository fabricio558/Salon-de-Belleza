import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const imprimirFacturaPdf = async (datosCita) => {
  const {
    idCitas,
    nombreCliente,
    nombreEstilista,
    fecha,
    servicios, // Array con [{ servicio, cantidad, precio }]
    total
  } = datosCita;

  // 1. Diseñar el HTML de la factura
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
        .subtitulo { font-size: 12px; color: #666; margin-top: 4px; }
        .info-resumen { margin-bottom: 20px; width: 100%; border-collapse: collapse; }
        .info-resumen td { padding: 4px 0; font-size: 14px; }
        .tabla-servicios { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .tabla-servicios th { background-color: #000; color: #fff; text-align: left; padding: 8px; font-size: 12px; text-transform: uppercase; }
        .tabla-servicios td { border-bottom: 1px solid #ddd; padding: 10px 8px; font-size: 13px; }
        .total-container { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
        .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #888; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">MANDALA</div>
        <div class="subtitulo">Salón de Belleza - Comprobante de Servicio</div>
      </div>

      <table class="info-resumen">
        <tr>
          <td><strong>N° de Turno / Cita:</strong> #${idCitas}</td>
          <td><strong>Fecha:</strong> ${fecha}</td>
        </tr>
        <tr>
          <td><strong>Cliente:</strong> ${nombreCliente}</td>
          <td><strong>Estilista:</strong> ${nombreEstilista}</td>
        </tr>
      </table>

      <table class="tabla-servicios">
        <thead>
          <tr>
            <th>Servicio</th>
            <th style="text-align: center;">Cant.</th>
            <th style="text-align: right;">Precio Unit.</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${servicios.map(s => `
            <tr>
              <td>${s.servicio}</td>
              <td style="text-align: center;">${s.cantidad}</td>
              <td style="text-align: right;">$${parseFloat(s.precio).toFixed(2)}</td>
              <td style="text-align: right;">$${(s.cantidad * parseFloat(s.precio)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-container">
        <span>TOTAL APAGAR: $${parseFloat(total).toFixed(2)}</span>
      </div>

      <div class="footer">
        <p>¡Gracias por elegir Mandala Salón de Belleza!</p>
      </div>
    </body>
    </html>
  `;

  try {
    // 2. Generar archivo PDF temporal
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // 3. Abrir menú para compartir/guardar o mandar a imprimir
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Factura Cita #${idCitas}`
      });
    } else {
      // Si se prefiere mandar directo a la impresora térmica/inalámbrica conectada:
      await Print.printAsync({ uri });
    }
  } catch (error) {
    console.error("Error al generar PDF de la factura:", error);
  }
};