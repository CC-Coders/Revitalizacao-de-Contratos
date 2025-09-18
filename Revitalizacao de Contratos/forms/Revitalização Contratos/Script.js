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
    const ATIVIDADE_ATUAL = parseInt($("#atividade").val())
    console.log(ATIVIDADE_ATUAL)
    if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO){
    	loadTelaInicioRetorno(); 
    } else if(ATIVIDADE_ATUAL == ATIVIDADES.INICIO_0) {
    	loadTelaInicio(); 
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.JURIDICO) {
        loadTelaJuridico();
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.CONTROLADORIA) {
        loadTelaControladoria();
    } else if (ATIVIDADE_ATUAL == ATIVIDADES.ENGENHEIRO || ATIVIDADE_ATUAL == ATIVIDADES.COORDENADOR_OBRAS || ATIVIDADE_ATUAL == ATIVIDADES.DIRETORIA) {
        loadTelaAprovacao();
    }

});
var beforeSendValidate = function (numState, nextState) {
    var atividade = parseInt(document.getElementById("atividade").value);
//    if (atividade == 0) {
//        return validaCampos();
//    }
    return validaCampos();
};

function bindings() {
    FLUIGC.popover('.step',{trigger: 'hover', placement: 'auto'});


    // Amarra eventos e elementos do HTML, mantendo todas definições de evento agrupadas
    $("#btnGerarArquivo").on("click", asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao);
    $("#btnEditarArquivo").on("click", editarArquivo);
    $("#btnSalvarArquivo").on("click", salvaModeloAlterado);
    $("#btnVisualizarArquivo").on("click", visualizaDocumento);
    $("#btnEnviarSolicitacao").on("click", enviarSolicitacao);
    $("#btnVisualizarPreContrato").on("click", geraPreContrato);
   
    $("#obra").off("change").on("change", salvaDadosDaObraSelecionadaComoHiddenInput);

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
    $("input[name='decisao']").on("change", function () {
        if ($(this).val() == "Aprovar") {
            $("#divDestinoRetorno").hide();
        }
        else if ($(this).val() == "Retornar") {
            $("#divDestinoRetorno").show();
            popularDestinoRetorno()
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


    // Aba Assinatura
    $("#assinaturaContrato").on("change", ()=> onchangeTipoAssinaturaContrato())
    $("#nomeRepresentanteFornecedor").on("change", ()=> asyncVerificaSeExisteAssinanteCadastradoPorNome($(this).val()));
    $("#tipoContrato, #obra").on("change", function(){
        if ($("#tipoContrato").val() != "" && $("#obra").val() != "") {
            asyncPreencheRepresentanteCastilho();
        }
    });


    // Aba Integração RM
    $("#btnAdicionarItem").on("click", asyncAdicionarItemNovoContrato);


    // Paginacao
    $("#btn-avancar").on("click", avancarPagina);
    $("#btn-voltar").on("click", voltarPagina);
      
    $(".pagination").on("click", function(){
        var index = parseInt($(this).attr("data-index"));
        paginaAtual=index;
        mostrarPagina(index);
    });


    // Decrição Atividades
    // $(".wizard-progress>.step").hover(mostraDescricaoDaAtividade, ()=>{$("#divDescricaoAtividades").hide()});
}

function loadTelaInicio() {
    $(".panelAprovacao").hide();
    $("#divRepresentantesContratoAprovacao").hide();
    $("#divRepresentantesContrato").show();
    $("#divTipoAssinaturaContrato").show();

    setAtividadeAtivaProgresso(0);
    preencherObrasDoUsuario();
    buscaFornecedores();
    buscaBancos();
    inicializarCalendario();
    inicializarPeriodoLocacao();
    inicializaInputAnexo();
}
function loadTelaInicioRetorno() {
    $(".panelAprovacao").hide();
    $("#divRepresentantesContrato").show();
    $("#divTipoAssinaturaContrato").show();

    setAtividadeAtivaProgresso(0);
//    preencherObrasDoUsuario();
    buscaFornecedores();
//    buscaBancos();
    inicializarCalendario();
    inicializarPeriodoLocacao();
    inicializaInputAnexo();
    asyncMontaHistorico()
    renderizarAnexosEtapaAprovacao();
        $("#formContainer").show();
        paginaAtual = 0;
        mostrarPagina(paginaAtual);
        if($("#caucao").val() == "Sim"){
        	$("#divValorCaucao, #divDataPagamentoCaucao").show();
        }
        if( $("#tipoPagamento").val() == "Depósito"){
        	 $("#divPagamento, #divBanco").show();
        }
        $("#obra").one('click', function() {
            if(!$(this).hasClass('opcoes-carregadas')) {
                preencherObrasDoUsuario();
                $(this).addClass('opcoes-carregadas');
            }
        });
        
        // Configurar o select de banco
        $("#banco").one('click', function() {
            if(!$(this).hasClass('opcoes-carregadas')) {
                buscaBancos();
                $(this).addClass('opcoes-carregadas');
            }
        });
}

function loadTelaJuridico() {
    $("#informacoesIniciais, #rowAnexosSelecao").hide();
    $(".panelAprovacao").show();
    $("#formContainer").show();
    $("#divBtnEnviar").hide();

    $("#panelDadosPagamento, #panelDadosGerais, #painelObservacoes").hide();
    setAtividadeAtivaProgresso(1);
    carregaDadosDoContratoParaTelaAprovacao();
    asyncMontaHistorico();
    mostrarPagina(0);
    renderizarAnexosEtapaAprovacao();

    $("#divRepresentantesContrato").hide();
        preencheInformacoesAprovacao();
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

    $("#divRepresentantesContrato").hide();
        preencheInformacoesAprovacao();
}

function loadTelaAprovacao() {
		$("#panelDadosPagamento, #panelDadosGerais, #painelObservacoes, #informacoesIniciais, #rowAnexosSelecao").hide();
	    $(".panelAprovacao, #formContainer").show();
	    setAtividadeAtivaProgresso(3);
	    carregaDadosDoContratoParaTelaAprovacao();
	    asyncMontaHistorico();
	    mostrarPagina(0);
	    renderizarAnexosEtapaAprovacao();
        
        $("#divRepresentantesContrato").hide();
        preencheInformacoesAprovacao();
    }