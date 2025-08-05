var ATIVIDADES = {
    INICIO_0: 0,
    INICIO: 4,
    JURIDICO: 5,
    SUPRIMENTOS: 17,
    SEGURANCA: 19,
    SEGURANCA: 19,
    CONTROLADORIA: 32,
    ENGENHEIRO: 43,
    COORDENADOR_OBRAS: 48,
    DIRETORIA: 53,
    ASSINATURA_ELETRONICA: 66,
};
function beforeTaskSave(colleagueId, nextSequenceId, userList) {
    var ATIVIDADE_ATUAL = getValue("WKNumState");

    if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO || ATIVIDADE_ATUAL == ATIVIDADES.INICIO_0) {
        beforeTaskSave_inicio();
    } 
    else if (ATIVIDADE_ATUAL == ATIVIDADES.JURIDICO) {
        beforeTaskSave_juridico();
    } 
    else if (ATIVIDADE_ATUAL == ATIVIDADES.CONTROLADORIA) {
        beforeTaskSave_controladoria();
    }
    else if (ATIVIDADE_ATUAL == ATIVIDADES.ENGENHEIRO) {
        beforeTaskSave_engenheiro();
    }
    else if (ATIVIDADE_ATUAL == ATIVIDADES.COORDENADOR_OBRAS) {
        beforeTaskSave_coordenadorObras();
    }
    else if (ATIVIDADE_ATUAL == ATIVIDADES.DIRETORIA) {
        beforeTaskSave_diretoria();
    }
}



function beforeTaskSave_inicio() {
    var docIdContrato = hAPI.getCardValue("contratoDocumentId");
    hAPI.attachDocument(docIdContrato);

    insereHistorico(hAPI.getCardValue("observacoes"), "Início", "Início");
}
function beforeTaskSave_juridico() {
    insereHistorico("#TODO: Definir o campo de Observação", "#TODO: Definir o campo de Decisão", "Jurídico");
}
function beforeTaskSave_controladoria() {
    insereHistorico("#TODO: Definir o campo de Observação", "#TODO: Definir o campo de Decisão", "Controladoria");
}
function beforeTaskSave_engenheiro() {
    insereHistorico("#TODO: Definir o campo de Observação", "#TODO: Definir o campo de Decisão", "Aprovação Engenheiro");
}
function beforeTaskSave_coordenadorObras() {
    insereHistorico("#TODO: Definir o campo de Observação", "#TODO: Definir o campo de Decisão", "Aprovação Coordenador");
}
function beforeTaskSave_diretoria() {
    insereHistorico("#TODO: Definir o campo de Observação", "#TODO: Definir o campo de Decisão", "Aprovação Diretoria");
}



// Utils
function insereHistorico(observacao, acao, atividade) {
    var USER = getValue("WKUser");
    var DATA = getDateTimeNow();

    var novaLinha = new java.util.HashMap();
    novaLinha.put("tableHistoricoUsuario", USER);
    novaLinha.put("tableHistoricoData", DATA);
    novaLinha.put("tableHistoricoAtividade", atividade);
    novaLinha.put("tableHistoricoObservacao", observacao);
    novaLinha.put("tableHistoricoAcao", acao);

    hAPI.addCardChild("tableHistorico", novaLinha);
}
function getDateTimeNow() {
    var date = new Date();
    var dia = date.getDate();
    if (dia < 10) {
        dia = "0" + dia;
    }
    var mes = date.getMonth() + 1;
    if (mes < 10) {
        mes = "0" + mes;
    }

    var ano = date.getFullYear();

    var hora = date.getHours();
    if (hora < 10) {
        hora = "0" + hora;
    }

    var minutos = date.getMinutes();
    if (minutos < 10) {
        minutos = "0" + minutos;
    }

    var dateTime = [ano, mes, dia].join("-") + " " + hora + ":" + minutos;
    return dateTime;
}
