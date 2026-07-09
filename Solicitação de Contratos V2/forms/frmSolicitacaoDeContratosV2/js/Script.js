
const ATIVIDADES = {
    INICIO_0: 0,
    INICIO: 4,
    JURIDICO: 5,
    SUPRIMENTOS: 17,
    SEGURANCA: 19,
    CONTROLADORIA: 32,
    ENGENHEIRO: 43,
    COORDENADOR_OBRAS: 48,
    DIRETORIA: 53,
    INTERMEDIARIO_ASSINATURA_ELETRONICA: 58,
    ASSINATURA_ELETRONICA: 66,
    ADM_OBRA: 64,
    CONTROLADORIA_RECEBIMENTO: 74,
    CONTROLADORIA_RECOLHE_ASSINATURA: 72,
    OBRA_RECEBE_VIAS: 76,
    FIM: [37, 62, 83]
};

$(document).ready(function () {
    bindings();
    const ATIVIDADE_ATUAL = parseInt($("#atividade").val());
    console.log(ATIVIDADE_ATUAL)
    if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO) {
        loadTelaInicioRetorno();
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO_0) {
        loadTelaInicio();
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.JURIDICO) {
        loadTelaJuridico();
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.CONTROLADORIA) {
        loadTelaControladoria();
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.ENGENHEIRO || ATIVIDADE_ATUAL == ATIVIDADES.COORDENADOR_OBRAS || ATIVIDADE_ATUAL == ATIVIDADES.DIRETORIA) {
        loadTelaAprovacao();
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.ASSINATURA_ELETRONICA || ATIVIDADE_ATUAL == ATIVIDADES.INTERMEDIARIO_ASSINATURA_ELETRONICA) {
        loadTelaAssinaturaEletronica();
    } else if ([ATIVIDADES.ADM_OBRA, ATIVIDADES.CONTROLADORIA_RECEBIMENTO, ATIVIDADES.CONTROLADORIA_RECOLHE_ASSINATURA, ATIVIDADES.OBRA_RECEBE_VIAS].includes(ATIVIDADE_ATUAL)) {
        // Se for atividade de Assinatura Manual
        loadTelaAssinaturaManual();
    } else {
        loadTelaAprovacao();
    }

});


var beforeSendValidate = function (numState, nextState) {
    var atividade = parseInt(document.getElementById("atividade").value);
    if (atividade == 0) {
        return validaCampos();
    }
    return validaCampos();
};


