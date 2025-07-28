function preencherObrasDoUsuario() {
    const userCode = $("#solicitante").val();
    if (!userCode) {
        console.error("O valor de 'solicitante' está vazio ou não foi encontrado.");
        FLUIGC.toast({
            title: "Erro:",
            message: "O usuário solicitante não está definido.",
            type: "warning"
        });
        return;
    }

    try {
        const permissoes = buscaObrasPorPermissaoDoUsuario(userCode, true);
        if (permissoes.length > 0) {
            const selectObra = $("#obra");
            selectObra.empty();

            let optionsObra = "<option value='' id='option'>Selecione uma obra</option>";
            let codcoligadaAtual = "";

            permissoes.forEach(ccusto => {
                if (codcoligadaAtual !== ccusto.CODCOLIGADA) {
                    if (codcoligadaAtual !== "") {
                        optionsObra += "</optgroup>";
                    }
                    optionsObra += `<optgroup label="${ccusto.CODCOLIGADA} - ${ccusto.NOMEFANTASIA}">`;
                    codcoligadaAtual = ccusto.CODCOLIGADA;
                }

                const optionValue = `${ccusto.CODCOLIGADA} - ${ccusto.CODCCUSTO} - ${ccusto.perfil}`;
                const optionLabel = `${ccusto.CODCCUSTO} - ${ccusto.perfil}`;

                optionsObra += `<option value="${optionValue}">${optionLabel}</option>`;
            });
            optionsObra += "</optgroup>";
            selectObra.append(optionsObra);
        } else {
            FLUIGC.toast({
                title: "Aviso:",
                message: "Nenhuma permissão encontrada para o usuário.",
                type: "warning"
            });
        }
    } catch (error) {
        console.error("Erro ao preencher obras do usuário:", error);
        FLUIGC.toast({
            title: "Erro ao preencher obras do usuário:",
            message: error.message || error,
            type: "danger"
        });
    }
}

function buscaFornecedores() {
        DatasetFactory.getDataset("FCFO", ["CGCCFO", "NOMEFANTASIA"], [
            DatasetFactory.createConstraint("ATIVO", 1, 1, ConstraintType.MUST),
            DatasetFactory.createConstraint("CODCOLIGADA", 0, 0, ConstraintType.MUST),
        ], null, {
            success: (fornecedores) => {
                if (fornecedores.columns[0] == "error") {
                    FLUIGC.toast({
                        title: "Erro ao buscar fornecedores: ",
                        message: fornecedores.values[0].error,
                        type: "warning"
                    });
                } else {
                    var optSelected = $("#locador").val();
                    $("#locador").html("<option></option>");

                    fornecedores.values.forEach(fornecedor => {
                        $("#locador").append($("<option></option>")
                            .attr("value", fornecedor.CGCCFO)
                            .text(fornecedor.CGCCFO + " - " + fornecedor.NOMEFANTASIA));
                    });

                    $("#locador").val(optSelected);

                    $('#locador').select2({
                        height: "34px",
                        width: "100%",
                        minimumInputLength: 4,
                        language: {
                            inputTooShort: () => "Digite pelo menos 4 caracteres",
                            noResults: () => "Nenhum resultado encontrado",
                            searching: () => "Buscando..."
                        }
                    });

                    $(".select2-container").off("click").on("click", function () {
                        $(this).removeClass("has-error");
                    });
                }
            },
            error: (error) => {
                FLUIGC.toast({
                    title: "Erro ao buscar fornecedores: ",
                    message: error,
                    type: "warning"
                });
            }
        });
}

