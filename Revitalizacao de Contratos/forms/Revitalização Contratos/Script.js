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
}

$(document).ready(function () {
	bindings();

	const ATIVIDADE_ATUAL = $("#atividade").val();

	if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO || ATIVIDADE_ATUAL == ATIVIDADES.INICIO_0) {
		loadTelaInicio();
	}
	else if (ATIVIDADE_ATUAL == ATIVIDADES.JURIDICO) {
		loadTelaJuridico();
	}
	else if (ATIVIDADE_ATUAL == ATIVIDADES.CONTROLADORIA) {
		loadTelaControladoria();
	}
	else if (ATIVIDADE_ATUAL == ATIVIDADES.ENGENHEIRO || ATIVIDADE_ATUAL == ATIVIDADES.COORDENADOR_OBRAS || ATIVIDADE_ATUAL == ATIVIDADES.DIRETORIA) {
		loadTelaAprovacao();
	}
});


function bindings() {
	// Amarra eventos e elementos do HTML, mantendo todas definições de evento agrupadas
	$("#btnGerarArquivo").on("click", () => { asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao() });
	$("#btnEditarArquivo").on("click", () => { editarArquivo() });
	$("#btnSalvarArquivo").on("click", () => { salvaModeloAlterado() });
	$("#btnVisualizarArquivo").on("click",visualizaDocumento);


	$('#locador').on('change', function () {
		var cgccfo = $(this).val();

		if (cgccfo) {
			buscaInfosFornecedor(cgccfo);
		} else {
			$(".endereco-fornecedor").slideUp();
		}
	});
	$("#tipoContrato").on("change", function () {
		if ($(this).val() == "Locação de Imóvel") {
			$("#formContainer").show();
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
}


function loadTelaInicio() {
	setAtividadeAtivaProgresso(0);
	preencherObrasDoUsuario();
	buscaFornecedores();
	buscaBancos();


	inicializarCalendario();
	inicializarPeriodoLocacao();

	$('#valorCaucao').maskMoney({
		prefix: 'R$ ',
		thousands: '.',
		decimal: ',',
		allowZero: true,
		affixesStay: true
	});
	$('#agencia').mask('0000-0', { placeholder: "____-_" });
	$('#contaCorrente').mask('00000-0', { placeholder: "_____-_" });
}

function loadTelaJuridico() {
	$("#informacoesIniciais").hide();

	setAtividadeAtivaProgresso(1);
	carregaDadosDoContratoParaTelaAprovacao();


}

function loadTelaControladoria() {

}

function loadTelaAprovacao() {

}