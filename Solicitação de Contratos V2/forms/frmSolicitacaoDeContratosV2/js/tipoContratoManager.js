function onChangeTipoContrato(that) {
    var tipoContrato = $("#tipoContrato").val() ? $("#tipoContrato").val():$("#tipoContrato").text();
    var origemContrato = $("#origemContrato").val() ? $("#origemContrato").val():$("#origemContrato").text();

    if (tipoContrato.includes("Transporte de Materiais")) {
        $("#locador").closest("div").find("label").first().text("Fornecedor:");
    } else {
        $("#locador").closest("div").find("label").first().text("Locador:");
    }
    
    if (dataTableEquipamentosAditivoRescisao) {
        if (tipoContrato == "Locação de Equipamento - Alteração de Prazo" || 
            tipoContrato == "Locação de Equipamento (Rescisões)" || tipoContrato == "Locação de Equipamento - Com Mão de Obra (Rescisões)") {
            // Oculta a coluna na posição 10 ( "Valor Reajustado" )
            dataTableEquipamentosAditivoRescisao.column(10).visible(false);

            // Oculta o checkbox que é usado para "... Inclusão de Equipamento"
            dataTableEquipamentosAditivoRescisao.column(11).visible(false);

            // Redesenha a tabela ( draw )
            dataTableEquipamentosAditivoRescisao.columns.adjust().draw();

        }  else if (tipoContrato == "Locação de Equipamento - Alteração de Valor" || tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor") {
            // Mostra a coluna na posição 10 ( "Valor Reajustado" )
            dataTableEquipamentosAditivoRescisao.column(10).visible(true);

            // Oculta o checkbox que é usado para "... Inclusão de Equipamento"
            dataTableEquipamentosAditivoRescisao.column(11).visible(false);

            // Redesenha a tabela ( draw )
            dataTableEquipamentosAditivoRescisao.columns.adjust().draw();

        } else if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento" || tipoContrato == "Locação de Equipamento - Exclusão de Equipamentos" ||
            tipoContrato == "Transporte de Materiais - Inclusão de Equipamento" || tipoContrato == "Transporte de Materiais - Exclusão de Equipamento") {
            // Oculta a coluna na posição 10 ( "Valor Reajustado" )
            dataTableEquipamentosAditivoRescisao.column(10).visible(false);

            // Mostra o checkbox que é usado para "... Inclusão de Equipamento"
            dataTableEquipamentosAditivoRescisao.column(11).visible(true);

            // Redesenha a tabela ( draw )
            dataTableEquipamentosAditivoRescisao.columns.adjust().draw();
        }
    }
    
    // Mostra/Oculta paginação de Locação de Contrato Principal e paginação de Equipamentos.
    //
    // Caso tipoContrato vazio então oculta tudo
    if (!tipoContrato) {
        $("#paginationEquipamentos, #paginationContratoPrincipal, #divTableEquipamentosAditivoRescisao, #divTableEquipamentos").addClass("hidden").hide();

    // Se tipoContrato contém "Locação de Imóvel" e origemContrato igual à "Aditivos" ou "Rescisões"
    } else if (tipoContrato.includes("Locação de Imóvel") && (origemContrato == "Aditivos" || origemContrato == "Rescisões")) {
        $("#paginationEquipamentos").addClass("hidden").hide();
        $("#paginationContratoPrincipal, #paginationAnexos").removeClass("hidden").show();

        if (origemContrato == "Aditivos") {
            $("#paginationAnexos").addClass("hidden").hide();
        }

    } else if (tipoContrato.includes("Locação de Equipamento")) {
        if (origemContrato == "Novos") {
            $("#paginationContratoPrincipal, #divTableEquipamentosAditivoRescisao").addClass("hidden").hide();
            $("#paginationEquipamentos, #divTableEquipamentos, #paginationAnexos").removeClass("hidden").show();

        } else if (origemContrato == "Aditivos" || origemContrato == "Rescisões") {
            $("#divTableEquipamentos").addClass("hidden").hide();
            $("#paginationEquipamentos, #divTableEquipamentosAditivoRescisao, #paginationContratoPrincipal, #paginationAnexos").removeClass("hidden").show();

            if (tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {
                // Flavio confirmou com o Juridico que não precisa de anexos aqui
                $("#paginationAnexos").addClass("hidden").hide();

            } else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo") {
                // Flavio pediu para ocultar a pagina de equipamentos aqui
                $("#paginationEquipamentos").addClass("hidden").hide();
            }
        }

        if ($("#formMode").val() == "VIEW") {
            $("#tableEquipamentosAditivoRescisao").hide();
        }

    } else if (tipoContrato.includes("Transporte de Materiais")) {
        //paginação (contrato principal / equipamentos / anexos) por origem e tipo de alteração
        if (origemContrato == "Aditivos" || origemContrato == "Rescisões") {
            $("#divTableEquipamentos").addClass("hidden").hide();
            $("#paginationContratoPrincipal").removeClass("hidden").show();

            if (tipoContrato == "Transporte de Materiais - Inclusão de Equipamento" ||
                tipoContrato == "Transporte de Materiais - Exclusão de Equipamento") {
                $("#paginationEquipamentos, #divTableEquipamentosAditivoRescisao").removeClass("hidden").show();
            } else {
                $("#paginationEquipamentos, #divTableEquipamentosAditivoRescisao").addClass("hidden").hide();
            }

            if (origemContrato == "Aditivos") {
                $("#paginationAnexos").addClass("hidden").hide();
            } else {
                $("#paginationAnexos").removeClass("hidden").show();
            }

        } else {
            $("#paginationContratoPrincipal, #divTableEquipamentosAditivoRescisao").addClass("hidden").hide();
            $("#paginationEquipamentos, #divTableEquipamentos, #paginationAnexos").removeClass("hidden").show();
        }

    } else {
        $("#paginationEquipamentos, #paginationContratoPrincipal").addClass("hidden").hide();
    }

    if (origemContrato == "Novos") {
        $(
            `.campoLocacaoImovel, .campoLocacaoEquipamento, .campoLocacaoImovelAditivo_alteracaoValor, .campoLocacaoEquipamento_alteracaoValor,
            .campoLocacaoEquipamento_rescisao, .campoLocacaoEquipamento_inclusaoEquipamento_exclusaoEquipamento, .campoTransporteMateriais,
            .campoTransporteAditivo_alteracaoValor, .campoTransporteAditivo_alteracaoPrazo,
            .campoTransporteAditivo_inclusaoEquipamento, .campoTransporteAditivo_exclusaoEquipamento`
        ).hide();
        
        $(".divDadosPagamento, .divDadosContratuais").show();
        $("#procurador, #contratantePrincipal, #percentualRetencao").closest("div").show();
        $("#descricaoImovel, #enderecoImovel, #valorMensalAluguel").removeAttr("readonly");

        // Readonly
        //$(".divEnderecoFornecedor, .pessoa-fisica, .pessoa-juridica").find("input").attr("readonly","readonly");
        $("#cpfFornecedor, #prazoLocacao, #dataReajuste").attr("readonly","readonly");

        // Remove class de preenhcimento obrigatório.
        $("#rgFornecedor").removeClass("inputInfoChamado");

        // Mostra simbolo de obrigatoriedade ( * )
        $("#descricaoImovel, #enderecoImovel, #prazoLocacao, #valorMensalLocacao, #valorMensalAluguel").closest("div").find("strong.strongAlert").show();
        $("#valorMensalAluguel").maskMoney({
            prefix: "R$ ",
            thousands: ".",
            decimal: ",",
            allowZero: true,
            affixesStay: true,
        });

        if (tipoContrato === "Locação de Imóvel") {
            $("#dadosContrato").show();
            $(".campoLocacaoImovel").show();
            $("#percentualRetencao").closest("div").hide();
        } 
        else if(tipoContrato === "Locação de Equipamento"  || tipoContrato === "Locação de Equipamento - Com Mão de Obra"){
            if ( tipoContrato === "Locação de Equipamento - Com Mão de Obra") {
                $("#divRetencao").show();

                // Somente em formMode "ADD" por ser abertura do processo
                // Sem isso, o que foi marcado (SIM/NÃO) e porcentagem iria ser sobrescrito
                if ($("#fomMode").val() == "ADD") {
                    $("#temRetencao").val("Sim").change();
                    $("#percentualRetencao").val("5%");
                }

            } else {

                // Somente em formMode "ADD" por ser abertura do processo
                // Sem isso, o que foi marcado (SIM/NÃO) e porcentagem iria ser sobrescrito
                if ($("#fomMode").val() == "ADD") {
                    $("#divRetencao").hide();
                    $("#temRetencao").val("Não").change();
                    $("#percentualRetencao").val("0%");
                }
            }

            $("#dadosContrato").show();
            $(".campoLocacaoEquipamento").show();
            if ($(that).val()) {
                anexosPorTipoDeContrato($(that).val());
            }
        }
        else if (tipoContrato === "Transporte de Materiais") {
            $("#dadosContrato").show();
            $(".campoLocacaoEquipamento").show();  
            $(".divDadosContratuais").hide();        
            $(".campoTransporteMateriais").show();
        }
        else {
            $("#dadosContrato").hide();
        }
    }
    else if (origemContrato == "Aditivos") {
        $(
            `.campoLocacaoImovel, .campoLocacaoEquipamento, .divDadosPagamento, .campoLocacaoImovelAditivo_alteracaoValor, .campoLocacaoImovelAditivo_alteracaoPrazo,
            .campoLocacaoEquipamento_alteracaoValor, .campoLocacaoEquipamento_rescisao, .campoLocacaoEquipamento_inclusaoEquipamento_exclusaoEquipamento,
            .campoTransporteMateriais, .campoTransporteAditivo_alteracaoValor, .campoTransporteAditivo_alteracaoPrazo,
            .campoTransporteAditivo_inclusaoEquipamento, .campoTransporteAditivo_exclusaoEquipamento`
        ).hide();
        $("#percentualRetencao").closest("div").hide();
        $(".divDadosContratuais").show();

        // Readonly
        $(".divEnderecoFornecedor").find("input").attr("readonly","readonly");
        $("#cpfFornecedor, #enderecoImovel, #prazoLocacao, #dataReajuste").attr("readonly","readonly");

        // Oculta simbolo de obrigatoriedade ( * )
        $("#enderecoImovel, #prazoLocacao, #valorMensalLocacao, #valorMensalAluguel, #rgFornecedor").closest("div").find("strong.strongAlert").hide();

        // Mostra simbolo de obrigatoriedade ( * )
        $("#valorLocacaoReajustado").closest("div").find("strong.strongAlert").show();

        // Readonly e Remoção de mask
        $("#valorMensalAluguel, #valorMensalLocacao").attr("readonly","readonly").maskMoney("destroy");

        // Remove readonly
        $("#valorLocacaoReajustado").removeAttr("readonly","readonly").maskMoney({
            prefix: "R$ ",
            thousands: ".",
            decimal: ",",
            allowZero: true,
            affixesStay: true,
        });

        if (tipoContrato === "Locação de Imóvel - Alteração de Prazo") {
            $("#dadosContrato").show();
            $(".campoLocacaoImovelAditivo_alteracaoPrazo").show();

            // Remove readonly
            $("#rgFornecedor").removeAttr("readonly","readonly");

            // Adiciona class para obrigar digitar o RG do Fornecedor, pois precisa para usar no contrato de aditivo/rescisão.
            $("#rgFornecedor").addClass("inputInfoChamado");

        }
        else if (tipoContrato === "Locação de Imóvel - Alteração de Valor") {
            $("#dadosContrato").show();
            $(".campoLocacaoImovelAditivo_alteracaoValor").show();

            // Remove Readonly
            $("#dataReajuste, #rgFornecedor").removeAttr("readonly","readonly");

            // Adiciona class para obrigar digitar o RG do Fornecedor, pois precisa para usar no contrato de aditivo/rescisão.
            $("#rgFornecedor").addClass("inputInfoChamado");

        }
        else if (tipoContrato === "Locação de Imóvel - Alteração de Prazo e Valor") {
            $("#dadosContrato").show();
            $(".campoLocacaoImovelAditivo_alteracaoPrazo, .campoLocacaoImovelAditivo_alteracaoValor").show();
            $("#dataReajuste").closest(".campoLocacaoImovelAditivo_alteracaoValor").hide();

            // Remove readonly
            $("#rgFornecedor").removeAttr("readonly","readonly");
        }
        else if (tipoContrato === "Locação de Equipamento - Alteração de Valor") {
            $("#dadosContrato").show();
            $(".campoLocacaoEquipamento_alteracaoValor").show();

            // Oculta simbolo de obrigatoriedade ( * )
            $("#valorLocacaoReajustado").closest("div").find("strong.strongAlert").hide();

            // Readonly e remove mask
            $("#valorLocacaoReajustado").attr("readonly","readonly").maskMoney("destroy");

            // Remove Readonly
            $("#dataReajuste").removeAttr("readonly","readonly");
            
        }
        else if (tipoContrato === "Locação de Equipamento - Alteração de Prazo") {            
            $("#dadosContrato").show();
            $(".campoLocacaoEquipamento_alteracaoPrazo").show();
            ordenaCamposNoFormPorTipoContrato();

        }
        else if (tipoContrato === "Locação de Equipamento - Alteração de Prazo e Valor" || tipoContrato === "Locação de Equipamento - Alteração de Prazo e Valor") {
            $("#dadosContrato").show();
            $(".campoLocacaoEquipamento_alteracaoPrazo, .campoLocacaoEquipamento_alteracaoValor").show();
            $("#dataReajuste").closest(".campoLocacaoImovelAditivo_alteracaoValor").hide();

            // Oculta simbolo de obrigatoriedade ( * )
            $("#valorLocacaoReajustado").closest("div").find("strong.strongAlert").hide();

            // Readonly e remove mask
            $("#valorLocacaoReajustado").attr("readonly","readonly").maskMoney("destroy");
            
        }
        else if (tipoContrato === "Locação de Equipamento - Inclusão de Equipamento" || tipoContrato === "Locação de Equipamento - Exclusão de Equipamento") {
            $("#dadosContrato").show();
            $(".campoLocacaoEquipamento_inclusaoEquipamento_exclusaoEquipamento").show();
        }
        else if (tipoContrato.includes("Transporte de Materiais")) {
            //mostra o grupo de campos de Dados Contratuais conforme o Tipo de Alteração
            $("#dadosContrato").show();

            $("#dataReajuste").removeAttr("readonly");

            if (tipoContrato === "Transporte de Materiais - Alteração de Valor") {
                $(".campoTransporteAditivo_alteracaoValor").show();
                //MELHORIA TRANSPORTE: Alteração de Valor usa o Formato de Cobrança (Valor Mensal / Valor por Km por T)
                toggleFormatoCobrancaAditivoTransporte();
            }
            else if (tipoContrato === "Transporte de Materiais - Alteração de Prazo") {
                $(".campoTransporteAditivo_alteracaoPrazo").show();
            }
            else if (tipoContrato === "Transporte de Materiais - Alteração de Prazo e Valor") {
                $(".campoTransporteAditivo_alteracaoPrazo, .campoTransporteAditivo_alteracaoValor").show();
                //MELHORIA TRANSPORTE: Prazo e Valor também mostra o Formato de Cobrança
                toggleFormatoCobrancaAditivoTransporte();
            }
            else if (tipoContrato === "Transporte de Materiais - Inclusão de Equipamento") {
                $(".campoTransporteAditivo_inclusaoEquipamento").show();
                //após exibir o grupo, aplica o Formato de Cobrança para mostrar só o campo de valor certo
                toggleFormatoCobrancaAditivoTransporte();
            }
            else if (tipoContrato === "Transporte de Materiais - Exclusão de Equipamento") {
                $(".campoTransporteAditivo_exclusaoEquipamento").show();
                toggleFormatoCobrancaAditivoTransporte();
            }
        }
        else {
            $("#dadosContrato").hide();
        }
    }
    else if (origemContrato == "Rescisões") {
        $(`
            .campoLocacaoImovel, .campoLocacaoEquipamento, .divDadosPagamento, .campoLocacaoImovelAditivo_alteracaoValor, .campoLocacaoImovelAditivo_alteracaoPrazo,
            .campoLocacaoEquipamento_alteracaoValor, .campoLocacaoEquipamento_rescisao, .campoLocacaoEquipamento_inclusaoEquipamento_exclusaoEquipamento,
            .campoTransporteMateriais, .campoTransporteRescisao,
            .campoTransporteAditivo_alteracaoValor, .campoTransporteAditivo_alteracaoPrazo,
            .campoTransporteAditivo_inclusaoEquipamento, .campoTransporteAditivo_exclusaoEquipamento`
        ).hide();
        $("#percentualRetencao").closest("div").hide();
        $("#dadosContrato, .divDadosContratuais").show();

        // Oculta simbolo de obrigatoriedade ( * )
        $("#descricaoImovel, #valorMensalLocacao").closest("div").find("strong.strongAlert").hide();

        // Readonly
        $(".divEnderecoFornecedor").find("input").attr("readonly","readonly");
        $("#descricaoImovel, #cpfFornecedor, #valorMensalLocacao").attr("readonly","readonly");

        if (tipoContrato == "Locação de Imóvel (Rescisões)") {
            $(".campoLocacaoImovel_rescisao").show();

            // Remove readonly
            $("#rgFornecedor").removeAttr("readonly","readonly");

            // Adiciona class para obrigar digitar o RG do Fornecedor, pois precisa para usar no contrato de aditivo/rescisão.
            $("#rgFornecedor").addClass("inputInfoChamado");
            
        } else if (tipoContrato == "Locação de Equipamento (Rescisões)" || tipoContrato == "Locação de Equipamento - Com Mão de Obra (Rescisões)") {
            $(".campoLocacaoEquipamento_rescisao").show();

            // Remove readonly
            $("#rgFornecedor").removeAttr("readonly","readonly");

            // Adiciona class para obrigar digitar o RG do Fornecedor, pois precisa para usar no contrato de aditivo/rescisão.
            $("#rgFornecedor").addClass("inputInfoChamado");

        } else if (tipoContrato == "Transporte de Materiais (Rescisões)") {
            //rescisão de Transporte mostra só os Dados Gerais (sem Valor Mensal)
            $(".campoTransporteRescisao").show();

            $(".divDadosContratuais").hide();

        } else {
            $("#dadosContrato").hide();
        }
    }
    else {
        $("#dadosContrato").hide();
    }
}

