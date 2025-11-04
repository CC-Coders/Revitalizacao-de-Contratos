function onChangeTipoContrato() {
    $(".campoLocacaoImovel, .campoLocacaoEquipamento").hide();
    $("#paginationEquipamentos").hide();
    $("#paginationEquipamentos").addClass("hidden");

    if ($(this).val() === "Locação de Imóvel") {
        $("#dadosContrato").show();
        $(".campoLocacaoImovel").show();
    } 
    else if($(this).val() === "Locação de Equipamento"){
        $("#dadosContrato").show();
        $(".campoLocacaoEquipamento").show();
        $("#paginationEquipamentos").show();
        $("#paginationEquipamentos").removeClass("hidden");
        anexosPorTipoDeContrato($(this).val());
    }
    else {
        $("#dadosContrato").hide();
    }
}