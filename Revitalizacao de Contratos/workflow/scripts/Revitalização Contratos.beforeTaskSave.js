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
function beforeTaskSave(colleagueId,nextSequenceId,userList){
    var ATIVIDADE_ATUAL = getValue("WKNumState");


    if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO || ATIVIDADE_ATUAL == ATIVIDADES.INICIO_0) {
        var docIdContrato = hAPI.getCardValue("contratoDocumentId");
        hAPI.attachDocument(docIdContrato);
    }


}