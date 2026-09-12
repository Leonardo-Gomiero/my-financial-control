import { fetchSheetData } from './api.js';
import { atualizarGraficos } from './charts.js';

let baseDados = [];

// Elementos DOM
const elLoading = document.getElementById('loading');
const elAreaFiltros = document.getElementById('areaFiltros');
const elAreaGraficos = document.getElementById('areaGraficos');

const selects = {
    ano: document.getElementById('fAno'),
    mes: document.getElementById('fMes'),
    tipo: document.getElementById('fTipo'),
    subtipo: document.getElementById('fSubtipo')
};

// Inicialização
window.addEventListener('DOMContentLoaded', carregarDados);
document.getElementById('btnAtualizar').addEventListener('click', carregarDados);

Object.values(selects).forEach(select => {
    select.addEventListener('change', aplicarFiltros);
});

async function carregarDados() {
    elLoading.style.display = 'block';
    elAreaFiltros.style.display = 'none';
    elAreaGraficos.style.display = 'none';

    try {
        baseDados = await fetchSheetData();
        popularSelects(baseDados);
        aplicarFiltros();

        elLoading.style.display = 'none';
        elAreaFiltros.style.display = 'block';
        elAreaGraficos.style.display = 'grid';
    } catch (erro) {
        console.error("Falha ao inicializar app:", erro);
        elLoading.innerText = 'Erro ao carregar os dados.';
    }
}

function popularSelects(dados) {
    const extrairUnicos = (chave) => [...new Set(dados.map(d => d[chave]).filter(Boolean))].sort();

    preencherOpcoes(selects.ano, extrairUnicos('ano'));
    preencherOpcoes(selects.mes, extrairUnicos('mes').sort((a,b)=>a-b));
    preencherOpcoes(selects.tipo, extrairUnicos('tipo'));
    preencherOpcoes(selects.subtipo, extrairUnicos('subtipo'));
}

function preencherOpcoes(elementoSelect, arrayValores) {
    elementoSelect.innerHTML = '<option value="">Todos</option>';
    arrayValores.forEach(val => {
        elementoSelect.innerHTML += `<option value="${val}">${val}</option>`;
    });
}

function aplicarFiltros() {
    const vAno = selects.ano.value;
    const vMes = selects.mes.value;
    const vTipo = selects.tipo.value;
    const vSubtipo = selects.subtipo.value;

    const dadosFiltrados = baseDados.filter(d => {
        return (!vAno || d.ano == vAno) &&
               (!vMes || d.mes == vMes) &&
               (!vTipo || d.tipo == vTipo) &&
               (!vSubtipo || d.subtipo == vSubtipo);
    });

    atualizarGraficos(dadosFiltrados);
}