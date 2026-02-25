function onChangeTipoContrato(that) {
    var tipoContrato = $("#tipoContrato").val() ? $("#tipoContrato").val():$("#tipoContrato").text();
    var origemContrato = $("#origemContrato").val() ? $("#origemContrato").val():$("#origemContrato").text();

    if (origemContrato == "Novo") {
        $(".campoLocacaoImovel, .campoLocacaoEquipamento").hide();
        $("#paginationEquipamentos").hide();
        $("#paginationEquipamentos").addClass("hidden");

        if (tipoContrato === "Locação de Imóvel") {
            $("#dadosContrato").show();
            $(".campoLocacaoImovel").show();
        } 
        else if(tipoContrato === "Locação de Equipamento"  || tipoContrato === "Locação de Equipamento - Com Mão de Obra"){
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
    else if(origemContrato == "Aditivos"){
        $("#dadosContrato").show();
        $(".campoLocacaoImovel, .campoLocacaoEquipamento").hide();
        $("#campoAditivo").show();
        
       


    }


    
}