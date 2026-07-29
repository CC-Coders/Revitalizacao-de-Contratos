// Modelo de Contrato
const pastasDeAnexosPorServidor = {
    DESENVOLVIMENTO: "18386",
    HOMOLOGACAO: "10540",
    PRODUCAO: "140518",
}
var ds = DatasetFactory.getDataset("dsGetServerURL", null, null, null);
const env = ds.values[0].URL == "http://homologacao.castilho.com.br:2020" ? "HOMOLOGACAO" : ds.values[0].URL == "http://desenvolvimento.castilho.com.br:3232" ? "DESENVOLVIMENTO" : "PRODUCAO";
const pastaDeAnexos = pastasDeAnexosPorServidor[env];


const codigosModelos = {
    PRODUCAO: {
        // Novos
        "Locação de Imóvel": 2070415,
        "Locação de Imóvel - PF": 2316784,
        "Locação de Equipamento": 2070416,
        "Locação de Equipamento - Com Mão de Obra": 2070417,
        "Transporte de Materiais": 2497902,

        // Aditivos
        "Locação de Equipamento - Alteração de Valor": 2245474,
        "Locação de Equipamento - Alteração de Prazo": 2245464,
        "Locação de Equipamento - Alteração de Prazo e Valor": 2245463,
        "Locação de Equipamento - Inclusão de Equipamento": 2245476,
        "Locação de Equipamento - Exclusão de Equipamento": 2245475,
        "Transporte de Materiais (Aditivos)": 2506918,

        "Locação de Imóvel PF - Alteração de Valor": 2245471,
        "Locação de Imóvel PF - Alteração de Prazo": 2245466,
        "Locação de Imóvel PF - Alteração de Prazo e Valor": 2245473,
        "Locação de Imóvel PJ - Alteração de Prazo": 2245467,
        "Locação de Imóvel PJ - Alteração de Valor": 2245472,
        "Locação de Imóvel PJ - Alteração de Prazo e Valor": 2245462,

        // Rescisões
        "Locação de Equipamento (Rescisões)": 2245470,
        "Locação de Equipamento - Com Mão de Obra (Rescisões)": 2245469,
        "Locação de Imóvel (Rescisões)": 2245468,

    },
    HOMOLOGACAO: {
        // Novos
        "Locação de Imóvel": 39635,
        "Locação de Equipamento": 39636,
        "Locação de Equipamento - Com Mão de Obra": 39959,
        "Transporte de Materiais": 44178,

        // Aditivos
        "Locação de Equipamento - Alteração de Valor": 40819,
        "Locação de Equipamento - Alteração de Prazo": 40817,
        "Locação de Equipamento - Alteração de Prazo e Valor": 40818,
        "Locação de Equipamento - Inclusão de Equipamento": 40858,
        "Locação de Equipamento - Exclusão de Equipamento": 40889,
        "Locação de Imóvel PF - Alteração de Valor": 40813,
        "Locação de Imóvel PF - Alteração de Prazo": 40812,
        "Locação de Imóvel PF - Alteração de Prazo e Valor": 40816,
        "Locação de Imóvel PJ - Alteração de Prazo": 40811,
        "Locação de Imóvel PJ - Alteração de Valor": 40815,
        "Locação de Imóvel PJ - Alteração de Prazo e Valor": 40810,
        "Transporte de Materiais (Aditivos)": 44261,

        // Rescisões
        "Locação de Equipamento (Rescisões)": 40928,
        "Locação de Equipamento - Com Mão de Obra (Rescisões)": 40939,
        "Locação de Imóvel (Rescisões)": 40814,
        "Transporte de Materiais (Rescisão)": 43958,
    },
    DESENVOLVIMENTO: {
        // Novos
        "Locação de Imóvel": 32778,
        "Locação de Equipamento": 32779,
        "Locação de Equipamento - Com Mão de Obra": 32791,
        "Transporte de Materiais": 35284,

        // Aditivos
        "Locação de Equipamento - Alteração de Valor": 32828,
        "Locação de Equipamento - Alteração de Prazo": 32851,
        "Locação de Equipamento - Alteração de Prazo e Valor": 32852,
        "Locação de Equipamento - Inclusão de Equipamento": 0,
        "Locação de Equipamento - Exclusão de Equipamento": 0,

        "Locação de Imóvel PF - Alteração de Valor": 32624,
        "Locação de Imóvel PF - Alteração de Prazo": 32628,
        "Locação de Imóvel PF - Alteração de Prazo e Valor": 32627,
        "Locação de Imóvel PJ - Alteração de Prazo": 32626,
        "Locação de Imóvel PJ - Alteração de Valor": 32625,
        "Locação de Imóvel PJ - Alteração de Prazo e Valor": 32629,

        // Rescisões
        "Locação de Equipamento (Rescisões)": 0,
        "Locação de Equipamento - Com Mão de Obra (Rescisões)": 0,
        "Locação de Imóvel (Rescisões)": 32912,
    }
};

// Ver se é PJ/PF para usar o modelo de Contrato correto com base nisso.
function getTipoContrato_tipoPessoa() {
    const selectTipoContrato = $("#tipoContrato").val(); // Pega a opção que o usuario selecionou no select do form.
    const tipoPessoa = $("#FORNECEDOR_PF_PJ").val();

    const modelosContrato = {
        "Locação de Imóvel - Alteração de Valor": {
            F: "Locação de Imóvel PF - Alteração de Valor",
            J: "Locação de Imóvel PJ - Alteração de Valor",
        },
        "Locação de Imóvel - Alteração de Prazo": {
            F: "Locação de Imóvel PF - Alteração de Prazo",
            J: "Locação de Imóvel PJ - Alteração de Prazo",
        },
        "Locação de Imóvel - Alteração de Prazo e Valor": {
            F: "Locação de Imóvel PF - Alteração de Prazo e Valor",
            J: "Locação de Imóvel PJ - Alteração de Prazo e Valor",
        }
    };

    if (modelosContrato[selectTipoContrato]) {

        if (!tipoPessoa) {
            return "";
        }

        return modelosContrato[selectTipoContrato][tipoPessoa];
    }

    return selectTipoContrato;
}

