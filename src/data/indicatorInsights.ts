import type { CategoryId, NewsArticle, SubcomponentItem } from '../types/indicators';

export interface IndicatorInsight {
  description: string;
  economicImpact: string;
  subcomponentsTitle?: string;
  subcomponents?: SubcomponentItem[];
  newsQuery: string;
}

export const INDICATOR_INSIGHTS: Record<string, IndicatorInsight> = {
  'dolar-oficial': {
    description:
      'Representa el tipo de cambio minorista de referencia regulado en el Mercado Libre de Cambios (MLC). Es la cotización base para liquidación de exportaciones, pago de importaciones autorizadas y determinación de impuestos vinculados al comercio exterior.',
    economicImpact:
      'Su trayectoria incide de manera directa en los costos de insumos importados, la competitividad exportadora y las expectativas inflacionarias sobre bienes transables.',
    newsQuery: 'dolar oficial bcra argentina',
  },
  'dolar-blue': {
    description:
      'Cotización informal del dólar estadounidense en el mercado paralelo de Argentina. Refleja la demanda minorista de cobertura por fuera del circuito bancario formal y las restricciones cambiarias vigentes.',
    economicImpact:
      'Funciona como termómetro inmediato de la incertidumbre financiera y suele influir sobre la formación de precios en sectores sin acceso directo al dólar oficial.',
    newsQuery: 'dolar blue hoy argentina',
  },
  'brecha-cambiaria': {
    description:
      'Mide la distancia porcentual entre la cotización del Dólar Blue y el Dólar Oficial minorista. Se calcula como la diferencia relativa entre ambos tipos de cambio.',
    economicImpact:
      'Brechas elevadas desincentivan la liquidación de divisas por canales formales, generan incentivos a adelantar importaciones y distorsionan precios relativos.',
    newsQuery: 'brecha cambiaria dolar argentina',
  },
  'dolar-mep': {
    description:
      'Dólar Mercado Electrónico de Pagos (Bolsa). Surge de la compra de un bono soberano en pesos (como AL30 o GD30) y su posterior venta en dólares dentro de la plaza local.',
    economicImpact:
      'Es el tipo de cambio financiero legal más utilizado por ahorristas y empresas locales para dolarizar excedentes líquidos de forma transparente.',
    newsQuery: 'dolar mep bolsa argentina',
  },
  'dolar-ccl': {
    description:
      'Dólar Contado con Liquidación. Se obtiene mediante la compra de activos financieros en pesos en el mercado local y su venta en dólares en el exterior.',
    economicImpact:
      'Refleja el costo de transferir capitales fuera del país y constituye la principal referencia financiera para valuación de activos corporativos y remisión de dividendos.',
    newsQuery: 'dolar ccl contado con liquidacion argentina',
  },
  'dolar-cripto': {
    description:
      'Tipo de cambio implícito en la compraventa de stablecoins atadas al dólar estadounidense (como USDT o USDC) en exchanges locales y mercados P2P.',
    economicImpact:
      'Al operar las 24 horas los 7 días de la semana, anticipa movimientos cambiarios durante fines de semana, feriados y cierres de rueda bursátil.',
    newsQuery: 'dolar cripto usdt argentina',
  },
  'riesgo-pais': {
    description:
      'Índice EMBI+ elaborado por JP Morgan que mide el diferencial de tasa de interés que pagan los bonos soberanos argentinos respecto de los bonos del Tesoro de Estados Unidos, expresado en puntos básicos (100 pb = 1%).',
    economicImpact:
      'Un descenso sostenido habilita la refinanciación de vencimientos en los mercados internacionales a menor costo financiero para el Estado y las empresas privadas.',
    subcomponentsTitle: 'Componentes clave que siguen los inversores',
    subcomponents: [
      { name: 'Riesgo de crédito soberano', sharePct: 48, detail: 'Curva Bonares / Globales' },
      { name: 'Capacidad de pago y reservas netas', sharePct: 30, detail: 'Acumulación BCRA' },
      { name: 'Consistencia fiscal y superávit', sharePct: 22, detail: 'SPNF primario' },
    ],
    newsQuery: 'riesgo pais argentina bonos jp morgan',
  },
  'plazo-fijo': {
    description:
      'Tasa Nominal Anual (TNA) ofrecida por las entidades financieras para colocaciones a 30 días en pesos. Se compara frente a la inflación esperada para determinar el rendimiento real del ahorro.',
    economicImpact:
      'Tasas reales positivas incentivan la permanencia en moneda local y moderan la presión sobre los dólares financieros; tasas negativas impulsan la búsqueda de cobertura.',
    subcomponentsTitle: 'Tasas vigentes por entidad (TNA Clientes)',
    newsQuery: 'tasa plazo fijo bancos bcra argentina',
  },
  'inflacion-mensual': {
    description:
      'Variación porcentual mensual del Índice de Precios al Consumidor (IPC) publicado por el INDEC. Releva precios minoristas de una canasta representativa de bienes y servicios en todo el país.',
    economicImpact:
      'Erosiona el poder adquisitivo de salarios y jubilaciones, condiciona las negociaciones paritarias y define el sendero de tasas de interés y ajuste tarifario.',
    subcomponentsTitle: 'Ponderación de divisiones en el IPC Nacional',
    subcomponents: [
      { name: 'Alimentos y bebidas no alcohólicas', sharePct: 27.0, detail: '27,0% del IPC' },
      { name: 'Vivienda, agua, electricidad y gas', sharePct: 11.4, detail: '11,4% del IPC' },
      { name: 'Transporte y combustibles', sharePct: 12.2, detail: '12,2% del IPC' },
      { name: 'Restaurantes y hoteles', sharePct: 9.6, detail: '9,6% del IPC' },
      { name: 'Salud y prepagas', sharePct: 8.9, detail: '8,9% del IPC' },
      { name: 'Equipamiento, educación y otros', sharePct: 30.9, detail: '30,9% del IPC' },
    ],
    newsQuery: 'inflacion indec ipc argentina',
  },
  'inflacion-acumulada': {
    description:
      'Muestra la suba acumulada de precios minoristas desde enero hasta el último mes informado dentro de cada año calendario, mediante capitalización compuesta de los IPC mensuales.',
    economicImpact:
      'Permite evaluar el desvío o cumplimiento respecto de las proyecciones presupuestarias anuales y comparar la evolución salarial acumulada en el año.',
    newsQuery: 'inflacion acumulada año indec argentina',
  },
  'inflacion-interanual': {
    description:
      'Variación porcentual del IPC respecto al mismo mes del año anterior (12 meses consecutivos). Suaviza los saltos estacionales puntuales de corto plazo.',
    economicImpact:
      'Es la referencia central para contratos de alquiler, actualización de escalas impositivas, valuaciones reales y análisis macroeconómico comparado.',
    newsQuery: 'inflacion interanual indec argentina',
  },
  'indice-uva': {
    description:
      'Unidad de Valor Adquisitivo actualizada diariamente por el BCRA según el Coeficiente de Estabilización de Referencia (CER), que replica la evolución del IPC con un rezago de corto plazo.',
    economicImpact:
      'Se utiliza para indexar créditos hipotecarios, plazos fijos UVA y contratos de financiamiento de mediano y largo plazo en moneda local.',
    newsQuery: 'valor uva creditos hipotecarios bcra argentina',
  },
  'emae-desestacionalizado': {
    description:
      'El Estimador Mensual de Actividad Económica (EMAE) anticipa la evolución trimestral del PBI con frecuencia mensual. La serie desestacionalizada elimina efectos de calendario y estacionalidad climática o comercial.',
    economicImpact:
      'Permite identificar con rapidez puntos de inflexión entre recesión y expansión económica, orientando decisiones de inversión y empleo.',
    subcomponentsTitle: 'Participación sectorial en el nivel de actividad',
    subcomponents: [
      { name: 'Comercio mayorista y minorista', sharePct: 16.8, detail: '16,8%' },
      { name: 'Industria manufacturera', sharePct: 15.4, detail: '15,4%' },
      { name: 'Actividades inmobiliarias y empres.', sharePct: 13.1, detail: '13,1%' },
      { name: 'Agricultura, ganadería y pesca', sharePct: 9.2, detail: '9,2%' },
      { name: 'Explotación de minas y canteras', sharePct: 7.8, detail: '7,8%' },
      { name: 'Construcción', sharePct: 4.5, detail: '4,5%' },
    ],
    newsQuery: 'emae actividad economica indec argentina',
  },
  'emae-original': {
    description:
      'Índice mensual de actividad económica sin corrección estacional. Refleja el volumen físico efectivo producido en cada mes calendario respecto al año base 2004.',
    economicImpact:
      'Es útil para contrastar la actividad interanual frente al mismo mes del año previo, capturando campañas agrícolas y picos estacionales de consumo.',
    newsQuery: 'emae indec actividad economica argentina',
  },
  'pbi-constante': {
    description:
      'Producto Bruto Interno medido a precios constantes de 2004. Cuantifica el valor real de todos los bienes y servicios finales producidos en el país aislando el efecto de la inflación.',
    economicImpact:
      'Es el indicador estructural por excelencia del tamaño y crecimiento de la economía argentina, clave para medir productividad y sustentabilidad fiscal.',
    subcomponentsTitle: 'Composición de la Demanda Agregada',
    subcomponents: [
      { name: 'Consumo privado', sharePct: 67.2, detail: '67,2% del PBI' },
      { name: 'Inversión (Formación Bruta Capital Fijo)', sharePct: 18.1, detail: '18,1% del PBI' },
      { name: 'Consumo público', sharePct: 15.4, detail: '15,4% del PBI' },
    ],
    newsQuery: 'pbi producto bruto interno indec argentina',
  },
  'pbi-per-capita': {
    description:
      'Cociente entre el PBI a precios constantes y la población total estimada en cada trimestre. Mide la producción económica real promedio generada por habitante.',
    economicImpact:
      'Refleja si el crecimiento económico supera al crecimiento demográfico y permite evaluar la evolución de los estándares materiales de vida a largo plazo.',
    newsQuery: 'pbi per capita crecimiento economia argentina',
  },
  'consumo-privado': {
    description:
      'Gasto total realizado por los hogares en bienes durables, no durables y servicios, medido a precios constantes de 2004 y ajustado por estacionalidad.',
    economicImpact:
      'Al representar cerca de dos tercios del PBI, es el motor principal del mercado interno y responde rápidamente a cambios en el salario real y el crédito.',
    newsQuery: 'consumo privado hogares ventas argentina',
  },
  'inversion-fbcf': {
    description:
      'La Formación Bruta de Capital Fijo mide el gasto en activos durables destinados a ampliar la capacidad productiva del país: obras de construcción, maquinaria industrial, equipos y transporte.',
    economicImpact:
      'Un aumento de la inversión impulsa el empleo en la construcción y la industria, moderniza la matriz productiva y eleva el crecimiento potencial futuro.',
    subcomponentsTitle: 'Desglose por componente de inversión',
    subcomponents: [
      { name: 'Construcción (residencial y no residencial)', sharePct: 52.4, detail: '52,4%' },
      { name: 'Maquinaria y equipo nacional', sharePct: 24.8, detail: '24,8%' },
      { name: 'Maquinaria y equipo importado', sharePct: 16.5, detail: '16,5%' },
      { name: 'Equipo de transporte', sharePct: 6.3, detail: '6,3%' },
    ],
    newsQuery: 'inversion formacion bruta capital fijo indec argentina',
  },
  smvm: {
    description:
      'El Salario Mínimo, Vital y Móvil es el piso legal remunerativo establecido por el Consejo del Salario para trabajadores comprendidos en el Régimen de Contrato de Trabajo.',
    economicImpact:
      'Además de fijar un umbral salarial, actúa como parámetro de actualización para prestaciones sociales, asignaciones, becas y montos jubilatorios mínimos.',
    newsQuery: 'salario minimo vital movil argentina',
  },
  'canasta-basica-total': {
    description:
      'Valoriza los requerimientos alimentarios más bienes y servicios no alimentarios esenciales (transporte, vestimenta, salud, educación y vivienda) para un hogar tipo de 4 integrantes.',
    economicImpact:
      'Determina oficialmente el umbral monetario por debajo del cual un hogar es considerado en situación de pobreza según la metodología del INDEC.',
    subcomponentsTitle: 'Estructura de gasto de la Canasta Básica Total',
    subcomponents: [
      { name: 'Canasta Básica Alimentaria (CBA)', sharePct: 45.2, detail: '45,2%' },
      { name: 'Vivienda, agua y energía', sharePct: 16.4, detail: '16,4%' },
      { name: 'Transporte y comunicaciones', sharePct: 14.6, detail: '14,6%' },
      { name: 'Salud y educación', sharePct: 12.0, detail: '12,0%' },
      { name: 'Indumentaria y otros bienes', sharePct: 11.8, detail: '11,8%' },
    ],
    newsQuery: 'canasta basica total pobreza indec argentina',
  },
  'canasta-basica-alimentaria': {
    description:
      'Determina el costo mensual de los alimentos indispensables para cubrir los requerimientos calóricos y proteicos mínimos de un hogar tipo (varón de 35 años, mujer de 31, hijo de 6 e hija de 8).',
    economicImpact:
      'Define el umbral oficial de indigencia. Su dinámica está fuertemente ligada a los precios de carnes, panificados, lácteos, frutas y verduras.',
    newsQuery: 'canasta basica alimentaria indigencia indec argentina',
  },
  'cobertura-smvm-cbt': {
    description:
      'Porcentaje de la Canasta Básica Total de una familia tipo que logra cubrirse con un Salario Mínimo, Vital y Móvil vigente en el mismo mes.',
    economicImpact:
      'Sintetiza en un solo ratio la pérdida o recuperación del poder adquisitivo de los ingresos base frente al costo de vida esencial.',
    newsQuery: 'salario minimo canasta basica poder adquisitivo argentina',
  },
  'tasa-desocupacion': {
    description:
      'Porcentaje de la Población Económicamente Activa (personas que trabajan o buscan activamente empleo) que no tiene ocupación y busca trabajo, relevado en 31 aglomerados urbanos por la EPH.',
    economicImpact:
      'Un incremento del desempleo debilita los ingresos familiares, reduce el consumo agregado y amplía la demanda de cobertura previsional y asistencia social.',
    newsQuery: 'tasa desocupacion desempleo indec eph argentina',
  },
  'tasa-pobreza': {
    description:
      'Porcentaje de personas residentes en aglomerados urbanos cuyos ingresos totales familiares resultan inferiores al valor de la Canasta Básica Total (CBT).',
    economicImpact:
      'Es el principal indicador social de mediano plazo y resume el efecto combinado de la inflación, los salarios reales, el empleo y las transferencias públicas.',
    newsQuery: 'tasa pobreza indec eph argentina',
  },
  'tasa-indigencia': {
    description:
      'Porcentaje de la población cuyos ingresos familiares totales no alcanzan para adquirir la Canasta Básica Alimentaria (CBA), midiendo la vulnerabilidad alimentaria extrema.',
    economicImpact:
      'Requiere seguimiento prioritario para calibrar programas alimentarios, tarjetas sociales y asignaciones familiares en los sectores de menores recursos.',
    newsQuery: 'tasa indigencia pobreza extrema indec argentina',
  },
  'hogares-pobreza': {
    description:
      'Proporción de hogares urbanos cuyo ingreso total mensual se ubica por debajo del costo de la Canasta Básica Total correspondiente a su composición demográfica.',
    economicImpact:
      'Complementa el dato de personas al reflejar la situación por unidad familiar, considerando que los hogares pobres suelen tener mayor cantidad promedio de integrantes.',
    newsQuery: 'hogares pobreza indec argentina',
  },
  'reservas-bcra': {
    description:
      'Stock bruto de activos externos bajo control del Banco Central (divisas, oro, DEG y acuerdos swap), expresado en millones de dólares estadounidenses.',
    economicImpact:
      'Respalda la estabilidad cambiaria, permite atender vencimientos de deuda pública y privada y fortalece la capacidad de intervención ante shocks externos.',
    subcomponentsTitle: 'Composición referencial de activos de reserva',
    subcomponents: [
      { name: 'Divisas líquidas y colocaciones externas', sharePct: 54, detail: 'Liquidez inmediata' },
      { name: 'Swaps de monedas y acuerdos bilaterales', sharePct: 33, detail: 'Líneas activas' },
      { name: 'Tenencias de oro y DEG del FMI', sharePct: 13, detail: 'Activos de reserva' },
    ],
    newsQuery: 'reservas internacionales bcra dolares argentina',
  },
  'exportaciones-fob': {
    description:
      'Valor mensual de las ventas de bienes al exterior valuadas a precio FOB (puestas a bordo en puerto argentino). Refleja el ingreso genuino de divisas comerciales.',
    economicImpact:
      'Mayor volumen exportado sostiene el superávit comercial, aporta divisas al BCRA y dinamiza las economías regionales, el agro, la energía y la industria.',
    subcomponentsTitle: 'Participación por grandes rubros exportados',
    subcomponents: [
      { name: 'Manufacturas de Origen Agropecuario (MOA)', sharePct: 37.8, detail: '37,8%' },
      { name: 'Manufacturas de Origen Industrial (MOI)', sharePct: 25.1, detail: '25,1%' },
      { name: 'Productos Primarios', sharePct: 24.5, detail: '24,5%' },
      { name: 'Combustibles y Energía', sharePct: 12.6, detail: '12,6%' },
    ],
    newsQuery: 'exportaciones balanza comercial indec argentina',
  },
  'importaciones-cif': {
    description:
      'Valor mensual de las compras de bienes al exterior valuadas a precio CIF (incluyendo costo, seguro y flete hasta puerto argentino).',
    economicImpact:
      'En la economía argentina, la mayoría de las importaciones son insumos y bienes de capital necesarios para sostener la producción industrial local.',
    subcomponentsTitle: 'Participación por uso económico',
    subcomponents: [
      { name: 'Bienes Intermedios', sharePct: 36.4, detail: '36,4%' },
      { name: 'Bienes de Capital', sharePct: 19.8, detail: '19,8%' },
      { name: 'Piezas y accesorios para bs. de capital', sharePct: 18.2, detail: '18,2%' },
      { name: 'Bienes de Consumo y vehículos', sharePct: 18.5, detail: '18,5%' },
      { name: 'Combustibles y Lubricantes', sharePct: 7.1, detail: '7,1%' },
    ],
    newsQuery: 'importaciones comercio exterior indec argentina',
  },
  'balanza-comercial': {
    description:
      'Diferencia neta entre Exportaciones FOB e Importaciones CIF en cada mes. Valores positivos indican superávit comercial; valores negativos, déficit.',
    economicImpact:
      'Constituye la principal fuente genuina de dólares para la cuenta corriente externa, reduciendo la dependencia de endeudamiento financiero.',
    newsQuery: 'superavit balanza comercial intercambio indec argentina',
  },
  'resultado-primario': {
    description:
      'Diferencia entre los ingresos totales del Sector Público Nacional No Financiero y los gastos primarios (antes del pago de intereses de la deuda pública).',
    economicImpact:
      'Es la señal fiscal central para evaluar el ancla fiscal del programa económico, las necesidades de financiamiento y la trayectoria de emisión monetaria.',
    newsQuery: 'superavit resultado primario cuentas publicas argentina',
  },
  'resultado-financiero': {
    description:
      'Resultado fiscal neto tras computar el pago de intereses de la deuda pública sobre el resultado primario. Determina el superávit o déficit global del Tesoro.',
    economicImpact:
      'Alcanzar equilibrio o superávit financiero elimina la necesidad de emitir moneda o tomar nueva deuda neta para cubrir gastos corrientes del Estado.',
    newsQuery: 'resultado financiero fiscal tesoro argentina',
  },
  'recaudacion-tributaria': {
    description:
      'Total mensual de ingresos impositivos, aduaneros y de seguridad social recaudados por ARCA (ex AFIP) y distribuidos entre Nación y provincias.',
    economicImpact:
      'Refleja en tiempo real el pulso del consumo (IVA), las ganancias corporativas, los salarios formales y el comercio exterior.',
    subcomponentsTitle: 'Estructura de ingresos tributarios',
    subcomponents: [
      { name: 'IVA Neto', sharePct: 31.5, detail: '31,5%' },
      { name: 'Aportes y Contribuciones SIPA', sharePct: 23.8, detail: '23,8%' },
      { name: 'Impuesto a las Ganancias', sharePct: 18.4, detail: '18,4%' },
      { name: 'Derechos de Exportación e Importación', sharePct: 8.7, detail: '8,7%' },
      { name: 'Créditos y Débitos Bancarios', sharePct: 7.6, detail: '7,6%' },
      { name: 'Otros tributos nacionales', sharePct: 10.0, detail: '10,0%' },
    ],
    newsQuery: 'recaudacion tributaria arca afip argentina',
  },
  'base-monetaria': {
    description:
      'Suma del dinero circulante en poder del público y los bancos más los encajes depositados por las entidades financieras en el Banco Central.',
    economicImpact:
      'El control de su expansión es un determinante clave de la liquidez en pesos, la demanda agregada y las expectativas de inflación de mediano plazo.',
    newsQuery: 'base monetaria bcra liquidez pesos argentina',
  },
};

