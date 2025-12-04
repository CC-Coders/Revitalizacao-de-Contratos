function onChangeTipoContrato(that) {
    $(".campoLocacaoImovel, .campoLocacaoEquipamento").hide();
    $("#paginationEquipamentos").hide();
    $("#paginationEquipamentos").addClass("hidden");

    if ($(that).val() === "Locação de Imóvel" || $(that).text() === "Locação de Imóvel") {
        $("#dadosContrato").show();
        $(".campoLocacaoImovel").show();
    } 
    else if($(that).val() === "Locação de Equipamento" || $(that).text() === "Locação de Equipamento"){
        $("#dadosContrato").show();
        $(".campoLocacaoEquipamento").show();
        $("#paginationEquipamentos").show();
        $("#paginationEquipamentos").removeClass("hidden");
        if ($(that).val()) {
            anexosPorTipoDeContrato($(that).val());
            
        }
    }
    else {
        $("#dadosContrato").hide();
    }
}