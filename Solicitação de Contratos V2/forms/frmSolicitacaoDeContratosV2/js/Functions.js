// Init
function inicializarCalendario() {
    if (isForModeView()) return;

    if (isContratoNovo_eJaGeradoContratoRM()) {
        return;
    }

    FLUIGC.calendar(".date", {
        pickDate: true,
        pickTime: false,
        useCurrent: false,
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

    // Para não adicionar selectize em modo VIEW para não bugar o visual e o valor (text)
    if ($("#formMode").val() == "VIEW") {
        return;
    }

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
            $(selectBanco)[0].selectize.addOption(bancos.map(e => { return { value: `${e.NUMBANCO} - ${e.NOME}`, text: `${e.NUMBANCO} - ${e.NOME}` } }));

            selectBanco[0].selectize.setValue(value);
        },
        error: (e) => {
            console.error(e);
            showMessage("Erro ao buscar Bancos: ", " favor entrar em contato com o Administrador.", "warning");
        },
    });
}
function preencherObrasDoUsuario() {
    if (isForModeView()) return;

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
    	//grupos que possuem permissão geral
        var dsGrupos = DatasetFactory.getDataset("colleagueGroup", null, [
            DatasetFactory.createConstraint("colleagueId", userCode, userCode, ConstraintType.MUST),
            DatasetFactory.createConstraint("groupId", "Controladoria",    "Controladoria",    ConstraintType.SHOULD),
            DatasetFactory.createConstraint("groupId", "Administrador TI", "Administrador TI", ConstraintType.SHOULD),
            DatasetFactory.createConstraint("groupId", "Comprador",        "Comprador",        ConstraintType.SHOULD),
            DatasetFactory.createConstraint("groupId", "Juridico",         "Juridico",         ConstraintType.SHOULD),
        ], null);
        
        var permissaoGeral = dsGrupos.values.length > 0;
        const permissoes = buscaObrasPorPermissaoDoUsuario(userCode, permissaoGeral);
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
                $("#obra")[0].selectize.addOptionGroup(ccusto.CODCOLIGADA, { value: ccusto.CODCOLIGADA, label: `${ccusto.CODCOLIGADA} - ${ccusto.NOMEFANTASIA}` });
            }           
            const optionValue = `${ccusto.CODCOLIGADA} - ${ccusto.CODCCUSTO} - ${ccusto.perfil}`;
            const optionLabel = `${ccusto.CODCCUSTO} - ${ccusto.perfil}`;
            selectObra[0].selectize.addOption({ value: optionValue, label: optionLabel, optgroup: ccusto.CODCOLIGADA });
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
    if (isForModeView()) return;

    var selectizeLocador = $("#locador")[0].selectize;

    // Guarda o valor atual antes de inserir a opção temporária.
    // Isso evita que depois o valor salvo seja "carregando".
    var optSelected = $("#locador").val();

    // Bloqueia a interação do usuário enquanto o dataset está carregando.
    selectizeLocador.lock();

    if (!optSelected) {
        // Limpa o valor atual e remove todas as opções do selectize. Para exibir temporariamente apenas a opção de carregamento.
        selectizeLocador.clear(true);
        selectizeLocador.clearOptions();

        // Adiciona uma opção temporária só para mostrar visualmente "Carregando fornecedores..." enquanto o dataset ainda não retornou.
        selectizeLocador.addOption({ value: "carregando", text: "Carregando fornecedores..." });

        // Seleciona a opção temporária
        selectizeLocador.setValue("carregando", true);
    }

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

                // Remove completamente a opção temporária e qualquer valor atual.
                // Assim, quando as opções reais entrarem, "carregando" desaparece.
                selectizeLocador.clear(true);
                selectizeLocador.clearOptions();

                selectizeLocador.addOption(fornecedores.values.map(e => { return { value: `${e.CODCFO} - ${e.CGCCFO} - ${e.NOMEFANTASIA}`, text: `${e.CGCCFO} - ${e.NOMEFANTASIA}` } }));

                // Se já tinha valor antes, restaura
                if (optSelected) {
                    selectizeLocador.setValue(optSelected);
                }
            }

            // Se já tiver sido gerado Contrato (IDCNT) e for um novo Contrato, não desbloqueia campo de "Locador"
            if ($("#IDCNT").val() && $("#origemContrato").val() == "Novos") {
                return;
            }

            // Libera novamente o campo para uso normal.
            selectizeLocador.unlock();
        },
        error: (error) => {
            FLUIGC.toast({
                title: "Erro ao buscar fornecedores: ",
                message: error,
                type: "warning",
            });

            // Em caso de erro, limpa a opção temporária para não deixar
            // o select preso com "Carregando fornecedores...".
            selectizeLocador.clear(true);
            selectizeLocador.clearOptions();

            // Libera o campo novamente.
            selectizeLocador.unlock();
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
async function buscaInfosFornecedor_verificaSeFornecedorPfOuPj_PreencheDadosDoFornecedorNoFormulario_AlteraAnexosNecessarios(cgccfo) {
    // Nome da função alterado para descrever as resposabilidades da função corretamente
    // Necessário quebrar a função em várias funções, cada uma com uma responsabilidade
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("RetornaEnderecoFornecedor", null, [DatasetFactory.createConstraint("CGCCFO", cgccfo, cgccfo, ConstraintType.MUST)], null, {
            success: (dataset) => {
                if (dataset.values && dataset.values.length > 0) {
                    const endereco = dataset.values[0];
                    const tipoPessoa = endereco.PESSOAFISOUJUR;
                    const nacionalidadeTexto = endereco.NACIONALIDADE == 0 ? "Brasileiro" : "Estrangeiro";
                    var origemContrato = $("#origemContrato").val() ? $("#origemContrato").val() : $("#origemContrato").text();
                    var tipoContrato = $("#tipoContrato").val() ? $("#tipoContrato").val() : $("#tipoContrato").text();
                    $("#FORNECEDOR_PF_PJ").val(tipoPessoa);

                    if (tipoPessoa === "F") {
                        $("#nacionalidadeFornecedor").val(nacionalidadeTexto);
                        $("#estadoCivilFornecedor").val(endereco.ESTADOCIVIL || "");

                    } else if (tipoPessoa === "J") {
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

                    // Pega o value de tipoContrato e se conter "Locação de Imóvel" chama a função para listar os anexos necessarios com base no tipo de pessoa
                    if (tipoContrato.includes("Locação de Imóvel") && origemContrato != "Aditivos") {
                        anexosPorTipoDeContrato(tipoPessoa == "F" ? "Locação de Imóvel - PF" : "Locação de Imóvel - PJ");

                    } else if (
                        tipoContrato.includes("Locação de Equipamento") &&
                        tipoContrato != "Locação de Equipamento - Alteração de Prazo" &&
                        tipoContrato != "Locação de Equipamento - Alteração de Valor" &&
                        tipoContrato != "Locação de Equipamento - Alteração de Prazo e Valor" &&
                        tipoContrato != "Locação de Equipamento - Inclusão de Equipamento"
                    ) {
                        anexosPorTipoDeContrato("Locação de Equipamento");
                    } else if (tipoContrato == "Transporte de Materiais") {   
                        anexosPorTipoDeContrato("Transporte de Materiais");
                    }

                    if (tipoContrato == "Locação de Equipamento - Alteração de Prazo") {
                        anexosPorTipoDeContrato("Locação de Equipamento - Alteração de Prazo");

                    } else if (tipoContrato == "Locação de Equipamento - Alteração de Valor") {
                        anexosPorTipoDeContrato("Locação de Equipamento - Alteração de Valor");

                    } else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor") {
                        anexosPorTipoDeContrato("Locação de Equipamento - Alteração de Prazo e Valor");

                    } else if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {
                        anexosPorTipoDeContrato("Locação de Equipamento - Inclusão de Equipamento");
                    }

                    resolve(tipoPessoa);

                } else {
                    FLUIGC.toast({
                        title: "Endereço não encontrado",
                        message: "Nenhum endereço localizado para este CGCCFO",
                        type: "warning",
                    });
                    $(".endereco-fornecedor").slideUp();

                    resolve(null);
                }
            },
            error: (err) => {
                console.error("Erro ao buscar endereço:", err);
                FLUIGC.toast({
                    title: "Erro ao buscar endereço",
                    message: err.message || "Erro desconhecido",
                    type: "danger",
                });
                reject(err);
            },
        });
    });
}