// Gera cópia do Modelo
async function asyncPreencheDocumentoComDadosDoFormulario(documentId) {
    var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId);
    var file = await geraFileFromURL(url);
    var pdf = await carregaFileProDocxTemplatereEPreencheOsValores_retornaFile(file);
    return pdf;

    function geraFileFromURL(url) {
        return new Promise((resolve, reject) => {
            PizZipUtils.getBinaryContent(url, function (error, content) {
                if (error) {
                    reject(error);
                }
                resolve(content);
            });
        });
    }
    async function carregaFileProDocxTemplatereEPreencheOsValores_retornaFile(content) {
        try {
            const zip = new PizZip(content);
            const doc = new window.docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                syntax: {
                },
            });

            var input = await buscaDadosDoFormulario(getTipoContrato_tipoPessoa());
            console.log(input);
            doc.render(input);
            var file = doc.toBlob();
            var file = new File([file], geraNomeDoArquivo() + ".pdf", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
            return file;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

}
async function buscaDadosDoFormulario(tipoContrato) {
    var dadosColigada = getDadosDaColigada();
    const CODCOLIGADA = $("#CODCOLIGADA").val();
    const TIPO_CONTRATO = $("#tipoContrato").val();
    const TIPO_MODELO = getTipoContrato_tipoPessoa();
    const origemContrato = $("#origemContrato").val();
    const tipoPessoa_pf_pj = $("#FORNECEDOR_PF_PJ").val();
    var representante = regraRepresentantes(CODCOLIGADA, TIPO_CONTRATO);
    var dadosRepresentante = jsonRepresentantes[representante];


    const meses = [
        "",
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ];
    var [ano, mes, dia] = getDateNow().split("-");

    // Novos
    if (TIPO_MODELO == "Locação de Imóvel") {
        var retorno = {
            CODIGO_DO_CONTRATO: $("#novoContratoCodigo").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()},`,
           
            IMOVEL_DESCRICAO: $("#descricaoImovel").val(),
            IMOVEL_MATRICULA: $("#matriculaImovel").val(),
            IMOVEL_FINALIDADE: $("#finalidadeLocacao").val(),
            LOCACAO_PERIODO: $("#periodoLocacao").val(),
            LOCACAO_VALOR: $("#valorMensalAluguel").val(),
            TEM_CAUCAO: $("#caucao").val() == "Sim" ? true : false,
            LOCACAO_DIA_VENCIMENTO: $("#janelaPagamento").val(),
            LOCACAO_VALOR_CAUCAO: $("#valorCaucao").val(),
            LOCACAO_DATA_CAUCAO: $("#dataPagamentoCaucao").val(),
            FORMA_PAGAMENTO_DEPOSITO: $("#tipoPagamento").val() == "Depósito" ? true : false,
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,
            CODIGO_CENTRO_DE_CUSTO: `${$("#CODCCUSTO").val()} - ${$("#NOMECCUSTO").val()}`,

            // Adicionados em 24/02/2026
            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo,
        };

        const tipoPessoa = $("#FORNECEDOR_PF_PJ").val();
        if (tipoPessoa == "F") {
            retorno.FORNECEDOR_CPF = $("#hiddenCGCCFO").val();
            retorno.FORNECEDOR_RG = $("#rgFornecedor").val();
            retorno.FORNECEDOR_NACIONALIDADE = $("#nacionalidadeFornecedor").val();
            retorno.FORNECEDOR_ESTADO_CIVIL = $("#estadoCivilFornecedor").val();
        }else{
            retorno.FORNECEDOR_CNPJ = $("#hiddenCGCCFO").val();
            retorno.FORNECEDOR_NOME_REPRESENTANTE = $("#administradorFornecedor").val();
            retorno.FORNECEDOR_CPF_REPRESENTANTE = $("#cpfAdministrador").val();
        }



        var formaPagamento = $("#tipoPagamento").val();
        if (formaPagamento == "Depósito") {
            retorno.BANCO = $("#banco").val();
            retorno.BANCO_AGENCIA = $("#agencia").val();
            retorno.BANCO_CONTA_CORRENTE = $("#contaCorrente").val();
            retorno.BANCO_TITULAR = $("#titular").val();
        } else if (formaPagamento == "Boleto") {
            retorno.BANCO = $("#banco").val();
        }


    } else if (origemContrato == "Novos" && TIPO_MODELO == "Locação de Equipamento" || origemContrato == "Novos" && TIPO_MODELO == "Locação de Equipamento - Com Mão de Obra") {
        var prazo_inicio = $("#dataInicioLocacao").val().split("/").reverse().join("-");
        var prazo_fim = $("#dataFimLocacao").val().split("/").reverse().join("-");

        var equipamentos = await asyncConsultaEquipamentosSelecionados();

        var formaPagamento = null;

        if ($("#tipoPagamento").val() == "Depósito") {
            formaPagamento = `de depósito bancário, na conta corrente da LOCADORA, no Banco ${$("#banco").val()}, Agência: ${$("#agencia").val()}; Conta Corrente: ${$("#contaCorrente").val()}. Em nome de ${$("#titular").val()}.`

        } else if ($("#tipoPagamento").val() == "Boleto") {
            formaPagamento = `${$("#tipoPagamento").val()}. Banco ${$("#banco").val()}.`
        }

        var EQUIPAMENTOS = equipamentos.map(e => ({
            PREFIXO: e.PREFIXO,
            ANO_FABRICACAO: e.ANO_FABRICACAO,
            ANO_MODELO: e.ANO_MODELO,
            CAPACIDADE_COMBUSTIVEL: e.CAPACIDADE_COMBUSTIVEL,
            CHASSI: e.CHASSI,
            CLASSEMECANICA: e.CLASSEMECANICA,
            CLASSEOPERACIONAL: e.CLASSEOPERACIONAL,
            COMBUSTIVEL: e.COMBUSTIVEL,
            DESCRICAO: e.DESCRICAO,
            FABRICANTE: e.FABRICANTE,
            MODELO: e.MODELO,
            PLACA: e.PLACA,
            CHASSI: e.CHASSI,
            POTENCIAHP: e.POTENCIAHP,
            UN_DESMOBILIZACAO: e.UN_DESMOBILIZACAO,
            VALOR_DESMOBILIZACAO: floatToMoney(e.VALOR_DESMOBILIZACAO),
            UN_MOBILIZADO: e.UN_MOBILIZADO,
            VALOR_MOBILIZADO: floatToMoney(e.VALOR_MOBILIZADO),
            UN_EXTRA: e.UN_EXTRA,
            VALOR_EXTRA: floatToMoney(e.VALOR_EXTRA),
            VALOR_TOTAL: floatToMoney(parseFloat(e.VALOR_LOCACAO || 0) + parseFloat(e.MAODEOBRA || 0)),
            VALOR_LOCACAO: floatToMoney(e.VALOR_LOCACAO),
        }));


        var retorno = {
            CODIGO_DO_CONTRATO: $("#novoContratoCodigo").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            FORNECEDOR_NOME_REPRESENTANTE: $("#administradorFornecedor").val(),
            FORNECEDOR_CPF_REPRESENTANTE: $("#cpfAdministrador").val(),

            PERIODOINICIO: $("#dataInicioLocacao").val(),
            PERIODOFIM: $("#dataFimLocacao").val(),

            TEM_RETENCAO: $("#temRetencao").val() == "Sim" ? true : false,
            PERCENTUAL_RETENCAO: $("#temRetencao").val() == "Sim" ? $("#percentualRetencao").val() : "",

            TEM_REIDI: $("#temREIDI").val() == "Sim" ? true : false,
            PERCENTUAL_REIDI: $("#temREIDI").val() == "Sim" ? $("#percentualREIDI").val() : "",

            TEM_REAJUSTE: $("#temReajuste").val() == "Sim" ? true : false,
            INDICE_REAJUSTE: $("#temReajuste").val() == "Sim" ? $("#indiceReajuste").val() : "",

            VALOR_TOTAL: $("#valorTotalLocacao").val(),
            VALOR_TOTAL_EXTENSO: numeroPorExtenso($("#valorTotalLocacao").val().replace("R$", "").replace(".", "").replace(",", ".").trim(), true),

            TIPO_PAGAMENTO: $("#tipoPagamento").val() == "Depósito" ? "depósito bancário" : "boleto",
            FORMA_PAGAMENTO: $("#tipoPagamento").val() == "Depósito" ? true : false,
            BANCO: $("#banco").val(),
            BANCO_AGENCIA: $("#agencia").val(),
            BANCO_CONTA_CORRENTE: $("#contaCorrente").val(),
            BANCO_TITULAR: $("#titular").val(),

            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,
            CODIGO_CENTRO_DE_CUSTO: `${$("#CODCCUSTO").val()} - ${$("#NOMECCUSTO").val()}`,
            OBRA: $("#NOMECCUSTO").val(),

            PRAZO: parseInt(calculaDiferencaEmMeses(prazo_inicio, prazo_fim)),
            PRAZO_EXTENSO: numeroPorExtenso(calculaDiferencaEmMeses(prazo_inicio, prazo_fim).toString()),

            EQUIPAMENTOS: EQUIPAMENTOS,

            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo,
            LOCALIZACAO: $("#localizacaoServico").val()
        };

    }
    
    //Transporte de Materiais
    else if (TIPO_MODELO == "Transporte de Materiais") {
        var prazo_inicio = $("#dataInicioTransporte").val().split("/").reverse().join("-");
        var prazo_fim    = $("#dataFimTransporte").val().split("/").reverse().join("-");
        var valorMensalFloat = parseFloat($("#valorMensalTransporte").val().replace(/[R$\s.]/g, "").replace(",", ".")) || 0;
        var pctParado = parseFloat($("#descontoPorDiaParadoTransporte").val().replace("%", "").trim()) || 0;
        var pctChuva  = parseFloat($("#descontoPorDiaChuvaTransporte").val().replace("%", "").trim()) || 0;
        var valorDiario = valorMensalFloat / 30;

        var equipamentos = await asyncConsultaEquipamentosSelecionados();
        var EQUIPAMENTOS = equipamentos.map(e => ({
            PREFIXO:        e.PREFIXO,
            DESCRICAO:      e.DESCRICAO,
            MODELO:         e.MODELO,
            PLACA:          e.PLACA,
            FABRICANTE:     e.FABRICANTE,
            ANO_FABRICACAO: e.ANO_FABRICACAO,
            ANO_MODELO:     e.ANO_MODELO,
            POTENCIAHP:     e.POTENCIAHP,
            CAPACIDADE:     e.CAPACIDADE,
            CHASSI:         e.CHASSI,
        }));

        var retorno = {
            CODIGO_DO_CONTRATO:    $("#novoContratoCodigo").val() || "_",
            FORNECEDOR:            $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_CNPJ:       $("#hiddenCGCCFO").val(),
            FORNECEDOR_ENDERECO:   `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$("#cidadeFornecedor").val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_NOME_REPRESENTANTE: $("#administradorFornecedor").val(),
            FORNECEDOR_CPF_REPRESENTANTE:  $("#cpfAdministrador").val(),
            ADMINISTRADOR:         $("#administradorTransporte").val(),
            CONTRATANTE_PRINCIPAL: $("#contratantePrincipal").val(),

            PERIODOINICIO:         $("#dataInicioTransporte").val(),
            PERIODOFIM:            $("#dataFimTransporte").val(),
            MESES:         		   $("#mesesContratoTransporte").val(),

            FORMATO_COBRANCA:      $("#formatoCobrancaTransporte").val(),
            VALOR_MENSAL:          $("#valorMensalTransporte").val(),   
            VALOR_M3:              $("#valorM3Transporte").val(),        
            KM:                    $("#kmTransporte").val(),             
            EH_VALOR_FIXO:         $("#formatoCobrancaTransporte").val() == "Valor Fixo",
            EH_VALOR_PARAMETRO:    $("#formatoCobrancaTransporte").val() == "Valor por Parâmetro",
            DESCONTO_QUEBRADO: "R$ " + (valorDiario * pctParado / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            DESCONTO_CHUVA:    "R$ " + (valorDiario * pctChuva  / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            EQUIPAMENTOS:          EQUIPAMENTOS,

            OBRA:                  $("#NOMECCUSTO").val(),
            CODIGO_CENTRO_DE_CUSTO: `${$("#CODCCUSTO").val()} - ${$("#NOMECCUSTO").val()}`,
            LOCALIZACAO: $("#localizacaoServico").val(),
            DIA:                   dia,
            MES:                   meses[parseInt(mes)],
            ANO:                   ano,
            TIPO_PAGAMENTO:        $("#tipoPagamento").val() == "Depósito" ? "depósito bancário" : "boleto bancário",
            FORMA_PAGAMENTO:       $("#tipoPagamento").val() == "Depósito",   // true = Depósito | false = Boleto
            BANCO:                 $("#banco").val() || "",
            BANCO_AGENCIA:         $("#tipoPagamento").val() == "Depósito" ? ($("#agencia").val() || "") : "",
            BANCO_CONTA_CORRENTE:  $("#tipoPagamento").val() == "Depósito" ? ($("#contaCorrente").val() || "") : "",
            NOME_COLIGADA:         dadosColigada.nome,
            ENDERECO_COLIGADA:     dadosColigada.endereco,
            CNPJ_COLIGADA:         dadosColigada.cnpj,
            NOME_REPRESENTANTE:    dadosRepresentante.nome,
            CPF_REPRESENTANTE:     dadosRepresentante.cpf,
            CARGO_REPRESENTANTE:   dadosRepresentante.cargo,
        };
    }

    // Aditivos
    else if (TIPO_MODELO == "Locação de Imóvel PF - Alteração de Valor" || TIPO_MODELO == "Locação de Imóvel PJ - Alteração de Valor") {

        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            FORNECEDOR_RG: $("#rgFornecedor").val(), // Novo
            IMOVEL_ENDERECO: $("#enderecoImovel").val(), // Novo
            LOCACAO_VALOR: $("#valorMensalAluguel").val(),
            LOCACAO_VALOR_NOVO: $("#valorLocacaoReajustado").val(), // Novo
            CLAUSULA_NUMERO: $("#clausulaAlterada").val(),
            DATA_REAJUSTE: $("#dataReajuste").val(), // Novo
            DATA_ASSINATURA: $("#dataAssinatura").val(), // Novo
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,


            NOME_COLIGADA: dadosColigada.nome, // Novo
            ENDERECO_COLIGADA: dadosColigada.endereco, // Novo
            CNPJ_COLIGADA: dadosColigada.cnpj // Novo
        }
    } else if (TIPO_MODELO == "Locação de Imóvel PF - Alteração de Prazo" || TIPO_MODELO == "Locação de Imóvel PJ - Alteração de Prazo") {
        var prazo_inicio = $("#dataInicioLocacao").val().split("/").reverse().join("-");
        var prazo_fim = $("#dataFimLocacao").val().split("/").reverse().join("-");

        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            FORNECEDOR_RG: $("#rgFornecedor").val(), // Novo
            IMOVEL_ENDERECO: $("#enderecoImovel").val(), // Novo
            PERIODOINICIO: $("#dataInicioLocacao").val(),
            PERIODOFIM: $("#dataFimLocacao").val(),
            PRAZO: parseInt(calculaDiferencaEmMeses(prazo_inicio, prazo_fim)),
            CLAUSULA_NUMERO: $("#clausulaAlterada").val(),
            DATA_REAJUSTE: $("#dataReajuste").val(), // Novo
            DATA_ASSINATURA: $("#dataAssinatura").val(), // Novo
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,


            NOME_COLIGADA: dadosColigada.nome, // Novo
            ENDERECO_COLIGADA: dadosColigada.endereco, // Novo
            CNPJ_COLIGADA: dadosColigada.cnpj // Novo
        }
    } else if (TIPO_MODELO == "Locação de Imóvel PF - Alteração de Prazo e Valor" || TIPO_MODELO == "Locação de Imóvel PJ - Alteração de Prazo e Valor") {
        var prazo_inicio = $("#dataInicioLocacao").val().split("/").reverse().join("-");
        var prazo_fim = $("#dataFimLocacao").val().split("/").reverse().join("-");

        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            FORNECEDOR_RG: $("#rgFornecedor").val(), // Novo
            IMOVEL_ENDERECO: $("#enderecoImovel").val(), // Novo
            LOCACAO_VALOR: $("#valorMensalAluguel").val(),
            LOCACAO_VALOR_NOVO: $("#valorLocacaoReajustado").val(), // Novo
            PERIODOINICIO: $("#dataInicioLocacao").val(),
            PERIODOFIM: $("#dataFimLocacao").val(),
            PRAZO: parseInt(calculaDiferencaEmMeses(prazo_inicio, prazo_fim)),
            CLAUSULA_NUMERO: $("#clausulaAlterada").val(),
            DATA_REAJUSTE: $("#dataReajuste").val(), // Novo
            DATA_ASSINATURA: $("#dataAssinatura").val(), // Novo
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,


            NOME_COLIGADA: dadosColigada.nome, // Novo
            ENDERECO_COLIGADA: dadosColigada.endereco, // Novo
            CNPJ_COLIGADA: dadosColigada.cnpj // Novo
        }
    }

    else if (TIPO_MODELO == "Locação de Equipamento - Alteração de Valor") {
        var equipamentos = await asyncConsultaEquipamentosSelecionados_aditivos();

        var EQUIPAMENTOS = equipamentos.map(e => ({
            PREFIXO: e.PREFIXO,
            FABRICANTE: e.FABRICANTE,
            PLACA: e.PLACA,
            RENAVAM: e.RENAVAM,
            CHASSI: e.CHASSI,
            MODELO: e.MODELO + ' - ' + e.ANO_MODELO,
            VALOR_TOTAL: floatToMoney(parseFloat(e.VALOR_LOCACAO || 0) + parseFloat(e.MAODEOBRA || 0)),
            VALOR_REAJUSTADO: floatToMoney(moneyToFloat($(".inputvalorLocacaoReajustado[data-prefixo='" + e.PREFIXO + "']").val() || '0'))
        }));


        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            DATA_ASSINATURA: $("#dataAssinatura").val(),
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,

            EQUIPAMENTOS: EQUIPAMENTOS,
            CLAUSULA_NUMERO: $("#clausulaAlterada").val(),
            DATA_REAJUSTE: $("#dataReajuste").val(),

            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo
        };

    } else if (TIPO_MODELO == "Locação de Equipamento - Alteração de Prazo") {
        var prazo_inicio = $("#dataInicioLocacao").val().split("/").reverse().join("-");
        var prazo_fim = $("#dataFimLocacao").val().split("/").reverse().join("-");

        var equipamentos = await asyncConsultaEquipamentosSelecionados_aditivos();

        var EQUIPAMENTOS = equipamentos.map(e => ({
            PREFIXO: e.PREFIXO,
            FABRICANTE: e.FABRICANTE,
            PLACA: e.PLACA,
            RENAVAM: e.RENAVAM,
            CHASSI: e.CHASSI,
            MODELO: e.MODELO + ' - ' + e.ANO_MODELO,
            VALOR_LOCACAO: floatToMoney(e.VALOR_LOCACAO),
        }));


        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            PERIODOINICIO: $("#dataInicioLocacao").val(),
            PERIODOFIM: $("#dataFimLocacao").val(),
            DATA_ASSINATURA: $("#dataAssinatura").val(),
            PRAZO: parseInt(calculaDiferencaEmMeses(prazo_inicio, prazo_fim)),
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,

            EQUIPAMENTOS: EQUIPAMENTOS,
            CLAUSULA_NUMERO: $("#clausulaAlterada").val(),
            DATA_REAJUSTE: $("#dataReajuste").val(),

            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo
        };
    } else if (TIPO_MODELO == "Locação de Equipamento - Alteração de Prazo e Valor") {
        var prazo_inicio = $("#dataInicioLocacao").val().split("/").reverse().join("-");
        var prazo_fim = $("#dataFimLocacao").val().split("/").reverse().join("-");

        var equipamentos = await asyncConsultaEquipamentosSelecionados_aditivos();

        var EQUIPAMENTOS = equipamentos.map(e => ({
            PREFIXO: e.PREFIXO,
            FABRICANTE: e.FABRICANTE,
            PLACA: e.PLACA,
            RENAVAM: e.RENAVAM,
            CHASSI: e.CHASSI,
            MODELO: e.MODELO + ' - ' + e.ANO_MODELO,
            VALOR_TOTAL: floatToMoney(parseFloat(e.VALOR_LOCACAO || 0) + parseFloat(e.MAODEOBRA || 0)),
            VALOR_REAJUSTADO: floatToMoney(moneyToFloat($(".inputvalorLocacaoReajustado[data-prefixo='" + e.PREFIXO + "']").val() || '0'))
        }));


        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            PERIODOINICIO: $("#dataInicioLocacao").val(),
            PERIODOFIM: $("#dataFimLocacao").val(),
            DATA_ASSINATURA: $("#dataAssinatura").val(),
            PRAZO: parseInt(calculaDiferencaEmMeses(prazo_inicio, prazo_fim)),
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,

            EQUIPAMENTOS: EQUIPAMENTOS,
            CLAUSULA_NUMERO: $("#clausulaAlterada").val(),
            DATA_REAJUSTE: $("#dataReajuste").val(),

            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo
        };
    } else if (TIPO_MODELO == "Locação de Equipamento - Inclusão de Equipamento") {
        var ID_TCNT_AUXILIAR = $("#ID_TCNT_AUXILIAR").val();
        var equips_contrato = await asyncConsultaEquipamentosPorContrato(ID_TCNT_AUXILIAR);

        var EQUIPAMENTOS_CONTRATO = equips_contrato.map(e => ({
            PREFIXO: e.PREFIXO,
            FABRICANTE: e.FABRICANTE,
            PLACA: e.PLACA,
            RENAVAM: e.RENAVAM,
            CHASSI: e.CHASSI,
            MODELO: e.MODELO + ' - ' + e.ANO_MODELO,
            VALOR_TOTAL: floatToMoney(parseFloat(e.VALOR_LOCACAO || 0) + parseFloat(e.MAODEOBRA || 0))
        }));

        var equipamentos = await asyncConsultaEquipamentosSelecionados_aditivos();

        var EQUIPAMENTOS = equipamentos.map(e => ({
            PREFIXO: e.PREFIXO,
            FABRICANTE: e.FABRICANTE,
            PLACA: e.PLACA,
            RENAVAM: e.RENAVAM,
            CHASSI: e.CHASSI,
            MODELO: e.MODELO + ' - ' + e.ANO_MODELO,
            VALOR_TOTAL: floatToMoney(parseFloat(e.VALOR_LOCACAO || 0) + parseFloat(e.MAODEOBRA || 0))
        }));


        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            CLAUSULA_NUMERO: $("#clausulaAlterada").val(),
            DATA_ASSINATURA: $("#dataAssinatura").val(),
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,

            EQUIPS_INCLUSAO: EQUIPAMENTOS,
            EQUIPAMENTOS: EQUIPAMENTOS_CONTRATO,

            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo
        };

    } else if (TIPO_MODELO == "Locação de Equipamento - Exclusão de Equipamento") {
        var ID_TCNT_AUXILIAR = $("#ID_TCNT_AUXILIAR").val();

        var equips_contrato = await asyncConsultaEquipamentosPorContrato(ID_TCNT_AUXILIAR);

        // Busca os equipamentos marcados para exclusão (pai-filho)
        var equipamentos_exclusao = await asyncConsultaEquipamentosSelecionados_aditivos();

        // Cria lista apenas com os PREFIXOS que serão excluídos
        var prefixos_exclusao = equipamentos_exclusao.map(e => e.PREFIXO);

        // Filtra os equipamentos do contrato removendo os que foram marcados para exclusão
        var equips_contrato_atual = equips_contrato.filter(e =>
            !prefixos_exclusao.includes(e.PREFIXO)
        );

        // Agora monta a lista final de equipamentos que permanecerão no contrato
        var EQUIPAMENTOS_CONTRATO = equips_contrato_atual.map(e => ({
            PREFIXO: e.PREFIXO,
            FABRICANTE: e.FABRICANTE,
            PLACA: e.PLACA,
            RENAVAM: e.RENAVAM,
            CHASSI: e.CHASSI,
            MODELO: e.MODELO + " - " + e.ANO_MODELO,
            VALOR_TOTAL: floatToMoney(
                parseFloat(e.VALOR_LOCACAO || 0) + parseFloat(e.MAODEOBRA || 0)
            )
        }));

        var equipamentos = await asyncConsultaEquipamentosSelecionados_aditivos();

        var EQUIPAMENTOS = equipamentos.map(e => ({
            PREFIXO: e.PREFIXO,
            FABRICANTE: e.FABRICANTE,
            PLACA: e.PLACA,
            RENAVAM: e.RENAVAM,
            CHASSI: e.CHASSI,
            MODELO: e.MODELO + ' - ' + e.ANO_MODELO,
            VALOR_TOTAL: floatToMoney(parseFloat(e.VALOR_LOCACAO || 0) + parseFloat(e.MAODEOBRA || 0))
        }));


        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            CLAUSULA_NUMERO: $("#clausulaAlterada").val(),
            DATA_ASSINATURA: $("#dataAssinatura").val(),
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,

            EQUIPS_EXCLUSAO: EQUIPAMENTOS,
            EQUIPAMENTOS: EQUIPAMENTOS_CONTRATO,

            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo
        };
    }

    // Rescisões
    else if (TIPO_MODELO == "Locação de Imóvel (Rescisões)" && tipoPessoa_pf_pj == "F" || TIPO_MODELO == "Locação de Imóvel (Rescisões)" && tipoPessoa_pf_pj == "J") { // Rescisão
        var tipoPessoa = null;

        if (tipoPessoa_pf_pj == "J") {
            tipoPessoa = `CNPJ sob o nº ${$("#FORNECEDOR_CNPJ").val()}, portador(a) da Cédula de Identidade nº ${$("#FORNECEDOR_RG").val()}`

        } else if (tipoPessoa_pf_pj == "F") {
            tipoPessoa = `CPF sob o nº ${$("#FORNECEDOR_CNPJ").val()}, portador(a) da Cédula de Indentidade nº ${$("#FORNECEDOR_RG").val()}`
        }

        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            TIPO_PESSOA: tipoPessoa_pf_pj == "F" ? true : false,
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            FORNECEDOR_RG: $("#rgFornecedor").val(), // Novo
            IMOVEL_DESCRICAO: $("#descricaoImovel").val(),
            DATA_ASSINATURA: $("#dataAssinatura").val(), // Novo
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,


            NOME_COLIGADA: dadosColigada.nome, // Novo
            ENDERECO_COLIGADA: dadosColigada.endereco, // Novo
            CNPJ_COLIGADA: dadosColigada.cnpj // Novo
        };

    } else if (TIPO_MODELO == "Locação de Equipamento (Rescisões)") {
        var ID_TCNT_AUXILIAR = $("#ID_TCNT_AUXILIAR").val();

        var equips_contrato = await asyncConsultaEquipamentosPorContrato(ID_TCNT_AUXILIAR);

        // Agora monta a lista final de equipamentos que permanecerão no contrato
        var EQUIPAMENTOS_CONTRATO = equips_contrato.map(e => ({
            PREFIXO: e.PREFIXO,
            FABRICANTE: e.FABRICANTE,
            PLACA: e.PLACA,
            RENAVAM: e.RENAVAM,
            CHASSI: e.CHASSI,
            MODELO: e.MODELO + " - " + e.ANO_MODELO,
            VALOR_TOTAL: floatToMoney(parseFloat(e.VALOR_LOCACAO || 0) + parseFloat(e.MAODEOBRA || 0))
        }));

        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            DATA_ASSINATURA: $("#dataAssinatura").val(),
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,

            EQUIPAMENTOS: EQUIPAMENTOS_CONTRATO,

            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo
        };
    } else if (TIPO_MODELO == "Locação de Equipamento - Com Mão de Obra (Rescisões)") {
        var ID_TCNT_AUXILIAR = $("#ID_TCNT_AUXILIAR").val();

        var equips_contrato = await asyncConsultaEquipamentosPorContrato(ID_TCNT_AUXILIAR);

        // Agora monta a lista final de equipamentos que permanecerão no contrato
        var EQUIPAMENTOS_CONTRATO = equips_contrato.map(e => ({
            PREFIXO: e.PREFIXO,
            FABRICANTE: e.FABRICANTE,
            PLACA: e.PLACA,
            RENAVAM: e.RENAVAM,
            CHASSI: e.CHASSI,
            MODELO: e.MODELO + " - " + e.ANO_MODELO,
            VALOR_TOTAL: floatToMoney(parseFloat(e.VALOR_LOCACAO || 0) + parseFloat(e.MAODEOBRA || 0))
        }));

        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                "#cidadeFornecedor"
            ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            DATA_ASSINATURA: $("#dataAssinatura").val(),
            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,

            EQUIPAMENTOS: EQUIPAMENTOS_CONTRATO,

            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo
        };
    }

    // Aditivos de Transporte de Materiais
    else if (TIPO_MODELO.indexOf("Transporte de Materiais - ") === 0) {
        var EQUIPAMENTOS_ADITIVO = [];
        if (TIPO_MODELO == "Transporte de Materiais - Inclusão de Equipamento" ||
            TIPO_MODELO == "Transporte de Materiais - Exclusão de Equipamento") {
            var equipsSelecionados = await asyncConsultaEquipamentosSelecionados();
            EQUIPAMENTOS_ADITIVO = equipsSelecionados.map(e => ({
                PREFIXO:        e.PREFIXO,
                DESCRICAO:      e.DESCRICAO,
                MODELO:         e.MODELO,
                ANO_FABRICACAO: e.ANO_FABRICACAO,
                PLACA:          e.PLACA,
                CHASSI:         e.CHASSI,
            }));
        }

        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$("#cidadeFornecedor").val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo,

            // Específicos da alteração — o modelo atual ainda não tem estas tags.
            CLAUSULA_NUMERO: $("#clausulaAlterada").val(),
            DATA_REAJUSTE: $("#dataReajuste").val(),
            DATA_ASSINATURA: $("#dataAssinaturaTransporte").val(),
            //MELHORIA TRANSPORTE: Alteração de Valor agora usa Formato de Cobrança — o valor sai em VALOR_MENSAL / VALOR_T / KM (abaixo)
            PERIODOINICIO: $("#dataInicioContratoTransporte").val(),
            PERIODOFIM: $("#dataFimContratoTransporte").val(),
            NOVA_DATA_FIM: $("#novaDataFimTransporte").val(),
            MESES: $("#mesesAditivoTransporte").val(),
            //Inclusão/Exclusão agora usam Formato de Cobrança
            FORMATO_COBRANCA: $("#formatoCobrancaAditivo").val(),
            VALOR_MENSAL: $("#valorMensalAditivoTransporte").val(),
            VALOR_T: $("#valorTAditivoTransporte").val(),
            KM: $("#kmAditivoTransporte").val(),
            EH_VALOR_FIXO: $("#formatoCobrancaAditivo").val() == "Valor Fixo",
            EH_VALOR_PARAMETRO: $("#formatoCobrancaAditivo").val() == "Valor por Parâmetro",
            EQUIPAMENTOS: EQUIPAMENTOS_ADITIVO,

            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,
        };
    }

    // Rescisão de Transporte de Materiais
    else if (TIPO_MODELO == "Transporte de Materiais (Rescisões)") {
        var retorno = {
            CODIGO_DO_CONTRATO: $("#codigoContratoPrincipal").val() || "___________",
            FORNECEDOR: $("#hiddenFORNECEDOR").val(),
            FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$("#cidadeFornecedor").val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()}`,
            NOME_COLIGADA: dadosColigada.nome,
            ENDERECO_COLIGADA: dadosColigada.endereco,
            CNPJ_COLIGADA: dadosColigada.cnpj,
            NOME_REPRESENTANTE: dadosRepresentante.nome,
            CPF_REPRESENTANTE: dadosRepresentante.cpf,
            CARGO_REPRESENTANTE: dadosRepresentante.cargo,
            DATA_CELEBRADA: $("#dataAssinatura").val(),

            DIA: dia,
            MES: meses[parseInt(mes)],
            ANO: ano,
        };
    }

    return retorno;
}
async function modalDadosDoFormulario() {
    var myModal = FLUIGC.modal(
        {
            title: "Dados do contrato",
            content: await geraHtml(),
            id: "fluig-modal",
            size: "full",
            actions: [
                {
                    label: "Fechar",
                    autoClose: true,
                },
            ],
        }
    );

    async function geraHtml() {
        var input = await buscaDadosDoFormulario(getTipoContrato_tipoPessoa());
        var tbody = "";

        for (const tag in input) {
            if (!Object.hasOwn(input, tag)) continue;

            const valor = input[tag];

            if (tag != "EQUIPAMENTOS") {
                tbody += `<tr>
                    <td>${tag}</td>
                    <td>${valor}</td>
                </tr>`;
            } else {

                var equipamento = valor[0];

                for (const tagEquipamento in equipamento) {
                    if (!Object.hasOwn(equipamento, tagEquipamento)) continue;

                    const valorEquipamento = equipamento[tagEquipamento];
                    tbody += `<tr>
                        <td>EQUIPAMENTO.${tagEquipamento}</td>
                        <td>${valorEquipamento}</td>
                    </tr>`;

                }

            }
        }

        var html =
            `<table class="table table-bordered">
            <thead>
                <tr>
                    <th>Tag</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>${tbody}</tbody>
        </table>`;


        return html;
    }
}
async function asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao() {
    var tipoContrato = getTipoContrato_tipoPessoa();
    const tipoPessoa = $("#FORNECEDOR_PF_PJ").val();
    if (tipoContrato == "Locação de Imóvel" && tipoPessoa == "F") {
        tipoContrato = "Locação de Imóvel - PF";
    }

    //Aditivos
    var chaveModelo = tipoContrato;
    if (tipoContrato.indexOf("Transporte de Materiais - ") === 0) {
        chaveModelo = "Transporte de Materiais (Aditivos)";
    } else if (tipoContrato == "Transporte de Materiais (Rescisões)") {
        chaveModelo = "Transporte de Materiais (Rescisão)";
    }

    const documentIdModelo = codigosModelos[env][chaveModelo];

    if (!documentIdModelo) {
        throw `Não há modelo de contrato cadastrado para "${chaveModelo}" no ambiente ${env}.`;
    }

    var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentIdModelo);

    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], geraNomeDoArquivo() + ".docx", {
        type: blob.type,
    });
    var documentId = await promiseCriaDocFluig_retornaDocumentId(file, pastaDeAnexos);
    $("#contratoDocumentId").val(documentId);
    console.log("### Iniciando preenchimento do documento...");
    var filePreenchido = await asyncPreencheDocumentoComDadosDoFormulario($("#contratoDocumentId").val());
    console.log("### Documento preenchido, convertendo para PDF...")
    var pdf = await convertDocxToPdf(filePreenchido);
    console.log("### PDF gerado, salvando...")
    const filePdf = new File([pdf], geraNomeDoArquivo() + ".pdf", {
        type: blob.type,
    });
    var pdfId = await promiseCriaDocFluig_retornaDocumentId(filePdf, pastaDeAnexos);
    $("#contratoPdfId").val(pdfId);
}
function geraNomeDoArquivo() {
    var CODCCUSTO = $("#CODCCUSTO").val();
    var NOME_FORNECEDOR = $("#hiddenFORNECEDOR").val();
    var TIPO_CONTRATO = getTipoContrato_tipoPessoa();
    var CODIGOCONTRATO = $("#novoContratoCodigo").val().replace("/", "_");
    var NUM_PROCES = $("#numProces").val();

    if (CODIGOCONTRATO) {
        return `${CODIGOCONTRATO} - ${NUM_PROCES} - ${TIPO_CONTRATO} - ${NOME_FORNECEDOR}`;
    } else {
        return `${CODCCUSTO} - ${NUM_PROCES} - ${TIPO_CONTRATO} - ${NOME_FORNECEDOR}`;
    }
}
async function salvaModeloAlterado() {
    try {
        Swal.fire({
            icon: "info",
            title: "Salvando Contrato, por favor aguarde...",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        // Gera o docx
        var response = await promiseConverteEditorParaDocx();
        const blob = new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const file = new File([blob], geraNomeDoArquivo() + ".docx", {
            type: blob.type,
        });
        await promiseAtualizaDocumentoNoGED(file, $("#contratoDocumentId").val(), geraNomeDoArquivo() + ".docx", pastaDeAnexos);

        // Gera o PDF
        var filePreenchido = await asyncPreencheDocumentoComDadosDoFormulario($("#contratoDocumentId").val());
        var pdf = await convertDocxToPdf(filePreenchido, geraNomeDoArquivo() + ".pdf");
        await promiseAtualizaDocumentoNoGED(pdf, $("#contratoPdfId").val(), geraNomeDoArquivo() + ".pdf", pastaDeAnexos);

        Swal.fire({
            position: "top-end",
            icon: "success",
            toast: true,
            title: "Contrato Salvo!",
            timer: 1500,
            preConfirm: false,
        });
    } catch (error) { }

    function promiseConverteEditorParaDocx() {
        return new Promise(async (resolve, reject) => {
            const data = {
                html: ckeditor.getData(),
                css: 'figure.table {    display: table;    margin: 1em auto; }figure.table table {border-collapse: collapse !important;    width: 100%;    table-layout: auto;    border: 1px solid #ccc;}figure.table td,figure.table th {    border: 1px solid #ccc;    padding: 4px;    font-family: "Arial, sans-serif";    font-size: 12px;    vertical-align: top;}figure.table p {    margin: 0;}',
                config: {
                    document: {
                        orientation: "portrait",
                        size: "Tabloid",
                        margins: {
                            top: "20mm",
                            bottom: "20mm",
                            right: "24mm",
                            left: "24mm",
                        },
                        language: "en",
                    },
                    merge_fields: {
                        prefix: "{{",
                        suffix: "}}",
                    },
                    headers: {
                        default: {
                            html: header,
                            css: "",
                        },
                    },
                    footers: {
                        default: {
                            html: footer,
                            css: "",
                        },
                    },
                },
            };

            axios
                .post("https://docx-converter.cke-cs.com/v2/convert/html-docx", data, {
                    responseType: "arraybuffer", headers: {
                        'Authorization': await getJWT()
                    }
                })
                .then(async (response) => {
                    resolve(response);
                })
                .catch((error) => {
                    console.error("Conversion error", error);
                    reject(error);
                });
        });
    }

    async function asyncBuscaCSSDoDocx() {
        var retorno = "";
        var cssUrl = "https://cdn.ckeditor.com/ckeditor5/46.0.0/ckeditor5.css";
        var css = await fetch(cssUrl);
        retorno += await css.text();
        retorno += " ";

        var cssUrl = "https://cdn.ckeditor.com/ckeditor5-premium-features/46.0.0/ckeditor5-premium-features.css";
        var css = await fetch(cssUrl);
        retorno += await css.text();

        return retorno;
    }
}
// Substitui o modelo (.docx) por um arquivo Word enviado pelo usuário e atualiza o docx e o PDF no GED
async function substituiModeloPorUploadDeDocx(inputFile) {
    if (!inputFile || !inputFile.files || inputFile.files.length === 0) {
        return;
    }

    var arquivoEnviado = inputFile.files[0];

    // Valida a extensão do arquivo
    if (!arquivoEnviado.name.toLowerCase().endsWith(".docx")) {
        showMessage("Arquivo inválido.", "Selecione um arquivo do Word (.docx).", "danger");
        inputFile.value = "";
        return;
    }

    try {
        Swal.fire({
            icon: "info",
            title: "Atualizando Contrato, por favor aguarde...",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        // Renomeia o arquivo enviado seguindo o padrão do fluxo
        var file = new File([arquivoEnviado], geraNomeDoArquivo() + ".docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Atualiza o docx (modelo) no GED
        await promiseAtualizaDocumentoNoGED(file, $("#contratoDocumentId").val(), geraNomeDoArquivo() + ".docx", pastaDeAnexos);

        // Regenera o PDF a partir do novo docx e atualiza no GED
        var filePreenchido = await asyncPreencheDocumentoComDadosDoFormulario($("#contratoDocumentId").val());
        var pdf = await convertDocxToPdf(filePreenchido, geraNomeDoArquivo() + ".pdf");
        await promiseAtualizaDocumentoNoGED(pdf, $("#contratoPdfId").val(), geraNomeDoArquivo() + ".pdf", pastaDeAnexos);

        Swal.fire({
            position: "top-end",
            icon: "success",
            toast: true,
            title: "Contrato atualizado!",
            timer: 1500,
            preConfirm: false,
        });
    } catch (error) {
        console.error(error);
        showMessage("Erro ao substituir o arquivo do contrato.", "", "danger");
    } finally {
        inputFile.value = "";
    }
}
// Baixa o docx (modelo) atualizado do contrato armazenado no GED
async function baixaDocxDoContrato() {
    var documentId = $("#contratoDocumentId").val();
    if (!documentId) {
        showMessage("Nenhum documento Word disponível para download.", "", "warning");
        return;
    }

    try {
        Swal.fire({
            icon: "info",
            title: "Preparando download, por favor aguarde...",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId);
        var response = await fetch(url);
        var blob = await response.blob();
        saveAs(blob, geraNomeDoArquivo() + ".docx");

        Swal.close();
    } catch (error) {
        console.error(error);
        showMessage("Erro ao baixar o arquivo Word.", "", "danger");
    }
}
async function geraPreContrato() {
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
        var file = await asyncPreencheDocumentoComDadosDoFormulario($("#contratoDocumentId").val());
        var pdf = await convertDocxToPdf(file);
    } catch (error) {
        // Mesmo motivo do enviarSolicitacao: sem o catch o modal de carregamento
        // fica girando e a falha some no "Uncaught (in promise)".
        console.error("Erro ao gerar o pré-contrato: ", error);

        // Desliga o loader e devolve o botão de fechar, que o Swal de carregamento
        // havia removido — o popup é o mesmo, reaproveitado.
        Swal.hideLoading();
        Swal.fire({
            icon: "error",
            title: "Erro ao gerar o pré-contrato",
            text: error && error.message ? error.message : error,
            showConfirmButton: true,
            allowEscapeKey: true,
            allowOutsideClick: true,
        });
        return;
    }

    Swal.close();
    saveAs(pdf, "teste.pdf");
}
async function convertDocxToPdf(docxBlob, name) {
    try {
        var html = await converteDocxParaHTML(docxBlob, name);
        var pdf = await converteHtmlParaPDF(html);
        return pdf;
    } catch (error) {
        console.error(error);
        showMessage("Erro ao gerar PDF.", "", "danger");
    }
    async function converteDocxParaHTML(docxBlob, name) {
        try {
            const formData = new FormData();
            formData.append("file", docxBlob, name);

            const docxHtmlResponse = await axios.post("https://docx-converter.cke-cs.com/v2/convert/docx-html", formData, {
                responseType: "json", headers: {
                    'Authorization': await getJWT()
                }
            });


            var html = docxHtmlResponse.data.html;
            if ($("#atividade").val() != ATIVIDADES.CONTROLADORIA) {
                html += `<div class="watermark" style="font-size: 50px;opacity: 0.5;color: black;position: fixed;left: 20%;top: 50%;transform: rotate(25deg);letter-spacing: 10px;">SEM VALOR CONTRATUAL</div>`;
            }

            return html;
        } catch (error) {
            console.error("DOCX to HTML conversion error", error);
            throw error;
        }
    }
    async function converteHtmlParaPDF(html) {
        try {
            var dadosColigadas = getDadosDaColigada();

            const pdfResponse = await axios.post(
                "https://pdf-converter.cke-cs.com/v1/convert",
                {
                    html: `<div>${html}</div>`,
                    options: {
                        format: "Tabloid",
                        margin_top: "20mm",
                        margin_bottom: "35mm",
                        margin_right: "24mm",
                        margin_left: "24mm",
                        page_orientation: "portrait",
                        header_html: `<div style="text-align:right;padding:10px;"><img src="${await getBase64FromUrl(dadosColigadas.header)}" alt='Dromos' style='margin-right: 8%; height: 54px;'></div>`,
                        footer_html: dadosColigadas.footer + `<div style="text-align:right; padding:5px;"><span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
                    },
                },
                {
                    responseType: "arraybuffer",
                    headers: {
                        'Authorization': await getJWT()
                    }
                }
            );
            return new Blob([pdfResponse.data], { type: "application/pdf" });
        } catch (error) {
            console.error("HTML to PDF conversion error", error);
            throw error;
        }
    }
}