function buscaInfosFornecedor(cgccfo) {
        DatasetFactory.getDataset("RetornaEnderecoFornecedor", null, [
            DatasetFactory.createConstraint("CGCCFO", cgccfo, cgccfo, ConstraintType.MUST)
        ], null, {
            success: (dataset) => {
                if (dataset.values && dataset.values.length > 0) {
                    const endereco = dataset.values[0];
                    const nacionalidadeTexto = endereco.NACIONALIDADE == 0 ? "Brasileiro" : "Estrangeiro";
                    
                    if (endereco.PESSOAFISOUJUR == 'F') {
                        $(".pessoa-fisica").show();
                        $(".pessoa-juridica").hide();
                        
                        $("#nacionalidadeFornecedor").val(nacionalidadeTexto);
                        $("#estadoCivilFornecedor").val(endereco.ESTADOCIVIL || "");
                    } else if (endereco.PESSOAFISOUJUR == 'J') {
                        $(".pessoa-fisica").hide();
                        $(".pessoa-juridica").show();
                        
                        $("#administradorFornecedor").val(endereco.ADMINISTRADOR || "");
                        $("#cpfFornecedor").val(endereco.CPF || "");
                    }
                    
                    $("#rgFornecedor").val(endereco.CGCCFO || "");
                    $("#ruaFornecedor").val(endereco.RUA || "");
                    $("#numeroFornecedor").val(endereco.NUMERO || "");
                    $("#bairroFornecedor").val(endereco.BAIRRO || "");
                    $("#cidadeFornecedor").val(endereco.CIDADE || "");
                    $("#cepFornecedor").val(endereco.CEP || "");
                    $("#estadoFornecedor").val(endereco.CODETD || "");
                    
                    $(".endereco-fornecedor").slideDown();
                } else {
                    FLUIGC.toast({
                        title: "Endereço não encontrado",
                        message: "Nenhum endereço localizado para este CGCCFO",
                        type: "warning"
                    });
                    $(".endereco-fornecedor").slideUp();
                }
            },
            error: (err) => {
                console.error("Erro ao buscar endereço:", err);
                FLUIGC.toast({
                    title: "Erro ao buscar endereço",
                    message: err.message || "Erro desconhecido",
                    type: "danger"
                });
            }
        });
}

function buscaBancos() {
        DatasetFactory.getDataset("GBANCO", null, null, null, {
            success: ds => {
                if (ds.values[0].STATUS != "SUCCESS") {
                    showMessage("Erro ao buscar Bancos: ", ds.values[0].MENSAGEM, "warning");
                    throw ds.values[0].MENSAGEM;
                }   
                var bancos = JSON.parse(ds.values[0].RESULT);
                const selectBanco = $('#banco');
                selectBanco.empty(); 
                selectBanco.append('<option value="">Selecione um banco</option>');
                bancos.forEach(banco => {
                    selectBanco.append(`<option value="${banco.NUMBANCO}">${banco.NUMBANCO} - ${banco.NOME}</option>`);
                });
                selectBanco.select2({
                    placeholder: "Selecione um banco",
                    allowClear: true,
                    width: '100%'
                });
            },
            error: e => {
                console.error(e);
                showMessage("Erro ao buscar Bancos: ", " favor entrar em contato com o Administrador.", "warning");
            }
        });
}

function inicializarCalendario() {
        FLUIGC.calendar(".date", {
            pickDate: true,
            pickTime: false,
            minDate: "01/01/2024",
            maxDate: "12/31/2030",
            language: "pt-br",
            dateFormat: "dd/mm/yyyy"
        });
}


function inicializarPeriodoLocacao() {
            const periodoLocacao = document.getElementById("periodoLocacao");
            
            if (periodoLocacao) {
                flatpickr(periodoLocacao, {
                    mode: "range",
                    dateFormat: "d/m/Y",
                    locale: "pt",
                    minDate: "01/01/2024",
                    maxDate: "31/12/2030",
                    allowInput: true, 
                    clickOpens: true,  
                    disableMobile: true,
                    onOpen: function() {
                        periodoLocacao.classList.remove("disabled");
                    },
                    onClose: function(selectedDates) {
                        if (selectedDates.length === 2) {
                            const [start, end] = selectedDates;
                            const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                            
                            if (diffInMonths > 12) {
                                FLUIGC.toast({
                                    message: "Período máximo: 12 meses.",
                                    type: "warning"
                                });
                                periodoLocacao.value = "";
                            }
                        }
                    }
                });
            }
        }
let paginaAtual = 0;

