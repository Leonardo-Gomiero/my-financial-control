import { fetchSheetData } from './api.js';
import { atualizarAnalise } from './charts.js';

let baseDados = [];

const nomesMeses = {
    1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
    5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
    9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
};

const elLoading = document.getElementById('loading');
const elApp = document.getElementById('app');
const elEmptyState = document.getElementById('emptyState');

const selects = {
    ano: document.getElementById('fAno'),
    mes: document.getElementById('fMes'),
    tipo: document.getElementById('fTipo'),
    subtipo: document.getElementById('fSubtipo')
};

window.addEventListener('DOMContentLoaded', carregarDados);
document.getElementById('btnAtualizar').addEventListener('click', carregarDados);

Object.values(selects).forEach(select => {
    select.addEventListener('change', aplicarFiltros);
});

async function carregarDados() {
    elLoading.hidden = false;
    elApp.hidden = true;

    try {
        baseDados = await fetchSheetData();
        popularSelects(baseDados);

        const hoje = new Date();
        const anoAtual = hoje.getFullYear().toString();
        const mesAtualNumerico = hoje.getMonth() + 1;

        const anoExiste = Array.from(selects.ano.options).some(opt => opt.value === anoAtual);
        selects.ano.value = anoExiste ? anoAtual : "";

        const mesOption = Array.from(selects.mes.options).find(opt => Number(opt.value) === mesAtualNumerico);
        selects.mes.value = mesOption ? mesOption.value : "";

        aplicarFiltros();

        elLoading.hidden = true;
        elApp.hidden = false;
    } catch (erro) {
        console.error("Falha ao inicializar app:", erro);
        elLoading.innerHTML = '<span>Erro ao carregar os dados.</span>';
    }
}

function popularSelects(dados) {
    const extrairUnicos = (chave) => [...new Set(dados.map(d => d[chave]).filter(Boolean))].sort();

    preencherOpcoes(selects.ano, extrairUnicos('ano'));

    const mesesUnicos = extrairUnicos('mes').sort((a, b) => Number(a) - Number(b));
    selects.mes.innerHTML = '<option value="">Todos</option>';
    mesesUnicos.forEach(val => {
        const nomeMes = nomesMeses[Number(val)] || val;
        selects.mes.innerHTML += `<option value="${val}">${nomeMes}</option>`;
    });

    preencherOpcoes(selects.tipo, extrairUnicos('tipo'));
    preencherOpcoes(selects.subtipo, extrairUnicos('subtipo'));
}

function preencherOpcoes(elementoSelect, arrayValores) {
    elementoSelect.innerHTML = '<option value="">Todos</option>';
    arrayValores.forEach(val => {
        elementoSelect.innerHTML += `<option value="${val}">${val}</option>`;
    });
}

function filtrar(dados, { ano, mes, tipo, subtipo }) {
    return dados.filter(d =>
        (!ano || d.ano == ano) &&
        (!mes || String(d.mes) == mes) &&
        (!tipo || d.tipo == tipo) &&
        (!subtipo || d.subtipo == subtipo)
    );
}

function aplicarFiltros() {
    const filtros = {
        ano: selects.ano.value,
        mes: selects.mes.value,
        tipo: selects.tipo.value,
        subtipo: selects.subtipo.value
    };

    const dadosFiltrados = filtrar(baseDados, filtros);
    // A evolução mensal ignora o filtro de mês para mostrar a tendência ao longo do tempo.
    const dadosTendencia = filtrar(baseDados, { ...filtros, mes: '' });

    elEmptyState.hidden = dadosFiltrados.length > 0;

    atualizarAnalise(dadosFiltrados, dadosTendencia);
}
