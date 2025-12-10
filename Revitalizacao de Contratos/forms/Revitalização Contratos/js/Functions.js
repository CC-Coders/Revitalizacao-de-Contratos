// Init
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
function buscaBancos() {
    DatasetFactory.getDataset("GBANCO", null, null, null, {
        success: (ds) => {
            if (ds.values[0].STATUS != "SUCCESS") {
                showMessage("Erro ao buscar Bancos: ", ds.values[0].MENSAGEM, "warning");
                throw ds.values[0].MENSAGEM;
            }

            var bancos = JSON.parse(ds.values[0].RESULT);
            const selectBanco = $("#banco");
            var value = $(selectBanco).val();

            $(selectBanco)[0].selectize.clearOptions();
            $(selectBanco)[0].selectize.addOption(bancos.map(e=>{return {value:`${e.NUMBANCO} - ${e.NOME}`, text:`${e.NUMBANCO} - ${e.NOME}`}}));

            selectBanco[0].selectize.setValue(value);
        },
        error: (e) => {
            console.error(e);
            showMessage("Erro ao buscar Bancos: ", " favor entrar em contato com o Administrador.", "warning");
        },
    });
}
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
        if (permissoes.length == 0) {
            FLUIGC.toast({
                title: "Aviso:",
                message: "Nenhuma permissão encontrada para o usuário.",
                type: "warning",
            });
            return;
        }

        const selectObra = $("#obra");
        permissoes.forEach((ccusto) => {
            if (!selectObra[0].selectize.optgroups[ccusto.NOMEFANTASIA]) {
                $("#obra")[0].selectize.addOptionGroup(ccusto.CODCOLIGADA, {value:ccusto.CODCOLIGADA, label: `${ccusto.CODCOLIGADA} - ${ccusto.NOMEFANTASIA}` });
            }

            const optionValue = `${ccusto.CODCOLIGADA} - ${ccusto.CODCCUSTO} - ${ccusto.perfil}`;
            const optionLabel = `${ccusto.CODCCUSTO} - ${ccusto.perfil}`;
            selectObra[0].selectize.addOption({ value: optionValue, label:optionLabel, optgroup:ccusto.CODCOLIGADA });
        });
      

    } catch (error) {
        console.error("Erro ao preencher obras do usuário:", error);
        FLUIGC.toast({
            title: "Erro ao preencher obras do usuário:",
            message: error.message || error,
            type: "danger",
        });
    }
}
function buscaFornecedores_preencheOptionsDoCampoLocador() {
        DatasetFactory.getDataset("FCFO", ["CODCFO", "CGCCFO", "NOMEFANTASIA"], [
            DatasetFactory.createConstraint("ATIVO", 1, 1, ConstraintType.MUST),
            DatasetFactory.createConstraint("CODCOLIGADA", 0, 0, ConstraintType.MUST)
        ], null, {
            success: (fornecedores) => {
                if (fornecedores.columns[0] == "error") {
                    FLUIGC.toast({
                        title: "Erro ao buscar fornecedores: ",
                        message: fornecedores.values[0].error,
                        type: "warning",
                    });
                } else {
                    var optSelected = $("#locador").val();
                    $("#locador")[0].selectize.clearOptions();

                    $("#locador")[0].selectize.addOption(fornecedores.values.map(e=>{return {value:`${e.CODCFO} - ${e.CGCCFO} - ${e.NOMEFANTASIA}`, text:`${e.CGCCFO} - ${e.NOMEFANTASIA}`}}));
                    $("#locador")[0].selectize.setValue(optSelected);
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


async function salvaDadosDaObraSelecionadaComoHiddenInput_buscaAprovadores(value) {
    if (!value) {
        $("#CODCOLIGADA").val("");
        $("#CODCCUSTO").val("");
        $("#NOMECCUSTO").val("");
    } else {
        var [CODCOLIGADA, CODCCUSTO, NOMECCUSTO] = value.split(" - ");
        $("#CODCOLIGADA").val(CODCOLIGADA);
        $("#CODCCUSTO").val(CODCCUSTO);
        $("#NOMECCUSTO").val(NOMECCUSTO);

        var aprovadores = extraiAprovadoresDaLista(await promiseBuscaAprovadoresDaObra(CODCOLIGADA, NOMECCUSTO, "1.1.02", "9999999999999"));
        $("#engenheiro").val(aprovadores.engenherio);
        $("#coordenador").val(aprovadores.coordenador);
        $("#diretor").val(aprovadores.diretor);
    }

    // Aprovadores
    function promiseBuscaAprovadoresDaObra(CODCOLIGADA, LOCALESTOQUE, CODTMV, valorTotal) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("verificaAprovador", null, [
                DatasetFactory.createConstraint("paramCodcoligada", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                DatasetFactory.createConstraint("paramLocal", LOCALESTOQUE, LOCALESTOQUE, ConstraintType.MUST),
                DatasetFactory.createConstraint("paramCodTmv", CODTMV, CODTMV, ConstraintType.MUST),
                DatasetFactory.createConstraint("paramValorTotal", valorTotal, valorTotal, ConstraintType.MUST),], null, {
                success: (ds) => {
                    if (ds.columns[0] == "FALHA") {
                        reject(ds.values[0].FALHA);
                    }

                    resolve(ds.values);
                },
                error: (e) => {
                    reject(e);
                },
            }
            );
        });
    }
    function extraiAprovadoresDaLista(lista) {
        var engenherio = "";
        var coordenador = "";
        var diretor = "";

        for (const user of lista) {
            if (!engenherio && verificaSeUsuarioPertenceAoGrupo(user.usuarioFLUIG, "Engenheiros")) {
                engenherio = user.usuarioFLUIG;
            } else if (!coordenador && verificaSeUsuarioPertenceAoGrupo(user.usuarioFLUIG, "Coordenadores de obras")) {
                coordenador = user.usuarioFLUIG;
            } else if (!diretor && verificaSeUsuarioPertenceAoGrupo(user.usuarioFLUIG, "Diretoria")) {
                diretor = user.usuarioFLUIG;
            }
        }

        return { engenherio, coordenador, diretor };
    }
}
function buscaInfosFornecedor_verificaSeFornecedorPfOuPj_PreencheDadosDoFornecedorNoFormulario_AlteraAnexosNecessarios(cgccfo) {
    // Nome da função alterado para descrever as resposabilidades da função corretamente
    // Necessário quebrar a função em várias funções, cada uma com uma responsabilidade
    DatasetFactory.getDataset("RetornaEnderecoFornecedor", null, [DatasetFactory.createConstraint("CGCCFO", cgccfo, cgccfo, ConstraintType.MUST)], null, {
        success: (dataset) => {
            if (dataset.values && dataset.values.length > 0) {
                const endereco = dataset.values[0];
                const tipoPessoa = endereco.PESSOAFISOUJUR;
                const nacionalidadeTexto = endereco.NACIONALIDADE == 0 ? "Brasileiro" : "Estrang eiro";

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

                if ($("#tipoContrato").val() == "Locação de Imóvel") {
                    anexosPorTipoDeContrato(tipoPessoa == "F" ? "Locação de Imóvel - PF":"Locação de Imóvel - PJ");
                }
                
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


async function enviarSolicitacao() {
    const ATIVIDADE_ATUAL = $("#atividade").val();

    if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO || ATIVIDADE_ATUAL == ATIVIDADES.INICIO_0) {
        if ($("#modeloContrato").val() == "Modelo Castilho") {
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
        }else{
            $("#workflowActions > button:first-child", window.parent.document).click();
        }

    } else {
        $("#workflowActions > button:first-child", window.parent.document).click();
    }
}
function validaCampos() {
    var atividade = parseInt(document.getElementById("atividade").value);
    var valida = true;
    var isRetornar = document.getElementById("decisaoCancelar").checked;
    console.log(isRetornar)
    if (atividade == 0) {
        $("input.inputInfoChamado, select.inputInfoChamado").each(function () {
            if ($(this).is(":visible") && ($(this).val() == null || $(this).val() == undefined || $(this).val() == "")) {
                $(this).addClass("has-error");
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
        if ($("#modeloContrato").val()=="Contrato fora do modelo" && $("#contratoPdfId").val() == "") {
            FLUIGC.toast({
                message: "Necessário anexar o Contrato fora do Modelo!",
                type: "warning",
            });
            valida = false;
        }
    }
    if (isRetornar) {
        var destinoRetorno = $("#destinoRetorno").val();
        if (destinoRetorno == null || destinoRetorno == undefined || destinoRetorno == "") {
            $("#destinoRetorno").addClass("has-error");
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
    }

    return valida;
}
function bloqueiaCamposAprovacao(){
    $("#origemContrato").attr("readonly","readonly");
    $("#modeloContrato").attr("readonly","readonly");
    $("#tipoContrato").attr("readonly","readonly");
    
    $("#obra")[0].selectize.lock();
    $("#locador")[0].selectize.lock();
    $("#procurador").attr("readonly","readonly");
    $("#contratantePrincipal").attr("readonly","readonly");
    
    $("#dataInicioLocacao").attr("readonly","readonly");
    $("#dataFimLocacao").attr("readonly","readonly");
    $("#indiceReajuste").attr("readonly","readonly");
    $("#temRetencao").attr("readonly","readonly");
    $("#percentualRetencao").attr("readonly","readonly");
    $("#temREIDI").attr("readonly","readonly");
    $("#percentualREIDI").attr("readonly","readonly");

    $("#tipoPagamento").attr("readonly","readonly");
    $("#banco")[0].selectize.lock();
    $("#titular").attr("readonly","readonly");
    $("#agencia").attr("readonly","readonly");
    $("#contaCorrente").attr("readonly","readonly");
    
    
    $("#nomeRepresentanteFornecedor").attr("readonly","readonly");
    $("#cpfRepresentanteFornecedor").attr("readonly","readonly");
    $("#mailRepresentanteFornecedor").attr("readonly","readonly");
    $("#assinaturaContrato").attr("readonly","readonly");
    
    
    $("#descricaoImovel").attr("readonly","readonly");
    $("#valorMensalAluguel").attr("readonly","readonly");
    $("#enderecoImovel").attr("readonly","readonly");
    $("#matriculaImovel").attr("readonly","readonly");
    $("#finalidadeLocacao").attr("readonly","readonly");
    $("#periodoLocacao").attr("readonly","readonly");
    $("#janelaPagamento").attr("readonly","readonly");
    $("#caucao").attr("readonly","readonly");
    $("#valorCaucao").attr("readonly","readonly");
    $("#dataPagamentoCaucao").attr("readonly","readonly");
    
    $("#descontoPorDiaChuva").attr("readonly","readonly");
    $("#descontoPorDiaParado").attr("readonly","readonly");
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
function obraPermiteReidi(CODCOLIGADA, CODCCUSTO){
    const obrasComReidi = {
        "1":{
            "1.2.043":"Obra Parapuã",
            "1.4.011":"Obra Conserva Echaporã",
            "1.4.016":"Obra Duplicação Oriente",
            "1.4.021":"Obra COFCO",
            "1.4.027":"Obra Conserva Maracaí",
            "1.4.030":"Obra MRS Pátios Vale do Paraíba",
            "1.4.034":"Obra MRS Campo Grande",
        },
        "13":{
            "1.4.030":"Obra MRS Pátios Vale do Paraíba",
            "1.4.034":"Obra MRS Campo Grande",
        }
    };

    if (obrasComReidi[CODCOLIGADA] && obrasComReidi[CODCOLIGADA][CODCCUSTO]) {
        return true;
    }
    else{
        return false;
    }
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


// Anexos
const documentosPorTipo = {
    F: ["Termo de Solicitação de Imóvel", "CNH", "RG", "CPF"],
    J: ["Termo de Solicitação de Imóvel", "Cartão CNPJ", "Cartão QSA"],
};
const documentosAnexados = {};
async function renderizarAnexosEtapaAprovacao() {
    const hiddenValue = document.getElementById("hiddenDocumentosAnexados").value;
    if (!hiddenValue) return;

    try {
        const anexos = JSON.parse(hiddenValue);
        const lista = document.getElementById("listaAnexos");
        lista.innerHTML = "";

        for (const [tipo, docId] of Object.entries(anexos)) {
            if (!docId) continue;
            const link = await promiseBuscaDownloadUrlDocumentoNoFLuig(docId);
            lista.innerHTML += `<li><span>✅ <b>${tipo}:</b> <a href="${link}" target="_blank">Visualizar</a></span></li>`;
        }
    } catch (e) {
        console.error("Erro ao carregar anexos:", e);
    }
}
function anexosPorTipoDeContrato(tipoDoContrato){
    const listaAnexosPorTipoDeContrato = {
        "Locação de Equipamento":["Cartão CNPJ", "Cartão QSA", "Formulario de Tributação", "Certidão de regularidade FGTS", "CNDs (municipal, estadual, federal e trabalhista)", "CNH", "RG", "CPF"],
        "Locação de Imóvel - PF":["Termo de Solicitação de Imóvel", "CNH", "RG", "CPF"],
        "Locação de Imóvel - PJ":["Termo de Solicitação de Imóvel", "Cartão CNPJ", "Cartão QSA"],
    };

    var anexos = listaAnexosPorTipoDeContrato[tipoDoContrato];
    var html = `<option value="">Selecione</option>`;
    var htmlListaAnexos = "";
    for (const anexo of anexos) {
        html += `<option value="${anexo}">${anexo}</option>`;
        htmlListaAnexos += `<li id="item-${anexo.split(" ").join("-").split("(")[0]}"><span>❌</span> <b>${anexo}</b></li>`;
    }
    $("#tipoDocumentacao").html(html);
    $("#listaAnexos").html(htmlListaAnexos);
}
async function onChangeInputAnexo_alteraListagemDeAnexos_criaDocNoFluig() {
    const tipo = $("#tipoDocumentacao").val();
    const file = this.files[0];
    if (!file || !tipo) {
        return;
    }

    try {
        const listaCarregar = $("#listaAnexos");
        const itemId = `item-${tipo.split(" ").join("-").split("(")[0]}`;

        insereLabelCarregando(tipo, itemId, listaCarregar);

        const docId = await criaDocFluigRetornaDocumentId(file, 10133);

        documentosAnexados[tipo] = docId;
        $("#hiddenDocumentosAnexados").val(JSON.stringify(documentosAnexados));
        await insereDocumentoCriado(tipo, documentosAnexados, file.name, docId)


        $("#inputAnexo").val("");
    } catch (e) {
        console.error("Erro ao anexar:", e);
        alert("Erro ao anexar documento.");
    }

    function insereLabelCarregando(tipo, itemId, listaCarregar){
        if (["CNH", "RG", "CPF"].includes(tipo)) {
            let item = $("#" + itemId);
            if (!item) {
                $(listaCarregar).append(`<li id="${itemId}"><span>⏳ <b>${tipo}:</b> carregando...</span></li>`);
            } else {
                $(item).html(`<span>⏳ <b>${tipo}:</b> carregando...</span>`);
            }
        } else {
            const item = $("#" + itemId);
            if (item) {
                $(item).html(`<span>⏳ <b>${tipo}:</b> carregando...</span>`);
            }
        }
    }
    async function insereDocumentoCriado(tipo, documentosAnexados, name, docId){
        const lista = $("#listaAnexos");
        const link = await promiseBuscaDownloadUrlDocumentoNoFLuig(docId);

        if (tipo === "CNH") {
            documentosAnexados["RG"] = null;
            documentosAnexados["CPF"] = null;

            $("#item-identidade-rg-cnh").remove();
            $("#item-identidade-cpf-cnh").remove();
            $("#item-RG").remove();
            $("#item-CPF").remove();
            const item = $("#item-CNH");
            if (item) {
                $(item).html(`<span>✅ <b>CNH:</b> <a href="${link}" target="_blank">${name}</a></span>`);
            }
        } else if (tipo === "RG") {
            documentosAnexados["CNH"] = null;
            $("#item-identidade-rg-cnh").remove();
            $("#item-CNH").remove();

            $(lista).append(`<li id="item-RG"><span>✅ <b>RG:</b> <a href="${link}" target="_blank">${name}</a></span></li>`);
            if (!documentosAnexados["CPF"]) {
                $("#item-identidade-cpf-cnh").remove();
                $(lista).append(`<li id="item-identidade-cpf-cnh"><span>❌ <b>CPF ou CNH</b></span></li>`);
            }
        } else if (tipo === "CPF") {
            documentosAnexados["CNH"] = null;
            $("#item-identidade-cpf-cnh").remove();
            $("#item-CNH").remove();

            $(lista).append(`<li id="item-CPF"><span>✅ <b>CPF:</b> <a href="${link}" target="_blank">${name}</a></span></li>`);
            if (!documentosAnexados["RG"]) {
                $("#item-identidade-rg-cnh").remove();
                $(lista).append(`<li id="item-identidade-rg-cnh"><span>❌ <b>RG ou CNH</b></span></li>`);
            }
        } else {
            $(`#item-${tipo.split(" ").join("-").split("(")[0]}`).html(`<span>✅ <b>${tipo}:</b> <a href="${link}" target="_blank">${file.name}</a></span>`);
        }
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


// Utils
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