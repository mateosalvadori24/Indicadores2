import {
  FALLBACK_CONSUMO_PRIVADO,
  FALLBACK_EMAE_DESEST,
  FALLBACK_EMAE_ORIG,
  FALLBACK_INVERSION_FBCF,
  FALLBACK_PBI_CONST,
  FALLBACK_PBI_PER_CAPITA,
  INDIGENCIA_INDEC_SERIES,
} from '../data/fallbacks';
import type {
  CategoryId,
  ChangeMode,
  IndicatorData,
  NewsArticle,
  SeriesPoint,
  SubcomponentItem,
  UnitType,
} from '../types/indicators';
import {
  formatArgNumber,
  formatAxisDate,
  formatBuenosAiresDateTime,
  formatBuenosAiresTimeOnly,
  formatPeriodShort,
} from '../utils/formatters';

interface DolarApiItem {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

interface ArgentinaDatosValor {
  fecha: string;
  valor: number;
}

interface ArgentinaDatosDolar {
  casa: string;
  compra: number;
  venta: number;
  fecha: string;
}

interface PlazoFijoBanco {
  entidad: string;
  tnaClientes: number;
  tnaNoClientes: number;
}

interface DatosGobResponse {
  data?: Array<[string, number | null]>;
  errors?: Array<{ error: string }>;
}

async function fetchJson<T>(url: string, timeoutMs = 8500): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function buildSeriesPoints(
  entries: Array<{ date: string; value: number }>,
  dateMode: 'daily' | 'monthly' | 'quarterly' | 'semiannual',
  changeMode: ChangeMode
): SeriesPoint[] {
  return entries.map((item, idx) => {
    let changeValue: number | null = null;
    if (idx > 0) {
      const prev = entries[idx - 1].value;
      if (changeMode === 'pct') {
        changeValue = prev !== 0 ? ((item.value - prev) / Math.abs(prev)) * 100 : null;
      } else {
        changeValue = item.value - prev;
      }
    }
    return {
      date: item.date,
      label: formatAxisDate(item.date, dateMode),
      value: item.value,
      changeValue,
    };
  });
}

function buildIndicator(params: {
  id: string;
  category: CategoryId;
  title: string;
  subtitle: string;
  source: string;
  unitType: UnitType;
  unitPrefix?: string;
  unitSuffix: string;
  decimals: number;
  changeMode: ChangeMode;
  changeLabel: string;
  frequencyLabel: string;
  fullSeries: SeriesPoint[];
  cardWindow?: number;
  isLiveApi: boolean;
  realtimeTimestamp?: string;
  liveSubcomponents?: SubcomponentItem[];
}): IndicatorData {
  const { fullSeries, cardWindow = 24 } = params;
  const series = fullSeries.slice(-cardWindow);
  const last = series[series.length - 1];
  const values = series.map((s) => s.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const fetchedIso = new Date().toISOString();

  const updatedAtLabel = params.realtimeTimestamp
    ? formatBuenosAiresDateTime(params.realtimeTimestamp)
    : `Período: ${formatPeriodShort(
        last ? last.date : fetchedIso.slice(0, 10),
        params.frequencyLabel
      )} · Act. ${formatBuenosAiresTimeOnly(fetchedIso)}`;

  return {
    id: params.id,
    category: params.category,
    title: params.title,
    subtitle: params.subtitle,
    source: params.source,
    unitType: params.unitType,
    unitPrefix: params.unitPrefix,
    unitSuffix: params.unitSuffix,
    decimals: params.decimals,
    currentValue: last ? last.value : 0,
    currentDate: last ? last.date : '',
    changeValue: last ? last.changeValue : null,
    changeMode: params.changeMode,
    changeLabel: params.changeLabel,
    minValue,
    maxValue,
    series,
    fullSeries,
    frequencyLabel: params.frequencyLabel,
    updatedAtLabel,
    apiFetchedAt: fetchedIso,
    isLiveApi: params.isLiveApi,
    liveSubcomponents: params.liveSubcomponents,
  };
}

async function fetchDatosGobSeries(
  seriesId: string,
  limit = 160,
  scale = 1,
  maxDate?: string
): Promise<Array<{ date: string; value: number }>> {
  const url = `https://apis.datos.gob.ar/series/api/series/?ids=${encodeURIComponent(
    seriesId
  )}&limit=${limit}&sort=desc`;
  const json = await fetchJson<DatosGobResponse>(url);
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].error);
  }
  const rows = (json.data ?? [])
    .filter((row): row is [string, number] => row[1] !== null && Number.isFinite(row[1]))
    .map(([date, val]) => ({ date, value: val * scale }))
    .filter((row) => (maxDate ? row.date <= maxDate : true))
    .reverse();
  if (rows.length === 0) {
    throw new Error(`Sin datos para ${seriesId}`);
  }
  return rows;
}

