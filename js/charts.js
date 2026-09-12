let graficoFluxo, graficoTipos;

export function atualizarGraficos(dados) {
    let totalEntradas = 0;
    let totalSaidas = 0;
    let gastosPorTipo = {};

    dados.forEach(d => {
        if(d.fluxo.toLowerCase() === 'entrada') totalEntradas += d.valor;
        if(d.fluxo.toLowerCase() === 'saída' || d.fluxo.toLowerCase() === 'saida') {
            totalSaidas += d.valor;
            let tipoLabel = d.tipo || 'Não Categorizado';
            gastosPorTipo[tipoLabel] = (gastosPorTipo[tipoLabel] || 0) + d.valor;
        }
    });

    renderChartFluxo(totalEntradas, totalSaidas);
    renderChartTipos(gastosPorTipo);
}

function renderChartFluxo(entradas, saidas) {
    const ctx = document.getElementById('chartFluxo').getContext('2d');
    if(graficoFluxo) graficoFluxo.destroy();
    
    graficoFluxo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                label: 'Total em R$',
                data: [entradas, saidas],
                backgroundColor: ['#34a853', '#ea4335'],
                borderRadius: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderChartTipos(gastos) {
    const ctx = document.getElementById('chartTipos').getContext('2d');
    if(graficoTipos) graficoTipos.destroy();
    
    const labels = Object.entries(gastos).map(([chave, valor]) => {
        return `${chave}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    });
    
    const data = Object.values(gastos);

    graficoTipos = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Sem dados'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: data.length ? ['#4285f4', '#fbbc05', '#ff6d01', '#46bdc6', '#9c27b0', '#795548'] : ['#e0e0e0'],
                borderWidth: 2
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            cutout: '60%', 
            plugins: { 
                legend: { position: 'right' } 
            } 
        }
    });
}