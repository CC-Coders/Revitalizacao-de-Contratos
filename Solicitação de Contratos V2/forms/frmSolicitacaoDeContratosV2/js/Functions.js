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
        
            await asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao();
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
    var isRetornar = document.getElementById("decisaoCancelar").checked;
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
            /*
                Locação de Equipamento
            */
            if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento" || tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {
                // Tabela de Equipamentos selecioandos para criar o inclusão/exclusão de equip no contrato
                // Se não tem nenhum prefixo adicionado para inclusão/exclusão e contrato principal selecionado (hidden preenchido)
                if ($("#tableEquipamentosSelecionados_aditivos > tbody > tr:not(:first)").length == 0 && $("#contratoSelecCodigo").val()) {
                    toastSeparado.push("Selecione pelo menos 1 equipamento!");
                    valida = false;
                }
            } else if (tipoContrato == "Locação de Equipamento - Alteração de Valor") {
                // Tabela de Equipamentos selecioandos, usada para guardar prefixos que foram informados valor de reajuste
                // Se não tem nenhum prefixo com valor reajustado preenchdio e contrato principal selecionado (hidden preenchido)
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
    }

    if (isRetornar) {
        var destinoRetorno = $("#destinoRetorno").val();
        if (destinoRetorno == null || destinoRetorno == undefined || destinoRetorno == "") {
            $("#destinoRetorno").addClass("has-error");
            mensagens.push("Destino do retorno");
        }

        var observacoes = $("#observacoes").val().trim();
        if (observacoes == null || observacoes == undefined || observacoes == "") {
            $("#observacoes").addClass("has-error");
            mensagens.push("Observações");
        }
    }

    if (!valida && mensagens.length > 0) {
        FLUIGC.toast({
            title: "Campo(s) não preenchido(s)",
            message: "<br>" + mensagens.join("<br>"),
            type: "warning",
        });
    }

    // Todos os toasts separados
    toastSeparado.forEach(function (mensagem) {
        FLUIGC.toast({
            title: "",
            message: mensagem,
            type: "warning",
            timeout: 4000
        });
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
/* validaCampos original
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
*/
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
var documentosAnexados = {};
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
function anexosPorTipoDeContrato(tipoDoContrato) {
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

        const docId = await criaDocFluigRetornaDocumentId(file, pastaDeAnexos);

        documentosAnexados[tipo] = docId;
        // Primeiro deixa a função ajustar as regras entre CNH / RG / CPF
        await insereDocumentoCriado(tipo, documentosAnexados, file.name, docId);

        // Só depois salva no hidden o objeto já corrigido
        $("#hiddenDocumentosAnexados").val(JSON.stringify(documentosAnexados));

        $("#inputAnexo").val("");
    } catch (e) {
        console.error("Erro ao anexar:", e);
        alert("Erro ao anexar documento.");
    }

    function insereLabelCarregando(tipo, itemId, listaCarregar) {
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

        // ALTERAÇÃO:
        // Antes estava usando append(), o que criava um NOVO item de CPF na lista.
        // Isso fazia o "CPF carregando..." continuar aparecendo junto com o novo.
        // Agora usa html() para SUBSTITUIR o item existente (mesma lógica aplicada no RG).
        $("#item-RG").html(`<span>✅ <b>RG:</b> <a href="${link}" target="_blank">${name}</a></span>`);

        if (!documentosAnexados["CPF"]) {
            $("#item-identidade-cpf-cnh").remove();
            $(lista).append(`<li id="item-identidade-cpf-cnh"><span>❌ <b>CPF ou CNH</b></span></li>`);
        }
    } else if (tipo === "CPF") {
        documentosAnexados["CNH"] = null;
        $("#item-identidade-cpf-cnh").remove();
        $("#item-CNH").remove();

        // ALTERAÇÃO:
        // Substitui o conteúdo do item existente ao invés de criar outro com append()
        // Isso evita duplicidade (CPF carregando + CPF anexado)
        $("#item-CPF").html(`<span>✅ <b>CPF:</b> <a href="${link}" target="_blank">${name}</a></span>`);

        if (!documentosAnexados["RG"]) {
            $("#item-identidade-rg-cnh").remove();
            $(lista).append(`<li id="item-identidade-rg-cnh"><span>❌ <b>RG ou CNH</b></span></li>`);
        }
    } else {
        $(`#item-${tipo.split(" ").join("-").split("(")[0]}`).html(`<span>✅ <b>${tipo}:</b> <a href="${link}" target="_blank">${name}</a></span>`);
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
async function asyncGetDocumentDetails(documentId) {
    return await axios.get(`/content-management/api/v2/documents/${documentId}`);
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