export const FALLBACK_NEWS_BY_CATEGORY: Record<CategoryId, NewsArticle[]> = {
  mercados: [
    {
      title: 'Los dólares financieros operan con estabilidad y la brecha cambiaria se mantiene contenida',
      source: 'Ámbito Financiero',
      link: 'https://www.ambito.com/contenidos/dolar.html',
      pubDate: '',
      relativeTime: 'Hace 2 horas',
    },
    {
      title: 'El Riesgo País retrocede tras nuevas subas en los bonos soberanos en dólares',
      source: 'El Cronista',
      link: 'https://www.cronista.com/finanzas-mercados/',
      pubDate: '',
      relativeTime: 'Hace 4 horas',
    },
    {
      title: 'Plazos fijos: qué tasas nominales anuales pagan los principales bancos este mes',
      source: 'Infobae Economía',
      link: 'https://www.infobae.com/economia/',
      pubDate: '',
      relativeTime: 'Hace 6 horas',
    },
    {
      title: 'Mercado cambiario: el BCRA cerró la rueda con saldo positivo en el mercado oficial',
      source: 'La Nación Economía',
      link: 'https://www.lanacion.com.ar/economia/',
      pubDate: '',
      relativeTime: 'Hace 8 horas',
    },
  ],
  precios: [
    {
      title: 'El INDEC difundió el último dato del IPC: alimentos y vivienda lideraron las variaciones',
      source: 'La Nación Economía',
      link: 'https://www.lanacion.com.ar/economia/',
      pubDate: '',
      relativeTime: 'Hace 3 horas',
    },
    {
      title: 'Inflación interanual: la tendencia descendente consolida proyecciones moderadas para los próximos meses',
      source: 'El Cronista',
      link: 'https://www.cronista.com/economia-politica/',
      pubDate: '',
      relativeTime: 'Hace 5 horas',
    },
    {
      title: 'Índice UVA y créditos hipotecarios: cómo impacta la última actualización del CER',
      source: 'Ámbito Financiero',
      link: 'https://www.ambito.com/economia',
      pubDate: '',
      relativeTime: 'Hace 7 horas',
    },
    {
      title: 'Consultoras privadas estiman la dinámica de precios regulados y estacionales del mes',
      source: 'Infobae Economía',
      link: 'https://www.infobae.com/economia/',
      pubDate: '',
      relativeTime: 'Hace 1 día',
    },
  ],
  actividad: [
    {
      title: 'EMAE: el nivel de actividad económica mostró señales de recuperación en minería, agro y comercio',
      source: 'El Cronista',
      link: 'https://www.cronista.com/economia-politica/',
      pubDate: '',
      relativeTime: 'Hace 3 horas',
    },
    {
      title: 'Cuentas Nacionales: la inversión en maquinaria y construcción marca el pulso del PBI trimestral',
      source: 'Ámbito Financiero',
      link: 'https://www.ambito.com/economia',
      pubDate: '',
      relativeTime: 'Hace 6 horas',
    },
    {
      title: 'El consumo privado y los indicadores sectoriales anticipan el desempeño del próximo trimestre',
      source: 'La Nación Economía',
      link: 'https://www.lanacion.com.ar/economia/',
      pubDate: '',
      relativeTime: 'Hace 9 horas',
    },
    {
      title: 'Formación bruta de capital fijo: qué sectores lideran las nuevas inversiones productivas',
      source: 'Infobae Economía',
      link: 'https://www.infobae.com/economia/',
      pubDate: '',
      relativeTime: 'Hace 1 día',
    },
  ],
  ingresos: [
    {
      title: 'El INDEC actualizó el valor de la Canasta Básica Total y la Canasta Básica Alimentaria',
      source: 'Infobae Economía',
      link: 'https://www.infobae.com/economia/',
      pubDate: '',
      relativeTime: 'Hace 2 horas',
    },
    {
      title: 'Salario Mínimo, Vital y Móvil: cómo evolucionó frente al costo de la canasta familiar',
      source: 'Ámbito Financiero',
      link: 'https://www.ambito.com/economia',
      pubDate: '',
      relativeTime: 'Hace 5 horas',
    },
    {
      title: 'Paritarias y poder de compra: los sectores que recuperan terreno frente al IPC',
      source: 'El Cronista',
      link: 'https://www.cronista.com/economia-politica/',
      pubDate: '',
      relativeTime: 'Hace 8 horas',
    },
    {
      title: 'Cuánto necesitó una familia tipo de cuatro integrantes para no caer bajo la línea de pobreza',
      source: 'La Nación Economía',
      link: 'https://www.lanacion.com.ar/economia/',
      pubDate: '',
      relativeTime: 'Hace 1 día',
    },
  ],
  sociedad: [
    {
      title: 'Mercado laboral: el INDEC informó los últimos datos de tasa de empleo y desocupación urbana',
      source: 'La Nación Economía',
      link: 'https://www.lanacion.com.ar/economia/',
      pubDate: '',
      relativeTime: 'Hace 4 horas',
    },
    {
      title: 'Encuesta Permanente de Hogares: evolución reciente de los índices de pobreza e indigencia',
      source: 'Infobae Economía',
      link: 'https://www.infobae.com/economia/',
      pubDate: '',
      relativeTime: 'Hace 6 horas',
    },
    {
      title: 'Análisis regional de la EPH: diferencias en la incidencia de la pobreza entre aglomerados',
      source: 'El Cronista',
      link: 'https://www.cronista.com/economia-politica/',
      pubDate: '',
      relativeTime: 'Hace 1 día',
    },
    {
      title: 'Ingresos laborales y programas sociales: su impacto sobre la línea de indigencia',
      source: 'Ámbito Financiero',
      link: 'https://www.ambito.com/economia',
      pubDate: '',
      relativeTime: 'Hace 2 días',
    },
  ],
  externo: [
    {
      title: 'Intercambio Comercial Argentino: el saldo de la balanza comercial cerró con superávit',
      source: 'El Cronista',
      link: 'https://www.cronista.com/economia-politica/',
      pubDate: '',
      relativeTime: 'Hace 2 horas',
    },
    {
      title: 'Exportaciones de energía y complejo agroindustrial sostienen el ingreso de divisas',
      source: 'La Nación Economía',
      link: 'https://www.lanacion.com.ar/economia/',
      pubDate: '',
      relativeTime: 'Hace 5 horas',
    },
    {
      title: 'Importaciones de bienes de capital e insumos intermedios acompañan la demanda industrial',
      source: 'Ámbito Financiero',
      link: 'https://www.ambito.com/economia',
      pubDate: '',
      relativeTime: 'Hace 8 horas',
    },
    {
      title: 'Reservas internacionales del BCRA: análisis de los pagos de deuda y compras en el MLC',
      source: 'Infobae Economía',
      link: 'https://www.infobae.com/economia/',
      pubDate: '',
      relativeTime: 'Hace 1 día',
    },
  ],
  finanzas: [
    {
      title: 'Cuentas públicas: el Sector Público Nacional volvió a registrar superávit primario mensual',
      source: 'Ámbito Financiero',
      link: 'https://www.ambito.com/economia',
      pubDate: '',
      relativeTime: 'Hace 3 horas',
    },
    {
      title: 'Recaudación tributaria: desempeño del IVA, Ganancias y derechos del comercio exterior',
      source: 'El Cronista',
      link: 'https://www.cronista.com/economia-politica/',
      pubDate: '',
      relativeTime: 'Hace 6 horas',
    },
    {
      title: 'Base monetaria y agregados en pesos: cómo opera el programa monetario del BCRA',
      source: 'La Nación Economía',
      link: 'https://www.lanacion.com.ar/economia/',
      pubDate: '',
      relativeTime: 'Hace 9 horas',
    },
    {
      title: 'Licitaciones del Tesoro y resultado financiero: el calendario de vencimientos en pesos',
      source: 'Infobae Economía',
      link: 'https://www.infobae.com/economia/',
      pubDate: '',
      relativeTime: 'Hace 1 día',
    },
  ],
};
