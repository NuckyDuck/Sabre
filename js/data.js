/* Datos de referencia del simulador (ficticios / con fines educativos). */
(function (G) {
  'use strict';

  // code: [ciudad, aeropuerto, pais, lat, lon, utcOffset, codigoCiudad]
  const AIRPORTS = {
    ATL: ['ATLANTA', 'HARTSFIELD-JACKSON INTL', 'US', 33.64, -84.43, -5],
    BOS: ['BOSTON', 'LOGAN INTL', 'US', 42.36, -71.01, -5],
    CLT: ['CHARLOTTE', 'DOUGLAS INTL', 'US', 35.21, -80.94, -5],
    DFW: ['DALLAS/FORT WORTH', 'DFW INTL', 'US', 32.9, -97.04, -6],
    DEN: ['DENVER', 'DENVER INTL', 'US', 39.86, -104.67, -7],
    DTW: ['DETROIT', 'METROPOLITAN WAYNE CO', 'US', 42.21, -83.35, -5, 'DTT'],
    IAH: ['HOUSTON', 'GEORGE BUSH INTCNTL', 'US', 29.98, -95.34, -6, 'HOU'],
    LAS: ['LAS VEGAS', 'HARRY REID INTL', 'US', 36.08, -115.15, -8],
    LAX: ['LOS ANGELES', 'LOS ANGELES INTL', 'US', 33.94, -118.41, -8],
    MCO: ['ORLANDO', 'ORLANDO INTL', 'US', 28.43, -81.31, -5],
    MIA: ['MIAMI', 'MIAMI INTL', 'US', 25.79, -80.29, -5],
    MSP: ['MINNEAPOLIS', 'MINNEAPOLIS/ST PAUL INTL', 'US', 44.88, -93.22, -6],
    JFK: ['NEW YORK', 'JOHN F KENNEDY INTL', 'US', 40.64, -73.78, -5, 'NYC'],
    LGA: ['NEW YORK', 'LAGUARDIA', 'US', 40.78, -73.87, -5, 'NYC'],
    EWR: ['NEWARK', 'NEWARK LIBERTY INTL', 'US', 40.69, -74.17, -5, 'NYC'],
    ORD: ['CHICAGO', "O'HARE INTL", 'US', 41.98, -87.9, -6, 'CHI'],
    PHX: ['PHOENIX', 'SKY HARBOR INTL', 'US', 33.43, -112.01, -7],
    SEA: ['SEATTLE', 'SEATTLE/TACOMA INTL', 'US', 47.45, -122.31, -8],
    SFO: ['SAN FRANCISCO', 'SAN FRANCISCO INTL', 'US', 37.62, -122.38, -8],
    SLC: ['SALT LAKE CITY', 'SALT LAKE CITY INTL', 'US', 40.79, -111.98, -7],
    IAD: ['WASHINGTON', 'DULLES INTL', 'US', 38.95, -77.46, -5, 'WAS'],
    YYZ: ['TORONTO', 'PEARSON INTL', 'CA', 43.68, -79.63, -5, 'YTO'],
    YUL: ['MONTREAL', 'TRUDEAU INTL', 'CA', 45.47, -73.74, -5, 'YMQ'],
    YVR: ['VANCOUVER', 'VANCOUVER INTL', 'CA', 49.19, -123.18, -8],
    MEX: ['MEXICO CITY', 'BENITO JUAREZ INTL', 'MX', 19.44, -99.07, -6],
    CUN: ['CANCUN', 'CANCUN INTL', 'MX', 21.04, -86.87, -5],
    GDL: ['GUADALAJARA', 'MIGUEL HIDALGO INTL', 'MX', 20.52, -103.31, -6],
    MTY: ['MONTERREY', 'MARIANO ESCOBEDO INTL', 'MX', 25.78, -100.11, -6],
    TIJ: ['TIJUANA', 'ABELARDO RODRIGUEZ INTL', 'MX', 32.54, -116.97, -8],
    GUA: ['GUATEMALA CITY', 'LA AURORA', 'GT', 14.58, -90.53, -6],
    SAL: ['SAN SALVADOR', 'MONSENOR ROMERO INTL', 'SV', 13.44, -89.06, -6],
    SJO: ['SAN JOSE', 'JUAN SANTAMARIA INTL', 'CR', 9.99, -84.2, -6],
    PTY: ['PANAMA CITY', 'TOCUMEN INTL', 'PA', 9.07, -79.38, -5],
    HAV: ['HAVANA', 'JOSE MARTI INTL', 'CU', 22.99, -82.41, -5],
    SDQ: ['SANTO DOMINGO', 'LAS AMERICAS INTL', 'DO', 18.43, -69.67, -4],
    PUJ: ['PUNTA CANA', 'PUNTA CANA INTL', 'DO', 18.57, -68.36, -4],
    SJU: ['SAN JUAN', 'LUIS MUNOZ MARIN INTL', 'PR', 18.44, -66.0, -4],
    BOG: ['BOGOTA', 'EL DORADO INTL', 'CO', 4.7, -74.15, -5],
    MDE: ['MEDELLIN', 'JOSE MARIA CORDOVA', 'CO', 6.16, -75.42, -5],
    CTG: ['CARTAGENA', 'RAFAEL NUNEZ INTL', 'CO', 10.44, -75.51, -5],
    CCS: ['CARACAS', 'SIMON BOLIVAR INTL', 'VE', 10.6, -66.99, -4],
    UIO: ['QUITO', 'MARISCAL SUCRE INTL', 'EC', -0.13, -78.36, -5],
    GYE: ['GUAYAQUIL', 'JOSE JOAQUIN DE OLMEDO', 'EC', -2.16, -79.88, -5],
    LIM: ['LIMA', 'JORGE CHAVEZ INTL', 'PE', -12.02, -77.11, -5],
    CUZ: ['CUSCO', 'VELASCO ASTETE', 'PE', -13.54, -71.94, -5],
    LPB: ['LA PAZ', 'EL ALTO INTL', 'BO', -16.51, -68.19, -4],
    SCL: ['SANTIAGO', 'ARTURO MERINO BENITEZ', 'CL', -33.39, -70.79, -4],
    EZE: ['BUENOS AIRES', 'MINISTRO PISTARINI', 'AR', -34.82, -58.54, -3, 'BUE'],
    AEP: ['BUENOS AIRES', 'JORGE NEWBERY', 'AR', -34.56, -58.42, -3, 'BUE'],
    MVD: ['MONTEVIDEO', 'CARRASCO INTL', 'UY', -34.84, -56.03, -3],
    ASU: ['ASUNCION', 'SILVIO PETTIROSSI INTL', 'PY', -25.24, -57.52, -3],
    GRU: ['SAO PAULO', 'GUARULHOS INTL', 'BR', -23.43, -46.47, -3, 'SAO'],
    GIG: ['RIO DE JANEIRO', 'GALEAO INTL', 'BR', -22.81, -43.25, -3, 'RIO'],
    MAD: ['MADRID', 'ADOLFO SUAREZ BARAJAS', 'ES', 40.47, -3.56, 1],
    BCN: ['BARCELONA', 'EL PRAT', 'ES', 41.3, 2.08, 1],
    AGP: ['MALAGA', 'COSTA DEL SOL', 'ES', 36.67, -4.49, 1],
    PMI: ['PALMA DE MALLORCA', 'SON SANT JOAN', 'ES', 39.55, 2.74, 1],
    LIS: ['LISBON', 'HUMBERTO DELGADO', 'PT', 38.77, -9.13, 0],
    LHR: ['LONDON', 'HEATHROW', 'GB', 51.47, -0.45, 0, 'LON'],
    LGW: ['LONDON', 'GATWICK', 'GB', 51.15, -0.18, 0, 'LON'],
    CDG: ['PARIS', 'CHARLES DE GAULLE', 'FR', 49.01, 2.55, 1, 'PAR'],
    ORY: ['PARIS', 'ORLY', 'FR', 48.72, 2.38, 1, 'PAR'],
    AMS: ['AMSTERDAM', 'SCHIPHOL', 'NL', 52.31, 4.76, 1],
    FRA: ['FRANKFURT', 'FRANKFURT INTL', 'DE', 50.03, 8.57, 1],
    MUC: ['MUNICH', 'FRANZ JOSEF STRAUSS', 'DE', 48.35, 11.79, 1],
    FCO: ['ROME', 'FIUMICINO', 'IT', 41.8, 12.25, 1, 'ROM'],
    MXP: ['MILAN', 'MALPENSA', 'IT', 45.63, 8.72, 1, 'MIL'],
    ZRH: ['ZURICH', 'ZURICH', 'CH', 47.46, 8.55, 1],
    IST: ['ISTANBUL', 'ISTANBUL', 'TR', 41.26, 28.74, 3],
    DXB: ['DUBAI', 'DUBAI INTL', 'AE', 25.25, 55.36, 4],
    DOH: ['DOHA', 'HAMAD INTL', 'QA', 25.27, 51.61, 3],
    NRT: ['TOKYO', 'NARITA INTL', 'JP', 35.77, 140.39, 9, 'TYO'],
    HND: ['TOKYO', 'HANEDA', 'JP', 35.55, 139.78, 9, 'TYO'],
    ICN: ['SEOUL', 'INCHEON INTL', 'KR', 37.46, 126.44, 9, 'SEL'],
    PEK: ['BEIJING', 'CAPITAL INTL', 'CN', 40.08, 116.58, 8, 'BJS'],
    HKG: ['HONG KONG', 'HONG KONG INTL', 'HK', 22.31, 113.91, 8],
    SIN: ['SINGAPORE', 'CHANGI', 'SG', 1.36, 103.99, 8],
    SYD: ['SYDNEY', 'KINGSFORD SMITH', 'AU', -33.95, 151.18, 10],
    JNB: ['JOHANNESBURG', 'O R TAMBO INTL', 'ZA', -26.14, 28.24, 2],
    CAI: ['CAIRO', 'CAIRO INTL', 'EG', 30.12, 31.41, 2],
  };

  const COUNTRIES = {
    US: 'UNITED STATES', CA: 'CANADA', MX: 'MEXICO', GT: 'GUATEMALA', SV: 'EL SALVADOR',
    CR: 'COSTA RICA', PA: 'PANAMA', CU: 'CUBA', DO: 'DOMINICAN REPUBLIC', PR: 'PUERTO RICO',
    CO: 'COLOMBIA', VE: 'VENEZUELA', EC: 'ECUADOR', PE: 'PERU', BO: 'BOLIVIA', CL: 'CHILE',
    AR: 'ARGENTINA', UY: 'URUGUAY', PY: 'PARAGUAY', BR: 'BRAZIL', ES: 'SPAIN', PT: 'PORTUGAL',
    GB: 'UNITED KINGDOM', FR: 'FRANCE', NL: 'NETHERLANDS', DE: 'GERMANY', IT: 'ITALY',
    CH: 'SWITZERLAND', TR: 'TURKIYE', AE: 'UNITED ARAB EMIRATES', QA: 'QATAR', JP: 'JAPAN',
    KR: 'KOREA REPUBLIC OF', CN: 'CHINA', HK: 'HONG KONG SAR', SG: 'SINGAPORE', AU: 'AUSTRALIA',
    ZA: 'SOUTH AFRICA', EG: 'EGYPT',
  };

  // code: [nombre, prefijo numerico de boleto, hubs, alcance max km, equipos]
  const AIRLINES = {
    AA: ['AMERICAN AIRLINES', '001', ['DFW', 'MIA', 'CLT', 'ORD', 'JFK', 'PHX'], 14000, ['738', '321', '789', '77W']],
    DL: ['DELTA AIR LINES', '006', ['ATL', 'JFK', 'MSP', 'DTW', 'LAX', 'SLC'], 14000, ['739', '321', '339', '359']],
    UA: ['UNITED AIRLINES', '016', ['ORD', 'EWR', 'IAH', 'DEN', 'SFO', 'IAD'], 14000, ['739', '320', '789', '77W']],
    B6: ['JETBLUE AIRWAYS', '279', ['JFK', 'BOS'], 6000, ['320', '32N']],
    AC: ['AIR CANADA', '014', ['YYZ', 'YUL', 'YVR'], 13000, ['32N', '7M8', '789']],
    AM: ['AEROMEXICO', '139', ['MEX'], 12000, ['7M8', '738', '789']],
    Y4: ['VOLARIS', '036', ['GDL', 'TIJ', 'MEX'], 4500, ['32N', '320']],
    CM: ['COPA AIRLINES', '230', ['PTY'], 7000, ['738', '7M9']],
    AV: ['AVIANCA', '134', ['BOG', 'SAL'], 9500, ['320', '32N', '788']],
    LA: ['LATAM AIRLINES', '045', ['LIM', 'SCL', 'GRU'], 12000, ['320', '32N', '763', '789']],
    AR: ['AEROLINEAS ARGENTINAS', '044', ['EZE', 'AEP'], 11000, ['738', '332']],
    G3: ['GOL LINHAS AEREAS', '127', ['GRU', 'GIG'], 6500, ['738', '7M8']],
    IB: ['IBERIA', '075', ['MAD'], 11000, ['320', '32N', '332', '359']],
    UX: ['AIR EUROPA', '996', ['MAD'], 10000, ['738', '789']],
    VY: ['VUELING AIRLINES', '030', ['BCN'], 3500, ['320', '32N']],
    BA: ['BRITISH AIRWAYS', '125', ['LHR'], 14000, ['320', '351', '77W', '388']],
    AF: ['AIR FRANCE', '057', ['CDG'], 14000, ['320', '359', '77W']],
    KL: ['KLM ROYAL DUTCH', '074', ['AMS'], 14000, ['73H', '789', '77W']],
    LH: ['LUFTHANSA', '220', ['FRA', 'MUC'], 14000, ['32N', '359', '744']],
    TP: ['TAP AIR PORTUGAL', '047', ['LIS'], 9500, ['32N', '339']],
    TK: ['TURKISH AIRLINES', '235', ['IST'], 14000, ['321', '333', '77W']],
    EK: ['EMIRATES', '176', ['DXB'], 15000, ['77W', '388']],
    QR: ['QATAR AIRWAYS', '157', ['DOH'], 15000, ['320', '359', '77W']],
    JL: ['JAPAN AIRLINES', '131', ['HND', 'NRT'], 14000, ['738', '789', '359']],
    NH: ['ALL NIPPON AIRWAYS', '205', ['HND', 'NRT'], 14000, ['738', '789', '77W']],
    KE: ['KOREAN AIR', '180', ['ICN'], 14000, ['333', '77W', '388']],
    CX: ['CATHAY PACIFIC', '160', ['HKG'], 15000, ['333', '359', '77W']],
    SQ: ['SINGAPORE AIRLINES', '618', ['SIN'], 16000, ['359', '77W', '388']],
    QF: ['QANTAS', '081', ['SYD'], 15000, ['738', '789', '388']],
  };

  // equipo: [descripcion, filas premium, filas economica, layout premium, layout eco]
  const EQUIPMENT = {
    '738': ['BOEING 737-800', 4, 26, 'AC DF', 'ABC DEF'],
    '739': ['BOEING 737-900', 5, 28, 'AC DF', 'ABC DEF'],
    '73H': ['BOEING 737-800 WINGLETS', 4, 26, 'AC DF', 'ABC DEF'],
    '7M8': ['BOEING 737 MAX 8', 4, 27, 'AC DF', 'ABC DEF'],
    '7M9': ['BOEING 737 MAX 9', 4, 29, 'AC DF', 'ABC DEF'],
    '320': ['AIRBUS A320', 3, 25, 'AC DF', 'ABC DEF'],
    '32N': ['AIRBUS A320NEO', 3, 27, 'AC DF', 'ABC DEF'],
    '321': ['AIRBUS A321', 5, 30, 'AC DF', 'ABC DEF'],
    '332': ['AIRBUS A330-200', 6, 32, 'AC DG HK', 'ABC DEFG HJK'],
    '333': ['AIRBUS A330-300', 7, 35, 'AC DG HK', 'ABC DEFG HJK'],
    '339': ['AIRBUS A330-900NEO', 7, 34, 'AC DG HK', 'ABC DEFG HJK'],
    '359': ['AIRBUS A350-900', 8, 36, 'A DG K', 'ABC DEFG HJK'],
    '351': ['AIRBUS A350-1000', 9, 38, 'A DG K', 'ABC DEFG HJK'],
    '763': ['BOEING 767-300', 6, 30, 'A DG K', 'BC DEF HJ'],
    '788': ['BOEING 787-8', 6, 30, 'A DG K', 'ABC DEF HJK'],
    '789': ['BOEING 787-9', 7, 33, 'A DG K', 'ABC DEF HJK'],
    '77W': ['BOEING 777-300ER', 9, 40, 'A DG K', 'ABC DEFG HJK'],
    '744': ['BOEING 747-400', 8, 42, 'A DG K', 'ABC DEFG HJK'],
    '388': ['AIRBUS A380-800', 10, 48, 'A DG K', 'ABC DEFG HJK'],
  };

  // Clases de reserva: [cabina, multiplicador de tarifa]
  const CLASSES = {
    F: ['F', 6.0], J: ['J', 4.2], C: ['J', 3.8], D: ['J', 3.3], I: ['J', 2.9],
    W: ['W', 1.9], P: ['W', 1.7],
    Y: ['Y', 1.0], B: ['Y', 0.88], H: ['Y', 0.78], K: ['Y', 0.7], M: ['Y', 0.62],
    L: ['Y', 0.55], V: ['Y', 0.49], S: ['Y', 0.44], N: ['Y', 0.39], Q: ['Y', 0.34],
    O: ['Y', 0.3], G: ['Y', 0.26],
  };
  const CLASS_ROW1 = ['J', 'C', 'D', 'I', 'W', 'Y', 'B', 'H', 'K'];
  const CLASS_ROW2 = ['M', 'L', 'V', 'S', 'N', 'Q', 'O', 'G'];

  const MEALS = { B: 'BREAKFAST', L: 'LUNCH', D: 'DINNER', S: 'SNACK', M: 'MEAL', G: 'FOOD FOR PURCHASE' };

  const PTC = {
    ADT: ['ADULT', 1.0], CNN: ['CHILD', 0.75], INF: ['INFANT', 0.1], SRC: ['SENIOR CITIZEN', 0.9],
    STU: ['STUDENT', 0.85], YTH: ['YOUTH', 0.9], MIL: ['MILITARY', 0.88],
  };

  const SSR_CODES = {
    DOCS: 'APIS - DATOS DE DOCUMENTO DE VIAJE', DOCA: 'APIS - DIRECCION', DOCO: 'APIS - OTROS DOCUMENTOS',
    CTCE: 'CONTACTO EMAIL', CTCM: 'CONTACTO MOVIL', FOID: 'IDENTIFICACION',
    VGML: 'COMIDA VEGETARIANA', AVML: 'COMIDA VEGETARIANA ASIATICA', KSML: 'COMIDA KOSHER',
    MOML: 'COMIDA MUSULMANA', DBML: 'COMIDA DIABETICA', GFML: 'COMIDA SIN GLUTEN', CHML: 'COMIDA INFANTIL',
    BBML: 'COMIDA BEBE', WCHR: 'SILLA DE RUEDAS - RAMPA', WCHS: 'SILLA DE RUEDAS - ESCALERAS',
    WCHC: 'SILLA DE RUEDAS - CABINA', BLND: 'PASAJERO CIEGO', DEAF: 'PASAJERO SORDO',
    UMNR: 'MENOR NO ACOMPANADO', PETC: 'MASCOTA EN CABINA', AVIH: 'ANIMAL EN BODEGA',
    BIKE: 'BICICLETA', XBAG: 'EQUIPAJE ADICIONAL', TKNE: 'NUMERO DE BOLETO ELECTRONICO',
    INFT: 'INFANTE', CHLD: 'NINO', OTHS: 'OTROS SERVICIOS',
  };

  // Tasas ficticias de cambio hacia USD (1 unidad = X USD)
  const CURRENCIES = {
    USD: ['US DOLLAR', 1], EUR: ['EURO', 1.08], GBP: ['POUND STERLING', 1.27], MXN: ['MEXICAN PESO', 0.055],
    COP: ['COLOMBIAN PESO', 0.00025], PEN: ['PERUVIAN SOL', 0.27], CLP: ['CHILEAN PESO', 0.00106],
    ARS: ['ARGENTINE PESO', 0.001], BRL: ['BRAZILIAN REAL', 0.18], CAD: ['CANADIAN DOLLAR', 0.73],
    JPY: ['YEN', 0.0067], CHF: ['SWISS FRANC', 1.13], DOP: ['DOMINICAN PESO', 0.0165],
    GTQ: ['QUETZAL', 0.128], CRC: ['COSTA RICAN COLON', 0.0019], UYU: ['URUGUAYAN PESO', 0.025],
    AED: ['UAE DIRHAM', 0.272], TRY: ['TURKISH LIRA', 0.029],
  };

  // Proveedores ficticios de hotel y auto (no corresponden a marcas reales)
  const HOTEL_CHAINS = [
    ['XA', 'AURORA'], ['XB', 'BRISA'], ['XC', 'CENTRAL'], ['XD', 'DORADO'], ['XE', 'ESTRELLA'],
    ['XF', 'FARO'], ['XG', 'GRAN VIA'], ['XH', 'HORIZONTE'],
  ];
  const HOTEL_SUFFIX = ['PLAZA', 'SUITES', 'GRAND HOTEL', 'BUSINESS', 'INN', 'RESORT', 'BOUTIQUE', 'EXPRESS'];
  const CAR_VENDORS = [['VA', 'ALFA RENT'], ['VB', 'BETA CARS'], ['VC', 'CONDOR AUTOS'], ['VD', 'DELTA DRIVE']];
  const CAR_TYPES = [
    ['ECAR', 'ECONOMY 2/4 DR AUTO AC', 28], ['CCAR', 'COMPACT 2/4 DR AUTO AC', 34],
    ['ICAR', 'INTERMEDIATE 4 DR AUTO AC', 41], ['SCAR', 'STANDARD 4 DR AUTO AC', 48],
    ['FCAR', 'FULLSIZE 4 DR AUTO AC', 55], ['IFAR', 'INTERMEDIATE SUV AUTO AC', 62],
    ['PCAR', 'PREMIUM 4 DR AUTO AC', 78], ['MVAR', 'MINIVAN AUTO AC', 84],
  ];

  G.SABDATA = {
    AIRPORTS, COUNTRIES, AIRLINES, EQUIPMENT, CLASSES, CLASS_ROW1, CLASS_ROW2, MEALS, PTC,
    SSR_CODES, CURRENCIES, HOTEL_CHAINS, HOTEL_SUFFIX, CAR_VENDORS, CAR_TYPES,
  };
})(window);
