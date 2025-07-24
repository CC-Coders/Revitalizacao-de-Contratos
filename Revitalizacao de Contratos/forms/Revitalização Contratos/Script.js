$(document).ready(function(){   
        bindings();
        preencherObrasDoUsuario()
        buscaFornecedores()
        buscaBancos()
        inicializarCalendario()
        inicializarPeriodoLocacao();
        $("#tipoContrato").on("change", function () {
                if ($(this).val() == "Locação de Imóvel") {
                        $("#formContainer").show();
                }else{
                        $("#formContainer").hide();
                }
        });
        $("#caucao").on("change", function () {
                if ($(this).val() == "Sim") {
                        $("#divValorCaucao, #divDataPagamentoCaucao").show();
                }else{
                        $("#divValorCaucao, #divDataPagamentoCaucao").hide();
                }
        });
        $("#tipoPagamento").on("change", function () {
                if ($(this).val() == "Depósito") {
                        $("#divPagamento, #divBanco").show();
                }else{
                        $("#divPagamento, #divBanco").hide();
                }
        });
        $('#valorCaucao').maskMoney({
                prefix: 'R$ ',
                thousands: '.',
                decimal: ',',
                allowZero: true,
                affixesStay: true  
            });
        $('#agencia').mask('0000-0', {placeholder: "____-_"});
        $('#contaCorrente').mask('00000-0', {placeholder: "_____-_"});
                
        $('#locador').on('change', function () {
                var cgccfo = $(this).val();

                if (cgccfo) {
                        buscaInfosFornecedor(cgccfo);
                } else {
                    $(".endereco-fornecedor").slideUp();
                }
            });

})


function bindings() {
	// Amarra eventos e elementos do HTML, mantendo todas definições de evento agrupadas
	$("#btnGerarArquivo").on("click", ()=>{buscaModeloDoContrato()});
	$("#btnEditarArquivo").on("click", ()=>{editarArquivo()});
	$("#btnSalvarArquivo").on("click", ()=>{salvaWord()});
}
