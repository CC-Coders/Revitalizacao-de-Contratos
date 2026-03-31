const ATIVIDADES = {
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
    INTERMEDIARIO_ASSINATURA_ELETRONICA: 58,
    ASSINATURA_ELETRONICA: 66,
    ADM_OBRA: 64,
    CONTROLADORIA_RECEBIMENTO: 74,
    CONTROLADORIA_RECOLHE_ASSINATURA: 72,
    OBRA_RECEBE_VIAS: 76,
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
    $("#btnSalvarArquivo").on("click", salvaModeloAlterado);
    $("#btnVisualizarArquivo").on("click", visualizaDocumento);
    $("#btnEnviarSolicitacao").on("click", enviarSolicitacao);
    $("#btnVisualizarPreContrato").on("click", geraPreContrato);

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
    $("#tipoContrato").on("change", () => onChangeTipoContrato($("#tipoContrato")));
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
    $("#valorCaucao, #valorMensalAluguel").maskMoney({
        prefix: "R$ ",
        thousands: ".",
        decimal: ",",
        allowZero: true,
        affixesStay: true,
    });
    $("#agencia").mask("0000-0", { placeholder: "____-_" });
    $("#contaCorrente").mask("00000-0", { placeholder: "_____-_" });
    $("#percentualRetencao").mask("000%", { reverse: true });
    $("#descontoPorDiaChuva").mask("000%", { reverse: true });
    $("#descontoPorDiaParado").mask("000%", { reverse: true });
    $(".cpfAdministrador").mask("000.000.000-00");

    $("#locador").selectize({
        onChange: (value) => {
            var [codcfo, cgccfo, nomeFornecedor] = value.split(" - ");

            // Por padrão os fornecedores são cadastrados no Coligada 0 = Global
            // Nos cadasos de cadastros errados tem que verificar a filial
            // Como a consulta não está retornando o CODCOLCFO ficou fixo como 0
            $("#hiddenCODCOLCFO").val(0);
            $("#hiddenCODCFO").val(codcfo);
            $("#hiddenCGCCFO").val(cgccfo);
            $("#hiddenFORNECEDOR").val(nomeFornecedor);

            if (cgccfo) {
                buscaInfosFornecedor_verificaSeFornecedorPfOuPj_PreencheDadosDoFornecedorNoFormulario_AlteraAnexosNecessarios(cgccfo);
                atualizaDatatableContratoPrincipal();
            } else {
                $(".endereco-fornecedor").slideUp();
            }
        }
    });

    $("#banco").selectize();

    $("#dataInicioLocacao, #dataFimLocacao").on("change", function () {
        atualizaValorTotalLocacao();
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

        if ((tipoContrato == "Locação de Equipamento" || tipoContrato == "Locação de Equipamento - Com Mão de Obra") && obra && locador) {
            preencheListaDeEquipamentos();
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
    if ($("#tipoContrato").val() == "Locação de Equipamento" || $("#tipoContrato").val() == "Locação de Equipamento - Com Mão de Obra") {
        $("#paginationEquipamentos").show();
        $("#paginationEquipamentos").removeClass("hidden");
    }

    $("#temRetencao").attr("readonly", "readonly");
    $("#selectTestemunha").selectize();
    asyncAtualizaListaDeAssinantes();
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

    // Configurar o select de banco
    $("#banco").one('click', function () {
        if (!$(this).hasClass('opcoes-carregadas')) {
            buscaBancos();
            $(this).addClass('opcoes-carregadas');
        }
    });

    if ($("#tipoContrato").val() == "Locação de Equipamento" || $("#tipoContrato").val() == "Locação de Equipamento - Com Mão de Obra") {
        $("#paginationEquipamentos").show();
        $("#paginationEquipamentos").removeClass("hidden");

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

    anexosPorTipoDeContrato($("#tipoContrato").val());

    for (const anexo in documentosAnexados) {
        var dataAnexo = await asyncGetDocumentDetails(documentosAnexados[anexo]);

        insereDocumentoCriado(anexo, documentosAnexados, dataAnexo.data.description, documentosAnexados[anexo]);
    }

    var tipoPessoa = $("#FORNECEDOR_PF_PJ").val();
    if (tipoPessoa === "F") {
        $(".pessoa-fisica").show();
        $(".pessoa-juridica").hide();
    } else if (tipoPessoa === "J") {
        $(".pessoa-fisica").hide();
        $(".pessoa-juridica").show();
    }

    if (!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)) {
        $("#temREIDI").closest("div.row").hide();
        $("#temREIDI").val("Não");
        $("#percentualREIDI").val("");
    } else {
        $("#temREIDI").closest("div.row").show();
    }
}
async function loadTelaJuridico() {
    $(".panelAprovacao").show();
    $("#rowAnexosSelecao").hide();
    $("#formContainer").show();
    $("#divBtnEnviar").hide();
    $("#tableEquipamentos").hide();
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
        $("#btnEditarArquivo").hide();
        $("#btnVisualizarPreContrato").hide();
    }

    if ($("#tipoContrato").val() == "Locação de Equipamento" || $("#tipoContrato").val() == "Locação de Equipamento - Com Mão de Obra") {
        $("#paginationEquipamentos").show();
        $("#paginationEquipamentos").removeClass("hidden");
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

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnAnexarContrato").show();
        $("#btnVisualizarArquivo").hide();

        var documentId = $("#contratoPdfId").val();
        $("#nomeAnexoContrato").attr("href", await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId));
        var documentData = await asyncGetDocumentDetails(documentId);
        $("#nomeAnexoContrato").text(documentData.data.description);
    } else {
        $("#btnAnexarContrato").hide();
    }

    $("#selectTestemunha").selectize();
    carregaTestemunhas(true);
    asyncAtualizaListaDeAssinantes();
    $("#btnVisualizarDadosContrato").show();

    var tipoPessoa = $("#FORNECEDOR_PF_PJ").val();
    if (tipoPessoa === "F") {
        $(".pessoa-fisica").show();
        $(".pessoa-juridica").hide();
    } else if (tipoPessoa === "J") {
        $(".pessoa-fisica").hide();
        $(".pessoa-juridica").show();
    }

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

    // Preenche campos de integração
    bindingCamposIntegracaoRM();
    $("#dadosRMNovoContrato").show();
    await asyncPreencheOptionsColigada();

    if ($("#IDCNT").val() == "") {
        preencheCamposAutomaticamente();
    }else{
        bloqueiaCamposIntegracaoRM();
    }

    geraEquipamentosSelecionados();
    geraCabecalhoEquipamentos();
    onChangeTipoContrato($("#tipoContrato"));
    buscaBancos();
    $(".endereco-fornecedor").slideDown();

    $("#divBotoesEdicaoContrato").show();
    $("#btnEditarArquivo").hide();
    $("#btnVisualizarPreContrato").hide();
    $("#selectTestemunha").selectize();
    asyncAtualizaListaDeAssinantes();

    setAtividadeAtivaProgresso(2);
    asyncMontaHistorico();
    mostrarPagina("0");

    renderizarAnexosEtapaAprovacao();
    bloqueiaCamposAprovacao();

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnAnexarContrato").show();
        $("#btnVisualizarArquivo").hide();

        var documentId = $("#contratoPdfId").val();
        $("#nomeAnexoContrato").attr("href", await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId));
        var documentData = await asyncGetDocumentDetails(documentId);
        $("#nomeAnexoContrato").text(documentData.data.description);
    } else {
        $("#btnAnexarContrato").hide();
    }

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnEditarArquivo").hide();
        $("#btnVisualizarPreContrato").hide();
    }

    if ($("#tipoPagamento").val() == "Depósito") {
        $("#divPagamento, #divBanco").show();
    }

    if ($("#tipoContrato").val() == "Locação de Equipamento" || $("#tipoContrato").val() == "Locação de Equipamento - Com Mão de Obra") {
        $("#paginationEquipamentos").show();
        $("#paginationEquipamentos").removeClass("hidden");
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
    carregaTestemunhas(true);

    var tipoPessoa = $("#FORNECEDOR_PF_PJ").val();
    if (tipoPessoa === "F") {
        $(".pessoa-fisica").show();
        $(".pessoa-juridica").hide();
    } else if (tipoPessoa === "J") {
        $(".pessoa-fisica").hide();
        $(".pessoa-juridica").show();
    }

    if (!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)) {
        $("#temREIDI").closest("div.row").hide();
        $("#temREIDI").val("Não");
        $("#percentualREIDI").val("");
    } else {
        $("#temREIDI").closest("div.row").show();
    }
}
function loadTelaAprovacao() {
    $(".panelAprovacao, #formContainer").show();
    $("#rowAnexosSelecao").hide();
    setAtividadeAtivaProgresso(3);

    onChangeTipoContrato($("#tipoContrato"));
    buscaBancos();

    $("#divBotoesEdicaoContrato").show();
    $("#btnEditarArquivo").hide();
    $("#btnVisualizarPreContrato").hide();

    asyncMontaHistorico();
    mostrarPagina("0");
    geraEquipamentosSelecionados();
    geraCabecalhoEquipamentos();
    renderizarAnexosEtapaAprovacao();
    $("#paginationIntegracaoRM").remove();
    $("#btnEditarArquivo").remove();
    bloqueiaCamposAprovacao();
    $(".endereco-fornecedor").slideDown();

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnEditarArquivo").hide();
        $("#btnVisualizarPreContrato").hide();
    }

    if ($("#tipoContrato").val() == "Locação de Equipamento" || $("#tipoContrato").val() == "Locação de Equipamento - Com Mão de Obra") {
        $("#paginationEquipamentos").show();
        $("#paginationEquipamentos").removeClass("hidden");
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

    var tipoPessoa = $("#FORNECEDOR_PF_PJ").val();
    if (tipoPessoa === "F") {
        $(".pessoa-fisica").show();
        $(".pessoa-juridica").hide();
    } else if (tipoPessoa === "J") {
        $(".pessoa-fisica").hide();
        $(".pessoa-juridica").show();
    }

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
    $("#btnEditarArquivo").remove();

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnEditarArquivo").hide();
        $("#btnVisualizarPreContrato").hide();
    }
    $(".endereco-fornecedor").slideDown();

    onChangeTipoContrato($("#tipoContrato"));
    bloqueiaCamposAprovacao();
    renderizarAnexosEtapaAprovacao();

    if ($("#tipoContrato").val() == "Locação de Equipamento" || $("#tipoContrato").val() == "Locação de Equipamento - Com Mão de Obra") {
        $("#paginationEquipamentos").show();
        $("#paginationEquipamentos").removeClass("hidden");
    }
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

    var tipoPessoa = $("#FORNECEDOR_PF_PJ").val();
    if (tipoPessoa === "F") {
        $(".pessoa-fisica").show();
        $(".pessoa-juridica").hide();
    } else if (tipoPessoa === "J") {
        $(".pessoa-fisica").hide();
        $(".pessoa-juridica").show();
    }

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
    $("#btnEditarArquivo").remove();

    if ($("#modeloContrato").val() == "Contrato fora do modelo") {
        $("#btnEditarArquivo").hide();
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

    if ($("#tipoContrato").val() == "Locação de Equipamento" || $("#tipoContrato").val() == "Locação de Equipamento - Com Mão de Obra") {
        $("#paginationEquipamentos").show();
        $("#paginationEquipamentos").removeClass("hidden");
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

    var tipoPessoa = $("#FORNECEDOR_PF_PJ").val();
    if (tipoPessoa === "F") {
        $(".pessoa-fisica").show();
        $(".pessoa-juridica").hide();
    } else if (tipoPessoa === "J") {
        $(".pessoa-fisica").hide();
        $(".pessoa-juridica").show();
    }

    if (!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)) {
        $("#temREIDI").closest("div.row").hide();
        $("#temREIDI").val("Não");
        $("#percentualREIDI").val("");
    } else {
        $("#temREIDI").closest("div.row").show();
    }
}