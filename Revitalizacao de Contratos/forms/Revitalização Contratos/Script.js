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
    ASSINATURA_ELETRONICA: 66,
};

$(document).ready(function () {
    bindings();

    const ATIVIDADE_ATUAL = $("#atividade").val();

    if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO || ATIVIDADE_ATUAL == ATIVIDADES.INICIO_0) {
        loadTelaInicio();
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.JURIDICO) {
        loadTelaJuridico();
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.CONTROLADORIA) {
        loadTelaControladoria();
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.ENGENHEIRO || ATIVIDADE_ATUAL == ATIVIDADES.COORDENADOR_OBRAS || ATIVIDADE_ATUAL == ATIVIDADES.DIRETORIA) {
        loadTelaAprovacao();
    }

    preencherObrasDoUsuario();
    buscaFornecedores();
    buscaBancos();
    inicializarCalendario();
    inicializarPeriodoLocacao();
    inicializaInputAnexo();
});
var beforeSendValidate = function (numState, nextState) {
    var atividade = parseInt(document.getElementById("atividade").value);
    if (atividade == 0) {
        return validaCampos();
    }
};

function bindings() {
    // Amarra eventos e elementos do HTML, mantendo todas definições de evento agrupadas
    $("#btnGerarArquivo").on("click", asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao);
    $("#btnEditarArquivo").on("click", editarArquivo);
    $("#btnSalvarArquivo").on("click", salvaModeloAlterado);
    $("#btnVisualizarArquivo").on("click", visualizaDocumento);
    $("#btnEnviarSolicitacao").on("click", enviarSolicitacao);
    $("#btnVisualizarPreContrato").on("click", geraPreContrato);
    $("#btn-avancar").on("click", avancarPagina);
    $("#btn-voltar").on("click", voltarPagina);
    $("#btnAdicionarItem").on("click", adicionarItemNovoContrato);
    
    $(".pagination").on("click", function(){
        var index = parseInt($(this).attr("data-index"));
        paginaAtual=index;
        mostrarPagina(index);
    });

    $("#tipoContrato").on("change", function () {
        if ($(this).val() === "Locação de Imóvel") {
            $("#formContainer").show();
            paginaAtual = 0;
            mostrarPagina(paginaAtual);
        } else {
            $("#formContainer").hide();
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
    $("#valorCaucao, #valorMensalAluguel").maskMoney({
        prefix: "R$ ",
        thousands: ".",
        decimal: ",",
        allowZero: true,
        affixesStay: true,
    });
    $("#agencia").mask("0000-0", { placeholder: "____-_" });
    $("#contaCorrente").mask("00000-0", { placeholder: "_____-_" });

    $("#locador").on("change", function () {
        var cgccfo = $(this).val().split(" - ")[0];
        if (cgccfo) {
            buscaInfosFornecedor(cgccfo);
        } else {
            $(".endereco-fornecedor").slideUp();
        }
    });

    document.getElementById("tipoDocumentacao").addEventListener("change", function () {
        const tipo = this.value;
        const divAnexo = document.getElementById("divAnexo");
        const labelAnexo = document.getElementById("labelAnexo");
        const inputAnexo = document.getElementById("inputAnexo");

        if (tipo) {
            labelAnexo.textContent = `Anexo: ${tipo}`;
            inputAnexo.value = "";
            divAnexo.style.opacity = "1";
            divAnexo.style.visibility = "visible";
        } else {
            divAnexo.style.opacity = "0";
            divAnexo.style.visibility = "hidden";
        }
    });
}

function loadTelaInicio() {
    $(".panelAprovacao").hide();

    setAtividadeAtivaProgresso(0);
    preencherObrasDoUsuario();
    buscaFornecedores();
    buscaBancos();

    inicializarCalendario();
    inicializarPeriodoLocacao();
}

function loadTelaJuridico() {
    $("#informacoesIniciais").hide();
    $(".panelAprovacao").show();
    $("#formContainer").show();
    $("#divBtnEnviar").hide();

    $("#panelDadosPagamento, #panelDadosGerais, #painelObservacoes").hide();
    setAtividadeAtivaProgresso(1);
    carregaDadosDoContratoParaTelaAprovacao();
    asyncMontaHistorico();
    mostrarPagina(0);
}

function loadTelaControladoria() {
    $("#informacoesIniciais").hide();
    $(".panelAprovacao").show();
    $("#formContainer").show();
    $("#divBtnEnviar").hide();

    $("#panelDadosPagamento, #panelDadosGerais, #painelObservacoes").hide();
    setAtividadeAtivaProgresso(2);
    carregaDadosDoContratoParaTelaAprovacao();
    asyncMontaHistorico();
    mostrarPagina(0);

}

function loadTelaAprovacao() {}
