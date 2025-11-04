function afterProcessFinish(processId){
    var TIPO_CONTRATO = hAPI.getCardValue("tipoContrato");

    if (TIPO_CONTRATO == "Locação de Equipamento") {
        atualizaStatusEquipamento("Contrato_Vigente");
    }
}