function bindings() {
    FLUIGC.popover('.step', { trigger: 'hover', placement: 'auto' });


    // Amarra eventos e elementos do HTML, mantendo todas definições de evento agrupadas
    $("#btnGerarArquivo").on("click", asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao);
    $("#btnEditarArquivo").on("click", editarArquivoNoCKEditor);

    $("#divInputFileSubstituirWord").html(`<input type="file" id="inputFileSubstituirWord" name="inputFileSubstituirWord"
                            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            style="display: none;">`);
    $("#btnSubstituirWord").on("click", function () {
        $("#inputFileSubstituirWord").click();
    });
    $("#inputFileSubstituirWord").on("change", function () {
        substituiModeloPorUploadDeDocx(this);
    });
    $("#btnBaixarWord").on("click", baixaDocxDoContrato);
    $("#btnSalvarArquivo").on("click", salvaModeloAlterado);
    $("#btnVisualizarArquivo").on("click", visualizaDocumento);
    $("#btnEnviarSolicitacao").on("click", enviarSolicitacao);
    $("#btnVisualizarPreContrato").on("click", geraPreContrato);

    if ($("#formMode").val() != "VIEW") {
        $("#obra").selectize({
            valueField: 'value',       // campo que vira o value do <option>
            labelField: 'label',       // campo exibido nas opções
            optgroupField: 'optgroup',      // campo nas options que referencia o grupo
            optgroupLabelField: 'label', // campo do objeto optgroup para exibição
            optgroupValueField: 'value', // campo do objeto optgroup que é a chave
            searchField: ['label'],    // campos onde a busca procura (pode ter vários)
            optgroups: [
            ],
            options: [

            ],
            render: {
                optgroup_header: function (data, escape) {
                    return '<div class="optgroup-header">' + escape(data.label) + '</div>';
                },
                option: function (item, escape) {
                    return '<div class="option">' + escape(item.label) + '</div>';
                }
            },
            onChange: (value) => {
                salvaDadosDaObraSelecionadaComoHiddenInput_buscaAprovadores(value);
                atualizaDatatableContratoPrincipal();

                var [CODCOLIGADA, CODCCUSTO, NOMECCUSTO] = value.split(" - ");
                if (!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)) {
                    $("#temREIDI").closest("div.row").hide();
                    $("#temREIDI").val("Não");
                    $("#percentualREIDI").val("");
                } else {
                    $("#temREIDI").closest("div.row").show();
                }
            }
        });

        $("#locador").selectize({
            onChange: async (value) => {
                var [codcfo, cgccfo, nomeFornecedor] = value.split(" - ");

                // Por padrão os fornecedores são cadastrados no Coligada 0 = Global
                // Nos casos de cadastros errados tem que verificar a filial
                // Como a consulta não está retornando o CODCOLCFO ficou fixo como 0
                $("#hiddenCODCOLCFO").val(0);
                $("#hiddenCODCFO").val(codcfo);
                $("#hiddenCGCCFO").val(cgccfo);
                $("#hiddenFORNECEDOR").val(nomeFornecedor);

                if (cgccfo) {
                    await buscaInfosFornecedor_verificaSeFornecedorPfOuPj_PreencheDadosDoFornecedorNoFormulario_AlteraAnexosNecessarios(
                        cgccfo,
                    );
                    atualizaDatatableContratoPrincipal();
                } else {
                    $(".endereco-fornecedor").slideUp();
                }
            },
        });

        $("#banco").selectize();
    } else {
        $("#obra, #locador, #banco").addClass("form-control");
        $(".endereco-fornecedor").show();
    }

    $("input[name='decisao']").on("change", function () {
        if ($(this).val() == "Aprovar") {
            $("#divDestinoRetorno").hide();
        }
        else if ($(this).val() == "Retornar") {
            $("#divDestinoRetorno").show();
            popularDestinoRetorno()
        }
    });
    $("#tipoDocumentacao").on("change", function () {
        const tipo = $(this).val();
        const inputAnexo = document.getElementById("inputAnexo");

        if (tipo) {
            inputAnexo.value = "";
        } else {
        }
    });

    // Aba Dados Gerais
    $("#modeloContrato").on("change", function () {
        if ($(this).val() == "Contrato fora do modelo") {
            $("#btnAnexarContrato").show();
        } else {
            $("#btnAnexarContrato").hide();
        }
    });

    if ($("#origemContrato").val() ? $("#origemContrato").val() : $("#origemContrato").text() == "Aditivos") {
        $(".divTipoAlteracao").show();

    } else {
        $(".divTipoAlteracao").hide();
    }

    // Colocado aqui em bidings() para centralizar... antes era feito isso em varias telas ( loadTela.... )
    var tipoPessoa = $("#FORNECEDOR_PF_PJ").val() ? $("#FORNECEDOR_PF_PJ").val() : $("#FORNECEDOR_PF_PJ").text();
    if (tipoPessoa === "F") {
        $(".pessoa-juridica").hide();
        $(".pessoa-fisica").show();
    } else if (tipoPessoa === "J") {
        $(".pessoa-fisica").hide();
        $(".pessoa-juridica").show();
    }

    $("#tipoContrato").on("change", () => onChangeTipoContrato($("#tipoContrato")));

    $("#origemContrato").on("change", () => {
        filtraTipoContratoPorOrigem();
        filtraTipoAlteracao_porTipoContratoBase(); // Quando contratos Novos
    });

    $("#tipoContratoBase, #tipoAlteracao").on("change", () => {
        filtraTipoAlteracao_porTipoContratoBase();
        atualizaTipoContratoHidden();

        var atividade = parseInt($("#atividade").val());
        var origemContrato = $("#origemContrato").val();
        var tipoContrato = $("#tipoContrato").val();
        var tipoPessoa = $("#FORNECEDOR_PF_PJ").val();

        // Quando alterar tipoContratoBase ou tipoAlteracao
        // Limpa o input hidden que guarda o codigo do contrato principal selecionado
        // Para não ficar preenchido de outro momento antes da alteração de tipoContratoBase ou tipoAlteracao
        // E com esse campo limpo, a validação obriga o usuário selecionar (nesse caso novamente) o contrato principal.
        // Tem outros inputs hidden em relação ao contrato principal selecionado, mas é limpo somente esse porque
        // é o suficiente para validar que "não tem contrato principal selecionado"
        $("#contratoSelecCodigo").val("");

        // É a mesma ideia do contratoSelecCodigo...
        $("#contratoSelecDataInicio").val("");

        // Chama a função para listar anexos pro Tipo Contrato
        // Chamada aqui porque a atualizaTipoContratoHidden atualiza o input de tipoContrato.
        if (tipoContrato.includes("Locação de Imóvel") && origemContrato != "Aditivos") {
            anexosPorTipoDeContrato(tipoPessoa == "F" ? "Locação de Imóvel - PF" : "Locação de Imóvel - PJ");

        } else if (
            tipoContrato.includes("Locação de Equipamento") &&
            tipoContrato != "Locação de Equipamento - Alteração de Prazo" &&
            tipoContrato != "Locação de Equipamento - Alteração de Valor" &&
            tipoContrato != "Locação de Equipamento - Alteração de Prazo e Valor" &&
            tipoContrato != "Locação de Equipamento - Inclusão de Equipamento" &&
            tipoContrato != "Locação de Equipamento - Exclusão de Equipamento" // Não pedir nenhum anexo
        ) {
            anexosPorTipoDeContrato("Locação de Equipamento");

        }

        if (tipoContrato == "Locação de Equipamento - Alteração de Prazo") {
            anexosPorTipoDeContrato("Locação de Equipamento - Alteração de Prazo");

        } else if (tipoContrato == "Locação de Equipamento - Alteração de Valor") {
            anexosPorTipoDeContrato("Locação de Equipamento - Alteração de Valor");

        } else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor") {
            anexosPorTipoDeContrato("Locação de Equipamento - Alteração de Prazo e Valor");

        } else if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {
            anexosPorTipoDeContrato("Locação de Equipamento - Inclusão de Equipamento");

        }

        // Caso o usuário alterou tipoAlterção ou tipoContratoBase e não altere a Obra/Fornecedor
        // Já atualiza a tabela, sem precisar o usuário ter que selecionar novamente Obra/Fornecedor
        // Só roda se tiver valor em tipoContrato porque quando Aditivo 
        // precisa que seja preenchido tanto #tipoContratoBase quanto #tipoAlteracao
        // Feito isso para não mostrar window de erro de datatable
        if (tipoContrato) {
            atualizaDatatableContratoPrincipal();
        }

        if (atividade == ATIVIDADES.INICIO || atividade == ATIVIDADES.INICIO_0) {
            if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {
                $("#tituloExclusaoEquip").hide();
                $("#divEquipamentosParaInclusaoExclusao, #tituloInclusaoEquip").show();

            } else if (tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {
                $("#tituloInclusaoEquip").hide();
                $("#divEquipamentosParaInclusaoExclusao, #tituloExclusaoEquip").show();

            } else {
                $("#divEquipamentosParaInclusaoExclusao, #tituloInclusaoEquip, #divEquipamentosParaInclusaoExclusao, #tituloExclusaoEquip").hide();
            }
        }
    });

    // Seleciona todos os inputs de valor reajustado da grid
    $(".inputValorLocacaoReajustado")

        // Remove qualquer evento "change" previamente vinculado a esses inputs
        // Isso evita duplicação de execução caso a função bindings() seja chamada novamente
        .off("change")

        // Adiciona novamente o evento "change"
        // Esse evento será disparado sempre que o valor do input for alterado
        .on("change", function () {

            // Atualiza a estrutura de equipamentos (pai-filho)
            // Recoleta os valores digitados na grid
            getEquipamentosAditivo_insereNaTabelaPaiFilho();

            // Recalcula ou atualiza o campo principal de valor de locação reajustado
            atualizaValorMensal_valorReajustado();
        });

    // Escuta mudanças (marcar ou desmarcar) nos checkboxes de seleção de equipamentos
    // dentro da tabela #tableEquipamentosAditivoRescisao.
    // Usado delegação de evento no container da tabela porque a DataTable recria
    // as linhas dinamicamente (draw/paginação), então o binding direto no checkbox
    // poderia se perder (tive exemplo de não escutar o change).
    $("#tableEquipamentosAditivoRescisao").on("change", ".checkboxSelecionaEquipamentoAditivo", function () {
        var tipoContrato = $("#tipoContrato").val();
        if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento" || tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {
            atualizaValorMensal_valorReajustado();

        }
    });

    $("#caucao").on("change", function () {
        if ($(this).val() == "Sim") {
            $("#divValorCaucao, #divDataPagamentoCaucao").show();
        } else {
            $("#divValorCaucao, #divDataPagamentoCaucao").hide();
        }
    });
    $("#tipoPagamento").on("change", function () {
        if ($(this).val() == "Depósito") {
            $("#divPagamento, #divBanco").show();
        } else {
            $("#divPagamento, #divBanco").hide();
        }
    });
    $("#valorCaucao, #valorMensalAluguel, #valorLocacaoReajustado").maskMoney({
        prefix: "R$ ",
        thousands: ".",
        decimal: ",",
        allowZero: true,
        affixesStay: true,
    });
    $("#agencia").mask("0000-0", { placeholder: "____-_" });
  //  $("#contaCorrente").mask("00000-0", { placeholder: "_____-_" });
    $("#contaCorrente").mask("0000099-0", {
        placeholder: "_____-_"
    });
    $("#percentualRetencao").mask("000%", { reverse: true });
    $("#descontoPorDiaChuva").mask("000%", { reverse: true });
    $("#descontoPorDiaParado").mask("000%", { reverse: true });
    $(".cpfAdministrador").mask("000.000.000-00");

    // Validações
    // blur dispara quando o usuário sai do campo
    $("#dataInicioLocacao, #dataFimLocacao").on("blur", function () {
        atualizaValorTotalLocacao_prazo();

        var tipoContrato = $("#tipoContrato").val();
        var dataInicioLocacao = $("#dataInicioLocacao").val().split("/").reverse().join("-");
        var dataFimLocacao = $("#dataFimLocacao").val().split("/").reverse().join("-");
        var dataInicioContrato = $("#contratoSelecDataInicio").val();

        /*
            Locação de Equipamento
        */
        if (tipoContrato == "Locação de Equipamento" || tipoContrato == "Locação de Equipamento - Com Mão de Obra") {
            if (dataInicioLocacao == dataFimLocacao) {
                $("#dataInicioLocacao").val("");
                $("#dataFimLocacao").val("");

                FLUIGC.toast({
                    title: "",
                    message: "A data de início não pode ser igual à data fim!",
                    type: "warning",
                    timeout: 4000
                });
                return;

                // Se data fim não vazio e data inicio maior que a data fim
            } else if (dataFimLocacao !== "" && dataInicioLocacao > dataFimLocacao) {
                $("#dataInicioLocacao").val("");
                $("#dataFimLocacao").val("");

                FLUIGC.toast({
                    title: "",
                    message: "A data de início não pode ser maior que a data fim!",
                    type: "warning",
                    timeout: 4000
                });
                return;

            } else if (dataInicioLocacao !== "" && dataFimLocacao < dataInicioContrato) {
                $("#dataInicioLocacao").val("");
                $("#dataFimLocacao").val("");

                FLUIGC.toast({
                    title: "",
                    message: "A data fim não pode ser menor que a data de início!",
                    type: "warning",
                    timeout: 4000
                });
                return;
            }
        } else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo" || tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor") {

            if (dataInicioLocacao === "" && dataFimLocacao !== "") {
                // Limpa o campo, aqui funciona porque esta no evento "blur"
                // (ou seja, depois que o usuário saiu do campo e o componente já terminou de processar)
                $(this).val("");

                FLUIGC.toast({
                    title: "",
                    message: "Informe a data de início locação primeiro!",
                    type: "warning",
                    timeout: 4000
                });
                return;

            } else if (dataFimLocacao == dataInicioLocacao) {
                $(this).val("");

                FLUIGC.toast({
                    title: "",
                    message: "A data fim de locação não pode ser igual à data de inicio de locação!",
                    type: "warning",
                    timeout: 4000
                });
                return;

            } else if (dataFimLocacao != "" && dataFimLocacao < dataInicioLocacao) {
                $(this).val("");

                FLUIGC.toast({
                    title: "",
                    message: "A data fim de locação não pode ser menor que a data de inicio de locação!",
                    type: "warning",
                    timeout: 4000
                });
            } else if (dataInicioContrato === "" && dataInicioLocacao !== "") {
                // Limpa o campo, aqui funciona porque esta no evento "blur"
                // (ou seja, depois que o usuário saiu do campo e o componente já terminou de processar)
                $(this).val("");

                FLUIGC.toast({
                    title: "",
                    message: "Selecione um contrato principal primeiro!",
                    type: "warning",
                    timeout: 4000
                });
                return;

            } else if (dataInicioContrato == dataInicioLocacao) {
                $(this).val("");

                FLUIGC.toast({
                    title: "",
                    message: "A data de inicio locação não pode ser igual à data de inicio do contrato!",
                    type: "warning",
                    timeout: 4000
                });
                return;

            } else if (dataInicioLocacao < dataInicioContrato) {
                $(this).val("");

                FLUIGC.toast({
                    title: "",
                    message: "A data de inicio locação não pode ser menor que a data de inicio do contrato!",
                    type: "warning",
                    timeout: 4000
                });
            }
        }
    });

    // Ao alterar a data de inicio  do contrato (onChange) automaticamente é preenchido o dataReajuste que está readonly.
    $("#dataInicioLocacao").on("change", function () {
        if ($("#origemContrato").val() === "Aditivos") {
            var dataInicioContrato = $(this).val();
            $("#dataReajuste").val(dataInicioContrato);
        }
    });

    // Validações
    // blur dispara quando o usuário sai do campo
    $("#dataReajuste").off("blur").on("blur", function () {
        var tipoContrato = $("#tipoContrato").val();
        var dataReajuste = $(this).val();
        var dataInicioContrato = $("#contratoSelecDataInicio").val();

        // Se não tem contrato selecionado mas o usuário informou uma data
        if (dataInicioContrato === "" && dataReajuste !== "") {
            // Limpa o campo, aqui funciona porque esta no evento "blur"
            // (ou seja, depois que o usuário saiu do campo e o componente já terminou de processar)
            $(this).val("");

            FLUIGC.toast({
                title: "",
                message: "Selecione um contrato principal primeiro!",
                type: "warning",
                timeout: 4000
            });
            return;
        }

        if (dataReajuste === dataInicioContrato) {
            $(this).val("");

            FLUIGC.toast({
                title: "",
                message: "A data de reajuste não pode ser igual à data de inicio do contrato!",
                type: "warning",
                timeout: 4000
            });
            return;
        }

        if (dataReajuste < dataInicioContrato) {
            $(this).val("");

            FLUIGC.toast({
                title: "",
                message: "A data de reajuste não pode ser menor que a data de inicio do contrato!",
                type: "warning",
                timeout: 4000
            });
        }
    });

    $("#temRetencao").on("change", function () {
        if ($(this).val() == "Sim") {
            $("#divPercentualRetencao").show();
        } else {
            $("#divPercentualRetencao").hide();
        }
    });
    $("#temREIDI").on("change", function () {
        if ($(this).val() == "Sim") {
            $("#divPercentualReidi").show();
        } else {
            $("#divPercentualReidi").hide();
        }
    });

    $("#btnAnexarContrato").on("click", function () {
        $("#inputFileAnexarContrato").click();
    });
    $("#inputFileAnexarContrato").on("change", async function () {
        if ($(this)[0].files.length > 0) {
            $("#nomeAnexoContrato").text("Carregando...");
            var docId = await criaDocFluigRetornaDocumentId($(this)[0].files[0], pastaDeAnexos);
            $("#contratoPdfId").val(docId);
            $("#nomeAnexoContrato").text($(this)[0].files[0].name);
            $("#nomeAnexoContrato").attr("href", await promiseBuscaDownloadUrlDocumentoNoFLuig(docId));
        }
    });

    $("#temReajuste").on("change", function () {
        var val = $(this).val();
        if (val == "Sim") {
            $("#divCampoReajuste").show();
        } else {
            $("#divCampoReajuste").hide();
        }
    });
    $("#percentualRetencao").on("change", function () {
        if ($("#atividade").val() != ATIVIDADES.JURIDICO) {
            if ($(this).val().replace("%", "") < 5) {
                FLUIGC.toast({
                    title: "Caso seja necessário informar retenção menor que 5%, a alteração deve ser solicitada ao Jurídico.",
                    message: "",
                    type: "warning"
                });
                $(this).val("5%");
            }
        }
    });
    $("#descontoPorDiaChuva").on("change", function () {
        if ($("#atividade").val() != ATIVIDADES.JURIDICO) {
            if ($("#modeloContrato").val() == "Modelo Castilho") {
                if ($(this).val().replace("%", "") < 50) {
                    FLUIGC.toast({
                        title: "Caso seja necessário informar desconto por dia de chuva menor que 50%, a alteração deve ser solicitada ao Jurídico.",
                        message: "",
                        type: "warning"
                    });
                    $(this).val("50%");
                }
            }
        }
    });
    $("#descontoPorDiaParado").on("change", function () {
        if ($("#atividade").val() != ATIVIDADES.JURIDICO) {
            if ($("#modeloContrato").val() == "Modelo Castilho") {
                if ($(this).val().replace("%", "") < 50) {
                    FLUIGC.toast({
                        title: "Caso seja necessário informar desconto por dia parado menor que 50%, a alteração deve ser solicitada ao Jurídico.",
                        message: "",
                        type: "warning"
                    });
                    $(this).val("50%");
                }
            }
        }
    });

    $("#btnVisualizarDadosContrato").on("click", function () {
        modalDadosDoFormulario();
    });

    // Aba Assinatura
    $("#assinaturaContrato").on("change", () => onchangeTipoAssinaturaContrato())
    var val = $("#assinaturaContrato").val() ? $("#assinaturaContrato").val() : $("#assinaturaContrato").text();

    if (val == "Eletrônica") {

        $("#mailRepresentanteCastilho, #mailRepresentanteFornecedor").closest("div").show();

    } else if (val == "Manual") {
        $("#mailRepresentanteCastilho, #mailRepresentanteFornecedor").closest("div").hide();
    }

    $("#nomeRepresentanteFornecedor").on("change", asyncVerificaSeExisteAssinanteCadastradoPorNome);
    $("#tipoContrato, #obra").on("change", function () {
        if ($("#tipoContrato").val() != "" && $("#obra").val() != "") {
            asyncPreencheRepresentanteCastilho();
        }
    });
    $("#btnCadastrarAssinante").on("click", abreModalCadastrarAssinante);
    $("#btnAdicionarTestemunha").on("click", function () {
        var value = $("#selectTestemunha")[0].selectize.items[0];
        if (!value) {
            return;
        }

        var [nome, email, cpf] = value.split(" - ");

        $("#tableTestemunhas>tbody").append(`
            <tr>
                <td>${nome}</td>
                <td>${email}</td>
                <td>${cpf}</td>
                <td style="text-align:center;">
                    <button class="btn btn-danger btnDelete">
                        <i class="flaticon flaticon-trash icon-md" aria-hidden="true"></i>
                    </button>
                </td>
            </tr>    
        `);

        $("#selectTestemunha")[0].selectize.clear();
        salvaTestemunhasNoCampoHidden();
        $("#tableTestemunhas>tbody>tr:last").find(".btnDelete").on("click", function () {
            $(this).closest("tr").remove();
            salvaTestemunhasNoCampoHidden();
        });
    });

    // Paginacao
    $("#btn-avancar").on("click", avancarPagina);
    $("#btn-voltar").on("click", voltarPagina);

    $(".pagination").on("click", function () {
        var index = $(this).attr("data-index");
        mostrarPagina(index, "set");
    });

    //Equipamentos
    $("#tipoContrato, #obra, #locador").on("change", function () {
        var tipoContrato = $("#tipoContrato").val();
        var obra = $("#obra").val();
        var locador = $("#locador").val();

        // Sempre limpa a tabela
        dataTableEquipamentosAditivoRescisao.clear().draw();

        if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento" && obra && locador) {
            preencheListaDeEquipamentos_aditivosRescisao();

        } else if (tipoContrato == "Locação de Equipamento" || tipoContrato == "Locação de Equipamento - Com Mão de Obra" && obra && locador) {
            preencheListaDeEquipamentos();
        }
    });

    // Pega alteração no value de ID_TCNT_AUXILIAR
    $("#ID_TCNT_AUXILIAR").on("change", function () {
        var tipoContrato = $("#tipoContrato").val();
        var origemContrato = $("#origemContrato").val();

        if (origemContrato == "Aditivos" || origemContrato == "Rescisões") {

            // Limpa tabela antes de montar novamente
            $("#tableEquipamentosSelecionados_aditivos > tbody > tr:not(:first)").each(function () {
                fnWdkRemoveChild(this);
            });

            preencheListaDeEquipamentos_aditivosRescisao();
        }

    });

    $("#novoContratoTipoFaturamento").on("change", function () {
        if ($(this).val() != "1") {
            $("#novoContratoDiaFaturamento, #novoContratoQtdeFaturamento").closest("div").hide();
        } else {
            $("#novoContratoDiaFaturamento, #novoContratoQtdeFaturamento").closest("div").show();
        }

    });

    // Anexos
    $("#btnAnexarDocumento").on("click", function () { $("#inputAnexo").click() });
    $("#inputAnexo").on("change", onChangeInputAnexo_alteraListagemDeAnexos_criaDocNoFluig);
}


