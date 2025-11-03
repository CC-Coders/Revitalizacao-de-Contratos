function onChangeTipoContrato() {
    $(".campoLocacaoImovel, .campoLocacaoEquipamento").hide();

    if ($(this).val() === "Locação de Imóvel") {
        $("#dadosContrato").show();
        $(".campoLocacaoImovel").show();
    } 
    else if($(this).val() === "Locação de Equipamento"){
        $("#dadosContrato").show();
        $(".campoLocacaoEquipamento").show();
        anexosPorTipoDeContrato($(this).val());
    }
    else {
        $("#dadosContrato").hide();
    }
}