async function enviarSolicitacao() {

    if (!validaCampos()) {
        return;
    }

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

            try {
                await asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao();
            } catch (error) {

                console.error("Erro ao gerar o contrato: ", error);

                Swal.hideLoading();
                Swal.fire({
                    icon: "error",
                    title: "Erro ao gerar o contrato",
                    text: error && error.message ? error.message : error,
                    showConfirmButton: true,
                    allowEscapeKey: true,
                    allowOutsideClick: true,
                });

                return;
            }

            Swal.close();
            parent.$("#send-process-button").click();
        } else {
            parent.$("#send-process-button").click();
        }
    }
    else if (ATIVIDADE_ATUAL == ATIVIDADES.CONTROLADORIA) {
        if ($("#modeloContrato").val() == "Modelo Castilho") {
            var filePreenchido = await asyncPreencheDocumentoComDadosDoFormulario($("#contratoDocumentId").val());
            var pdf = await convertDocxToPdf(filePreenchido, geraNomeDoArquivo() + ".pdf");
            await promiseAtualizaDocumentoNoGED(pdf, $("#contratoPdfId").val(), geraNomeDoArquivo() + ".pdf", pastaDeAnexos);
        }
        parent.$("#send-process-button").click();

    }
    else {
        parent.$("#send-process-button").click();
    }
}
function validaCampos() {
    var atividade = parseInt(document.getElementById("atividade").value);
    var origemContrato = $("#origemContrato").val();
    var tipoContrato = $("#tipoContrato").val();
    var valida = true;
    var isReprovado = $("#decisao").val() == "Reprovado";
    var mensagens = [];
    var toastSeparado = [];

    if (atividade == ATIVIDADES.INICIO || atividade == ATIVIDADES.INICIO_0) {

        // Valida os anexos vazios.
        // Se faltar anexo obrigatório, além de mostrar o toast,
        // também marca a validação geral como false para impedir o envio.
        if (!validaAnexosPorTipoContrato()) {
            valida = false;
        }

        // Verificar melhor essa validação... porque caso o usuario mude o locador, ele não limpa o input hidden de cod do contrato, e nem limpa tabela... etc
        if (origemContrato == "Aditivos" || origemContrato == "Rescisões") {
            // Contrato Principal selecioando
            //if (!$(".checkboxContratoPrincipal:checked").length) {
            if (!$("#contratoSelecCodigo").val()) {
                toastSeparado.push("Selecione o contrato principal!");
                valida = false;
            }
        }

        if (tipoContrato == "Locação de Equipamento" || tipoContrato == "Locação de Equipamento - Com Mão de Obra") {
            // Tabela de Equipamentos selecioandos para criar o contrato
            // Se não tem nenhum prefixo com valor reajustado preenchdio e contrato principal selecionado (hidden preenchido)
            if ($("#tableEquipamentosSelecionados > tbody > tr:not(:first)").length == 0 && $("#contratoSelecCodigo").val()) {
                toastSeparado.push("Selecione pelo menos 1 equipamento!");
                valida = false;
            }
        }

        // Toda a parte de Dados Inicias
        if (origemContrato == "Novos" || origemContrato == "Rescisões") {
            if (!origemContrato || !tipoContrato || !tipoContrato) {
                mensagens.push("Preencha todos os campos de Dados Iniciais")
            }

        } else if (origemContrato == "Aditivos") {
            if (!origemContrato || !tipoContrato || !tipoContrato || !$("#tipoAlteracao").val()) {
                mensagens.push("Preencha todos os campos de Dados Iniciais")
            }
        
            //exige ao menos 1 equipamento também na Inclusão/Exclusão de Transporte
            if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento" || tipoContrato == "Locação de Equipamento - Exclusão de Equipamento" ||
                tipoContrato == "Transporte de Materiais - Inclusão de Equipamento" || tipoContrato == "Transporte de Materiais - Exclusão de Equipamento") {

                if ($("#tableEquipamentosSelecionados_aditivos > tbody > tr:not(:first)").length == 0 && $("#contratoSelecCodigo").val()) {
                    toastSeparado.push("Selecione pelo menos 1 equipamento!");
                    valida = false;
                }
            } else if (tipoContrato == "Locação de Equipamento - Alteração de Valor") {
                
                if ($("#tableEquipamentosSelecionados_aditivos > tbody > tr:not(:first)").length == 0 && $("#contratoSelecCodigo").val()) {

                    toastSeparado.push("Informe reajuste de valor em pelo menos 1 equipamento!");
                    valida = false;
                }

                /*
                    Locação de Imóvel
                */
            } else if (tipoContrato == "Locação de Imóvel - Alteração de Valor" || tipoContrato == "Locação de Imóvel - Alteração de Prazo e Valor") {
                if (!$("#valorLocacaoReajustado").val()) {
                    $("#valorLocacaoReajustado").addClass("has-error");
                    mensagens.push("Valor Reajustado");
                    valida = false;
                }
            }
        }
        // Obra
        if (!$("#obra").val()) {
            $("#obra")[0].selectize.$control.css("border", "1px solid #FF0000");
            mensagens.push("Obra");
            valida = false;
        }
        // Fornecedor
        if (!$("#locador").val()) {
            $("#locador")[0].selectize.$control.css("border", "1px solid #FF0000");
            mensagens.push("Fornecedor");
            valida = false;
        }
        // RG Fornecedor, se estiver visivel
        if (origemContrato == "Aditivos" || origemContrato == "Rescisões" && tipoContrato.includes("Locação de Imóvel")) {
            if ($("#rgFornecedor").is(":visible") && !$("#rgFornecedor").val()) {
                $("#rgFornecedor").addClass("has-error");
                mensagens.push("RG do fornecedor");
                valida = false;
            }
        }
        // Procurador, se estiver visivel
        if ($("#procurador").is(":visible") && !$("#procurador").val()) {
            $("#procurador").addClass("has-error");
            mensagens.push("Nome do procurador");
            valida = false;
        }
        // Contratante Principal, se estiver visivel
        if ($("#contratantePrincipal").is(":visible") && !$("#contratantePrincipal").val()) {
            $("#contratantePrincipal").addClass("has-error");
            mensagens.push("Nome do contratante principal");
            valida = false;
        }
        // Contratante Principal, se estiver visivel
        if ($("#localizacaoServico").is(":visible") && !$("#localizacaoServico").val()) {
            $("#localizacaoServico").addClass("has-error");
            mensagens.push("Localização dos serviços");
            valida = false;
        }
        // Tipo Pagamento, se estiver visivel
        if ($("#tipoPagamento").is(":visible") && !$("#tipoPagamento").val()) {
            $("#tipoPagamento").addClass("has-error");
            mensagens.push("Tipo de pagamento");
            valida = false;
        }
        // Banco, se for origemContrato Novos
        if (origemContrato == "Novos") {
            if (!$("#banco").val()) {
                $("#banco")[0].selectize.$control.css("border", "1px solid #FF0000");
                mensagens.push("Banco");
                valida = false;
            }
        }
        // Data Início Locação, se estiver visivel
        if ($("#dataInicioLocacao").is(":visible") && !$("#dataInicioLocacao").val()) {
            $("#dataInicioLocacao").addClass("has-error");
            mensagens.push("Data início locação");
            valida = false;
        }
        // Data Fim Locação, se estiver visivel
        if ($("#dataFimLocacao").is(":visible") && !$("#dataFimLocacao").val()) {
            $("#dataFimLocacao").addClass("has-error");
            mensagens.push("Data fim locação");
            valida = false;
        }
        // Claúsulas alteradas, se estiver visivel
        if ($("#clausulaAlterada").is(":visible") && !$("#clausulaAlterada").val()) {
            $("#clausulaAlterada").addClass("has-error");
            mensagens.push("Cláusulas alteradas");
            valida = false;
        }
        // Data de reajuste, se estiver visivel
        if ($("#dataReajuste").is(":visible") && !$("#dataReajuste").val()) {
            $("#dataReajuste").addClass("has-error");
            mensagens.push("Data de reajuste");
            valida = false;
        }
        //nova data de fim precisa ser maior que a data de fim atual do contrato.
        if ($("#novaDataFimTransporte").is(":visible") && $("#novaDataFimTransporte").val()) {
            var fimAtualTM = parseDataBR($("#dataFimContratoTransporte").val());
            var novoFimTM  = parseDataBR($("#novaDataFimTransporte").val());
            if (fimAtualTM && novoFimTM && novoFimTM <= fimAtualTM) {
                $("#novaDataFimTransporte").addClass("has-error");
                mensagens.push("A nova data de fim precisa ser maior que a data de fim atual do contrato");
                valida = false;
            }
        }
        // Valor Mensal Locação, se for origemContrato Novos, se estiver visivel
        if (origemContrato == "Novos") {
            if ($("#valorMensalLocacao").is(":visible") && !$("#valorMensalLocacao").val()) {
                $("#valorMensalLocacao").addClass("has-error");
                mensagens.push("Valor mensal locação");
                valida = false;
            }

            if (tipoContrato == "Locação de Imóvel") {
                if (!$("#descricaoImovel").val()) {
                    $("#descricaoImovel").addClass("has-error");
                    mensagens.push("Descrição do imóvel");
                    valida = false;
                }
                if (!$("#valorMensalAluguel").val()) {
                    $("#valorMensalAluguel").addClass("has-error");
                    mensagens.push("Valor mensal do aluguel");
                    valida = false;

                }
                if (!$("#enderecoImovel").val()) {
                    $("#enderecoImovel").addClass("has-error");
                    mensagens.push("Endereço do imóvel");
                    valida = false;

                }
                if (!$("#matriculaImovel").val()) {
                    $("#matriculaImovel").addClass("has-error");
                    mensagens.push("Matrícula do imóvel");
                    valida = false;
                }
                if (!$("#finalidadeLocacao").val()) {
                    $("#finalidadeLocacao").addClass("has-error");
                    mensagens.push("Finalidade de locação");
                    valida = false;

                }
                if (!$("#periodoLocacao").val()) {
                    $("#periodoLocacao").addClass("has-error");
                    mensagens.push("Período de locação");
                    valida = false;
                }
                if (!$("#janelaPagamento").val()) {
                    $("#janelaPagamento").addClass("has-error");
                    mensagens.push("Janela de pagamento");
                    valida = false;

                }
                if (!$("#caucao").val()) {
                    $("#caucao").addClass("has-error");
                    mensagens.push("Caução");
                    valida = false;
                }
            }
        }
        // Reajuste, se estiver visivel
        if ($("#temReajuste").is(":visible") && !$("#temReajuste").val()) {
            $("#temReajuste").addClass("has-error");
            mensagens.push("Tem reajuste?");
            valida = false;
        }
        // Reajuste visivel e com value de "Sim".
        if ($("#temReajuste").is(":visible") && $("#temReajuste").val() == "Sim") {
            // Como terá reajuste (value "Sim") então valida o indice de reajuste vazio
            if (!$("#indiceReajuste").val()) {
                $("#indiceReajuste").addClass("has-error");
                mensagens.push("Indíce de reajuste");
                valida = false;
            }
        }
        // REIDI, se estiver visivel
        if ($("#temREIDI").is(":visible") && !$("#temREIDI").val()) {
            $("#temREIDI").addClass("has-error");
            mensagens.push("REIDI");
            valida = false;
        }
        // Nome Representante Fornecedor
        if (!$("#nomeRepresentanteFornecedor").val()) {
            $("#nomeRepresentanteFornecedor").addClass("has-error");
            mensagens.push("Nome do representante do fornecedor");
            valida = false;
        }
        // CPF Representante Fornecedor
        if (!$("#cpfRepresentanteFornecedor").val()) {
            $("#cpfRepresentanteFornecedor").addClass("has-error");
            mensagens.push("CPF do representante do fornecedor");
            valida = false;
        }
        // E-mail Representante Fornecedor
        if ($("#mailRepresentanteFornecedor").is(":visible") && $("#mailRepresentanteFornecedor").val() == "") {
            $("#mailRepresentanteFornecedor").addClass("has-error");
            mensagens.push("E-mail do representante do fornecedor");
            valida = false;
        }

        // Tipo de Assinatura
        if (!$("#assinaturaContrato").val()) {
            $("#assinaturaContrato").addClass("has-error");
            mensagens.push("Forma de assinatura");
            valida = false;
        }

        // Banco
        if ($("#banco").is(":visible") && $("#banco").val() == "") {
            mensagens.push("Banco");
            valida = false;
        }

        if ($("#modeloContrato").val() == "Contrato fora do modelo" && $("#contratoPdfId").val() == "") {
            valida = false;
            mensagens.push("Anexo do contrato fora do modelo");
        }

        if ($("#tipoContratoBase").val() == "Transporte de Materiais" && origemContrato == "Novos") {
            var formatoCobranca = $("#formatoCobrancaTransporte").val();
            var camposTransporte = [
                //campo Administrador removido do form, então saiu da validação
                { id: "dataInicioTransporte",            label: "Data inicial (transporte)" },
                { id: "dataFimTransporte",               label: "Data final (transporte)" },
                { id: "descontoPorDiaChuvaTransporte",   label: "Desconto por dia de chuva" },
                { id: "descontoPorDiaParadoTransporte",  label: "Desconto por dia parado" },
                { id: "formatoCobrancaTransporte",       label: "Formato de cobrança" }
            ];

            if (formatoCobranca == "Valor Fixo") {
                camposTransporte.push({ id: "valorMensalTransporte", label: "Valor mensal (transporte)" });
            } else if (formatoCobranca == "Valor por Parâmetro") {
                camposTransporte.push({ id: "valorM3Transporte", label: "Valor por Tonelada" });
                camposTransporte.push({ id: "kmTransporte", label: "KM Rodado" });
            }

            camposTransporte.forEach(function (campo) {               
                if (!$("#" + campo.id).val()) {
                    $("#" + campo.id).addClass("has-error");
                    mensagens.push(campo.label);
                    valida = false;
                }
            });
        }
    }
 if (atividade == ATIVIDADES.CONTROLADORIA && origemContrato == "Novos") {
        // Produto
        $("[name^='novoContratoItemProduto___']").each(function (i) {
            if (!$(this).val()) {
                if (this.selectize) { this.selectize.$control.css("border", "1px solid #FF0000"); }
                mensagens.push("Produto (Item " + (i + 1) + ")");
                valida = false;
            }
        });

        // Valor Produto
        $("[name^='novoContratoItemValor___']").each(function (i) {
            if (!$(this).val()) {
                $($(this)).addClass("has-error");
                mensagens.push("Valor (Item " + (i + 1) + ")");
                valida = false;
            }
        });

        // Coligada
        if (!$("#novoContratoColigada").val()) {
            $("#novoContratoColigada").addClass("has-error");
            mensagens.push("Coligada");
            valida = false;
        }
        // Filial
        if (!$("#novoContratoFilial").val()) {
            $("#novoContratoFilial").addClass("has-error");
            mensagens.push("Filial");
            valida = false;
        }
        // Filial
        if (!$("#novoContratoTipoContrato").val()) {
            $("#novoContratoTipoContrato").addClass("has-error");
            mensagens.push("Tipo Contrato");
            valida = false;
        }
        // Centro de Custo
        if (!$("#novoContratoCCUSTO").val()) {
            $("#novoContratoCCUSTO").addClass("has-error");
            mensagens.push("Centro de Custo");
            valida = false;
        }
        // Código Contrato
        if (!$("#novoContratoCodigo").val()) {
            $("#novoContratoCodigo").addClass("has-error");
            mensagens.push("Código Contrato");
            valida = false;
        }
        // Local de Estoque
        if (!$("#novoContratoLocalDeEstoque").val()) {
            $("#novoContratoLocalDeEstoque").addClass("has-error");
            mensagens.push("Local de Estoque");
            valida = false;
        }
        // Status Contrato
        if (!$("#novoContratoSTATUS").val()) {
            $("#novoContratoSTATUS").addClass("has-error");
            mensagens.push("Status Contrato");
            valida = false;
        }
        // Condição de Pagamento
        if (!$("#novoContratoCondicaoPagamento").val()) {
            $("#novoContratoCondicaoPagamento").addClass("has-error");
            mensagens.push("Condição de Pagamento");
            valida = false;
        }
        // Representante
        if (!$("#novoContratoRepresentante").val()) {
            $("#novoContratoRepresentante").addClass("has-error");
            mensagens.push("Representante");
            valida = false;
        }
        // Data Inicio
        if (!$("#novoContratoDataInicio").val()) {
            $("#novoContratoDataInicio").addClass("has-error");
            mensagens.push("Data Inicio");
            valida = false;
        }
        // Data Fim
        if (!$("#novoContratoDataFim").val()) {
            $("#novoContratoDataFim").addClass("has-error");
            mensagens.push("Data Fim");
            valida = false;
        }
        // Objeto do Contrato
        if (!$("#novoContratoObjeto").val()) {
            $("#novoContratoObjeto").addClass("has-error");
            mensagens.push("Objeto do Contrato");
            valida = false;
        }
        // Tipo de Faturamento
        if (!$("#novoContratoTipoFaturamento").val()) {
            $("#novoContratoTipoFaturamento").addClass("has-error");
            mensagens.push("Tipo de Faturamento");
            valida = false;
        }

        // ------------- //

        // Item
        $(".divNovoContratoTableRateiosItens").each(function() {
            // Titulo do item, exemplo: Item 1
            var nomeItem = $(this).closest("tr").find(".titleCounterItem").text();

            $(this).find("tbody tr").each(function (indice) {
                var linha = indice + 1;
                var selectizeDepto = $(this).find(".selectDepartamentoNovoContratoItemRateio");
                var inputValor = $(this).find(".inputValorNovoContratoItemRateio");

                // Departamento
                if (!selectizeDepto.val()) {
                    if (selectizeDepto[0].selectize.$control.css("border", "1px solid #FF0000"));
                    mensagens.push("Departamento (" + nomeItem + ", Linha " + linha + ")");
                    valida = false;
                }

                // Valor
                if (!inputValor.val()) {
                    inputValor.addClass("has-error");
                    mensagens.push("Valor (" + nomeItem + ", Linha " + linha + ")");
                    valida = false;
                }
            });
        });
        
    }
    if (isReprovado) {
        // Juridico reprova somente para o Inicio

        var destinoRetorno = $("#destinoRetorno").val();
        if (destinoRetorno == null || destinoRetorno == undefined || destinoRetorno == "" && atividade != ATIVIDADES.JURIDICO) {
            $("#destinoRetorno").addClass("has-error");
            mensagens.push("Destino reprovação");
            valida = false;
        }

        var observacoes = $("#observacoes").val().trim();
        if (observacoes == null || observacoes == undefined || observacoes == "") {
            $("#observacoes").addClass("has-error");
            mensagens.push("Observações");
            valida = false;
        }
    }

    if (!valida && mensagens.length > 0) {
        mostraToast("Campo(s) não preenchido(s)", mensagens.join("<br>"), "warning");
    }

    // Todos os toasts separados
    toastSeparado.forEach(function (mensagem) {
        mostraToast("", mensagem, "warning");
    });

    return valida;
}
function validaAnexosPorTipoContrato() {
    var origemContrato = $("#origemContrato").val();
    var tipoContrato = $("#tipoContrato").val();
    var tipoPessoa = $("#FORNECEDOR_PF_PJ").val();
    var hidden = $("#hiddenDocumentosAnexados").val();
    var documentos = hidden ? JSON.parse(hidden) : {};
    var faltando = [];

    // Flavio confirmou com o Juridico que não precisa de anexos para quando "Alteração de Prazo" ou "Alteração de Valor" ou "Exclusão de Equipamento"
    if (tipoContrato.includes("Locação de Equipamento") &&
        tipoContrato != "Locação de Equipamento - Alteração de Prazo" &&
        tipoContrato != "Locação de Equipamento - Alteração de Valor" &&
        tipoContrato != "Locação de Equipamento - Alteração de Prazo e Valor" &&
        tipoContrato != "Locação de Equipamento - Inclusão de Equipamento" &&
        tipoContrato != "Locação de Equipamento - Exclusão de Equipamento") {

        if (!documentos["Cartão CNPJ"]) {
            faltando.push("Cartão CNPJ");
        }

        if (!documentos["Cartão QSA"]) {
            faltando.push("Cartão QSA");
        }

        if (!documentos["Formulario de Tributação"]) {
            faltando.push("Formulario de Tributação");
        }

        if (!documentos["Certidão de regularidade FGTS"]) {
            faltando.push("Certidão de regularidade FGTS");
        }

        if (!documentos["CNDs (municipal, estadual, federal e trabalhista)"]) {
            faltando.push("CNDs (municipal, estadual, federal e trabalhista)");
        }

        var temCNH = !!documentos["CNH"];
        var temRG = !!documentos["RG"];
        var temCPF = !!documentos["CPF"];

        if (!temCNH && !(temRG && temCPF)) {
            faltando.push("CNH ou RG + CPF");
        }
    }

    else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo" ||
        tipoContrato == "Locação de Equipamento - Alteração de Valor" ||
        tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor" ||
        tipoContrato == "Locação de Equipamento - Inclusão de Equipamento"
    ) {
        if (!documentos["Proposta Comercial"]) {
            faltando.push("Proposta Comercial");
        }
    }

    else if (tipoContrato.includes("Locação de Imóvel") && tipoPessoa == "F" && origemContrato != "Aditivos") {

        if (!documentos["Termo de Solicitação de Imóvel"]) {
            faltando.push("Termo de Solicitação de Imóvel");
        }

        var temCNH = !!documentos["CNH"];
        var temRG = !!documentos["RG"];
        var temCPF = !!documentos["CPF"];

        // A validação de identidade agora considera o que está visível na lista.
        // Se CNH foi anexada, RG e CPF deixam de ser exigidos visualmente.
        // Então só cobra RG/CPF quando os itens ainda estiverem visíveis na tela.
        var rgVisivel = $("#item-RG").is(":visible");
        var cpfVisivel = $("#item-CPF").is(":visible");

        // Se CNH não foi anexada, valida individualmente apenas os documentos
        // que continuam visíveis para o usuário.
        if (!temCNH) {
            if (rgVisivel && !temRG) {
                faltando.push("RG");
            }

            if (cpfVisivel && !temCPF) {
                faltando.push("CPF");
            }
        }
    }

    else if (tipoContrato.includes("Locação de Imóvel") && tipoPessoa == "J" && origemContrato != "Aditivos") {

        if (!documentos["Termo de Solicitação de Imóvel"]) {
            faltando.push("Termo de Solicitação de Imóvel");
        }

        if (!documentos["Cartão CNPJ"]) {
            faltando.push("Cartão CNPJ");
        }

        if (!documentos["Cartão QSA"]) {
            faltando.push("Cartão QSA");
        }
    }
    else if (tipoContrato == "Transporte de Materiais") {
        if (!documentos["Cartão CNPJ"]) {
            faltando.push("Cartão CNPJ");
        }
        if (!documentos["QSA"]) {
            faltando.push("QSA");
        }
        if (!documentos["NF de Remessa"]) {
            faltando.push("NF de Remessa");
        }
        if (!documentos["Certidão de regularidade FGTS"]) {
            faltando.push("Certidão de regularidade FGTS");
        }
        if (!documentos["CNDs (municipal, estadual, federal e trabalhista)"]) {
            faltando.push("CNDs (municipal, estadual, federal e trabalhista)");
        }
        var temCNH = !!documentos["CNH"];
        var temRG  = !!documentos["RG"];
        var temCPF = !!documentos["CPF"];
        if (!temCNH && !(temRG && temCPF)) {
            faltando.push("CNH ou RG + CPF");
        }

    }
    if (faltando.length > 0) {
        FLUIGC.toast({
            title: "Anexos obrigatórios pendentes",
            message: "<br>" + faltando.join("<br>"),
            type: "warning"
        });
        return false;
    }

    return true;
}
function bloqueiaCamposAprovacao() {
    $("#origemContrato").attr("readonly", "readonly");
    $("#modeloContrato").attr("readonly", "readonly");
    $("#tipoContratoBase").attr("readonly", "readonly");
    $("#tipoAlteracao").attr("readonly", "readonly");

    // Pra evitar problemas de ler o campo quando não estiver com selectize (só quando não VIEW)
    if ($("#formMode").val() != "VIEW") {
        $("#obra")[0].selectize.lock();
        $("#locador")[0].selectize.lock();
        $("#banco")[0].selectize.lock();
    }

    $("#procurador").attr("readonly", "readonly");
    $("#contratantePrincipal").attr("readonly", "readonly");

    $("#valorLocacaoReajustado").attr("readonly", "readonly"); // Novo
    $("#dataReajuste").attr("readonly", "readonly"); // Novo
    $("#clausulaAlterada").attr("readonly", "readonly"); // Novo
    $("#dataInicioLocacao").attr("readonly", "readonly");
    $("#dataFimLocacao").attr("readonly", "readonly");
    $("#temReajuste").attr("readonly", "readonly");
    $("#indiceReajuste").attr("readonly", "readonly");
    $("#temRetencao").attr("readonly", "readonly");
    $("#percentualRetencao").attr("readonly", "readonly");
    $("#temREIDI").attr("readonly", "readonly");
    $("#percentualREIDI").attr("readonly", "readonly");

    $("#tipoPagamento").attr("readonly", "readonly");
    $("#titular").attr("readonly", "readonly");
    $("#agencia").attr("readonly", "readonly");
    $("#contaCorrente").attr("readonly", "readonly");


    $("#nomeRepresentanteFornecedor").attr("readonly", "readonly");
    $("#cpfRepresentanteFornecedor").attr("readonly", "readonly");
    $("#mailRepresentanteFornecedor").attr("readonly", "readonly");
    $("#assinaturaContrato").attr("readonly", "readonly");



    $("#descricaoImovel").attr("readonly", "readonly");
    $("#valorMensalAluguel").attr("readonly", "readonly");
    $("#valorMensalLocacao").attr("readonly", "readonly");
    $("#enderecoImovel").attr("readonly", "readonly");
    $("#matriculaImovel").attr("readonly", "readonly");
    $("#finalidadeLocacao").attr("readonly", "readonly");
    $("#periodoLocacao").attr("readonly", "readonly");
    $("#janelaPagamento").attr("readonly", "readonly");
    $("#caucao").attr("readonly", "readonly");
    $("#valorCaucao").attr("readonly", "readonly");
    $("#dataPagamentoCaucao").attr("readonly", "readonly");

    $("#descontoPorDiaChuva").attr("readonly", "readonly");
    $("#descontoPorDiaParado").attr("readonly", "readonly");


    $("#ruaFornecedor").attr("readonly", "readonly");
    $("#numeroFornecedor").attr("readonly", "readonly");
    $("#bairroFornecedor").attr("readonly", "readonly");
    $("#administradorFornecedor").attr("readonly", "readonly");
    $("#cpfAdministrador").attr("readonly", "readonly");
    $("#localizacaoServico").attr("readonly", "readonly");
    $("#cidadeFornecedor").attr("readonly", "readonly");
    $("#estadoFornecedor").attr("readonly", "readonly");
    $("#cepFornecedor").attr("readonly", "readonly");
    $("#cpfFornecedor").attr("readonly", "readonly");
    $("#rgFornecedor").attr("readonly", "readonly");
    $("#nacionalidadeFornecedor").attr("readonly", "readonly");
    $("#estadoCivilFornecedor").attr("readonly", "readonly");
    
    $("#administradorTransporte").attr("readonly", "readonly")
    $("#dataInicioTransporte").attr("readonly", "readonly");
    $("#dataFimTransporte").attr("readonly", "readonly");
    $("#descontoPorDiaChuvaTransporte").attr("readonly", "readonly");
    $("#descontoPorDiaParadoTransporte").attr("readonly", "readonly");
    $("#formatoCobrancaTransporte").attr("readonly", "readonly");
    $("#valorMensalTransporte").attr("readonly", "readonly");
    $("#valorM3Transporte").attr("readonly", "readonly");
    $("#kmTransporte").attr("readonly", "readonly");
}
function bloqueiaCamposPagIntegracaoRM_antesDeGeradoContratoRM() {

    // Não roda função caso já tenha sido criado contrato
    // Nesse caso vai rodar a função bloqueiaCamposPagIntegacaoRM_seJaGeradoContratoRM()
    if ($("#IDCNT").val()) {
        return;
    }

    var inputsTexto = [
        "#novoContratoColigada",
        "#novoContratoFilial",
        "#novoContratoCCUSTO",
        "#novoContratoLocalDeEstoque"
    ];

    bloqueiaCampos_inputsTexto();

    // Utils
    function bloqueiaCampos_inputsTexto() {
        inputsTexto.forEach(function (campo) {
            $(campo).attr("readonly", "readonly");
        });
    }
}
function bloqueiaCamposPagIntegacaoRM_seJaGeradoContratoRM() {

    if (!$("#IDCNT").val()) {
        return;
    }

    var selectsSelectize = [
        "[name^='novoContratoItemProduto___']",
        ".selectDepartamentoNovoContratoItemRateio"
    ];

    var botoes = [
        "#btnAdicionarItem",
        ".btnRemoverItemNovoContrato",
        ".btnAdicionarRateio",
        ".btnRemoverLinhaRateioNovoItem"
    ];

    var inputsTexto = [
        "#novoContratoCodigo",
        "#novoContratoDataInicio",
        "#novoContratoDataFim",
        "#novoContratoObjeto",
        ".novoContratoItemValor",
        ".inputValorNovoContratoItemRateio"
    ];

    var selectsNativos = [
        "#novoContratoColigada",
        "#novoContratoFilial",
        "#novoContratoTipoContrato",
        "#novoContratoCCUSTO",
        "#novoContratoLocalDeEstoque",
        "#novoContratoSTATUS",
        "#novoContratoCondicaoPagamento",
        "#novoContratoRepresentante",
        "#novoContratoTipoFaturamento"
    ];


    bloqueiaSelectize();
    desativaBotoes();
    bloqueiaCampos_inputsTexto();
    bloqueiaCamposEDesativaClick_selectsNativos();

    // Utils
    function bloqueiaSelectize() {
        selectsSelectize.forEach(function (campo) {
            $(campo).each(function () {

                if (this.selectize) {
                    this.selectize.lock();
                }
            });
        });
    }
    function desativaBotoes() {
        botoes.forEach(function (campo) {
            $(campo).prop("disabled", true);
        });
    }
    function bloqueiaCampos_inputsTexto() {
        inputsTexto.forEach(function (campo) {
            $(campo).attr("readonly", "readonly");
        });
    }
    function bloqueiaCamposEDesativaClick_selectsNativos() {
        selectsNativos.forEach(function (campo) {
            $(campo).attr("readonly", "readonly"); // Readonly
            $(campo).on("mousedown", function(e) {
                e.preventDefault() // Não permite abri as options
            });
        });
    }
}
function bloqueiaCampos_seJaGeradoContratoRM() {

    if (!isContratoNovo_eJaGeradoContratoRM()) {
        return;
    }

    var selectsSelectize = [
        "#obra",
        "#locador",
    ];

    var inputsTexto = [
        "#dataInicioLocacao",
        "#dataFimLocacao"
    ];

    var selectsNativos = [
        "#origemContrato",
        "#modeloContrato",
        "#tipoContratoBase",
        "#temRetencao",
        "#percentualRetencao"
    ];


    bloqueiaSelectize();
    bloqueiaCamposEDesativaClick_inputsTexto();
    bloqueiaCamposEDesativaClick_selectsNativos();

    // Utils
    function bloqueiaSelectize() {
        selectsSelectize.forEach(function (campo) {
            $(campo).each(function () {

                if (this.selectize) {
                    this.selectize.lock();
                }
            });
        });
    }
    function bloqueiaCamposEDesativaClick_inputsTexto() {
        inputsTexto.forEach(function (campo) {
            $(campo).attr("readonly", "readonly");
            $(campo).on("focus click", function (e) {
                e.preventDefault();
                this.blur(); // tira o foco para não disparar o datepicker
            });
        });
    }
    function bloqueiaCamposEDesativaClick_selectsNativos() {
        selectsNativos.forEach(function (campo) {
            $(campo).attr("readonly", "readonly"); // Readonly
            $(campo).on("mousedown", function(e) {
                e.preventDefault() // Não permite abri as options
            });
        });
    }
}
function popularDestinoRetorno() {
    const ATIVIDADE_ATUAL = $("#atividade").val();
    const $select = $("#destinoRetorno");

    if ($("#formMode").val() == "VIEW") {
        return;
    }

    $select.empty().append('<option value="">Selecione o destino</option>');
    let opcoes = [];
    switch (parseInt(ATIVIDADE_ATUAL)) {
        case ATIVIDADES.JURIDICO:
            opcoes = [
                { value: "SOLICITANTE", text: "Solicitante" }
            ];
            break;
        case ATIVIDADES.CONTROLADORIA:
            opcoes = [
                { value: "JURIDICO", text: "Jurídico" },
                { value: "SOLICITANTE", text: "Solicitante" }
            ];
            break;
        case ATIVIDADES.ENGENHEIRO:
        case ATIVIDADES.COORDENADOR_OBRAS:
        case ATIVIDADES.DIRETORIA:
            opcoes = [
                { value: "CONTROLADORIA", text: "Controladoria" },
                { value: "JURIDICO", text: "Jurídico" },
                { value: "SOLICITANTE", text: "Solicitante" }
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
function obraPermiteReidi(CODCOLIGADA, CODCCUSTO) {
    const obrasComReidi = {
        "1": {
            "1.2.043": "Obra Parapuã",
            "1.4.011": "Obra Conserva Echaporã",
            "1.4.016": "Obra Duplicação Oriente",
            "1.4.021": "Obra COFCO",
            "1.4.027": "Obra Conserva Maracaí",
            "1.4.030": "Obra MRS Pátios Vale do Paraíba",
            "1.4.034": "Obra MRS Campo Grande",
        },
        "13": {
            "1.4.030": "Obra MRS Pátios Vale do Paraíba",
            "1.4.034": "Obra MRS Campo Grande",
        }
    };

    if (obrasComReidi[CODCOLIGADA] && obrasComReidi[CODCOLIGADA][CODCCUSTO]) {
        return true;
    }
    else {
        return false;
    }
}


// Opções de Aprovação/Envio
function controlaBotoesAprovacao_porAtividade() {
    const atividadeAtual = parseInt($("#atividade").val());

    // Atvds que somente "Enviam"
    const atividadesAssinaturaManual = 
        atividadeAtual == ATIVIDADES.ADM_OBRA ||
        atividadeAtual == ATIVIDADES.CONTROLADORIA_RECEBIMENTO || 
        atividadeAtual == ATIVIDADES.CONTROLADORIA_RECOLHE_ASSINATURA || 
        atividadeAtual == ATIVIDADES.OBRA_RECEBE_VIAS;

    // Regras
    if (atividadeAtual == ATIVIDADES.INICIO || atividadeAtual == ATIVIDADES.INICIO_0) {
        $("#divDecisaoAprovar, #divDecisaoReprovar, #divDestinoRetorno").hide();
        $("#divBtnEviar").show();
    
    } else if (atividadeAtual == ATIVIDADES.JURIDICO) {
        $("#divBtnEviar, #divDestinoRetorno").hide();
        $("#divDecisaoAprovar, #divDecisaoReprovar").show();

    } else if (atividadeAtual == ATIVIDADES.INTERMEDIARIO_ANALISE_EQUIPS) {
        $("#divDecisaoAprovar, #divDecisaoReprovar, #divDestinoRetorno").hide();

    } else if (atividadesAssinaturaManual) {
        $("#divDecisaoAprovar, #divDecisaoReprovar, #divDestinoRetorno").hide();
        $("#divBtnEviar").show();

    } else if (ATIVIDADES.FIM.includes(atividadeAtual)) {
        $("#divDecisaoAprovar, #divDecisaoReprovar, #divDestinoRetorno").hide();

    } else {
        $("#divBtnEviar").hide();
        $("#divDecisaoAprovar, #divDecisaoReprovar, #divDestinoRetorno").show();
        popularDestinoRetorno();
    }
}
function controlaBtnReprovar_comBaseNaSelecaoAtividadeRetorno_ouPorAtividadeAtual(atividadeDestino, atividadeAtual) {

    // ====== Por Atividade Atual ========
    if (atividadeAtual == ATIVIDADES.JURIDICO) {
        $("#btnDecisaoReprovar").attr("disabled", false); // Habilita btn
        return;
    }


    // ====== Por Seleção Atividade Destino Reprovação ========
    if (atividadeDestino != "") {
        $("#btnDecisaoReprovar").attr("disabled", false); // Habilita btn

    // Se usuário selecionou uma opção valida
    } else {
        $("#btnDecisaoReprovar").attr("disabled", true); // Desabilita btn
    }
}


// Modal Manual Contrato
function modalManualContrato_modeloCastilho() { // Modelo Castilho
    var modal = FLUIGC.modal({
        title: "Manual de Contratos - Padrão Castilho",
        size: "full",
        content: 
            `<p>Leia atentamente o <b>Manual de Contrato</b> a seguir antes de continuar a solicitação: </p>

             <div class="viewerPdf">
                 <embed id="pdfManualContrato" src="" type="application/pdf">
                 <br>
                 <div class="col-md-12 custom-checkbox custom-checkbox-success checkboxAceite custom-checkbox-lg">
                     <input type="checkbox" id="checkAceitaManual">
                     <label class="form-check-label" for="checkAceitaManual"> Estou de acordo com o Manual de Contrato</label>
                 </div>
                 <br>
             </div>

            <div class="btnArea">
                <button type="button" class="btn btn-info" data-dismiss="modal" id="btnAlterarModelo">Alterar Modelo Contrato</button>
                
                <button type="button" class="btn btn-success" data-dismiss="modal" disabled id="btnSalvar">Continuar</button>
            </div>`

    }, function (error) {
        
        if (error)  {
            console.log(error);

        // Se sucesso
        } else {
            $(".close").hide(); // Oculta o botão X de fechar do Modal

            // PDF
            exibePDFManualContrato_modeloCastilho().then(function(url) {
                $("#pdfManualContrato").attr("src", url + "#view=FitV");
            });

            $("#checkAceitaManual").change(function() {
                var isChecked = $(this).prop("checked");

                $("#btnSalvar").prop("disabled", !isChecked);
            });

            // Se clicou em "Alterar Modelo de Contrato"
            $("#btnAlterarModelo").on("click", function() {
                $("#modeloContrato").val(""); // Limpa seleção de Modelo
            });

            // Se clicou em "Continuar" então marcou o aceite
            $("#btnSalvar").on("click", function() {
                $("#usuarioDeAcordoManualContrato").val("SIM");
                controlaBlockCampoTipoContrato_seUsuarioDeAcordoManualContrato($("#usuarioDeAcordoManualContrato").val());
            });

            // Fecha o modal, pois foi marcado o checkbox
            $(".close").on("click", function() {
                location.reload();
            });
        }
    });

    return modal;


    // Utils
    function exibePDFManualContrato_modeloCastilho() { // Modelo Castilho

        var urlAtual = retornaUrlAmbienteFluigAtual();
        var idGED_manualPorAmbiente = idsGED_manuaisContratosCastilho_porAmbiente[ambiente];

        // dentro de exibePDFManualContrato_modeloCastilho(), no lugar do $.ajax atual
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "GET",
                url: urlAtual + "/api/public/ecm/document/downloadURL/" + idGED_manualPorAmbiente,
                success: function (data) {
                    // data.content = URL de download do PDF no GED
                    fetch(data.content)
                        .then(function (r) { return r.blob(); })
                        .then(function (blob) {
                            var pdfBlob = blob.type === "application/pdf"
                                ? blob
                                : new Blob([blob], { type: "application/pdf" });
                            resolve(URL.createObjectURL(pdfBlob));
                        })
                        .catch(function (e) {
                            mostraToast("Erro ao carregar Manual: ", e, "warning");
                            reject(e);
                        });
                },
                error: function (x, error) {
                    mostraToast("Erro ao exibir Manual: ", error, "warning");
                    reject("Erro ao exibir Manual");
                },
            });
        });
    }
}
function modalContrato_modeloForaPadrao() {
    var modalForaPadrao = FLUIGC.modal({
        title: "Manual de Contratos - Fora do Modelo Castilho",
        size: "full",
        content: 
        `<p>Leia atentamente o <b>Manual de Contrato</b> a seguir antes de continuar a solicitação:</p>

        <div class="viewerPdf">
            <embed id="pdfManualContrato" src="" type="application/pdf">
            <br>
            <div class="col-md-12 custom-checkbox custom-checkbox-success checkboxAceite custom-checkbox-lg">
            <input type="checkbox" id="checkAceitaManual">
            <label class="form-check-label" for="checkAceitaManual"> Estou de acordo com o Manual de Contrato</label>
            </div>
            <br>
        </div>

        <div class="btnArea">
            <button type="button" class="btn btn-info" data-dismiss="modal" id="btnAlterarModelo">Alterar Modelo Contrato</button>
            
            <button type="button" class="btn btn-success" data-dismiss="modal" disabled id="btnSalvar">Continuar</button>
        </div>`

    }, function(error) {
        if (error) {
            console.log(error);

        // Se sucesso
        } else {
            $(".close").hide(); // Oculta o botão X de fechar do Modal

            // PDF
            exibePDFManualContrato_modeloForaPadrao().then(function(url) {
                $("#pdfManualContrato").attr("src", url + "#view=FitV");
            });

            $("#checkAceitaManual").change(function() {
                var isChecked = $(this).prop("checked");

                $("#btnSalvar").prop("disabled", !isChecked);
            });

            // Se clicou em "Alterar Modelo de Contrato"
            $("#btnAlterarModelo").on("click", function() {
                $("#modeloContrato").val(""); // Limpa seleção de Modelo
            });

            // Se clicou em "Continuar" então marcou o aceite
            $("#btnSalvar").on("click", function() {
                $("#usuarioDeAcordoManualContrato").val("SIM");
                controlaBlockCampoTipoContrato_seUsuarioDeAcordoManualContrato($("#usuarioDeAcordoManualContrato").val());
            });

            // Fecha o modal, pois foi marcado o checkbox
            $(".close").on("click", function() {
                location.reload();
            });
        }
    });

    return modalForaPadrao;


    // Utils
    function exibePDFManualContrato_modeloForaPadrao() { // Modelo Fora Padrão

        var urlAtual = retornaUrlAmbienteFluigAtual();
        var idGED_manualPorAmbiente = idsGED_manuaisContratosForaPadrao_porAmbiente[ambiente];

        return new Promise(function(resolve, reject) {
            $.ajax({
                type: "GET",
                contentType: "application/json",
                url: urlAtual + "/api/public/ecm/document/downloadURL/" + idGED_manualPorAmbiente,
            
                success: function(data) {
                    resolve(data.content);
                },

                error: function(x, error) {
                    console.log(x);
                    console.log(error);

                    mostraToast("Erro ao exibir Manual: ", error, "warning");

                    reject("Erro ao exibir Manual");
                },
            });
        });
    }
}
function controlaBlockCampoTipoContrato_seUsuarioDeAcordoManualContrato(checkboxAceite) {

    if (checkboxAceite == "SIM") {
        $("#tipoContratoBase").removeAttr("readonly","readonly");

    } else if (checkboxAceite == "NAO") {
        $("#tipoContratoBase").attr("readonly","readonly");
    }
}
function limpaCampoTipoContrato() {
    $("#tipoContratoBase").val("").trigger("change");
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
                USUARIO:    $(this).find(".tableHistoricoUsuario").val(),
                DATA:       $(this).find(".tableHistoricoData").val(),
                OBSERVACAO: $(this).find(".tableHistoricoObservacao").val(),
                ACAO:       $(this).find(".tableHistoricoAcao").val(),
                ATIVIDADE:  $(this).find(".tableHistoricoAtividade").val(),
                PROXIMA_ATIVIDADE: $(this).find(".tableHistoricoProximaAtividade").val()
            });
        });
        return retorno;
    }
    function geraHtmlHistorico(linha) {
        var DATA = linha.DATA.split(" ");
        var textoObs = (linha.OBSERVACAO || "").replace(/^(<br\s*\/?>|\s)*/gi, "").trim();
        DATA = DATA[0].split("-").reverse().join("/") + " " + DATA[1];

        if (linha.ATIVIDADE === "Abertura Solicitação" && !textoObs) {
            textoObs = "Abertura da Solicitação";
        }

        var estiloBorda =
            linha.ACAO == "Aprovado" ? "border:solid 1px green;" // Aprovado
            : linha.ACAO == "Reprovado" ? "border:solid 1px red;" // Reprovado
            : ""; // Outro

        var html = `<div class="card">
                <div class="card-body" style="${estiloBorda}">
                    <div style="display:flex;">
                        <div class="divImageUser" style="margin-right:20px;"></div>
                        <div>
                            <h3 
                                class="card-title" style="margin-bottom:0px; color:black;">${BuscaNomeUsuario(linha.USUARIO)} 
                                <small>${linha.ATIVIDADE}</small>
                                <i class="flaticon flaticon-arrow-right icon-xs" aria-hidden="true"></i>
                                <small>${linha.PROXIMA_ATIVIDADE}</small>
                            </h3>
                            <small>${DATA}</small>
                            <p class="card-text">${textoObs ? textoObs : (linha.ACAO || "")}</p>
                        </div>
                    </div>
                </div>
            </div>`;

        return html;
    }
    function promiseBuscaImagemUsuario(usuario) {
        return new Promise(async (resolve, reject) => {
            const res  = await fetch("/api/public/social/image/" + usuario);
            const blob = await res.blob();
            const img  = new Image();
            img.width  = "60";
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
var documentosAnexados = {};
const TIPOS_MULTIPLOS_ANEXOS = [
    "Cartão CNPJ",
    "Cartão QSA",
    "QSA",
    "Formulario de Tributação",
    "Certidão de regularidade FGTS",
    "CNDs (municipal, estadual, federal e trabalhista)",
    "Termo de Solicitação de Imóvel",
    "NF de Remessa",
    "Proposta Comercial",
    "Outros",
    "CNH", 
    "RG",
    "CPF"
];

function isTipoAnexoMultiplo(tipo) {
    return TIPOS_MULTIPLOS_ANEXOS.includes(tipo);
}
function temAnexoDoTipo(documentos, tipo) {
    var valor = documentos[tipo];

    if (Array.isArray(valor)) {
        return valor.length > 0;
    }
    return !!valor;
}
async function renderizarAnexosEtapaAprovacao() {
    const hiddenValue = document.getElementById("hiddenDocumentosAnexados").value;
    if (!hiddenValue) return;

    try {
        const anexos = JSON.parse(hiddenValue);
        const lista = document.getElementById("listaAnexos");
        lista.innerHTML = "";

        for (const [tipo, valor] of Object.entries(anexos)) {
            const ids = [].concat(valor).filter(id => id && id !== "null" && id !== "#");
            
            if (!ids.length) {
                 continue; // Pula RG/CPF
            } 

            if (isTipoAnexoMultiplo(tipo)) {
                // Segue o mesmo modelo aplicado em insereDocumentoCriado
                // Nome do Tipo de Arquivo
                // Anexos
                var html = `<li> <i class="flaticon flaticon-done icon-md" aria-hidden="true"></i> <span><b>${tipo}:</b></span>`;
                for (const docId  of ids) {
                    if (!docId || docId === "null" || docId === "#") continue; // Pula docIds invalidos/vazios
                    const link = await promiseBuscaDownloadUrlDocumentoNoFLuig(docId);
                    html += `<div style="margin-left:20px"><a href="${link}" target="_blank">Visualizar</a></div>`;
                }
                html += `</li>`;
                lista.innerHTML += html;

            // Para arquivos unicos
            } else {
                if (ids[0]) {
                    const link = await promiseBuscaDownloadUrlDocumentoNoFLuig(ids[0]);
                    lista.innerHTML += `<li> <i class="flaticon flaticon-done icon-md" aria-hidden="true"></i> <span><b>${tipo}:</b> <a href="${link}" target="_blank">Visualizar</a></span></li>`;
                }
            }
        }
    } catch (e) {
        console.error("Erro ao carregar anexos:", e);
    }
}
function anexosPorTipoDeContrato(tipoDoContrato) {
    
    // Se a lista já está renderizada para este mesmo tipo, não reconstrói de novo.
    if ($("#listaAnexos").data("tipoRenderizado") === tipoDoContrato) {
        return;
    }

	console.log("[ANEXOS] chamado com:", tipoDoContrato); 
    const listaAnexosPorTipoDeContrato = {
        "Locação de Equipamento": ["Cartão CNPJ", "Cartão QSA", "Formulario de Tributação", "Certidão de regularidade FGTS", "CNDs (municipal, estadual, federal e trabalhista)", "CNH", "RG", "CPF"],
        "Locação de Equipamento - Com Mão de Obra": ["Cartão CNPJ", "Cartão QSA", "Formulario de Tributação", "Certidão de regularidade FGTS", "CNDs (municipal, estadual, federal e trabalhista)", "CNH", "RG", "CPF"],
        "Locação de Imóvel - PF": ["Termo de Solicitação de Imóvel", "CNH", "RG", "CPF"],
        "Locação de Imóvel - PJ": ["Termo de Solicitação de Imóvel", "Cartão CNPJ", "Cartão QSA"],
        "Transporte de Materiais": ["Cartão CNPJ", "QSA", "NF de Remessa", "Certidão de regularidade FGTS", "CNDs (municipal, estadual, federal e trabalhista)", "CNH", "RG", "CPF", "Outros"],
        // Aditivos
        "Locação de Equipamento - Alteração de Prazo": ["Proposta Comercial"],
        "Locação de Equipamento - Alteração de Valor": ["Proposta Comercial"],
        "Locação de Equipamento - Alteração de Prazo e Valor": ["Proposta Comercial"],
        "Locação de Equipamento - Inclusão de Equipamento": ["Proposta Comercial"],


        //"Transporte de Materiais/Funcionários" ...
    };

    if (!isForModeView()) {
        var anexos = listaAnexosPorTipoDeContrato[tipoDoContrato];
        var html = `<option value="">Selecione</option>`;
        var htmlListaAnexos = "";
        for (const anexo of anexos) {
            // Se for Anexo Mulitplo -> adiciona " (Vários)" ao final do nome da option
            // Ex: "Cartão CNPJ (Vários)"
            //
            // Se for Anexo Unico -> adiciona " (Único)" ao final do nome da option
            // Ex: "CPF (Único)"
            html += `<option value="${anexo}">${anexo}</option>`;

            htmlListaAnexos += `<li id="item-${anexo.split(" ").join("-").split("(")[0]}"><i class="flaticon flaticon-close icon-md" aria-hidden="true"></i> <b>${anexo}</b></li>`;
        }
        $("#tipoDocumentacao").html(html); // Preenche o <select> de tipos de documentação

        // No final, marca o tipo renderizado junto com o html
        $("#listaAnexos").html(htmlListaAnexos).data("tipoRenderizado", tipoDoContrato); // (Re)desenha a lista inteira do zero, todos os itens começam com ❌   
    } 

    // Re-marca os anexos já enviados sempre que a lista é reconstruída,
    // evitando que callbacks assíncronos (ex.: busca do fornecedor) apaguem os ✅.
    renderizaAnexosJaEnviados();

    // Util
    async function renderizaAnexosJaEnviados() {

        // Não segue se não tem anexos anteriores
        if (!documentosAnexados) {
            return;
        }

        for (const tipo in documentosAnexados) { // Pecorre cada tipo de anexo já enviado antes
            var ids = [].concat(documentosAnexados[tipo]); // Pega o ID do documento no Fluig desse tipo

            for (const docId of ids) {
                try {
                    const dataAnexo = await asyncGetDocumentDetails(docId); // Busca os detalhes do doc no Fluig (Nome/Descricao)
                    
                    // Troca o ❌ por ✅ + link do arquivo
                    insereDocumentoCriado(tipo, documentosAnexados, dataAnexo.data.description, docId); 

                // Se a busca falhar, mostra erro no log
                } catch (error) {
                    console.error("Erro ao reaplicar anexo:", tipo, error);
                }   
            }
        }
    };
}
async function onChangeInputAnexo_alteraListagemDeAnexos_criaDocNoFluig() {
    const tipo = $("#tipoDocumentacao").val();
    const selecioandos = Array.from(this.files || []);

    if (!selecioandos.length || !tipo) {
        return;
    }

    // Tipo de anexo unico considera só o primeiro arquivo
    const arquivos = isTipoAnexoMultiplo(tipo) ? selecioandos : [selecioandos[0]];

    try {
        const listaCarregar = $("#listaAnexos");
        const itemId = `item-${tipo.split(" ").join("-").split("(")[0]}`;

        for (const file of arquivos) {
            insereLabelCarregando(tipo, itemId, listaCarregar);

            const docId = await criaDocFluigRetornaDocumentId(file, pastaDeAnexos);

            if (isTipoAnexoMultiplo(tipo)) {

                if (!Array.isArray(documentosAnexados[tipo])) {
                    documentosAnexados[tipo] = [];
                }
                documentosAnexados[tipo].push(docId);

            } else {
                documentosAnexados[tipo] = docId;
            }
            // Primeiro deixa a função ajustar as regras entre CNH / RG / CPF
            await insereDocumentoCriado(tipo, documentosAnexados, file.name, docId);

            // Só depois salva no hidden o objeto já corrigido
            $("#hiddenDocumentosAnexados").val(JSON.stringify(documentosAnexados));
        }

        $("#inputAnexo").val("");
    } catch (e) {
        console.error("Erro ao anexar:", e);
        alert("Erro ao anexar documento.");
    }

    function insereLabelCarregando(tipo, itemId, listaCarregar) {

        if (isTipoAnexoMultiplo(tipo)) { // Fluxo de tipos com múltiplos anexos
            var itemMult = $("#" + itemId); // Procura a linha do tipo na lista

            if (itemMult.length === 0) {  // Se a linha não existir (foi removida pela exclusão CNH/RG/CPF)...
                $(listaCarregar).append('<li id="' + itemId + '"></li>'); // ...recria a linha vazia
                itemMult = $("#" + itemId); // ...e recupera a referência recém-criada
            }

            if (!itemMult.data("pronto")) { // Se ainda não tem o cabeçalho "✅ Tipo:"...
                itemMult.html('<i class="flaticon flaticon-done icon-md" aria-hidden="true"></i>' + "<span><b>" + tipo + ":</b></span>").data("pronto", true); // ...coloca o cabeçalho (só na 1ª vez)
            }

            itemMult.append('<div id="' + itemId + '-loading" style="margin-left:20px">⏳ carregando...</div>'); // Mostra "carregando" enquanto envia o arquivo
            return; // Encerra aqui (não cai nos fluxos de tipo único abaixo)
        }

        if (["CNH", "RG", "CPF"].includes(tipo)) {
            let item = $("#" + itemId);

            if (item.length === 0) {
                $(listaCarregar).append(`<li id="${itemId}"><span>⏳ <b>${tipo}:</b> carregando...</span></li>`);
            } else {
                $(item).html(`<span>⏳ <b>${tipo}:</b> carregando...</span>`);
            }
        } else {
            const item = $("#" + itemId);

            // ALTERAÇÃO:
            // Antes usava if (!item), mas em jQuery isso nunca funciona corretamente,
            // pois sempre retorna um objeto.
            // Agora usa item.length === 0 para verificar se o elemento realmente existe.
            if (item.length > 0) {
                $(item).html(`<span>⏳ <b>${tipo}:</b> carregando...</span>`);
            }
        }
    }
}
async function insereDocumentoCriado(tipo, documentosAnexados, name, docId) {
    const lista = $("#listaAnexos");
    const link = await promiseBuscaDownloadUrlDocumentoNoFLuig(docId);

    // CNH
    if (tipo == "CNH") {
        documentosAnexados["RG"] = null;
        documentosAnexados["CPF"] = null;

        // Remove as linhas de RG e CPF da tela
        $("#item-RG, #item-CPF").remove();

        $("#item-identidade-rg-cnh, #item-identidade-cpf-cnh").remove(); // Remove eventuais placeholders "RG ou CNH"/"CPF ou CNH"
        appendAnexoMultiplo("CNH", "item-CNH"); // Renderiza a CNH no formato de múltiplos

    // RG ou CPF
    } else if (tipo == "RG" || tipo == "CPF") {
        documentosAnexados["CNH"] = null;

        // Remove a linha de CNH da tela
        $("#item-CNH").remove();
        $("#item-identidade-" + tipo.toLowerCase() + "-cnh").remove(); // Remove o placeholder deste próprio tipo (ex.: "CPF ou CNH" ao anexar CPF)
        appendAnexoMultiplo(tipo, "item-" + tipo); // Renderiza o RG/CPF no formato de múltiplos

        var par = (tipo === "RG") ? "CPF" : "RG"; // Descobre qual é o par que ainda pode faltar

        if (!temAnexoDoTipo(documentosAnexados, par) && $("#item-" + par).length === 0) { // Se o par não foi anexado e não está na tela...
            var phId = "item-identidade-" + par.toLowerCase() + "-cnh"; // ...monta o id do placeholder do par
            $("#" + phId).remove(); // ...evita duplicar (remove se já existir)
            lista.append('<li id="' + phId + '"><i class="flaticon flaticon-close icon-md" aria-hidden="true"></i> <b>' + par + ' ou CNH</b></li>'); // ...mostra "RG ou CNH" / "CPF ou CNH"
        }

    } else if (isTipoAnexoMultiplo(tipo)) {
        appendAnexoMultiplo(tipo, "item-" + tipo.split(" ").join("-").split("(")[0]); // Renderiza no formato de múltiplos

    } else {
        $(`#item-${tipo.split(" ").join("-").split("(")[0]}`).html(`<i class="flaticon flaticon-done icon-md" aria-hidden="true"></i> <span><b>${tipo}:</b> <a href="${link}" target="_blank">${name}</a></span>`); // Substitui pela linha única
    }

    // Util
    function appendAnexoMultiplo(tipo, itemId) {
        var item = $("#" + itemId); // Procura a linha do tipo

        if (item.length === 0) { // Se não existir (foi removida pela exclusão mútua)...
            lista.append('<li id="' + itemId + '"></li>'); // ...recria a linha vazia
            item = $("#" + itemId); // ...recupera a referência
        }

        if (!item.data("pronto")) {                                    // Se a linha ainda não tem o cabeçalho "✅ Tipo:"...
            item.html('<i class="flaticon flaticon-done icon-md" aria-hidden="true"></i>' + "<span><b>" + tipo + ":</b></span>").data("pronto", true); // ...coloca o cabeçalho (só 1ª vez)
        }

        $("#" + itemId + "-loading").remove();                         // Remove o "⏳ carregando..." desse tipo

        // Acrescenta o arquivo (mantém os anteriores)
        item.append(
            '<div class="anexo-multiplo" data-tipo="' + tipo + '" data-docid="' + docId + '" style="margin-left:20px">' + // guarda tipo/docId p/ remoção
                '<a href="' + link + '" target="_blank">' + name + '</a> ' +       // Link para abrir/baixar
                '<span class="btn-remove-anexo" title="Remover" style="cursor:pointer"><i class="flaticon flaticon-trash icon-md" aria-hidden="true"></i></span>' + // Botão de remover só este arquivo
            '</div>'
        );
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
function onClickRemoveAnexo(e) {
    e.preventDefault();

    var linha = $(this).closest(".anexo-multiplo");
    var tipo = linha.data("tipo");
    var docId = linha.data("docid");

    // Remove o docId do array do tipo
    if (Array.isArray(documentosAnexados[tipo])) {
        documentosAnexados[tipo] = documentosAnexados[tipo].filter(function(id) {
            return String(id) != String(docId);
        });

        if (documentosAnexados[tipo].length == 0) {
            delete documentosAnexados[tipo];
        }
    }

    // Atualiza o hidden de anexos
    $("#hiddenDocumentosAnexados").val(JSON.stringify(documentosAnexados));

    // Atualiza a tela
    var item = linha.closest("li");
    linha.remove();

    // Se não tiver nenhum aquivo, volta icone de ❌ e libera anexo
    if (item.find(".anexo-multiplo").length == 0) {
        item.data("pronto", false).html('<i class="flaticon flaticon-close icon-md" aria-hidden="true"></i> <b>' + tipo + "</b>");
    }
}


// Haver com Transporte
function validaNovaDataFimTransporte() { //alerta imediato quando a nova data de fim é inválida ou <= data de fim atual.
    var novoFimStr = $("#novaDataFimTransporte").val();
    if (!novoFimStr) { return; } // nada digitado ainda

    var fimAtual = parseDataBR($("#dataFimContratoTransporte").val());
    var novoFim  = parseDataBR(novoFimStr);

    if (!novoFim) {
        FLUIGC.toast({ title: "", message: "Data inválida! Use o formato dd/mm/aaaa.", type: "warning", timeout: 4000 });
        $("#novaDataFimTransporte").val(""); $("#mesesAditivoTransporte").val("");
        return;
    }

    if (fimAtual && novoFim <= fimAtual) {
        FLUIGC.toast({ title: "", message: "A nova data de fim precisa ser maior que a data de fim atual do contrato!", type: "warning", timeout: 4000 });
        $("#novaDataFimTransporte").val(""); $("#mesesAditivoTransporte").val("");
    }
}
function atualizaMesesAditivoTransporte() { //meses de contrato = diferença entre a data de fim atual e a nova data de fim
    var fimAtualStr = $("#dataFimContratoTransporte").val();
    var novoFimStr  = $("#novaDataFimTransporte").val();

    if (!fimAtualStr || !novoFimStr) { $("#mesesAditivoTransporte").val(""); return; }

    var fimAtual = parseDataBR(fimAtualStr);
    var novoFim  = parseDataBR(novoFimStr);

    if (!fimAtual || !novoFim || novoFim <= fimAtual) {
        $("#mesesAditivoTransporte").val("");
        return;
    }

    // Meses de contrato = diferença entre a data de fim atual e a nova data de fim.
    var meses = (novoFim.getFullYear() - fimAtual.getFullYear()) * 12 + (novoFim.getMonth() - fimAtual.getMonth());
    if (novoFim.getDate() < fimAtual.getDate()) { meses--; }
    $("#mesesAditivoTransporte").val(meses + (meses === 1 ? " mês" : " meses"));
}
function toggleFormatoCobrancaAditivoTransporte() { //mostra o campo de valor conforme o Formato de Cobrança do aditivo (Incl/Excl).
    var formato = $("#formatoCobrancaAditivo").val();
    $("#divValorMensalAditivoTransporte").toggle(formato === "Valor Fixo");
    $("#divValorTAditivoTransporte, #divKmAditivoTransporte").toggle(formato === "Valor por Parâmetro");
    if (formato !== "Valor Fixo")        { $("#valorMensalAditivoTransporte").val(""); }
    if (formato !== "Valor por Parâmetro") { $("#valorTAditivoTransporte").val(""); $("#kmAditivoTransporte").val(""); }
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
async function asyncGetDocumentDetails(documentId) {
    return await axios.get(`/content-management/api/v2/documents/${documentId}`);
}
function getServerURL() {
    var ds = DatasetFactory.getDataset("dsGetServerURL", null, null, null);
    return ds.values[0].URL;
}
function retornaUrlAmbienteFluigAtual() {

    if (ambiente == "PRODUCAO") {
        return "http://fluig.castilho.com.br:1010";

    } else if (ambiente == "HOMOLOGACAO") {
        return "http://homologacao.castilho.com.br:2020";

    } else if (ambiente == "DESENVOLVIMENTO") {
        return "http://desenvolvimento.castilho.com.br:3232";
    }
}
function mostraToast(title, message, type) {

    /*
        Titulo (Alinhado a esquerda (pois tem diferença de DEV para HML/PROD), em negrito)
        Mensagem 
    */

    FLUIGC.toast({
        message: '<div style="text-align:left;"><strong>' + title + '</strong><br>' + message + '</div>',
        type: type
    });
}
function parseDataBR(s) {
    var digits = (s || "").replace(/\D/g, "");
    if (digits.length !== 8) { return null; }

    var dia = parseInt(digits.substring(0, 2), 10);
    var mes = parseInt(digits.substring(2, 4), 10);
    var ano = parseInt(digits.substring(4, 8), 10);

    var d = new Date(ano, mes - 1, dia);
    if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) { return null; }

    return d;
}
function preencherCamposViaSessionStorage() {
    var dadosRaw = sessionStorage.getItem("rescisaoContrato");
    if (!dadosRaw) return;
    var dados = JSON.parse(dadosRaw);
    console.log("Dados sessionStorage:", dados);
    $("#origemContrato").val(dados.origemContrato).trigger("change");
    $("#modeloContrato").val(dados.modeloContrato).trigger("change");
    $("#tipoContratoBase").val(dados.tipoContratoBase).trigger("change");
    var tentativasObra = 0;
    var intervalObra = setInterval(function () {
        var selectize = $("#obra")[0].selectize;
        tentativasObra++;
        if (Object.keys(selectize.options).length > 0) {
            selectize.setValue(dados.obra);
            clearInterval(intervalObra);
        }
        if (tentativasObra > 30) {
            console.warn("Timeout ao tentar preencher Obra via sessionStorage");
            clearInterval(intervalObra);
        }
    }, 300);
    var tentativasLocador = 0;
    var intervalLocador = setInterval(function () {
        var selectize = $("#locador")[0].selectize;
        tentativasLocador++;

        var temOpcoes = Object.keys(selectize.options).length > 0;
        var estaDesbloqueado = !selectize.isLocked;

        if (temOpcoes && estaDesbloqueado) {
            selectize.setValue(dados.locador);
            console.log("Valor setado. Valor atual após set:", selectize.getValue());
            clearInterval(intervalLocador);
        }

        if (tentativasLocador > 60) {
            clearInterval(intervalLocador);
        }
    }, 500);
    sessionStorage.removeItem("rescisaoContrato");
}
function isForModeView() {

    if ($("#formMode").val() == "VIEW") {
        return true;
    } else {
        return false;
    }
}
function isContratoNovo_eJaGeradoContratoRM() {
    if ($("#IDCNT").val() && $("#origemContrato").val() == "Novos") {
        return true;

    } else {
        return false;
    }
}