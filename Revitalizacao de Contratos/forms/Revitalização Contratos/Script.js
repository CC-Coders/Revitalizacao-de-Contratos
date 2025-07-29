$(document).ready(function(){   
        
        preencherObrasDoUsuario()
        buscaFornecedores()
        buscaBancos()
        inicializarCalendario()
        inicializarPeriodoLocacao();

        $("#tipoContrato").on("change", function () {
            if ($(this).val() === "Locação de Imóvel") {
              $("#formContainer").show();
              paginaAtual = 0;
              mostrarPagina(paginaAtual);
            } else {
              $("#formContainer").hide();
            }
          });

          $("#btn-avancar").on("click", avancarPagina);
          $("#btn-voltar").on("click", voltarPagina);
        
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
    	document.getElementById("inputAnexo").addEventListener("change", async function () {
    		  const tipo = document.getElementById("tipoDocumentacao").value;
    		  const file = this.files[0];
    		  const lista = document.getElementById("listaAnexos");

    		  if (!file || !tipo) return;
    		  try {
    		    const docId = await criaDocFluigRetornaDocumentId(file, 10133);
    		    const li = document.createElement("li");
    		    const link = `http://desenvolvimento.castilho.com.br:3232/portal/p/1/ecmnavigation?app_ecm_navigation_doc=${docId}`;
    		    li.innerHTML = `<span>✅<b> ${tipo}:</b> <a href="${link}" target="_blank">${file.name}</a>`;
    		    lista.appendChild(li);

    		    document.getElementById("tipoDocumentacao").value = "";
    		    this.value = "";
    		    document.getElementById("divAnexo").style.opacity = "0";
    		    document.getElementById("divAnexo").style.visibility = "hidden";
    		  } catch (error) {
    		    console.error("Erro ao salvar documento no Fluig:", error);
    		    alert("Erro ao anexar documento. Tente novamente.");
    		  }
    		});

})


