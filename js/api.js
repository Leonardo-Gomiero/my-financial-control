import { ENV } from './config.js';

export async function fetchSheetData() {
    const resposta = await fetch(ENV.URL_API);
    const dadosPlanilha = await resposta.json();
    
    const dadosFormatados = [];
    
    // Pula o cabeçalho (i=1)
    for (let i = 1; i < dadosPlanilha.length; i++) {
        const linha = dadosPlanilha[i];
        
        let dataStr = linha[1] || '';
        let anoExtraido = dataStr.length >= 4 ? dataStr.substring(0, 4) : '';
        let valor = parseFloat(linha[5]) || 0;

        if (linha[2] || linha[5]) {
            dadosFormatados.push({
                mes: linha[0] === '#VALUE!' ? '' : linha[0],
                data: dataStr,
                ano: anoExtraido,
                fluxo: linha[2] || '',
                tipo: linha[3] || '',
                subtipo: linha[4] || '',
                valor: valor
            });
        }
    }
    
    return dadosFormatados;
}