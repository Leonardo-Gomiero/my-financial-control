let graficoFluxo, graficoTipos, graficoEvolucao, graficoSubtipos;

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const nomesMesesAbrev = {
    1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
    7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
};

const CORES = ['#6ea8fe', '#f5b942', '#c084fc', '#4ade80', '#38bdf8', '#fb923c', '#f472b6', '#a3e635'];

const COR_TEXTO_MUTED = '#8b949e';
const COR_BORDA = '#262c36';
const COR_ENTRADA = '#4ade80';
const COR_SAIDA = '#f97066';

Chart.defaults.color = COR_TEXTO_MUTED;
Chart.defaults.borderColor = COR_BORDA;
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = '#1c2129';
Chart.defaults.plugins.tooltip.titleColor = '#e6edf3';
Chart.defaults.plugins.tooltip.bodyColor = '#e6edf3';
Chart.defaults.plugins.tooltip.borderColor = COR_BORDA;
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;

function isEntrada(fluxo) {
    return (fluxo || '').toLowerCase() === 'entrada';
}

function isSaida(fluxo) {
    const f = (fluxo || '').toLowerCase();
    return f === 'saída' || f === 'saida';
}

export function atualizarAnalise(dadosFiltrados, dadosTendencia) {
    const kpis = calcularKPIs(dadosFiltrados);
    atualizarKPIsDOM(kpis);

    renderChartFluxo(kpis.totalEntradas, kpis.totalSaidas);
    renderChartTipos(agruparPorTipo(dadosFiltrados));
    renderChartEvolucao(agruparPorMes(dadosTendencia));
    renderChartSubtipos(agruparPorSubtipo(dadosFiltrados));
}

function calcularKPIs(dados) {
    let totalEntradas = 0;
    let totalSaidas = 0;

    dados.forEach(d => {
        if (isEntrada(d.fluxo)) totalEntradas += d.valor;
        else if (isSaida(d.fluxo)) totalSaidas += d.valor;
    });

    const saldo = totalEntradas - totalSaidas;
    const taxaEconomia = totalEntradas > 0 ? (saldo / totalEntradas) * 100 : 0;

    return { totalEntradas, totalSaidas, saldo, taxaEconomia };
}

function atualizarKPIsDOM({ totalEntradas, totalSaidas, saldo, taxaEconomia }) {
    document.getElementById('kpiEntradas').textContent = formatoMoeda.format(totalEntradas);
    document.getElementById('kpiSaidas').textContent = formatoMoeda.format(totalSaidas);

    const elSaldo = document.getElementById('kpiSaldo');
    elSaldo.textContent = formatoMoeda.format(saldo);
    elSaldo.classList.toggle('kpi-positive', saldo >= 0);
    elSaldo.classList.toggle('kpi-negative', saldo < 0);

    const elEconomia = document.getElementById('kpiEconomia');
    elEconomia.textContent = `${taxaEconomia.toFixed(1)}%`;
    elEconomia.classList.toggle('kpi-positive', taxaEconomia >= 0);
    elEconomia.classList.toggle('kpi-negative', taxaEconomia < 0);
}

function agruparPorTipo(dados) {
    const gastos = {};
    dados.forEach(d => {
        if (isSaida(d.fluxo)) {
            const chave = d.tipo || 'Não Categorizado';
            gastos[chave] = (gastos[chave] || 0) + d.valor;
        }
    });
    return gastos;
}

function agruparPorSubtipo(dados) {
    const gastos = {};
    dados.forEach(d => {
        if (isSaida(d.fluxo)) {
            const chave = d.subtipo || 'Não Categorizado';
            gastos[chave] = (gastos[chave] || 0) + d.valor;
        }
    });
    return Object.entries(gastos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
}

function agruparPorMes(dados) {
    const grupos = {};

    dados.forEach(d => {
        if (!d.ano || !d.mes) return;
        const chave = `${d.ano}-${String(d.mes).padStart(2, '0')}`;
        if (!grupos[chave]) grupos[chave] = { entradas: 0, saidas: 0 };
        if (isEntrada(d.fluxo)) grupos[chave].entradas += d.valor;
        else if (isSaida(d.fluxo)) grupos[chave].saidas += d.valor;
    });

    return Object.keys(grupos)
        .sort()
        .map(chave => {
            const [ano, mes] = chave.split('-');
            return {
                label: `${nomesMesesAbrev[Number(mes)] || mes}/${ano.slice(2)}`,
                ...grupos[chave]
            };
        });
}

function renderChartFluxo(entradas, saidas) {
    const ctx = document.getElementById('chartFluxo').getContext('2d');
    if (graficoFluxo) graficoFluxo.destroy();

    graficoFluxo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                label: 'Total em R$',
                data: [entradas, saidas],
                backgroundColor: [COR_ENTRADA, COR_SAIDA],
                borderRadius: 6,
                maxBarThickness: 90
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => formatoMoeda.format(ctx.parsed.y) } }
            },
            scales: {
                y: { grid: { color: COR_BORDA }, ticks: { callback: v => formatoMoeda.format(v) } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderChartTipos(gastos) {
    const ctx = document.getElementById('chartTipos').getContext('2d');
    if (graficoTipos) graficoTipos.destroy();

    const entradas = Object.entries(gastos).sort((a, b) => b[1] - a[1]);
    const labels = entradas.map(([chave]) => chave);
    const data = entradas.map(([, valor]) => valor);

    graficoTipos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Sem dados'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: data.length ? CORES : ['#2a2f3a'],
                borderWidth: 2,
                borderColor: '#161b22'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.label}: ${formatoMoeda.format(ctx.parsed)}`
                    }
                }
            }
        }
    });
}

function renderChartEvolucao(meses) {
    const ctx = document.getElementById('chartEvolucao').getContext('2d');
    if (graficoEvolucao) graficoEvolucao.destroy();

    graficoEvolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: meses.map(m => m.label),
            datasets: [
                {
                    label: 'Entradas',
                    data: meses.map(m => m.entradas),
                    borderColor: COR_ENTRADA,
                    backgroundColor: 'rgba(74, 222, 128, 0.12)',
                    tension: 0.35,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: COR_ENTRADA
                },
                {
                    label: 'Saídas',
                    data: meses.map(m => m.saidas),
                    borderColor: COR_SAIDA,
                    backgroundColor: 'rgba(249, 112, 102, 0.12)',
                    tension: 0.35,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: COR_SAIDA
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatoMoeda.format(ctx.parsed.y)}` } }
            },
            scales: {
                y: { grid: { color: COR_BORDA }, ticks: { callback: v => formatoMoeda.format(v) } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderChartSubtipos(entradas) {
    const ctx = document.getElementById('chartSubtipos').getContext('2d');
    if (graficoSubtipos) graficoSubtipos.destroy();

    const labels = entradas.map(([chave]) => chave);
    const data = entradas.map(([, valor]) => valor);

    graficoSubtipos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Sem dados'],
            datasets: [{
                data: data.length ? data : [0],
                backgroundColor: CORES,
                borderRadius: 6,
                maxBarThickness: 26
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => formatoMoeda.format(ctx.parsed.x) } }
            },
            scales: {
                x: { grid: { color: COR_BORDA }, ticks: { callback: v => formatoMoeda.format(v) } },
                y: { grid: { display: false } }
            }
        }
    });
}