function mostrarPagina(indice) {
	  const paginas = document.querySelectorAll(".pagina");
	  const totalPaginas = paginas.length;

	  paginas.forEach((p, i) => {
	    p.classList.remove("ativa", "escondida-para-direita", "escondida-para-esquerda");

	    if (i === indice) {
	      p.classList.add("ativa");
	      p.style.position = "relative";
	    } else if (i < indice) {
	      p.classList.add("escondida-para-esquerda");
	      p.style.position = "absolute";
	    } else {
	      p.classList.add("escondida-para-direita");
	      p.style.position = "absolute";
	    }
	  });

	  document.querySelectorAll(".bolinha").forEach((b, i) => {
	    b.classList.toggle("ativa", i === indice);
	  });
	}

	function avancarPagina() {
	  const totalPaginas = document.querySelectorAll(".pagina").length;
	  if (paginaAtual < totalPaginas - 1) {
	    paginaAtual++;
	    mostrarPagina(paginaAtual);
	  }
	}

	function voltarPagina() {
	  if (paginaAtual > 0) {
	    paginaAtual--;
	    mostrarPagina(paginaAtual);
	  }
	}
	
	
	
	
	
	
	
	
	
	
	
	function handleFileUpload(inputId, descricaoArquivo) {
	    const input = document.getElementById(inputId);
	    const statusText = document.getElementById("textFileOrcamento");

	    input.click(); // Abre o seletor de arquivos

	    input.onchange = async function () {
	        const file = input.files[0];

	        if (!file) {
	            statusText.textContent = "Nenhum arquivo selecionado";
	            return;
	        }

	        try {
	            statusText.textContent = "Enviando arquivo...";
	            const pastaDestino = "12345"; // Substitua pelo ID da pasta no GED

	            const docId = await promiseCriaDocFluig_retornaDocumentId(file, pastaDestino);

	            statusText.textContent = `Arquivo enviado: ${file.name}`;

	            // Anexa ao processo
	            anexarDocumentoAoProcesso(docId);

	            console.log(`Arquivo ${file.name} enviado e anexado com sucesso!`);
	        } catch (err) {
	            statusText.textContent = "Erro ao enviar arquivo";
	            console.error("Erro ao fazer upload do arquivo:", err);
	        }
	    };
	}

	function promiseCriaDocFluig_retornaDocumentId(file, parentId) {
	    return new Promise((resolve, reject) => {
	        const reader = new FileReader();
	        const fileName = file.name;

	        reader.readAsDataURL(file);
	        reader.onload = function (e) {
	            const bytes = e.target.result.split("base64,")[1];

	            DatasetFactory.getDataset("CriacaoDocumentosFluig", null, [
	                DatasetFactory.createConstraint("conteudo", bytes, bytes, ConstraintType.MUST),
	                DatasetFactory.createConstraint("nome", fileName, fileName, ConstraintType.SHOULD),
	                DatasetFactory.createConstraint("descricao", fileName, fileName, ConstraintType.SHOULD),
	                DatasetFactory.createConstraint("pasta", parentId, parentId, ConstraintType.SHOULD),
	            ], null, {
	                success: function (dataset) {
	                    if (!dataset || dataset.values.length === 0) {
	                        reject("Erro ao comunicar com dataset");
	                    } else if (dataset.values[0][0] === "false") {
	                        reject("Erro na criação do documento: " + dataset.values[0][1]);
	                    } else {
	                        console.log("Documento criado, ID:", dataset.values[0].Resultado);
	                        resolve(dataset.values[0].Resultado);
	                    }
	                },
	                error: function (err) {
	                    reject(err);
	                }
	            });
	        };
	    });
	}

	function anexarDocumentoAoProcesso(docId) {
	    try {
	        if (parent?.ECM?.workflowView?.attachDocument) {
	            parent.ECM.workflowView.attachDocument(docId);
	            console.log(`Documento ${docId} anexado ao processo`);
	        } else {
	            console.warn("Função de anexo ao processo não disponível.");
	        }
	    } catch (e) {
	        console.error("Erro ao anexar documento ao processo:", e);
	    }
	}
