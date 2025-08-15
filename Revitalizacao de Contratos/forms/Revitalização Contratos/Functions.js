function preencherObrasDoUsuario() {
    const userCode = $("#solicitante").val();
    if (!userCode) {
        console.error("O valor de 'solicitante' está vazio ou não foi encontrado.");
        FLUIGC.toast({
            title: "Erro:",
            message: "O usuário solicitante não está definido.",
            type: "warning",
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

            permissoes.forEach((ccusto) => {
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
                type: "warning",
            });
        }
    } catch (error) {
        console.error("Erro ao preencher obras do usuário:", error);
        FLUIGC.toast({
            title: "Erro ao preencher obras do usuário:",
            message: error.message || error,
            type: "danger",
        });
    }
}

function buscaFornecedores() {
    DatasetFactory.getDataset("FCFO",["CGCCFO", "NOMEFANTASIA"],[
        DatasetFactory.createConstraint("ATIVO", 1, 1, ConstraintType.MUST), DatasetFactory.createConstraint("CODCOLIGADA", 0, 0, ConstraintType.MUST)
    ],null,{
            success: (fornecedores) => {
                if (fornecedores.columns[0] == "error") {
                    FLUIGC.toast({
                        title: "Erro ao buscar fornecedores: ",
                        message: fornecedores.values[0].error,
                        type: "warning",
                    });
                } else {
                    var optSelected = $("#locador").val();
                    $("#locador").html("<option></option>");

                    fornecedores.values.forEach((fornecedor) => {
                        $("#locador").append(
                            $("<option></option>")
                                .attr("value", fornecedor.CGCCFO + " - " + fornecedor.NOMEFANTASIA)
                                .text(fornecedor.CGCCFO + " - " + fornecedor.NOMEFANTASIA)
                        );
                    });

                    $("#locador").val(optSelected);
                    $("#locador").select2({
                        height: "34px",
                        width: "100%",
                        minimumInputLength: 4,
                        language: {
                            inputTooShort: () => "Digite pelo menos 4 caracteres",
                            noResults: () => "Nenhum resultado encontrado",
                            searching: () => "Buscando...",
                        },
                    });

                    $(".select2-container")
                        .off("click")
                        .on("click", function () {
                            $(this).removeClass("has-error");
                        });
                }
            },
            error: (error) => {
                FLUIGC.toast({
                    title: "Erro ao buscar fornecedores: ",
                    message: error,
                    type: "warning",
                });
            },
        }
    );
}

function buscaInfosFornecedor(cgccfo) {
    DatasetFactory.getDataset("RetornaEnderecoFornecedor", null, [DatasetFactory.createConstraint("CGCCFO", cgccfo, cgccfo, ConstraintType.MUST)], null, {
        success: (dataset) => {
            if (dataset.values && dataset.values.length > 0) {
                const endereco = dataset.values[0];
                const tipoPessoa = endereco.PESSOAFISOUJUR;
                const nacionalidadeTexto = endereco.NACIONALIDADE == 0 ? "Brasileiro" : "Estrangeiro";

                if (tipoPessoa === "F") {
                    $(".pessoa-fisica").show();
                    $(".pessoa-juridica").hide();

                    $("#nacionalidadeFornecedor").val(nacionalidadeTexto);
                    $("#estadoCivilFornecedor").val(endereco.ESTADOCIVIL || "");
                } else if (tipoPessoa === "J") {
                    $(".pessoa-fisica").hide();
                    $(".pessoa-juridica").show();

                    $("#administradorFornecedor").val(endereco.ADMINISTRADOR || "");
                    $("#cnpjFornecedor").val(endereco.CPF || "");
                }

                $("#cpfFornecedor").val(endereco.CGCCFO || "");
                $("#ruaFornecedor").val(endereco.RUA || "");
                $("#numeroFornecedor").val(endereco.NUMERO || "");
                $("#bairroFornecedor").val(endereco.BAIRRO || "");
                $("#cidadeFornecedor").val(endereco.CIDADE || "");
                $("#cepFornecedor").val(endereco.CEP || "");
                $("#estadoFornecedor").val(endereco.CODETD || "");

                $(".endereco-fornecedor").slideDown();

                atualizaOpcoesDocumentos(tipoPessoa);
            } else {
                FLUIGC.toast({
                    title: "Endereço não encontrado",
                    message: "Nenhum endereço localizado para este CGCCFO",
                    type: "warning",
                });
                $(".endereco-fornecedor").slideUp();
            }
        },
        error: (err) => {
            console.error("Erro ao buscar endereço:", err);
            FLUIGC.toast({
                title: "Erro ao buscar endereço",
                message: err.message || "Erro desconhecido",
                type: "danger",
            });
        },
    });
}

const documentosPorTipo = {
    F: ["Termo de Solicitação de Imóvel", "CNH", "RG", "CPF"],
    J: ["Termo de Solicitação de Imóvel", "Cartão CNPJ", "Cartão QSA"],
};
const documentosAnexados = {};

function atualizaOpcoesDocumentos(tipoPessoa) {
    const select = $("#tipoDocumentacao").empty().append('<option value="">Selecione</option>');
    const lista = document.getElementById("listaAnexos");
    lista.innerHTML = "";

    const docs = [...(documentosPorTipo[tipoPessoa] || []), "Outros"];

    docs.forEach((doc) => {
        documentosAnexados[doc] = null;

        if (["RG", "CPF", "CNH"].includes(doc)) return;

        select.append(`<option value="${doc}">${doc}</option>`);
        lista.innerHTML += `<li id="item-${doc}"><span>❌ <b>${doc}</b></span></li>`;
    });

    select.append(`<option value="CNH">CNH</option>`);
    select.append(`<option value="RG">RG</option>`);
    select.append(`<option value="CPF">CPF</option>`);
    lista.innerHTML += `<li id="item-identidade-rg-cnh"><span>❌ <b>RG ou CNH</b></span></li>`;
    lista.innerHTML += `<li id="item-identidade-cpf-cnh"><span>❌ <b>CPF ou CNH</b></span></li>`;
}

function inicializaInputAnexo() {
    const select = document.getElementById("tipoDocumentacao");
    const input = document.getElementById("inputAnexo");
    const divAnexo = document.getElementById("divAnexo");

    select.addEventListener("change", function () {
        divAnexo.style.opacity = this.value ? "1" : "0";
        divAnexo.style.visibility = this.value ? "visible" : "hidden";
    });

    input.addEventListener("change", async function () {
        const tipo = select.value;
        const file = this.files[0];
        if (!file || !tipo) return;

        try {
            const listaCarregar = document.getElementById("listaAnexos");
            const itemId = `item-${tipo}`;

//            if (["CNH", "RG", "CPF"].includes(tipo)) {
//                listaCarregar.innerHTML += `<li id="${itemId}"><span>⏳ <b>${tipo}:</b> carregando...</span></li>`;
//            } else {
//                const item = document.getElementById(itemId);
//                if (item) item.innerHTML = `<span>⏳ <b>${tipo}:</b> carregando...</span>`;
//            }
            if (["CNH", "RG", "CPF"].includes(tipo)) {
                let item = document.getElementById(itemId);
                if (!item) {
                    listaCarregar.innerHTML += `<li id="${itemId}"><span>⏳ <b>${tipo}:</b> carregando...</span></li>`;
                    item = document.getElementById(itemId);
                } else {
                    item.innerHTML = `<span>⏳ <b>${tipo}:</b> carregando...</span>`;
                }
            } else {
                const item = document.getElementById(itemId);
                if (item) item.innerHTML = `<span>⏳ <b>${tipo}:</b> carregando...</span>`;
            }

            const docId = await criaDocFluigRetornaDocumentId(file, 10133);
            const link = `http://desenvolvimento.castilho.com.br:3232/portal/p/1/ecmnavigation?app_ecm_navigation_doc=${docId}`;

            documentosAnexados[tipo] = docId;
            document.getElementById("hiddenDocumentosAnexados").value = JSON.stringify(documentosAnexados);


            const lista = document.getElementById("listaAnexos");

            if (tipo === "CNH") {
                documentosAnexados["RG"] = null;
                documentosAnexados["CPF"] = null;

                removeItem("item-identidade-rg-cnh");
                removeItem("item-identidade-cpf-cnh");
                removeItem("item-RG");
                removeItem("item-CPF");
                const item = document.getElementById("item-CNH");
                if (item) {
                    item.innerHTML = `<span>✅ <b>CNH:</b> <a href="${link}" target="_blank">${file.name}</a></span>`;
                }
              //  lista.innerHTML += `<li id="item-CNH"><span>✅ <b>CNH:</b> <a href="${link}" target="_blank">${file.name}</a></span></li>`;
            } else if (tipo === "RG") {
                documentosAnexados["CNH"] = null;
                removeItem("item-identidade-rg-cnh");
                removeItem("item-CNH");

                lista.innerHTML += `<li id="item-RG"><span>✅ <b>RG:</b> <a href="${link}" target="_blank">${file.name}</a></span></li>`;
                if (!documentosAnexados["CPF"]) {
                    removeItem("item-identidade-cpf-cnh");
                    lista.innerHTML += `<li id="item-identidade-cpf-cnh"><span>❌ <b>CPF ou CNH</b></span></li>`;
                }
            } else if (tipo === "CPF") {
                documentosAnexados["CNH"] = null;
                removeItem("item-identidade-cpf-cnh");
                removeItem("item-CNH");

                lista.innerHTML += `<li id="item-CPF"><span>✅ <b>CPF:</b> <a href="${link}" target="_blank">${file.name}</a></span></li>`;
                if (!documentosAnexados["RG"]) {
                    removeItem("item-identidade-rg-cnh");
                    lista.innerHTML += `<li id="item-identidade-rg-cnh"><span>❌ <b>RG ou CNH</b></span></li>`;
                }
            } else {
                document.getElementById(`item-${tipo}`).innerHTML = `<span>✅ <b>${tipo}:</b> <a href="${link}" target="_blank">${file.name}</a></span>`;
            }

            input.value = "";
            select.value = "";
            divAnexo.style.opacity = "0";
            divAnexo.style.visibility = "hidden";
        } catch (e) {
            console.error("Erro ao anexar:", e);
            alert("Erro ao anexar documento.");
        }
    });
}

function removeItem(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function renderizarAnexosEtapaAprovacao() {
    const hiddenValue = document.getElementById("hiddenDocumentosAnexados").value;
    if (!hiddenValue) return;

    try {
        const anexos = JSON.parse(hiddenValue);
        const lista = document.getElementById("listaAnexos");
        lista.innerHTML = "";

        for (const [tipo, docId] of Object.entries(anexos)) {
            if (!docId) continue;
            const link = `http://desenvolvimento.castilho.com.br:3232/portal/p/1/ecmnavigation?app_ecm_navigation_doc=${docId}`;
            lista.innerHTML += `<li><span>✅ <b>${tipo}:</b> <a href="${link}" target="_blank">Visualizar</a></span></li>`;
        }
    } catch (e) {
        console.error("Erro ao carregar anexos:", e);
    }
}





function buscaBancos() {
    DatasetFactory.getDataset("GBANCO", null, null, null, {
        success: (ds) => {
            if (ds.values[0].STATUS != "SUCCESS") {
                showMessage("Erro ao buscar Bancos: ", ds.values[0].MENSAGEM, "warning");
                throw ds.values[0].MENSAGEM;
            }
            var bancos = JSON.parse(ds.values[0].RESULT);
            const selectBanco = $("#banco");
            selectBanco.empty();
            selectBanco.append('<option value="">Selecione um banco</option>');
            bancos.forEach((banco) => {
                selectBanco.append(`<option value="${banco.NUMBANCO} - ${banco.NOME}">${banco.NUMBANCO} - ${banco.NOME}</option>`);
            });
            selectBanco.select2({
                placeholder: "Selecione um banco",
                allowClear: true,
                width: "100%",
            });
        },
        error: (e) => {
            console.error(e);
            showMessage("Erro ao buscar Bancos: ", " favor entrar em contato com o Administrador.", "warning");
        },
    });
}

function inicializarCalendario() {
    FLUIGC.calendar(".date", {
        pickDate: true,
        pickTime: false,
        minDate: "01/01/2024",
        maxDate: "12/31/2030",
        language: "pt-br",
        dateFormat: "dd/mm/yyyy",
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
            onOpen: function () {
                periodoLocacao.classList.remove("disabled");
            },
            onClose: function (selectedDates) {
                if (selectedDates.length === 2) {
                    const [start, end] = selectedDates;
                    const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

                    if (diffInMonths > 12) {
                        FLUIGC.toast({
                            message: "Período máximo: 12 meses.",
                            type: "warning",
                        });
                        periodoLocacao.value = "";
                    }
                }
            },
        });
    }
}

function carregaDadosDoContratoParaTelaAprovacao() {
    var obra = $("#obra").val() ? $("#obra").val() : $("#obra").text();
    var locador = $("#locador").val() ? $("#locador").val() : $("#locador").text();
    var procurador = $("#procurador").val() ? $("#procurador").val() : $("#procurador").text();
    var representante = $("#representante").val() ? $("#representante").val() : $("#representante").text();
    var contratantePrincipal = $("#contratantePrincipal").val() ? $("#contratantePrincipal").val() : $("#contratantePrincipal").text();
    var enderecoImovel = $("#enderecoImovel").val() ? $("#enderecoImovel").val() : $("#enderecoImovel").text();
    var matriculaImovel = $("#matriculaImovel").val() ? $("#matriculaImovel").val() : $("#matriculaImovel").text();
    var finalidade = $("#finalidadeLocacao").val() ? $("#finalidadeLocacao").val() : $("#finalidadeLocacao").text();
    var periodo = $("#periodoLocacao").val() ? $("#periodoLocacao").val() : $("#periodoLocacao").text();
    var janelaPagamento = $("#janelaPagamento").val() ? $("#janelaPagamento").val() : $("#janelaPagamento").text();
    var caucao = $("#caucao").val() ? $("#caucao").val() : $("#caucao").text();
    var valorCaucao = $("#valorCaucao").val() ? $("#valorCaucao").val() : $("#valorCaucao").text();
    var dataCaucao = $("#dataPagamentoCaucao").val() ? $("#dataPagamentoCaucao").val() : $("#dataPagamentoCaucao").text();

    $("#aprovacaoTextObra").text(obra);
    $("#aprovacaoTextLocador").text(locador);
    $("#aprovacaoTextProcurador").text(procurador);
    $("#aprovacaoTextRepresentante").text(representante);
    $("#aprovacaoTextContratantePrincipal").text(contratantePrincipal);
    $("#aprovacaoTextEnderecoImovel").text(enderecoImovel);
    $("#aprovacaoTextMatriculaImovel").text(matriculaImovel);
    $("#aprovacaoTextFinalidadeLocacao").text(finalidade);
    $("#aprovacaoTextPeriodoLocacao").text(periodo);
    $("#aprovacaoTextJanelaPagamento").text(janelaPagamento);
    $("#aprovacaoTextCaucao").text(caucao);
    if (caucao == "Sim") {
        $("#aprovacaoTextCaucaoValor").text(valorCaucao);
        $("#aprovacaoTextCaucaoData").text(dataCaucao);
    } else {
        $(".camposComCaucao").hide();
    }

    var tipoPagamento = $("#tipoPagamento").val() ? $("#tipoPagamento").val() : $("#tipoPagamento").text();
    var banco = $("#banco").val() ? $("#banco").val() : $("#banco").text();
    var titular = $("#titular").val() ? $("#titular").val() : $("#titular").text();
    var agencia = $("#agencia").val() ? $("#agencia").val() : $("#agencia").text();
    var contaCorrente = $("#contaCorrente").val() ? $("#contaCorrente").val() : $("#contaCorrente").text();

    $("#aprovacaoTextTipoPagamento").text(tipoPagamento);
    $("#aprovacaoTextBanco").text(banco);
    $("#aprovacaoTextTitularConta").text(titular);
    $("#aprovacaoTextAgência").text(agencia);
    $("#aprovacaoTextContaCorrente").text(contaCorrente);
}

function setAtividadeAtivaProgresso(atividadesConcluidas) {
    var counter = 0;
    $(".wizard-progress")
        .find("div")
        .each(function () {
            if (counter < atividadesConcluidas) {
                $(this).addClass("completed");
            } else if (counter == atividadesConcluidas) {
                $(this).addClass("active");
            }
            counter++;
        });
}
async function enviarSolicitacao() {
    const ATIVIDADE_ATUAL = $("#atividade").val();

    if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO || ATIVIDADE_ATUAL == ATIVIDADES.INICIO_0) {
        Swal.fire({
            icon: "info",
            title: "Gerando Contrato, por favor aguarde...",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });
        await asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao();
        Swal.close();

        $("#workflowActions > button:first-child", window.parent.document).click();
    } else {
        $("#workflowActions > button:first-child", window.parent.document).click();
    }
}