export async function fetchMercadosIndicators(): Promise<IndicatorData[]> {
  const [
    dolaresLiveRes,
    riesgoRes,
    plazoFijoRes,
    depositosRes,
    histOficialRes,
    histBlueRes,
    histMepRes,
    histCclRes,
    histCriptoRes,
  ] = await Promise.allSettled([
    fetchJson<DolarApiItem[]>('https://dolarapi.com/v1/dolares'),
    fetchJson<ArgentinaDatosValor[]>('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais'),
    fetchJson<PlazoFijoBanco[]>('https://api.argentinadatos.com/v1/finanzas/tasas/plazoFijo'),
    fetchJson<ArgentinaDatosValor[]>('https://api.argentinadatos.com/v1/finanzas/tasas/depositos30Dias'),
    fetchJson<ArgentinaDatosDolar[]>('https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial'),
    fetchJson<ArgentinaDatosDolar[]>('https://api.argentinadatos.com/v1/cotizaciones/dolares/blue'),
    fetchJson<ArgentinaDatosDolar[]>('https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa'),
    fetchJson<ArgentinaDatosDolar[]>('https://api.argentinadatos.com/v1/cotizaciones/dolares/contadoconliqui'),
    fetchJson<ArgentinaDatosDolar[]>('https://api.argentinadatos.com/v1/cotizaciones/dolares/cripto'),
  ]);

  const liveQuotes =
    dolaresLiveRes.status === 'fulfilled' ? dolaresLiveRes.value : [];
  const quoteMap = new Map<string, DolarApiItem>();
  for (const q of liveQuotes) {
    quoteMap.set(q.casa, q);
  }

  const mergeDollarSeries = (
    histRes: PromiseSettledResult<ArgentinaDatosDolar[]>,
    casa: string
  ): Array<{ date: string; value: number }> => {
    const hist =
      histRes.status === 'fulfilled'
        ? histRes.value
            .filter((d) => Number.isFinite(d.venta) && d.venta > 0)
            .slice(-3650)
            .map((d) => ({ date: d.fecha, value: d.venta }))
        : [];
    const live = quoteMap.get(casa);
    if (live && Number.isFinite(live.venta) && live.venta > 0) {
      const liveDate = live.fechaActualizacion.slice(0, 10);
      const lastHist = hist[hist.length - 1];
      if (!lastHist || lastHist.date < liveDate) {
        hist.push({ date: liveDate, value: live.venta });
      } else if (lastHist.date === liveDate) {
        hist[hist.length - 1] = { date: liveDate, value: live.venta };
      }
    }
    return hist;
  };

  const oficialRaw = mergeDollarSeries(histOficialRes, 'oficial');
  const blueRaw = mergeDollarSeries(histBlueRes, 'blue');
  const mepRaw = mergeDollarSeries(histMepRes, 'bolsa');
  const cclRaw = mergeDollarSeries(histCclRes, 'contadoconliqui');
  const criptoRaw = mergeDollarSeries(histCriptoRes, 'cripto');

  const oficialByDate = new Map(oficialRaw.map((d) => [d.date, d.value]));
  const brechaRaw: Array<{ date: string; value: number }> = [];
  for (const b of blueRaw) {
    const ofVal = oficialByDate.get(b.date);
    if (ofVal && ofVal > 0) {
      brechaRaw.push({
        date: b.date,
        value: ((b.value - ofVal) / ofVal) * 100,
      });
    }
  }

  const cards: IndicatorData[] = [];

  const addDollarCard = (
    id: string,
    title: string,
    casa: string,
    raw: Array<{ date: string; value: number }>
  ) => {
    if (raw.length === 0) return;
    const live = quoteMap.get(casa);
    const compraStr = live
      ? `Compra $${formatArgNumber(live.compra, 2)}`
      : 'Cotización venta';
    const spreadPct =
      live && live.compra > 0 ? ((live.venta - live.compra) / live.compra) * 100 : null;
    const liveSubs: SubcomponentItem[] | undefined = live
      ? [
          {
            name: 'Precio Compra',
            sharePct: Math.min(100, (live.compra / live.venta) * 100),
            detail: `$${formatArgNumber(live.compra, 2)}`,
          },
          {
            name: 'Precio Venta',
            sharePct: 100,
            detail: `$${formatArgNumber(live.venta, 2)}`,
          },
          ...(spreadPct !== null
            ? [
                {
                  name: 'Spread Compra / Venta',
                  sharePct: Math.min(100, Math.max(4, spreadPct * 10)),
                  detail: `${formatArgNumber(spreadPct, 2)}%`,
                },
              ]
            : []),
        ]
      : undefined;

    cards.push(
      buildIndicator({
        id,
        category: 'mercados',
        title,
        subtitle: `${compraStr} · DolarApi`,
        source: 'DolarApi / ArgentinaDatos',
        unitType: 'ars',
        unitPrefix: '$',
        unitSuffix: '',
        decimals: 2,
        changeMode: 'pct',
        changeLabel: 'vs. cierre anterior',
        frequencyLabel: 'Diario',
        fullSeries: buildSeriesPoints(raw, 'daily', 'pct'),
        cardWindow: 60,
        isLiveApi: true,
        realtimeTimestamp: live?.fechaActualizacion ?? new Date().toISOString(),
        liveSubcomponents: liveSubs,
      })
    );
  };

  addDollarCard('dolar-oficial', 'Dólar Oficial (Venta)', 'oficial', oficialRaw);
  addDollarCard('dolar-blue', 'Dólar Blue', 'blue', blueRaw);

  if (brechaRaw.length > 0) {
    const oficialTs = quoteMap.get('oficial')?.fechaActualizacion;
    const blueTs = quoteMap.get('blue')?.fechaActualizacion;
    const latestBrechaTs =
      oficialTs && blueTs
        ? oficialTs > blueTs
          ? oficialTs
          : blueTs
        : blueTs ?? oficialTs ?? new Date().toISOString();
    cards.push(
      buildIndicator({
        id: 'brecha-cambiaria',
        category: 'mercados',
        title: 'Brecha Cambiaria (Blue / Oficial)',
        subtitle: 'Diferencia porcentual entre Blue y Oficial',
        source: 'Cálculo DolarApi',
        unitType: 'pct',
        unitSuffix: '%',
        decimals: 2,
        changeMode: 'pp',
        changeLabel: 'vs. jornada anterior',
        frequencyLabel: 'Diario',
        fullSeries: buildSeriesPoints(brechaRaw, 'daily', 'pp'),
        cardWindow: 60,
        isLiveApi: true,
        realtimeTimestamp: latestBrechaTs,
      })
    );
  }

  addDollarCard('dolar-mep', 'Dólar MEP (Bolsa)', 'bolsa', mepRaw);
  addDollarCard('dolar-ccl', 'Dólar CCL', 'contadoconliqui', cclRaw);
  addDollarCard('dolar-cripto', 'Dólar Cripto', 'cripto', criptoRaw);

  if (riesgoRes.status === 'fulfilled' && riesgoRes.value.length > 0) {
    const rpRaw = riesgoRes.value
      .filter((r) => Number.isFinite(r.valor))
      .slice(-3650)
      .map((r) => ({ date: r.fecha, value: r.valor }));
    cards.push(
      buildIndicator({
        id: 'riesgo-pais',
        category: 'mercados',
        title: 'Riesgo País (EMBI+)',
        subtitle: 'Puntos básicos sobre bonos del Tesoro EE.UU.',
        source: 'JP Morgan / ArgentinaDatos',
        unitType: 'pts',
        unitSuffix: ' pts',
        decimals: 0,
        changeMode: 'pts',
        changeLabel: 'vs. cierre anterior',
        frequencyLabel: 'Diario',
        fullSeries: buildSeriesPoints(rpRaw, 'daily', 'pts'),
        cardWindow: 60,
        isLiveApi: true,
        realtimeTimestamp: new Date().toISOString(),
      })
    );
  }

  const depRaw =
    depositosRes.status === 'fulfilled'
      ? depositosRes.value
          .filter((d) => Number.isFinite(d.valor) && d.valor > 0)
          .slice(-3650)
          .map((d) => ({ date: d.fecha, value: d.valor }))
      : [];

  let liveTnaAvg: number | null = null;
  let bankCount = 0;
  let bankSubs: SubcomponentItem[] | undefined;

  if (plazoFijoRes.status === 'fulfilled') {
    const valid = plazoFijoRes.value.filter(
      (b) => Number.isFinite(b.tnaClientes) && b.tnaClientes > 0
    );
    bankCount = valid.length;
    if (valid.length > 0) {
      liveTnaAvg =
        (valid.reduce((acc, b) => acc + b.tnaClientes, 0) / valid.length) * 100;
      const topBanks = [...valid]
        .sort((a, b) => b.tnaClientes - a.tnaClientes)
        .slice(0, 6);
      const maxTna = topBanks[0].tnaClientes * 100;
      bankSubs = topBanks.map((b) => {
        const tnaPct = b.tnaClientes * 100;
        return {
          name: b.entidad
            .replace(/ S\.A\.U\.| S\.A\.| ARGENTINA| Y BUENOS AIRES/gi, '')
            .trim(),
          sharePct: maxTna > 0 ? (tnaPct / maxTna) * 100 : 0,
          detail: `${formatArgNumber(tnaPct, 2)}% TNA`,
        };
      });
    }
  }

  if (depRaw.length > 0 || liveTnaAvg !== null) {
    const seriesInput = [...depRaw];
    if (liveTnaAvg !== null) {
      const todayIso = new Date().toISOString().slice(0, 10);
      const last = seriesInput[seriesInput.length - 1];
      if (!last || last.date < todayIso) {
        seriesInput.push({ date: todayIso, value: liveTnaAvg });
      }
    }
    cards.push(
      buildIndicator({
        id: 'plazo-fijo',
        category: 'mercados',
        title: 'Tasa Plazo Fijo (TNA 30 días)',
        subtitle:
          bankCount > 0
            ? `Promedio ${bankCount} entidades bancarias · BCRA`
            : 'Tasa Nominal Anual promedio · BCRA',
        source: 'BCRA / ArgentinaDatos',
        unitType: 'pct',
        unitSuffix: '%',
        decimals: 2,
        changeMode: 'pp',
        changeLabel: 'vs. registro anterior',
        frequencyLabel: 'Diario',
        fullSeries: buildSeriesPoints(seriesInput, 'daily', 'pp'),
        cardWindow: 60,
        isLiveApi: true,
        realtimeTimestamp: new Date().toISOString(),
        liveSubcomponents: bankSubs,
      })
    );
  }

  return cards;
}

