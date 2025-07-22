$(document).ready(function () {

	//Chamada de Funções
	bindings();
	preencherObrasDoUsuario()
	BuscaFornecedores()
	buscaBancos()
	inicializarCalendario()
	inicializarPeriodoLocacao();

	//Mostrar/Ocultar Funções
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
			$("#divPagamento").show();
		} else {
			$("#divPagamento").hide();
		}
	});
	$('#locador').on('change', function () {
		var cgccfo = $(this).val();
		if (cgccfo) {
			buscarEnderecoFornecedor(cgccfo);
		} else {
			$(".endereco-fornecedor").slideUp();
		}
	});

	//Máscaras
	$('#agencia').mask('0000-0', { placeholder: "____-_" });
	$('#contaCorrente').mask('00000-0', { placeholder: "_____-_" });
	$('#valorCaucao').maskMoney({
		prefix: 'R$ ',
		thousands: '.',
		decimal: ',',
		allowZero: true,
		affixesStay: true
	});

});



function bindings() {
	// Amarra eventos e elementos do HTML, mantendo todas definições de evento agrupadas
	$("#btnGerarArquivo").on("click", ()=>{buscaModeloDoContrato()});
}


