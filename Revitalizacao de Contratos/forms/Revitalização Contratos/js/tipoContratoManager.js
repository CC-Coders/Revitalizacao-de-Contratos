function onChangeTipoContrato(that) {
    $(".campoLocacaoImovel, .campoLocacaoEquipamento").hide();
    $("#paginationEquipamentos").hide();
    $("#paginationEquipamentos").addClass("hidden");

    if ($(that).val() === "Locação de Imóvel" || $(that).text() === "Locação de Imóvel") {
        $("#dadosContrato").show();
        $(".campoLocacaoImovel").show();
    } 
    else if($(that).val() === "Locação de Equipamento" || $(that).text() === "Locação de Equipamento" || $(that).val() === "Locação de Equipamento - Com Mão de Obra" || $(that).text() === "Locação de Equipamento - Com Mão de Obra"){
        $("#dadosContrato").show();
        $(".campoLocacaoEquipamento").show();
        $("#paginationEquipamentos").show();
        $("#paginationEquipamentos").removeClass("hidden");
        if ($(that).val()) {
            anexosPorTipoDeContrato($(that).val());

            $("#temRetencao").val("Sim").change();
        }
    }
    else {
        $("#dadosContrato").hide();
    }
}