const alteracoesPorTipoContratoBase = {

    "Locação de Imóvel": [
    "Alteração de Valor",
    "Alteração de Prazo",
    "Alteração de Prazo e Valor"
  ],
  "Locação de Equipamento": [
    "Alteração de Valor",
    "Alteração de Prazo",
    "Alteração de Prazo e Valor",
    "Inclusão de Equipamento",
    "Exclusão de Equipamento"
  ],
  "Locação de Equipamento - Com Mão de Obra": [
    "Alteração de Valor",
    "Alteração de Prazo",
    "Alteração de Prazo e Valor",
    "Inclusão de Equipamento",
    "Exclusão de Equipamento"
  ],
  //alterações permitidas para aditivo de Transporte de Materiais
  "Transporte de Materiais": [
    "Alteração de Valor",
    "Alteração de Prazo",
    "Alteração de Prazo e Valor",
    "Inclusão de Equipamento",
    "Exclusão de Equipamento"
  ]
}

function filtraTipoContratoPorOrigem() {
  const origemContrato = $("#origemContrato").val();

  // Filtra apenas o select BASE
  $("#tipoContratoBase option").each(function () {

    if (!$(this).val()) { 
      $(this).show(); 
      return; 
    }

    const origensContratos = ($(this).data("origem") || "").split(",");
    $(this).toggle(origensContratos.includes(origemContrato));
  });

  // Reseta seleções
  $("#tipoContratoBase").val("");
  $("#tipoAlteracao").val("");

  // Mostra/oculta Tipo de Alteração
  if (origemContrato == "Aditivos") {
    $(".divTipoAlteracao").slideDown(300);
  } else {
    $(".divTipoAlteracao").slideUp(300);
  }

  // Filtra alterações com base no novo estado
  filtraTipoAlteracao_porTipoContratoBase();

  // Atualiza hidden
  atualizaTipoContratoHidden();
}
function filtraTipoAlteracao_porTipoContratoBase() {
  const origemContrato = $("#origemContrato").val();
  const tipoContratobase = $("#tipoContratoBase").val();

  // Se não for Aditivos, a função simplesmente encerra.
  if (origemContrato !== "Aditivos") return;

  // Busca no objeto alteracoesPorTipoContratoBase quais alterações são permitidas para o tipo base selecionado.
  // Se não encontrar nenhuma configuração, retorna array vazio.
  const permitidas = alteracoesPorTipoContratoBase[tipoContratobase] || [];

  // Percorre todas as opções do select #tipoAlteracao
  $("#tipoAlteracao option").each(function () {

    // Valor do option atual
    const optionTipoAlteracao = $(this).val();

    // Mantém sempre visível a opção padrão "Selecione" (valor vazio)
    if (!optionTipoAlteracao) { 
      $(this).show(); 
      return; 
    }

    // Mostra apenas as opções que estiverem dentro do array "permitidas".
    // Se não estiverem, esconde.
    $(this).toggle(permitidas.includes(optionTipoAlteracao));
  });

  // Após filtrar, llimpa o select
  const atual = $("#tipoAlteracao").val();

  if (atual && !permitidas.includes(atual)) {
    $("#tipoAlteracao").val("");
  }
}
function atualizaTipoContratoHidden() {

  // - origemContrato: "Novos" | "Aditivos" | "Rescisões"
  // - tipoContratobase: o tipo base selecionado no primeiro select
  // - tipoAlteracao: a alteração selecionada no segundo select (usado só em Aditivos)
  const origemContrato = $("#origemContrato").val();
  const tipoContratobase = $("#tipoContratoBase").val();
  const tipoAlteracao  = $("#tipoAlteracao").val();

  // Se não tem tipo base selecionado, zera o hidden #tipoContrato
  // e dispara "change" para a lógica antiga perceber que ficou vazio.
  if (!tipoContratobase) {
    $("#tipoContrato").val("").trigger("change");
    return;
  }

  // Se caso for Rescisões como origem de contrato então acrescenta o texto "(Rescisões)" ao final para diferenciar de contratos novos.
  if (origemContrato === "Rescisões") {
    if (tipoContratobase == "Locação de Imóvel") {
        $("#tipoContrato").val("Locação de Imóvel (Rescisões)").trigger("change");
        return;

    } else if (tipoContratobase == "Locação de Equipamento") {
        $("#tipoContrato").val("Locação de Equipamento (Rescisões)").trigger("change");
        return;

    } else if (tipoContratobase == "Locação de Equipamento - Com Mão de Obra") {
        $("#tipoContrato").val("Locação de Equipamento - Com Mão de Obra (Rescisões)").trigger("change");
        return;

    } else if (tipoContratobase == "Transporte de Materiais") {
        //compõe o tipo de rescisão de Transporte
        $("#tipoContrato").val("Transporte de Materiais (Rescisões)").trigger("change");
        return;
    }
  }

  if (origemContrato === "Novos") {
    $("#tipoContrato").val(tipoContratobase).trigger("change");
    return;
  }


  if (!tipoAlteracao) {
    $("#tipoContrato").val("").trigger("change");
    return;
  }

  $("#tipoContrato").val(`${tipoContratobase} - ${tipoAlteracao}`).trigger("change");
}

function ordenaCamposNoFormPorTipoContrato() {
    var tipoContrato = $("#tipoContrato").val();

    var $dataInicio = $("#dataInicioLocacao").closest(".col-md-6");
    var $dataFim = $("#dataFimLocacao").closest(".col-md-6");
    var $prazo = $("#prazoLocacao").closest(".col-md-6");
    var $clausula = $("#clausulaAlterada").closest(".col-md-6");

    if (tipoContrato == "Locação de Equipamento - Alteração de Prazo") {
        $dataInicio.parent().append($dataInicio);
        $dataFim.parent().append($dataFim);
        $prazo.parent().append($prazo);
        $clausula.parent().append($clausula);
    }
}