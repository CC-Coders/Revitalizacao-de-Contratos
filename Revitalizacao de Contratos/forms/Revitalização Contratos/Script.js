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
    } else if(ATIVIDADE_ATUAL == ATIVIDADES.ASSINATURA_ELETRONICA || ATIVIDADE_ATUAL == ATIVIDADES.INTERMEDIARIO_ASSINATURA_ELETRONICA){
        loadTelaAssinaturaEletronica();
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
            optgroup_header: function(data, escape) {
                return '<div class="optgroup-header">' + escape(data.label) + '</div>';
            },
            option: function(item, escape) {
                return '<div class="option">' + escape(item.label) + '</div>';
            }
        },
        onChange:(value)=>{
            salvaDadosDaObraSelecionadaComoHiddenInput_buscaAprovadores(value);
            
             var [CODCOLIGADA, CODCCUSTO, NOMECCUSTO] = value.split(" - ");
            if(!obraPermiteReidi(CODCOLIGADA, CODCCUSTO)){
                $("#temREIDI").closest("div.row").hide();
                $("#temREIDI").val("Não");
                $("#percentualREIDI").val("");
            }else{
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

    // Aba Dados Gerais
    $("#tipoContrato").on("change", onChangeTipoContrato);
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
    $("#percentualRetencao").mask("000%", {reverse:true});

    $("#locador").selectize({
        onChange:(value)=>{
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
            } else {
                $(".endereco-fornecedor").slideUp();
            }
        }
    });


    $("#temRetencao").on("change", function(){
        if ($(this).val() == "Sim") {
            $("#divPercentualRetencao").show();
        }else{
            $("#divPercentualRetencao").hide();
        }
    });
    $("#temREIDI").on("change", function(){
        if ($(this).val() == "Sim") {
            $("#divPercentualReidi").show();
        }else{
            $("#divPercentualReidi").hide();
        }
    });


    // Aba Assinatura
    $("#assinaturaContrato").on("change", ()=> onchangeTipoAssinaturaContrato())
    $("#nomeRepresentanteFornecedor").on("change", asyncVerificaSeExisteAssinanteCadastradoPorNome);
    $("#tipoContrato, #obra").on("change", function(){
        if ($("#tipoContrato").val() != "" && $("#obra").val() != "") {
            asyncPreencheRepresentanteCastilho();
        }
    });

    // Paginacao
    $("#btn-avancar").on("click", avancarPagina);
    $("#btn-voltar").on("click", voltarPagina);
      
    $(".pagination").on("click", function(){
        var index = $(this).attr("data-index");
        mostrarPagina(index, "set");
    });

    //Equipamentos
    $("#tipoContrato, #obra, #locador").on("change", function(){
        var tipoContrato = $("#tipoContrato").val();
        var obra = $("#obra").val();
        var locador = $("#locador").val();

        if (tipoContrato == "Locação de Equipamento" && obra && locador) {
            preencheListaDeEquipamentos();
        }
    });

    $("#novoContratoTipoFaturamento").on("change", function(){
        if ($(this).val() != "1") {
            $("#novoContratoDiaFaturamento, #novoContratoQtdeFaturamento").closest("div").hide();
        }else{
            $("#novoContratoDiaFaturamento, #novoContratoQtdeFaturamento").closest("div").show();
        }

    });

    // Decrição Atividades
    // $(".wizard-progress>.step").hover(mostraDescricaoDaAtividade, ()=>{$("#divDescricaoAtividades").hide()});
}

function loadTelaInicio() {
    $(".panelAprovacao").hide();
    $(".panelInput").show();
    $("#divRepresentantesContratoAprovacao").hide();
    $("#divRepresentantesContrato").show();
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
    inicializaInputAnexo();

    initDataTableEquipamentos();
    preencheListaDeEquipamentos();
}