async function loadTelaInicio() {
    parent.$("#workflowActions").hide();

    $(".panelAprovacao").hide();
    $(".panelInput").show();
    $("#divTipoAssinaturaContrato").show();

    $("#paginationIntegracaoRM").remove();

    $("#historico, #divDecisaoAprovar, #divDecisaoCancelar").hide();
    mostrarPagina("0");
    setAtividadeAtivaProgresso(0);
    preencherObrasDoUsuario();
    buscaFornecedores_preencheOptionsDoCampoLocador();
    buscaBancos();
    inicializarCalendario();
    inicializarPeriodoLocacao();

    initDataTableContratoPrincipal();

    initDataTableEquipamentos();
    preencheListaDeEquipamentos();
    initDataTableEquipamentos_aditivoRescisao();
    initDataTableEquipamentosParaInclusaoExclusao();
    preencheListaDeEquipamentos_aditivosRescisao();

    $("#temRetencao").attr("readonly", "readonly");
    $("#selectTestemunha").selectize();
    asyncAtualizaListaDeAssinantes();
    preencherCamposViaSessionStorage();
}
async function loadTelaInicioRetorno() {
    $(".panelAprovacao").hide();
    $("#divTipoAssinaturaContrato").show();
    $("#dadosContrato").show();
    $("#paginationIntegracaoRM").remove();
    setAtividadeAtivaProgresso(0);
    preencherObrasDoUsuario();
    buscaFornecedores_preencheOptionsDoCampoLocador();
    buscaBancos();
    inicializarCalendario();
    inicializarPeriodoLocacao();
    initDataTableContratoPrincipal();

    initDataTableEquipamentos_aditivoRescisao();
    initDataTableEquipamentosParaInclusaoExclusao();
    preencheListaDeEquipamentos_aditivosRescisao();

    atualizaDatatableContratoPrincipal();
    asyncMontaHistorico()
    onChangeTipoContrato($("#tipoContrato"));
    $(".endereco-fornecedor").slideDown();
    $("#formContainer").show();
    mostrarPagina("0");
    if ($("#caucao").val() == "Sim") {
        $("#divValorCaucao, #divDataPagamentoCaucao").show();
    }
    if ($("#tipoPagamento").val() == "Depósito") {
        $("#divPagamento, #divBanco").show();
    }

    if ($("#temReajuste").val() == "Sim") {
        $("#divCampoReajuste").show();
    } else {
        $("#divCampoReajuste").hide();
    }
    
   

    $("#banco").one('click', function () {
        if (!$(this).hasClass('opcoes-carregadas')) {
            buscaBancos();
            $(this).addClass('opcoes-carregadas');
        }
    });

    if ($("#tipoContrato").val() == "Locação de Equipamento" || $("#tipoContrato").val() == "Locação de Equipamento - Com Mão de Obra") {

        initDataTableEquipamentos();
        preencheListaDeEquipamentos();
    }

    if ($("#temRetencao").val() == "Sim") {
        $("#divPercentualRetencao").show();
    } else {
        $("#divPercentualRetencao").hide();
    }
    if ($("#temREIDI").val() == "Sim") {
        $("#divPercentualReidi").show();
    } else {
        $("#divPercentualReidi").hide();
    }


    $("#temRetencao").attr("readonly", "readonly");

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnAnexarContrato").show();

        var documentId = $("#contratoPdfId").val();
        $("#nomeAnexoContrato").attr("href", await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId));
        var documentData = await asyncGetDocumentDetails(documentId);
        $("#nomeAnexoContrato").text(documentData.data.description);
    } else {
        $("#btnAnexarContrato").hide();
    }

    const hiddenValue = $("#hiddenDocumentosAnexados").val();
    const anexos = JSON.parse(hiddenValue);
    documentosAnexados = anexos;

    anexosPorTipoDeContrato($("#tipoContratoBase").val());

    for (const anexo in documentosAnexados) {
        var dataAnexo = await asyncGetDocumentDetails(documentosAnexados[anexo]);

        insereDocumentoCriado(anexo, documentosAnexados, dataAnexo.data.description, documentosAnexados[anexo]);
    }

    var tipoPessoa = $("#FORNECEDOR_PF_PJ").val();

    if (!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)) {
        $("#temREIDI").closest("div.row").hide();
        $("#temREIDI").val("Não");
        $("#percentualREIDI").val("");
    } else {
        $("#temREIDI").closest("div.row").show();
    }
}
function loadTelaJuridico() {
    $(".panelAprovacao").show();
    $("#rowAnexosSelecao").hide();
    $("#formContainer").show();
    $("#divBtnEnviar").hide();
    $("#tableEquipamentos, #tableEquipamentosAditivoRescisao").hide();

    // Mostra a tabela de Contrato Principal Selecionado para Aditivo/Rescisão
    $("#tableContratoPrincipalSelecionado").show();
    // Carrega dados do Contrato Principal selecionado
    carregaTabelaContratoPrincipalSelecionado();
    // Oculta Tabela Principal para selecionar o contrato (mostra somente na Inicio)
    $("#tableContratoPrincipal").hide();

    geraEquipamentosSelecionados();
    geraCabecalhoEquipamentos();
    $("#divBotoesEdicaoContrato").show();
    $(".endereco-fornecedor").slideDown();
    onChangeTipoContrato($("#tipoContrato"));
    buscaBancos();

    setAtividadeAtivaProgresso(1);
    asyncMontaHistorico();
    mostrarPagina("0");
    renderizarAnexosEtapaAprovacao();

    $("#paginationIntegracaoRM").remove();

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnEditarArquivo, #btnSubstituirWord, #btnBaixarWord").hide();
        $("#btnVisualizarPreContrato").hide();
    }

    if ($("#temRetencao").val() == "Sim") {
        $("#divPercentualRetencao").show();
    } else {
        $("#divPercentualRetencao").hide();
    }
    if ($("#temREIDI").val() == "Sim") {
        $("#divPercentualReidi").show();
    } else {
        $("#divPercentualReidi").hide();
    }
    if ($("#temReajuste").val() == "Sim") {
        $("#divCampoReajuste").show();
    } else {
        $("#divCampoReajuste").hide();
    }

    if ($("#tipoPagamento").val() == "Depósito") {
        $("#divPagamento, #divBanco").show();
    }

    $("#divAdicionarTestemunha").hide();
    carregaTestemunhas();

    $("#btnVisualizarDadosContrato").show();

    if (!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)) {
        $("#temREIDI").closest("div.row").hide();
        $("#temREIDI").val("Não");
        $("#percentualREIDI").val("");
    } else {
        $("#temREIDI").closest("div.row").show();
    }
}
async function loadTelaControladoria() {
    parent.$("#workflowActions").hide();
    $(".panelAprovacao").show();
    $("#rowAnexosSelecao").hide();
    $("#formContainer").show();

    // Mostra a tabela de Contrato Principal Selecionado para Aditivo/Rescisão
    $("#tableContratoPrincipalSelecionado").show();
    // Carrega dados do Contrato Principal selecionado
    carregaTabelaContratoPrincipalSelecionado();
    // Oculta Tabela Principal para selecionar o contrato (mostra somente na Inicio)
    $("#tableContratoPrincipal").hide();


    if ($("#origemContrato").val() == "Novos") {
        bindingCamposIntegracaoRM();
    } else {
        $("#paginationIntegracaoRM").remove();
    }

    // Preenche campos de integração
    $("#dadosRMNovoContrato").show();
    await asyncPreencheOptionsColigada();
    preencheCamposAutomaticamente();

    geraEquipamentosSelecionados();
    geraCabecalhoEquipamentos();
    onChangeTipoContrato($("#tipoContrato"));
    buscaBancos();
    $(".endereco-fornecedor").slideDown();

    $("#divBotoesEdicaoContrato").show();
    
    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnEditarArquivo, #btnSubstituirWord, #btnBaixarWord").hide();
        $("#btnVisualizarPreContrato").hide();
    }
    $("#btnVisualizarPreContrato").hide();


    setAtividadeAtivaProgresso(2);
    asyncMontaHistorico();
    mostrarPagina("0");

    renderizarAnexosEtapaAprovacao();
    bloqueiaCamposAprovacao();

    ///////////PAOLA
    const select = $("#assinaturaContrato");
    select.removeAttr("readonly");
    select.find('option[value="Já Assinado"]').removeAttr("hidden");
   

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnEditarArquivo, #btnSubstituirWord, #btnBaixarWord").hide();
        $("#btnVisualizarPreContrato").hide();
    }

    if ($("#tipoPagamento").val() == "Depósito") {
        $("#divPagamento, #divBanco").show();
    }

    if ($("#temRetencao").val() == "Sim") {
        $("#divPercentualRetencao").show();
    } else {
        $("#divPercentualRetencao").hide();
    }
    if ($("#temREIDI").val() == "Sim") {
        $("#divPercentualReidi").show();
    } else {
        $("#divPercentualReidi").hide();
    }
    if ($("#temReajuste").val() == "Sim") {
        $("#divCampoReajuste").show();
    } else {
        $("#divCampoReajuste").hide();
    }
    $("#divAdicionarTestemunha").hide();
    carregaTestemunhas();

    if (!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)) {
        $("#temREIDI").closest("div.row").hide();
        $("#temREIDI").val("Não");
        $("#percentualREIDI").val("");
    } else {
        $("#temREIDI").closest("div.row").show();
    }

    $(".btnRemoverItemNovoContrato").off("click").on("click", function () {
        fnWdkRemoveChild($(this).closest("tr")[0]);
    });
}
function loadTelaAprovacao() {
    parent.$("#workflowActions").hide();
    $(".panelAprovacao, #formContainer").show();
    $("#rowAnexosSelecao").hide();
    setAtividadeAtivaProgresso(3);

    //PAOLA
    const select = $("#assinaturaContrato");
    select.removeAttr("readonly");
    select.find('option[value="Já Assinado"]').removeAttr("hidden");
    
    
    
    // Mostra a tabela de Contrato Principal Selecionado para Aditivo/Rescisão
    $("#tableContratoPrincipalSelecionado").show();
    // Carrega dados do Contrato Principal selecionado
    carregaTabelaContratoPrincipalSelecionado();
    // Oculta Tabela Principal para selecionar o contrato (mostra somente na Inicio)
    $("#tableContratoPrincipal").hide();

    onChangeTipoContrato($("#tipoContrato"));
    buscaBancos();

    $("#divBotoesEdicaoContrato").show();
    $("#btnEditarArquivo, #btnSubstituirWord, #btnBaixarWord").hide();
    $("#btnVisualizarPreContrato").hide();

    asyncMontaHistorico();
    mostrarPagina("0");
    geraEquipamentosSelecionados();
    geraCabecalhoEquipamentos();
    renderizarAnexosEtapaAprovacao();
    $("#paginationIntegracaoRM").remove();
    $("#btnEditarArquivo, #btnSubstituirWord, #btnBaixarWord").remove();
    bloqueiaCamposAprovacao();
    $(".endereco-fornecedor").slideDown();
    

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnEditarArquivo, #btnSubstituirWord, #btnBaixarWord").hide();
        $("#btnVisualizarPreContrato").hide();
    }

    if ($("#temRetencao").val() == "Sim") {
        $("#divPercentualRetencao").show();
    } else {
        $("#divPercentualRetencao").hide();
    }
    if ($("#temREIDI").val() == "Sim") {
        $("#divPercentualReidi").show();
    } else {
        $("#divPercentualReidi").hide();
    }
    if ($("#temReajuste").val() == "Sim") {
        $("#divCampoReajuste").show();
    } else {
        $("#divCampoReajuste").hide();
    }
    $("#divAdicionarTestemunha").hide();
    carregaTestemunhas();

    if ($("#tipoPagamento").val() == "Depósito") {
        $("#divPagamento, #divBanco").show();
    }

    if (!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)) {
        $("#temREIDI").closest("div.row").hide();
        $("#temREIDI").val("Não");
        $("#percentualREIDI").val("");
    } else {
        $("#temREIDI").closest("div.row").show();
    }
}
function loadTelaAssinaturaManual() {
    $(".panelAprovacao, #formContainer, #dadosContrato").show();
    $("#rowAnexosSelecao").hide();
    setAtividadeAtivaProgresso(4);
    asyncMontaHistorico();
    mostrarPagina("0");
    geraEquipamentosSelecionados();
    geraCabecalhoEquipamentos();
    $("#paginationIntegracaoRM").remove();
    $("#btnEditarArquivo, #btnSubstituirWord, #btnBaixarWord").remove();

    // Mostra a tabela de Contrato Principal Selecionado para Aditivo/Rescisão
    $("#tableContratoPrincipalSelecionado").show();
    // Carrega dados do Contrato Principal selecionado
    carregaTabelaContratoPrincipalSelecionado();
    // Oculta Tabela Principal para selecionar o contrato (mostra somente na Inicio)
    $("#tableContratoPrincipal").hide();

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnEditarArquivo, #btnSubstituirWord, #btnBaixarWord").hide();
        $("#btnVisualizarPreContrato").hide();
    }
    $(".endereco-fornecedor").slideDown();

    onChangeTipoContrato($("#tipoContrato"));
    bloqueiaCamposAprovacao();
    renderizarAnexosEtapaAprovacao();

    $("#divResolucaoChamado").hide();

    if ($("#temRetencao").val() == "Sim") {
        $("#divPercentualRetencao").show();
    } else {
        $("#divPercentualRetencao").hide();
    }
    if ($("#temREIDI").val() == "Sim") {
        $("#divPercentualReidi").show();
    } else {
        $("#divPercentualReidi").hide();
    }
    if ($("#temReajuste").val() == "Sim") {
        $("#divCampoReajuste").show();
    } else {
        $("#divCampoReajuste").hide();
    }
    $("#divAdicionarTestemunha").hide();
    carregaTestemunhas();

    if ($("#tipoPagamento").val() == "Depósito") {
        $("#divPagamento, #divBanco").show();
    }

    if (!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)) {
        $("#temREIDI").closest("div.row").hide();
        $("#temREIDI").val("Não");
        $("#percentualREIDI").val("");
    } else {
        $("#temREIDI").closest("div.row").show();
    }
}
function loadTelaAssinaturaEletronica() {

    $(".panelAprovacao, #formContainer, #dadosContrato").show();
    $("#rowAnexosSelecao").hide();
    setAtividadeAtivaProgresso(4);
    asyncMontaHistorico();
    mostrarPagina("0");
    geraEquipamentosSelecionados();
    geraCabecalhoEquipamentos();
    $("#paginationIntegracaoRM").remove();
    $("#btnEditarArquivo, #btnSubstituirWord, #btnBaixarWord").remove();

    // Mostra a tabela de Contrato Principal Selecionado para Aditivo/Rescisão
    $("#tableContratoPrincipalSelecionado").show();
    // Carrega dados do Contrato Principal selecionado
    carregaTabelaContratoPrincipalSelecionado();
    // Oculta Tabela Principal para selecionar o contrato (mostra somente na Inicio)
    $("#tableContratoPrincipal").hide();

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnEditarArquivo, #btnSubstituirWord, #btnBaixarWord").hide();
        $("#btnVisualizarPreContrato").hide();
    }
    $(".endereco-fornecedor").slideDown();

    onChangeTipoContrato($("#tipoContrato"));
    renderizarAnexosEtapaAprovacao();

    $("#divQuadroStatusAssinaturaEletronica").show();
    asyncGeraQuadroStatusAssinatura();
    bloqueiaCamposAprovacao();

    if ($("#tipoPagamento").val() == "Depósito") {
        $("#divPagamento, #divBanco").show();
    }

    if ($("#temRetencao").val() == "Sim") {
        $("#divPercentualRetencao").show();
    } else {
        $("#divPercentualRetencao").hide();
    }
    if ($("#temREIDI").val() == "Sim") {
        $("#divPercentualReidi").show();
    } else {
        $("#divPercentualReidi").hide();
    }
    if ($("#temReajuste").val() == "Sim") {
        $("#divCampoReajuste").show();
    } else {
        $("#divCampoReajuste").hide();
    }

    $("#divAdicionarTestemunha").hide();
    carregaTestemunhas();

    if (!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)) {
        $("#temREIDI").closest("div.row").hide();
        $("#temREIDI").val("Não");
        $("#percentualREIDI").val("");
    } else {
        $("#temREIDI").closest("div.row").show();
    }
}