// CK5 Editor
var ckeditor = null;
async function editarArquivoNoCKEditor() {
    Swal.fire({
        icon: "info",
        title: "Carregando Contrato, por favor aguarde...",
        showConfirmButton: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
    openModal();
    await loadCkEditor();
    setTimeout(async () => {
        await carregaDocumentoParaOCKEditor($("#contratoDocumentId").val());
    }, 200);

    function openModal() {
        var html = `<div class="main-container">
				<div class="editor-container editor-container_classic-editor editor-container_include-style editor-container_include-fullscreen"
					id="editor-container">
					<div class="editor-container__editor">
						<div id="editor"></div>
					</div>
				</div>
			</div>`;

        var myModal = FLUIGC.modal(
            {
                title: "Title",
                content: html,
                id: "fluig-modal",
                size: "full",
                actions: [
                    {
                        label: "Salvar",
                        bind: "data-open-modal",
                        autoClose: true,
                    },
                    {
                        label: "Cancelar",
                        autoClose: true,
                    },
                ],
            },
            function (err, data) {
                if (err) {
                    // do error handling
                } else {
                    $("[data-open-modal]").on("click", salvaModeloAlterado);
                }
            }
        );
    }
}
async function loadCkEditor() {
    const LICENSE_KEY =
        'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3OTcwMzM1OTksImp0aSI6ImMxYmRiODcxLTBkZjQtNDkwYi1hMTdmLWQ3MDUwNDFmMGNiOCIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiXSwid2hpdGVMYWJlbCI6dHJ1ZSwiZmVhdHVyZXMiOlsiRFJVUCIsIkRPIiwiRlAiLCJTQyIsIlRPQyIsIlRQTCIsIlBPRSIsIkNDIiwiTUYiLCJFMlAiLCJFMlciLCJNTEwiLCJTRUUiLCJFQ0giLCJFSVMiLCJMSCIsIkZPTyIsIkNNVCIsIlRDIiwiUkgiLCJSRSIsIlJDTVQiLCJSVEMiLCJSUkgiLCJJVyJdLCJ2YyI6IjYxMzAyNWJkIn0.SxKfpHP3CrGh4PCAOFbLGZRej1E6jDsyYE3JSVKry4jP5jDWvR2ctVmamF3QRHcon7pepx9ztNecmlgHOaLdeA';

    const CLOUD_SERVICES_TOKEN_URL =
        'https://riccys8ecxzq.cke-cs.com/token/dev/21a778b99face29865582bf7e8d4515fcd885eaacbc2e6d1e0b23a69215a?limit=10';


    const { ClassicEditor,
        Alignment,
        ListEditing,
        Autoformat,
        AutoImage,
        AutoLink,
        Autosave,
        BlockQuote,
        Bold,
        Bookmark,
        CKBox,
        ImageResizeEditing, ImageResizeHandles,
        CKBoxImageEdit,
        CloudServices,
        Code,
        Emoji,
        Essentials,
        FindAndReplace,
        FontBackgroundColor,
        FontColor,
        FontFamily,
        FontSize,
        Fullscreen,
        GeneralHtmlSupport,
        Heading,
        Highlight,
        HorizontalLine,
        ImageBlock,
        ImageCaption,
        ImageEditing,
        ImageInline,
        ImageInsert,
        ImageInsertViaUrl,
        ImageResize,
        ImageStyle,
        ImageTextAlternative,
        ImageToolbar,
        ImageUpload,
        ImageUtils,
        Indent,
        IndentBlock,
        Italic,
        Link,
        LinkImage,
        List,
        ListProperties,
        Mention,
        PageBreak,
        Paragraph,
        PasteFromOffice,
        PictureEditing,
        RemoveFormat,
        SpecialCharacters,
        SpecialCharactersArrows,
        SpecialCharactersCurrency,
        SpecialCharactersEssentials,
        SpecialCharactersLatin,
        SpecialCharactersMathematical,
        SpecialCharactersText,
        Strikethrough,
        Style,
        Subscript,
        Superscript,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableProperties,
        TableToolbar,
        TextTransformation,
        TodoList,
        Base64UploadAdapter,
        Underline, } = CKEDITOR;
    const { CaseChange,
        ExportPdf,
        ExportWord,
        FormatPainter,
        ImportWord,
        LineHeight,
        MergeFields,
        MultiLevelList,
        PasteFromOfficeEnhanced,
        SlashCommand,
        TableOfContents,
        Template, } = CKEDITOR_PREMIUM_FEATURES;

    ckeditor = await ClassicEditor.create(document.querySelector('#editor'), {
        plugins: [
            Alignment,
            Base64UploadAdapter,
            CaseChange,
            ListEditing,
            Autoformat,
            AutoImage,
            AutoLink,
            Autosave,
            BlockQuote,
            Bold,
            Bookmark,
            CKBox,
            CKBoxImageEdit,
            CloudServices,
            Code,
            ImageResizeEditing, ImageResizeHandles,
            Emoji,
            Essentials,
            FindAndReplace,
            FontBackgroundColor,
            FontColor,
            FontFamily,
            FontSize,
            Fullscreen,
            GeneralHtmlSupport,
            Heading,
            Highlight,
            HorizontalLine,
            ImageBlock,
            ImageCaption,
            ImageEditing,
            ImageInline,
            ImageInsert,
            ImageInsertViaUrl,
            ImageResize,
            ImageStyle,
            ImageTextAlternative,
            ImageToolbar,
            ImageUpload,
            ImageUtils,
            Indent,
            IndentBlock,
            Italic,
            Link,
            LinkImage,
            List,
            ListProperties,
            Mention,
            PageBreak,
            Paragraph,
            PasteFromOffice,
            PictureEditing,
            RemoveFormat,
            SpecialCharacters,
            SpecialCharactersArrows,
            SpecialCharactersCurrency,
            SpecialCharactersEssentials,
            SpecialCharactersLatin,
            SpecialCharactersMathematical,
            SpecialCharactersText,
            Strikethrough,
            Style,
            Subscript,
            Superscript,
            Table,
            TableColumnResize,
            TableCaption,
            TableCellProperties,
            TableProperties,
            TableToolbar,
            TextTransformation,
            TodoList,
            Underline,
            ExportPdf,
            ExportWord,
            FormatPainter,
            ImportWord,
            LineHeight,
            MergeFields,
            MultiLevelList,
            PasteFromOfficeEnhanced,
            SlashCommand,
            TableOfContents,
            Template,

        ],
        toolbar: {
            items: [
                'undo',
                'redo',
                '|',
                'insertMergeField',
                'previewMergeFields',
                '|',
                'importWord',
                'exportWord',
                'exportPdf',
                'formatPainter',
                'caseChange',
                'findAndReplace',
                'fullscreen',
                '|',
                'heading',
                '|',
                'fontSize',
                'fontFamily',
                'fontColor',
                'fontBackgroundColor',
                '|',
                'bold',
                'italic',
                'underline',
                'strikethrough',
                'subscript',
                'superscript',
                'code',
                'removeFormat',
                '|',
                'emoji',
                'specialCharacters',
                'horizontalLine',
                'pageBreak',
                'link',
                'insertFootnote',
                'insertImageViaUrl',
                'insertTable',
                'tableOfContents',
                'insertTemplate',
                '|',
                'alignment',
                'lineHeight',
                '|',
                'bulletedList',
                'numberedList',
                'multiLevelList',
                'todoList',
                'outdent',
                'indent'
            ],
            shouldNotGroupWhenFull: true
        },

        menuBar: {
            isVisible: true,
        },
        licenseKey: LICENSE_KEY,
        fontFamily: {
            supportAllValues: true
        },
        fontSize: {
            options: [10, 12, 14, 'default', 18, 20, 22],
            supportAllValues: true
        },
        heading: {
            options: [
                {
                    model: 'paragraph',
                    title: 'Paragraph',
                    class: 'ck-heading_paragraph'
                },
                {
                    model: 'heading1',
                    view: 'h1',
                    title: 'Heading 1',
                    class: 'ck-heading_heading1'
                },
                {
                    model: 'heading2',
                    view: 'h2',
                    title: 'Heading 2',
                    class: 'ck-heading_heading2'
                },
                {
                    model: 'heading3',
                    view: 'h3',
                    title: 'Heading 3',
                    class: 'ck-heading_heading3'
                },
                {
                    model: 'heading4',
                    view: 'h4',
                    title: 'Heading 4',
                    class: 'ck-heading_heading4'
                },
                {
                    model: 'heading5',
                    view: 'h5',
                    title: 'Heading 5',
                    class: 'ck-heading_heading5'
                },
                {
                    model: 'heading6',
                    view: 'h6',
                    title: 'Heading 6',
                    class: 'ck-heading_heading6'
                }
            ]
        },
        image: {
            toolbar: [
                'toggleImageCaption',
                'imageTextAlternative',
                '|',
                'imageStyle:inline',
                'imageStyle:wrapText',
                'imageStyle:breakText',
                '|',
                'resizeImage'
            ]
        },
        language: 'pt',
        lineHeight: {
            supportAllValues: true
        },
        link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
            decorators: {
                toggleDownloadable: {
                    mode: 'manual',
                    label: 'Downloadable',
                    attributes: {
                        download: 'file'
                    }
                }
            }
        },
        list: {
            properties: {
                styles: true,
                startIndex: true,
                reversed: true
            },
        },
        table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
        },


    });

    return;

}
var header = null; //Salva o cabeçalho importado do docx para usar quando for salvar pra docx novamente
var footer = null; //Salva o rodape importado do docx para usar quando for salvar pra docx novamente
async function carregaDocumentoParaOCKEditor(documentId) {
    const fileUrl = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId);
    const response = await fetch(fileUrl);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append("file", blob, "file.docx");
    axios
        .post("https://docx-converter.cke-cs.com/v2/convert/docx-html", formData, {
            headers: {
                'Authorization': await getJWT()
            }
        })
        .then((response) => {
            console.log("Conversion result", response.data);
            header = response?.data?.headers?.default?.html || "<h1></h1>";
            footer = response?.data?.footers?.default?.html || "<h1></h1>";
            ckeditor.setData(response.data.html);

            Swal.close();
        })
        .catch((error) => {
            console.log("Conversion error", error);
        });
}