export async function fetchPreciosIndicators(): Promise<IndicatorData[]> {
  const [infRes, infIaRes, uvaRes] = await Promise.allSettled([
    fetchJson<ArgentinaDatosValor[]>('https://api.argentinadatos.com/v1/finanzas/indices/inflacion'),
    fetchJson<ArgentinaDatosValor[]>('https://api.argentinadatos.com/v1/finanzas/indices/inflacionInteranual'),
    fetchJson<ArgentinaDatosValor[]>('https://api.argentinadatos.com/v1/finanzas/indices/uva'),
  ]);

  const cards: IndicatorData[] = [];

  if (infRes.status === 'fulfilled' && infRes.value.length > 0) {
    const allInf = infRes.value.filter((d) => Number.isFinite(d.valor));
    const infHist = allInf.slice(-180).map((d) => ({ date: d.fecha, value: d.valor }));

    cards.push(
      buildIndicator({
        id: 'inflacion-mensual',
        category: 'precios',
        title: 'Inflación Mensual (IPC)',
        subtitle: 'Variación mensual nivel general nacional',
        source: 'INDEC / ArgentinaDatos',
        unitType: 'pct',
        unitSuffix: '%',
        decimals: 1,
        changeMode: 'pp',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(infHist, 'monthly', 'pp'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );

    const ytdMap = new Map<string, number>();
    let currentYear = '';
    let accFactor = 1;
    for (const item of infHist) {
      const y = item.date.slice(0, 4);
      if (y !== currentYear) {
        currentYear = y;
        accFactor = 1;
      }
      accFactor *= 1 + item.value / 100;
      ytdMap.set(item.date, (accFactor - 1) * 100);
    }
    const ytdRaw = infHist.map((d) => ({
      date: d.date,
      value: ytdMap.get(d.date) ?? 0,
    }));
    cards.push(
      buildIndicator({
        id: 'inflacion-acumulada',
        category: 'precios',
        title: 'Inflación Acumulada en el Año',
        subtitle: 'Variación acumulada anual (YTD) IPC',
        source: 'INDEC / Cálculo IPC',
        unitType: 'pct',
        unitSuffix: '%',
        decimals: 1,
        changeMode: 'pp',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(ytdRaw, 'monthly', 'pp'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  if (infIaRes.status === 'fulfilled' && infIaRes.value.length > 0) {
    const infIaHist = infIaRes.value
      .filter((d) => Number.isFinite(d.valor))
      .slice(-180)
      .map((d) => ({ date: d.fecha, value: d.valor }));
    cards.push(
      buildIndicator({
        id: 'inflacion-interanual',
        category: 'precios',
        title: 'Inflación Interanual (IPC)',
        subtitle: 'Variación acumulada últimos 12 meses',
        source: 'INDEC / ArgentinaDatos',
        unitType: 'pct',
        unitSuffix: '%',
        decimals: 1,
        changeMode: 'pp',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(infIaHist, 'monthly', 'pp'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  if (uvaRes.status === 'fulfilled' && uvaRes.value.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const uvaFiltered = uvaRes.value
      .filter((d) => Number.isFinite(d.valor) && d.fecha <= today)
      .slice(-3650)
      .map((d) => ({ date: d.fecha, value: d.valor }));
    cards.push(
      buildIndicator({
        id: 'indice-uva',
        category: 'precios',
        title: 'Índice UVA (Unidad de Valor Adquisitivo)',
        subtitle: 'Valor diario actualizado por CER · BCRA',
        source: 'BCRA / ArgentinaDatos',
        unitType: 'ars',
        unitPrefix: '$',
        unitSuffix: '',
        decimals: 2,
        changeMode: 'pct',
        changeLabel: 'vs. día anterior',
        frequencyLabel: 'Diario',
        fullSeries: buildSeriesPoints(uvaFiltered, 'daily', 'pct'),
        cardWindow: 90,
        isLiveApi: true,
        realtimeTimestamp: new Date().toISOString(),
      })
    );
  }

  return cards;
}

export async function fetchActividadIndicators(): Promise<IndicatorData[]> {
  const [emaeDesestRes, emaeOrigRes, pbiRes, pobRes, consumoRes, fbcfRes] =
    await Promise.allSettled([
      fetchDatosGobSeries('143.3_NO_PR_2004_A_31', 180, 1),
      fetchDatosGobSeries('143.3_NO_PR_2004_A_21', 180, 1),
      fetchDatosGobSeries('9.2_PP2_2004_T_16', 88, 1),
      fetchDatosGobSeries('9.2_P_2004_T_9', 88, 1),
      fetchDatosGobSeries('3.2_DGCP_D_2004_T_27', 88, 1),
      fetchDatosGobSeries('166.2_F_BRUTAIJO_0_0_19', 80, 0.001),
    ]);

  const emaeDesestSeries =
    emaeDesestRes.status === 'fulfilled'
      ? buildSeriesPoints(emaeDesestRes.value, 'monthly', 'pct')
      : FALLBACK_EMAE_DESEST;

  const emaeOrigSeries =
    emaeOrigRes.status === 'fulfilled'
      ? buildSeriesPoints(emaeOrigRes.value, 'monthly', 'pct')
      : FALLBACK_EMAE_ORIG;

  const pbiSeries =
    pbiRes.status === 'fulfilled'
      ? buildSeriesPoints(pbiRes.value, 'quarterly', 'pct')
      : FALLBACK_PBI_CONST;

  let pbiPerCapitaSeries = FALLBACK_PBI_PER_CAPITA;
  let pbiPcLive = false;
  if (pbiRes.status === 'fulfilled' && pobRes.status === 'fulfilled') {
    const pobMap = new Map(pobRes.value.map((p) => [p.date, p.value]));
    const pcRaw = pbiRes.value
      .filter((row) => pobMap.has(row.date) && (pobMap.get(row.date) ?? 0) > 0)
      .map((row) => ({
        date: row.date,
        value: (row.value * 1_000_000) / (pobMap.get(row.date) ?? 1),
      }));
    if (pcRaw.length > 0) {
      pbiPerCapitaSeries = buildSeriesPoints(pcRaw, 'quarterly', 'pct');
      pbiPcLive = true;
    }
  }

  const consumoSeries =
    consumoRes.status === 'fulfilled'
      ? buildSeriesPoints(consumoRes.value, 'quarterly', 'pct')
      : FALLBACK_CONSUMO_PRIVADO;

  const fbcfSeries =
    fbcfRes.status === 'fulfilled'
      ? buildSeriesPoints(fbcfRes.value, 'quarterly', 'pct')
      : FALLBACK_INVERSION_FBCF;

  return [
    buildIndicator({
      id: 'emae-desestacionalizado',
      category: 'actividad',
      title: 'EMAE (Desestacionalizado)',
      subtitle: 'Estimador Mensual de Actividad Económica · Base 2004=100',
      source: 'INDEC · datos.gob.ar',
      unitType: 'idx',
      unitSuffix: ' pts',
      decimals: 2,
      changeMode: 'pct',
      changeLabel: 'vs. mes anterior',
      frequencyLabel: 'Mensual',
      fullSeries: emaeDesestSeries,
      cardWindow: 36,
      isLiveApi: emaeDesestRes.status === 'fulfilled',
    }),
    buildIndicator({
      id: 'emae-original',
      category: 'actividad',
      title: 'EMAE (Serie Original)',
      subtitle: 'Actividad económica mensual sin ajuste estacional',
      source: 'INDEC · datos.gob.ar',
      unitType: 'idx',
      unitSuffix: ' pts',
      decimals: 2,
      changeMode: 'pct',
      changeLabel: 'vs. mes anterior',
      frequencyLabel: 'Mensual',
      fullSeries: emaeOrigSeries,
      cardWindow: 36,
      isLiveApi: emaeOrigRes.status === 'fulfilled',
    }),
    buildIndicator({
      id: 'pbi-constante',
      category: 'actividad',
      title: 'PBI a Precios Constantes',
      subtitle: 'Millones de pesos a precios de 2004 · Trimestral',
      source: 'INDEC · datos.gob.ar',
      unitType: 'ars_m',
      unitPrefix: '$ ',
      unitSuffix: ' M',
      decimals: 0,
      changeMode: 'pct',
      changeLabel: 'vs. trimestre anterior',
      frequencyLabel: 'Trimestral',
      fullSeries: pbiSeries,
      cardWindow: 24,
      isLiveApi: pbiRes.status === 'fulfilled',
    }),
    buildIndicator({
      id: 'pbi-per-capita',
      category: 'actividad',
      title: 'PBI per Cápita (Precios 2004)',
      subtitle: 'Producto por habitante a precios constantes de 2004',
      source: 'INDEC · datos.gob.ar',
      unitType: 'ars',
      unitPrefix: '$',
      unitSuffix: '',
      decimals: 0,
      changeMode: 'pct',
      changeLabel: 'vs. trimestre anterior',
      frequencyLabel: 'Trimestral',
      fullSeries: pbiPerCapitaSeries,
      cardWindow: 24,
      isLiveApi: pbiPcLive,
    }),
    buildIndicator({
      id: 'consumo-privado',
      category: 'actividad',
      title: 'Consumo Privado (Desestacionalizado)',
      subtitle: 'Millones de pesos a precios de 2004',
      source: 'INDEC · datos.gob.ar',
      unitType: 'ars_m',
      unitPrefix: '$ ',
      unitSuffix: ' M',
      decimals: 0,
      changeMode: 'pct',
      changeLabel: 'vs. trimestre anterior',
      frequencyLabel: 'Trimestral',
      fullSeries: consumoSeries,
      cardWindow: 24,
      isLiveApi: consumoRes.status === 'fulfilled',
    }),
    buildIndicator({
      id: 'inversion-fbcf',
      category: 'actividad',
      title: 'Inversión (Formación Bruta Capital Fijo)',
      subtitle: 'Miles de millones de pesos corrientes · Trimestral',
      source: 'INDEC · datos.gob.ar',
      unitType: 'ars_b',
      unitPrefix: '$ ',
      unitSuffix: ' MM',
      decimals: 1,
      changeMode: 'pct',
      changeLabel: 'vs. trimestre anterior',
      frequencyLabel: 'Trimestral',
      fullSeries: fbcfSeries,
      cardWindow: 24,
      isLiveApi: fbcfRes.status === 'fulfilled',
    }),
  ];
}

export async function fetchIngresosIndicators(): Promise<IndicatorData[]> {
  const currentMonthCutoff = `${new Date().toISOString().slice(0, 7)}-31`;

  const [smvmRes, cbtRes, cbaRes] = await Promise.allSettled([
    fetchDatosGobSeries('57.1_SMVMM_0_M_34', 160, 1, currentMonthCutoff),
    fetchDatosGobSeries('150.1_LA_POBREZA_0_D_13', 140, 1),
    fetchDatosGobSeries('150.1_LA_INDICIA_0_D_16', 140, 1),
  ]);

  const cards: IndicatorData[] = [];

  if (smvmRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'smvm',
        category: 'ingresos',
        title: 'Salario Mínimo, Vital y Móvil',
        subtitle: 'Monto mensual vigente en pesos corrientes',
        source: 'Secretaría de Trabajo · datos.gob.ar',
        unitType: 'ars',
        unitPrefix: '$',
        unitSuffix: '',
        decimals: 0,
        changeMode: 'pct',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(smvmRes.value, 'monthly', 'pct'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  if (cbtRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'canasta-basica-total',
        category: 'ingresos',
        title: 'Canasta Básica Total (CBT)',
        subtitle: 'Línea de pobreza · Hogar Tipo 2 (4 integrantes)',
        source: 'INDEC · datos.gob.ar',
        unitType: 'ars',
        unitPrefix: '$',
        unitSuffix: '',
        decimals: 2,
        changeMode: 'pct',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(cbtRes.value, 'monthly', 'pct'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  if (cbaRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'canasta-basica-alimentaria',
        category: 'ingresos',
        title: 'Canasta Básica Alimentaria (CBA)',
        subtitle: 'Línea de indigencia · Hogar Tipo 2 (4 integrantes)',
        source: 'INDEC · datos.gob.ar',
        unitType: 'ars',
        unitPrefix: '$',
        unitSuffix: '',
        decimals: 2,
        changeMode: 'pct',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(cbaRes.value, 'monthly', 'pct'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  if (smvmRes.status === 'fulfilled' && cbtRes.status === 'fulfilled') {
    const smvmMap = new Map(smvmRes.value.map((s) => [s.date.slice(0, 7), s.value]));
    const ratioRaw = cbtRes.value
      .filter((c) => smvmMap.has(c.date.slice(0, 7)) && c.value > 0)
      .map((c) => ({
        date: c.date,
        value: ((smvmMap.get(c.date.slice(0, 7)) ?? 0) / c.value) * 100,
      }));
    if (ratioRaw.length > 0) {
      cards.push(
        buildIndicator({
          id: 'cobertura-smvm-cbt',
          category: 'ingresos',
          title: 'Cobertura SMVM sobre Canasta Básica',
          subtitle: 'Porcentaje de la CBT cubierto por un Salario Mínimo',
          source: 'Cálculo INDEC / Trabajo',
          unitType: 'pct',
          unitSuffix: '%',
          decimals: 1,
          changeMode: 'pp',
          changeLabel: 'vs. mes anterior',
          frequencyLabel: 'Mensual',
          fullSeries: buildSeriesPoints(ratioRaw, 'monthly', 'pp'),
          cardWindow: 24,
          isLiveApi: true,
        })
      );
    }
  }

  return cards;
}

export async function fetchSociedadIndicators(): Promise<IndicatorData[]> {
  const [desocRes, pobrezaRes, hogaresRes] = await Promise.allSettled([
    fetchDatosGobSeries('42.3_EPH_PUNTUATAL_0_M_30', 80, 100),
    fetchDatosGobSeries('64.2_POBLACION_NUA_0_0_34_74', 40, 100),
    fetchDatosGobSeries('63.2_HOGARES_PONUA_0_0_33_21', 40, 100),
  ]);

  const cards: IndicatorData[] = [];

  if (desocRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'tasa-desocupacion',
        category: 'sociedad',
        title: 'Tasa de Desocupación',
        subtitle: 'Población Económicamente Activa · Total 31 aglomerados EPH',
        source: 'INDEC · datos.gob.ar',
        unitType: 'pct',
        unitSuffix: '%',
        decimals: 1,
        changeMode: 'pp',
        changeLabel: 'vs. trimestre anterior',
        frequencyLabel: 'Trimestral',
        fullSeries: buildSeriesPoints(desocRes.value, 'quarterly', 'pp'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  if (pobrezaRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'tasa-pobreza',
        category: 'sociedad',
        title: 'Tasa de Pobreza (Personas)',
        subtitle: 'Personas bajo la Línea de Pobreza · Total aglomerados EPH',
        source: 'INDEC · datos.gob.ar',
        unitType: 'pct',
        unitSuffix: '%',
        decimals: 1,
        changeMode: 'pp',
        changeLabel: 'vs. semestre anterior',
        frequencyLabel: 'Semestral',
        fullSeries: buildSeriesPoints(pobrezaRes.value, 'semiannual', 'pp'),
        cardWindow: 20,
        isLiveApi: true,
      })
    );
  }

  cards.push(
    buildIndicator({
      id: 'tasa-indigencia',
      category: 'sociedad',
      title: 'Tasa de Indigencia (Personas)',
      subtitle: 'Personas bajo la Línea de Indigencia · EPH Semestral',
      source: 'INDEC · EPH',
      unitType: 'pct',
      unitSuffix: '%',
      decimals: 1,
      changeMode: 'pp',
      changeLabel: 'vs. semestre anterior',
      frequencyLabel: 'Semestral',
      fullSeries: INDIGENCIA_INDEC_SERIES,
      cardWindow: 20,
      isLiveApi: false,
    })
  );

  if (hogaresRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'hogares-pobreza',
        category: 'sociedad',
        title: 'Hogares bajo la Línea de Pobreza',
        subtitle: 'Porcentaje de hogares pobres · Total aglomerados EPH',
        source: 'INDEC · datos.gob.ar',
        unitType: 'pct',
        unitSuffix: '%',
        decimals: 1,
        changeMode: 'pp',
        changeLabel: 'vs. semestre anterior',
        frequencyLabel: 'Semestral',
        fullSeries: buildSeriesPoints(hogaresRes.value, 'semiannual', 'pp'),
        cardWindow: 20,
        isLiveApi: true,
      })
    );
  }

  return cards;
}

export async function fetchExternoIndicators(): Promise<IndicatorData[]> {
  const [reservasRes, expoRes, impoRes, saldoRes] = await Promise.allSettled([
    fetchDatosGobSeries('92.2_RESERVAS_IRES_0_0_32_40', 1800, 1),
    fetchDatosGobSeries('74.3_IET_0_M_16', 140, 1),
    fetchDatosGobSeries('74.3_IIT_0_M_25', 140, 1),
    fetchDatosGobSeries('74.3_ISC_0_M_19', 140, 1),
  ]);

  const cards: IndicatorData[] = [];

  if (reservasRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'reservas-bcra',
        category: 'externo',
        title: 'Reservas Internacionales (BCRA)',
        subtitle: 'Stock bruto en millones de dólares estadounidenses',
        source: 'BCRA · datos.gob.ar',
        unitType: 'usd_m',
        unitPrefix: 'USD ',
        unitSuffix: ' M',
        decimals: 0,
        changeMode: 'pct',
        changeLabel: 'vs. día anterior',
        frequencyLabel: 'Diario',
        fullSeries: buildSeriesPoints(reservasRes.value, 'daily', 'pct'),
        cardWindow: 60,
        isLiveApi: true,
      })
    );
  }

  if (expoRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'exportaciones-fob',
        category: 'externo',
        title: 'Exportaciones Totales (FOB)',
        subtitle: 'Intercambio Comercial Argentino · Millones de USD',
        source: 'INDEC · datos.gob.ar',
        unitType: 'usd_m',
        unitPrefix: 'USD ',
        unitSuffix: ' M',
        decimals: 1,
        changeMode: 'pct',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(expoRes.value, 'monthly', 'pct'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  if (impoRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'importaciones-cif',
        category: 'externo',
        title: 'Importaciones Totales (CIF)',
        subtitle: 'Intercambio Comercial Argentino · Millones de USD',
        source: 'INDEC · datos.gob.ar',
        unitType: 'usd_m',
        unitPrefix: 'USD ',
        unitSuffix: ' M',
        decimals: 1,
        changeMode: 'pct',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(impoRes.value, 'monthly', 'pct'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  if (saldoRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'balanza-comercial',
        category: 'externo',
        title: 'Balanza Comercial (Saldo)',
        subtitle: 'Superávit o déficit comercial mensual · Millones de USD',
        source: 'INDEC · datos.gob.ar',
        unitType: 'usd_m',
        unitPrefix: 'USD ',
        unitSuffix: ' M',
        decimals: 1,
        changeMode: 'pct',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(saldoRes.value, 'monthly', 'pct'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  return cards;
}

export async function fetchFinanzasIndicators(): Promise<IndicatorData[]> {
  const [primarioRes, financieroRes, recaudacionRes, baseRes] = await Promise.allSettled([
    fetchDatosGobSeries('452.3_RESULTADO_RIO_0_M_18_54', 120, 0.001),
    fetchDatosGobSeries('452.2_RESULTADO_ERO_0_T_20_32', 48, 0.001),
    fetchDatosGobSeries('172.3_TL_RECAION_M_0_0_17', 140, 0.001),
    fetchDatosGobSeries('331.1_SALDO_BASERIA__15', 140, 0.001),
  ]);

  const cards: IndicatorData[] = [];

  if (primarioRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'resultado-primario',
        category: 'finanzas',
        title: 'Resultado Fiscal Primario (SPNF)',
        subtitle: 'Miles de millones de pesos · Antes de intereses de deuda',
        source: 'Secretaría de Hacienda · datos.gob.ar',
        unitType: 'ars_b',
        unitPrefix: '$ ',
        unitSuffix: ' MM',
        decimals: 1,
        changeMode: 'pct',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(primarioRes.value, 'monthly', 'pct'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  if (financieroRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'resultado-financiero',
        category: 'finanzas',
        title: 'Resultado Fiscal Financiero (SPNF)',
        subtitle: 'Miles de millones de pesos · Incluye pago de intereses',
        source: 'Secretaría de Hacienda · datos.gob.ar',
        unitType: 'ars_b',
        unitPrefix: '$ ',
        unitSuffix: ' MM',
        decimals: 1,
        changeMode: 'pct',
        changeLabel: 'vs. trimestre anterior',
        frequencyLabel: 'Trimestral',
        fullSeries: buildSeriesPoints(financieroRes.value, 'quarterly', 'pct'),
        cardWindow: 20,
        isLiveApi: true,
      })
    );
  }

  if (recaudacionRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'recaudacion-tributaria',
        category: 'finanzas',
        title: 'Recaudación Tributaria Total',
        subtitle: 'Miles de millones de pesos · Ingresos impositivos y aduaneros',
        source: 'ARCA / Hacienda · datos.gob.ar',
        unitType: 'ars_b',
        unitPrefix: '$ ',
        unitSuffix: ' MM',
        decimals: 1,
        changeMode: 'pct',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(recaudacionRes.value, 'monthly', 'pct'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  if (baseRes.status === 'fulfilled') {
    cards.push(
      buildIndicator({
        id: 'base-monetaria',
        category: 'finanzas',
        title: 'Base Monetaria (BCRA)',
        subtitle: 'Circulante y encajes en miles de millones de pesos',
        source: 'BCRA · datos.gob.ar',
        unitType: 'ars_b',
        unitPrefix: '$ ',
        unitSuffix: ' MM',
        decimals: 1,
        changeMode: 'pct',
        changeLabel: 'vs. mes anterior',
        frequencyLabel: 'Mensual',
        fullSeries: buildSeriesPoints(baseRes.value, 'monthly', 'pct'),
        cardWindow: 24,
        isLiveApi: true,
      })
    );
  }

  return cards;
}

export async function fetchCategoryIndicators(category: CategoryId): Promise<IndicatorData[]> {
  switch (category) {
    case 'mercados':
      return fetchMercadosIndicators();
    case 'precios':
      return fetchPreciosIndicators();
    case 'actividad':
      return fetchActividadIndicators();
    case 'ingresos':
      return fetchIngresosIndicators();
    case 'sociedad':
      return fetchSociedadIndicators();
    case 'externo':
      return fetchExternoIndicators();
    case 'finanzas':
      return fetchFinanzasIndicators();
  }
}

export async function fetchIndicatorNews(query: string): Promise<NewsArticle[]> {
  const res = await fetchJson<{ items?: NewsArticle[] }>(
    `/api/news?q=${encodeURIComponent(query)}`,
    6500
  );
  return res.items ?? [];
}