function loadTelaInicioRetorno() {
    $(".panelAprovacao").hide();
    $("#divRepresentantesContrato").show();
    $("#divTipoAssinaturaContrato").show();
    $("#paginationIntegracaoRM").remove();
    setAtividadeAtivaProgresso(0);
//    preencherObrasDoUsuario();
    buscaFornecedores_preencheOptionsDoCampoLocador();
//    buscaBancos();
    inicializarCalendario();
    inicializarPeriodoLocacao();
    inicializaInputAnexo();
    asyncMontaHistorico()
    renderizarAnexosEtapaAprovacao();
        $("#formContainer").show();
        mostrarPagina("0");
        if($("#caucao").val() == "Sim"){
        	$("#divValorCaucao, #divDataPagamentoCaucao").show();
        }
        if( $("#tipoPagamento").val() == "Depósito"){
        	 $("#divPagamento, #divBanco").show();
        }
        
        // Configurar o select de banco
        $("#banco").one('click', function() {
            if(!$(this).hasClass('opcoes-carregadas')) {
                buscaBancos();
                $(this).addClass('opcoes-carregadas');
            }
        });
}

function loadTelaJuridico() {
    $(".panelAprovacao").show();
    $("#informacoesIniciais, #rowAnexosSelecao").hide();
    $("#formContainer").show();
    $("#divBtnEnviar").hide();
    $("#tableEquipamentos").hide();
    geraEquipamentosSelecionados();
    $("#divBotoesEdicaoContrato").show();

    $("#panelDadosPagamento, #panelDadosGerais, #painelObservacoes").hide();
    setAtividadeAtivaProgresso(1);
    carregaDadosDoContratoParaTelaAprovacao();
    asyncMontaHistorico();
    mostrarPagina("0");
    renderizarAnexosEtapaAprovacao();

    $("#divRepresentantesContrato").hide();
    preencheInformacoesAprovacao();
    $("#paginationIntegracaoRM").remove();
}

function loadTelaControladoria() {
    $(".panelAprovacao").show();
    $("#informacoesIniciais, #rowAnexosSelecao").hide();
    $("#formContainer").show();
    $("#divBtnEnviar").hide();
    bindingCamposIntegracaoRM();
    geraEquipamentosSelecionados();


    $("#panelDadosPagamento, #panelDadosGerais, #painelObservacoes").hide();
    setAtividadeAtivaProgresso(2);
    carregaDadosDoContratoParaTelaAprovacao();
    asyncMontaHistorico();
    mostrarPagina("0");

    renderizarAnexosEtapaAprovacao();

    $("#divRepresentantesContrato").hide();
        preencheInformacoesAprovacao();
}

function loadTelaAprovacao() {
    $(".panelAprovacao, #formContainer").show();
	$("#panelDadosPagamento, #panelDadosGerais, #painelObservacoes, #informacoesIniciais, #rowAnexosSelecao").hide();
	setAtividadeAtivaProgresso(3);
	carregaDadosDoContratoParaTelaAprovacao();
	asyncMontaHistorico();
	mostrarPagina("0");
    geraEquipamentosSelecionados();
	renderizarAnexosEtapaAprovacao();
    $("#paginationIntegracaoRM").remove();
    $("#btnEditarArquivo").remove();

    $("#divRepresentantesContrato").hide();
    preencheInformacoesAprovacao();
}

function loadTelaAssinaturaEletronica(){

    $(".panelAprovacao, #formContainer").show();
	$("#panelDadosPagamento, #panelDadosGerais, #painelObservacoes, #informacoesIniciais, #rowAnexosSelecao").hide();
	setAtividadeAtivaProgresso(4);
	carregaDadosDoContratoParaTelaAprovacao();
	asyncMontaHistorico();
	mostrarPagina("0");
    geraEquipamentosSelecionados();
	renderizarAnexosEtapaAprovacao();
    $("#paginationIntegracaoRM").remove();
    $("#btnEditarArquivo").remove();

    $("#divRepresentantesContrato").hide();
    preencheInformacoesAprovacao();

    $("#divQuadroStatusAssinaturaEletronica").show();
    asyncGeraQuadroStatusAssinatura();
}