let paginaAtual = 0;
function mostrarPagina(indice) {

    $(".pagination-active").removeClass("pagination-active", 250);
    $(`.pagination:nth-child(${indice+1})`).addClass("pagination-active", 250);


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
        $(window).scrollTop(0)
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

    input.click();

    input.onchange = async function () {
        const file = input.files[0];

        if (!file) {
            statusText.textContent = "Nenhum arquivo selecionado";
            return;
        }

        try {
            statusText.textContent = "Enviando arquivo...";
            const pastaDestino = "12345";

            const docId = await promiseCriaDocFluig_retornaDocumentId(file, pastaDestino);

            statusText.textContent = `Arquivo enviado: ${file.name}`;
            anexarDocumentoAoProcesso(docId);

            console.log(`Arquivo ${file.name} enviado e anexado com sucesso!`);
        } catch (err) {
            statusText.textContent = "Erro ao enviar arquivo";
            console.error("Erro ao fazer upload do arquivo:", err);
        }
    };
}
function criaDocFluigRetornaDocumentId(file, parentId) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const fileName = file.name;

        reader.readAsDataURL(file);
        reader.onload = function (e) {
            const bytes = e.target.result.split("base64,")[1];

            DatasetFactory.getDataset(
                "CriacaoDocumentosFluig",
                null,
                [
                    DatasetFactory.createConstraint("conteudo", bytes, bytes, ConstraintType.MUST),
                    DatasetFactory.createConstraint("nome", fileName, fileName, ConstraintType.SHOULD),
                    DatasetFactory.createConstraint("descricao", fileName, fileName, ConstraintType.SHOULD),
                    DatasetFactory.createConstraint("pasta", parentId, parentId, ConstraintType.SHOULD),
                ],
                null,
                {
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
                    },
                }
            );
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

