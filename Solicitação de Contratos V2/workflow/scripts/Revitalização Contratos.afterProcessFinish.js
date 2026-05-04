function afterProcessFinish(processId){
    var TIPO_CONTRATO = hAPI.getCardValue("tipoContrato");

    if (TIPO_CONTRATO == "Locação de Equipamento" || TIPO_CONTRATO == "Locação de Equipamento - Com Mão de Obra") {
        atualizaStatusEquipamento("Contrato_Vigente");
    }
}