// Utils
function promiseGeraFileFromURL(url) {
    return new Promise((resolve, reject) => {
        PizZipUtils.getBinaryContent(url, function (error, content) {
            if (error) {
                reject(error);
            }
            resolve(content);
        });
    });
}
function promiseAtualizaDocumentoNoGED(file, documentId, name, parentId) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = function (e) {
            var bytes = e.target.result.split("base64,")[1];
            var ds = DatasetFactory.getDataset(
                "dsAtualizaDocumentosFluig",
                null,
                [
                    DatasetFactory.createConstraint("name", name, name, ConstraintType.MUST),
                    DatasetFactory.createConstraint("ParentDocumentId", parentId, parentId, ConstraintType.MUST),
                    DatasetFactory.createConstraint("documentId", documentId, documentId, ConstraintType.MUST),
                    DatasetFactory.createConstraint("conteudo", bytes, bytes, ConstraintType.MUST),
                ],
                null
            );

            resolve(ds);
        };
    });
}
function promiseCriaDocFluig_retornaDocumentId(file, parentId) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        var fileName = file.name;

        reader.readAsDataURL(file);
        reader.onload = function (e) {
            var bytes = e.target.result.split("base64,")[1];
            console.log(bytes)

            // Chama Dataset de Criação de Documento
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
                        if (!dataset || dataset == "" || dataset == null) {
                            // Retorna com erro
                            reject("Houve um erro na comunicação com o webservice de criação de documentos. Tente novamente!");
                        }

                        if (dataset.values[0][0] == "false") {
                            // Retorna com erro
                            reject("Erro ao criar arquivo. Favor entrar em contato com o administrador do sistema. Mensagem: " + dataset.values[0][1]);
                        } else {
                            // Retorna com Sucesso
                            console.log("### GEROU docID = " + dataset.values[0].Resultado);
                            resolve(dataset.values[0].Resultado);
                        }
                    },
                    error: function (error) {
                        reject(error);
                    },
                }
            );
        };
    });
}
function numeroPorExtenso(value, centavos) {
    //retorna o numero passado por extenso
    var resposta = "";

    if (value != "" && value != " " && value != null && value != undefined) {
        var unidade = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
        var dezena = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
        var centena = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

        list = value.split(".")[0].split("");
        list = list.reverse();

        // Remove zeros a esquerda
        while (list[list.length - 1] == 0) list.pop();

        for (var i = list.length - 1; i >= 0; i--) {
            if (value == 0) {
                return "zero";
            }
            if (value < 20) {
                return unidade[list.reverse().join("")];
            }
            if (value == "100") {
                return "cem";
            } else if (value == "1000") {
                return "mil";
            } else {
                if (i == 5 || i == 2 || i == 8) {
                    if (list[i] == 1 && list[i - 1] == 0 && list[i - 2] == 0) {
                        resposta += "cem";
                    } else resposta += centena[parseInt(list[i])] + " ";

                    if (list[i - 1] != 0) {
                        resposta += "e ";
                    }
                } else if (i == 4 || i == 1 || i == 7) {
                    if (list[i] < 2 && list[i] > 0) {
                        resposta += unidade[parseInt(list[i] + "" + list[i - 1])];
                    } else {
                        resposta += dezena[list[i]] + " ";
                        if (list[i - 1] != 0) {
                            resposta += "e ";
                        }
                    }
                } else {
                    if ((list[i + 1] >= 2 || list[i + 1] == 0 || list[i + 1] == null) && (i != 3 || list[i] != 1)) {
                        resposta += unidade[list[i]];
                    }
                    if (i == 3) {
                        resposta += " mil ";
                        if (list[2] != 0 && list[1] == 0 && list[0] == 0) {
                            resposta += "e ";
                        }
                    }
                    if (i == 6) {
                        resposta += " milhões ";
                    }
                }
            }
        }
        resposta = resposta.split("  ");
        resposta = resposta.join(" ");

        string = resposta.substring(0, 1);
        if (string == " ") {
            resposta = resposta.substring(1, resposta.length);
        }

        do {
            string = resposta.substring(resposta.length - 1);
            if (string == " " || string == "") {
                resposta = resposta.substring(0, resposta.length - 1);
            }
        } while (string == " ");
        if (centavos) {
            resposta += " reais";
            list = value.split(".")[1].split("");
            if (list[0] != 0 || list[1] != 0) {
                if (list[0] < 2 && list[0] > 0) {
                    resposta += " e " + unidade[list[0] + "" + list[1]] + " centavos";
                } else {
                    if (list[0] > 0) {
                        resposta += " e " + dezena[list[0]];
                    }
                    if (list[1] > 0) {
                        resposta += " e " + unidade[list[1]];
                    }
                    if (list[0] == 0 && list[1] == 1) {
                        resposta += " centavo";
                    } else {
                        resposta += " centavos";
                    }
                }
            }
        }
    }
    return resposta;
}
function getDateNow() {
    var date = new Date();
    var dia = date.getDate();
    if (dia < 10) {
        dia = "0" + dia;
    }
    var mes = date.getMonth() + 1;
    if (mes < 10) {
        mes = "0" + mes;
    }
    var ano = date.getFullYear();

    var dateTime = [ano, mes, dia].join("-");
    return dateTime;
}
async function visualizaDocumento() {
    var documentId = $("#contratoPdfId").val();
    var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId);
    window.open(url, '_blank');
}
function getDadosDaColigada() {
    var CODCOLIGADA = $("#CODCOLIGADA").val();
    var dadosColigada = jsonClausulasColigadas[CODCOLIGADA];

    return dadosColigada;
}
async function getBase64FromUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function getJWT() {
    const accessKey = 'wqNvgzQtZbz1Q42vjKExfxBur9XlXHA1vSfqQHZ0YTKpGTz7Bae4SNI9YxeMdWcdHrphZKJH5WTpCR5KD9shZ4QlZvoTruKnvXYpx508WSNnASt9LwIAvaVu'
    const environmentId = 'btBoGKVUYq79VoqVVAON'

    function base64url(source) {
        return CryptoJS.enc.Base64.stringify(source)
            .replace(/=+$/, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
    }

    function generateJWT() {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        }

        const payload = {
            aud: environmentId,
            iat: Math.floor(Date.now() / 1000)
        }

        const encodedHeader = base64url(
            CryptoJS.enc.Utf8.parse(JSON.stringify(header))
        )
        const encodedPayload = base64url(
            CryptoJS.enc.Utf8.parse(JSON.stringify(payload))
        )

        const signature = CryptoJS.HmacSHA256(
            `${encodedHeader}.${encodedPayload}`,
            accessKey
        )

        return `${encodedHeader}.${encodedPayload}.${base64url(signature)}`
    }

    return generateJWT();
}