function validaCampos() {
    var atividade = parseInt(document.getElementById("atividade").value);
    var valida = true;
    var isRetornar = document.getElementById("decisaoCancelar").checked;
    console.log(isRetornar)
    if (atividade == 0) {
        $(".inputInfoChamado").each(function () {
            if ($(this).is(":visible") && ($(this).val() == null || $(this).val() == undefined || $(this).val() == "")) {
                $(this).addClass("has-error");
                if ($(this).hasClass("select2-hidden-accessible")) {
                    $(this).next(".select2-container").addClass("has-error");
                }
                if (valida) {
                    valida = false;
                    FLUIGC.toast({
                        message: "Campo não preenchido!",
                        type: "warning",
                    });
                    $([document.documentElement, document.body]).animate(
                        {
                            scrollTop: $(this).offset().top - screen.height * 0.15,
                        },
                        700
                    );
                }
            }
        });
    }
    if (isRetornar) {
        var destinoRetorno = $("#destinoRetorno").val();
        if (destinoRetorno == null || destinoRetorno == undefined || destinoRetorno == "") {
            $("#destinoRetorno").addClass("has-error");
            $("#destinoRetorno").next(".select2-container").addClass("has-error");
            if (valida) {
                valida = false;
                FLUIGC.toast({
                    message: "Selecione o destino do retorno!",
                    type: "warning",
                });
                $([document.documentElement, document.body]).animate(
                    {
                        scrollTop: $("#destinoRetorno").offset().top - screen.height * 0.15,
                    },
                    700
                );
            }
        }
        var observacoes = $("#observacoes").val().trim();
        if (observacoes == null || observacoes == undefined || observacoes == "") {
            $("#observacoes").addClass("has-error");
            if (valida) {
                valida = false;
                FLUIGC.toast({
                    message: "Preencha as observações!",
                    type: "warning",
                });
                $([document.documentElement, document.body]).animate(
                    {
                        scrollTop: $("#observacoes").offset().top - screen.height * 0.15,
                    },
                    700
                );
            }
        }
    }
    if (!valida) {
        FLUIGC.toast({
            message: "Preencha todos os campos obrigatórios!",
            type: "warning",
        });
    } else {
        // salvaDadosFormulario();
    }

    return valida;
}

