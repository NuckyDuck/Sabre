/* Lecciones guiadas y referencia de comandos. */
(function (G) {
  'use strict';
  G.SABLESSONS = [
    {
      title: '1. Iniciar sesión y áreas de trabajo',
      text: 'Todo agente inicia sesión con su número (EPR). El sistema tiene 6 áreas de trabajo (A–F) independientes; cada una puede tener un PNR distinto.',
      steps: [['SI*1234', 'Iniciar sesión'], ['SI', 'Ver estado de la sesión'], ['HELP', 'Temas de ayuda']],
    },
    {
      title: '2. Codificar y decodificar',
      text: 'Antes de reservar se confirman los códigos IATA de ciudades, aeropuertos, aerolíneas y equipos.',
      steps: [['W/-CCMADRID', 'Código de la ciudad de Madrid'], ['W/*LHR', 'Decodificar aeropuerto'], ['W/-ALIBERIA', 'Código de aerolínea'], ['W/*AA', 'Decodificar aerolínea'], ['W/EQ*789', 'Decodificar equipo']],
    },
    {
      title: '3. Disponibilidad y venta',
      text: 'La disponibilidad muestra vuelos y asientos por clase (0–9). Se vende indicando cantidad, clase y línea. Las conexiones se venden juntas.',
      steps: [['1{FECHA}MIAMAD', 'Disponibilidad Miami–Madrid'], ['1*', 'Más opciones'], ['01Y1', 'Vender 1 asiento clase Y, línea 1'], ['1R{FECHA7}', 'Disponibilidad de regreso'], ['01M1', 'Vender el regreso en clase M'], ['*I', 'Ver itinerario']],
    },
    {
      title: '4. Construir el PNR',
      text: 'Un PNR requiere 5 elementos obligatorios: Nombre (-), Itinerario, Teléfono (9), Ticketing (7) y Recibido de (6). Al finalizar (E) se genera el localizador.',
      steps: [['-PEREZ/JUAN MR', 'Nombre'], ['9305-555-1234-A', 'Teléfono de agencia'], ['7TAW/', 'Campo de ticketing'], ['5CLIENTE CORPORATIVO', 'Observación'], ['PE‡JUAN@CORREO.COM‡', 'Email'], ['6JUAN', 'Recibido de'], ['ER', 'Finalizar y redesplegar']],
    },
    {
      title: '5. Servicios especiales y asientos',
      text: 'Los SSR comunican necesidades a la aerolínea (comidas, asistencia, APIS). Los asientos se asignan por segmento.',
      steps: [['3DOCS/P/USA/123456789/USA/12JUL80/M/20JUL30/PEREZ/JUAN-1.1', 'Datos APIS (pasaporte)'], ['3VGML1', 'Comida vegetariana segmento 1'], ['3OSI IB VIP CLIENTE FRECUENTE', 'OSI'], ['4G1*', 'Mapa de asientos'], ['4G1/22C', 'Asignar asiento 22C'], ['FFIB12345678-1.1', 'Viajero frecuente'], ['6JUAN§ER', 'Recibido y finalizar']],
    },
    {
      title: '6. Tarifas y price quote',
      text: 'WP cotiza la reserva tal como está. WPNC busca la clase más baja disponible y WPNCB la reserva. WPRQ guarda el Price Quote necesario para emitir.',
      steps: [['FQMIAMAD{FECHA}', 'Despliegue de tarifas'], ['RD1', 'Reglas de la tarifa línea 1'], ['WP', 'Cotizar'], ['WPNC', 'Mejor tarifa disponible'], ['WPNCB', 'Reservar la mejor tarifa'], ['WPRQ', 'Guardar Price Quote'], ['*PQ', 'Ver Price Quotes'], ['6JUAN§ER', 'Finalizar']],
    },
    {
      title: '7. Emisión de boletos',
      text: 'Con el PNR finalizado y un PQ guardado se emite el boleto electrónico indicando la forma de pago. Un boleto del mismo día se puede anular (void).',
      steps: [['W‡PQ1‡FCASH', 'Emitir en efectivo'], ['*T', 'Ver números de boleto'], ['WETR', 'Lista de boletos'], ['WETR*2', 'Detalle del boleto'], ['WV2', 'Anular el boleto del ítem 2']],
    },
    {
      title: '8. Recuperar, modificar y cancelar',
      text: 'Los PNR se recuperan por localizador o apellido. Toda modificación requiere un nuevo Recibido de (6) y finalizar.',
      steps: [['*-PEREZ', 'Buscar por apellido'], ['*R', 'Desplegar PNR'], ['91¤305-555-9999-H', 'Cambiar teléfono 1'], ['.1HK', 'Cambiar estatus segmento 1'], ['X2', 'Cancelar segmento 2'], ['*H', 'Historial'], ['I', 'Ignorar cambios']],
    },
    {
      title: '9. Hoteles y autos',
      text: 'Se pueden agregar segmentos de hotel y auto al mismo PNR (proveedores ficticios).',
      steps: [['HOTMAD/{FECHA}-{FECHA3}2', 'Hoteles en Madrid para 2'], ['HOD1', 'Descripción línea 1'], ['0H1', 'Reservar hotel'], ['CFMAD/{FECHA}-{FECHA3}/1000-1000', 'Autos en Madrid'], ['0C1', 'Reservar auto']],
    },
    {
      title: '10. Colas',
      text: 'Las colas son bandejas de trabajo de la oficina: cambios de horario, ticketing, seguimiento.',
      steps: [['QP/50', 'Colocar PNR en cola 50'], ['6JUAN§E', 'Finalizar (se coloca en la cola)'], ['QC/', 'Conteo de colas'], ['Q/50', 'Trabajar la cola 50'], ['QR', 'Remover y siguiente'], ['QXI', 'Salir de la cola']],
    },
    {
      title: '11. Utilidades',
      text: 'Herramientas de apoyo del agente.',
      steps: [['T‡MAD', 'Hora local en Madrid'], ['T‡{FECHA}‡90', 'Sumar 90 días'], ['T‡1250*0.1', 'Calculadora'], ['DC‡USD500/EUR', 'Conversión de moneda'], ['2IB921/{FECHA}', 'Información de vuelo'], ['S*MIAMAD', 'Horarios'], ['VI*', 'Detalle de vuelos del PNR']],
    },
  ];

  G.SABREF = [
    ['Sesión', [['SI*1234', 'Iniciar sesión'], ['SO*', 'Cerrar sesión'], ['HELP', 'Ayuda']]],
    ['Codificar', [['W/*MAD', 'Decodificar'], ['W/-CCMADRID', 'Codificar ciudad'], ['W/-APHEATHROW', 'Codificar aeropuerto'], ['W/-ALIBERIA', 'Codificar aerolínea'], ['W/EQ*789', 'Equipo']]],
    ['Disponibilidad', [['115DECMIAMAD', 'Por fecha y par de ciudades'], ['115DECMIAMAD9A', 'Desde una hora'], ['115DECMIAMAD‡IB', 'Por aerolínea'], ['1*', 'Más'], ['1R22DEC', 'Regreso'], ['S*MIAMAD', 'Horarios'], ['2IB921/15DEC', 'Info de vuelo']]],
    ['Venta', [['01Y1', 'Vender de disponibilidad'], ['02Y3Y4', 'Vender conexión'], ['01Y1LL', 'Lista de espera'], ['0IB921Y15DECMIAMADNN1', 'Venta directa'], ['0A', 'ARNK']]],
    ['PNR', [['-PEREZ/JUAN MR', 'Nombre'], ['-2GOMEZ/ANA MRS/LUIS MR', 'Varios nombres'], ['-ROJAS/PEDRO*C05', 'Niño'], ['-I/ROJAS/SOFIA*15JAN25', 'Infante'], ['9305-555-1234-A', 'Teléfono'], ['7TAW/', 'Ticketing'], ['6JUAN', 'Recibido'], ['5TEXTO', 'Observación'], ['5-CASH', 'Forma de pago'], ['PE‡A@B.COM‡', 'Email'], ['DK123456', 'Nº cliente']]],
    ['SSR / Asientos', [['3DOCS/P/USA/123/USA/12JUL80/M/20JUL30/PEREZ/JUAN-1.1', 'APIS'], ['3VGML1', 'Comida'], ['3WCHR1', 'Silla de ruedas'], ['3OSI IB TEXTO', 'OSI'], ['4G1*', 'Mapa'], ['4G1/12A', 'Asignar'], ['FFIB123456-1.1', 'Viajero frecuente']]],
    ['Desplegar', [['*R', 'PNR completo'], ['*I', 'Itinerario'], ['*N', 'Nombres'], ['*P9', 'Teléfonos'], ['*T', 'Ticketing'], ['*P3', 'SSR'], ['*P5', 'Observaciones'], ['*B', 'Asientos'], ['*H', 'Historial'], ['*-PEREZ', 'Buscar']]],
    ['Finalizar', [['E', 'Finalizar'], ['ER', 'Finalizar y redesplegar'], ['I', 'Ignorar'], ['IR', 'Ignorar y recuperar']]],
    ['Modificar', [['X2', 'Cancelar segmento'], ['XI', 'Cancelar itinerario'], ['.1HK', 'Cambiar estatus'], ['-1.1¤PEREZ/JUAN MR', 'Cambiar nombre'], ['92¤', 'Borrar teléfono'], ['D1', 'Dividir PNR']]],
    ['Tarifas', [['WP', 'Cotizar'], ['WPNC', 'Mejor tarifa'], ['WPNCB', 'Reservar mejor tarifa'], ['WPRQ', 'Guardar PQ'], ['WPP1ADT/1CNN', 'Por tipo pasajero'], ['*PQ', 'Ver PQ'], ['FQMIAMAD15DEC', 'Tarifas'], ['RD1', 'Reglas']]],
    ['Boletos', [['W‡PQ1‡FCASH', 'Emitir'], ['W‡F*VI4111111111111111‡12/28', 'Con tarjeta'], ['WETR', 'Lista'], ['WETR*2', 'Detalle'], ['WV2', 'Void'], ['WFR2', 'Reembolso']]],
    ['Hotel / Auto', [['HOTMAD/15DEC-18DEC2', 'Hoteles'], ['HOD1', 'Descripción'], ['0H1', 'Reservar'], ['CFMAD/15DEC-18DEC/1000-1000', 'Autos'], ['0C1', 'Reservar']]],
    ['Colas', [['QC/', 'Conteo'], ['QP/50', 'Colocar'], ['Q/50', 'Entrar'], ['QR', 'Remover'], ['QXI', 'Salir']]],
    ['Utilidades', [['T‡MAD', 'Hora local'], ['T‡15DEC‡30', 'Calcular fecha'], ['T‡100*1.16', 'Calculadora'], ['DC‡USD100/EUR', 'Moneda'], ['VI*', 'Detalle vuelos'], ['MD', 'Bajar pantalla'], ['MU', 'Subir pantalla']]],
  ];
})(window);