// Historico
async function asyncMontaHistorico() {
    var linhasHistorico = getLinhasHistorico();

    // Inverte a Lista para motrar o Histórico do Mais Recente para o Mais Antigo
    linhasHistorico = linhasHistorico.reverse();

    for (const linha of linhasHistorico) {
        var html = geraHtmlHistorico(linha);

        // Primeiro insere a linha do HTML, depois cria a <img/> e insere na DIV
        $("#divLinhasHistorico").append(html);
        $(".divImageUser:last").append(await promiseBuscaImagemUsuario(linha.USUARIO));
    }

    function getLinhasHistorico() {
        var retorno = [];
        $("#tableHistorico>tbody>tr:not(:first)").each(function () {
            retorno.push({
                USUARIO: $(this).find(".tableHistoricoUsuario").val(),
                DATA: $(this).find(".tableHistoricoData").val(),
                OBSERVACAO: $(this).find(".tableHistoricoObservacao").val(),
                ACAO: $(this).find(".tableHistoricoAcao").val(),
                ATIVIDADE: $(this).find(".tableHistoricoAtividade").val(),
            });
        });
        return retorno;
    }
    function geraHtmlHistorico(linha) {
        var DATA = linha.DATA.split(" ");
        DATA = DATA[0].split("-").reverse().join("/") + " " + DATA[1];

        var html = `<div class="card">
                <div class="card-body" style="${linha.ACAO == "Aprovado" ? "border:solid 1px green;" : linha.ACAO == "Reprovado" ? "border:solid 1px red;" : ""} ">
                    <div style="display:flex;">
                        <div class="divImageUser" style="margin-right:20px;"></div>
                        <div>
                            <h3 class="card-title" style="margin-bottom:0px; color:black;">${BuscaNomeUsuario(linha.USUARIO)} <small>${linha.ACAO}</small></h3>
                            <small>${DATA}</small>
                            <p class="card-text">${linha.OBSERVACAO && linha.OBSERVACAO.trim() ? linha.OBSERVACAO : "Aprovado"}</p>
                        </div>
                    </div>
                </div>
            </div>`;

        return html;
    }
    function promiseBuscaImagemUsuario(usuario) {
        return new Promise(async (resolve, reject) => {
            const res = await fetch("/api/public/social/image/" + usuario);
            const blob = await res.blob();
            const img = new Image();
            img.width = "60";
            img.height = "60";
            img.classList.add("userImage");
            img.src = URL.createObjectURL(blob);
            await img.decode();
            resolve(img);
        });
    }
}


    function salvaDadosDaObraSelecionadaComoHiddenInput(){
        var value = $(this).val();
        console.log(this);
        console.log(value);
        console.log(!value);
        if (!value) {
            $("#CODCOLIGADA").val("");
            $("#CODCCUSTO").val("");
            $("#NOMECCUSTO").val("");
        }else{
            var [CODCOLIGADA, CODCCUSTO, NOMECCUSTO] = $(this).val().split(" - ");
            console.log(CODCOLIGADA, CODCCUSTO, NOMECCUSTO);
            $("#CODCOLIGADA").val(CODCOLIGADA);
            $("#CODCCUSTO").val(CODCCUSTO);
            $("#NOMECCUSTO").val(NOMECCUSTO);
        }
    }
    
    function popularDestinoRetorno() {
        const ATIVIDADE_ATUAL = $("#atividade").val(); 
        const $select = $("#destinoRetorno");
        $select.empty().append('<option value="">Selecione o destino</option>');
        let opcoes = [];
        switch (parseInt(ATIVIDADE_ATUAL)) { 
            case ATIVIDADES.JURIDICO:
                opcoes = [
                    { value: "OBRA", text: "Obra" }
                ];
                break;
            case ATIVIDADES.CONTROLADORIA:
                opcoes = [
                    { value: "JURIDICO", text: "Jurídico" },
                    { value: "OBRA", text: "Obra" }
                ];
                break;
            case ATIVIDADES.ENGENHEIRO:
            case ATIVIDADES.COORDENADOR_OBRAS:
            case ATIVIDADES.DIRETORIA:
                opcoes = [
                    { value: "CONTROLADORIA", text: "Controladoria" },
                    { value: "JURIDICO", text: "Jurídico" },
                    { value: "OBRA", text: "Obra" }
                ];
                break;
        }
        opcoes.forEach(opcao => {
            $select.append($('<option>', {
                value: opcao.value,
                text: opcao.text
            }));
        });
    }