function bindingCamposIntegracaoRM() {
    $("#novoContratoColigada").on("change", function () {
        var CODCOLIGA = $(this).val();
        if (CODCOLIGA) {
            asyncPreencheOptionsFilial(CODCOLIGA);
            asyncPreencheOptionsTipoDeContrato(CODCOLIGA);
            asyncPreencheOptionsStatus(CODCOLIGA);
            asyncPreencheOptionsCCusto(CODCOLIGA);
            asyncPreencheOptionsCondicaoPagamento(CODCOLIGA);
            asyncPreencheOptionsRepresentante(CODCOLIGA);
        }
    });
    $("#novoContratoFilial").on("change", function () {
        var CODCOLIGADA = $("#novoContratoColigada").val();
        var CODFILIAL = $(this).val();
        asyncPreencheOptionsLocalEstoque(CODCOLIGADA, CODFILIAL);
    });
    $("#btnAdicionarItem").on("click", asyncAdicionarItemNovoContrato);
}


function preencheCamposAutomaticamente() {
    var CODCOLIGADA = $("#CODCOLIGADA").val();
    var CCUSTO = $("#CODCCUSTO").val();

    $("#novoContratoColigada").val(CODCOLIGADA).trigger("change");
    setTimeout(async () => {
        $("#novoContratoFilial").val(1).trigger("change");
        setTimeout(() => {
            var CCUSTO = $("#CODCCUSTO").val();
            $("#novoContratoCCUSTO").val(CCUSTO);
            setTimeout(() => {
                var CodLocEstoque = $("#novoContratoLocalDeEstoque").find(`option:contains(${$("#NOMECCUSTO").val()})`)[0].value;
                $("#novoContratoLocalDeEstoque").val(CodLocEstoque);
            }, 500);
        }, 500);

        var CODSTACNT_PENDENTEOBRA = "05";
        $("#novoContratoSTATUS").val(CODSTACNT_PENDENTEOBRA);

        var TIPO_CONTRATO = $("#tipoContrato").val();
        $("#novoContratoObjeto").val(TIPO_CONTRATO);
        if (TIPO_CONTRATO == "Locação de Imóvel" || TIPO_CONTRATO == "Locação de Equipamento" ||
            TIPO_CONTRATO == "Locação de Equipamento - Com Mão de Obra" || TIPO_CONTRATO == "Transporte de Materiais") {
            $("#novoContratoTipoContrato").val(regraTipoDeContrato());
        }
        var CCUSTO = $("#CODCCUSTO").val();
        $("#novoContratoCCUSTO").val(CCUSTO);


        var representante = regraRepresentantes(CODCOLIGADA, TIPO_CONTRATO);
        $("#novoContratoRepresentante option").each(function () {
            if ($(this).text() == representante) {
                $("#novoContratoRepresentante").val($(this).val());
            }
        });

        if (TIPO_CONTRATO == "Locação de Imóvel" ) {
            var periodo = $("#periodoLocacao").val();
            var [periodoInit, periodoEnd] = periodo.split(" até ");
            $("#novoContratoDataInicio").val(periodoInit);
            $("#novoContratoDataFim").val(periodoEnd);
        }
        else  if (TIPO_CONTRATO == "Locação de Equipamento" || TIPO_CONTRATO == "Locação de Equipamento - Com Mão de Obra") {
            var periodoInit = $("#dataInicioLocacao").val();
            var periodoEnd = $("#dataFimLocacao").val();
            $("#novoContratoDataInicio").val(periodoInit);
            $("#novoContratoDataFim").val(periodoEnd);
        }
        else  if (TIPO_CONTRATO == "Transporte de Materiais") {
            var periodoInit = $("#dataInicioTransporte").val();
            var periodoEnd = $("#dataFimTransporte").val();
            $("#novoContratoDataInicio").val(periodoInit);
            $("#novoContratoDataFim").val(periodoEnd);
        }
      

        var momentInit = moment(periodoInit.split("/").reverse().join("-"));
        var momentEnd = moment(periodoEnd.split("/").reverse().join("-"));


        var duration = moment.duration(momentEnd.diff(momentInit));
        var months = Math.ceil(duration.asMonths());
        $("#novoContratoQtdeFaturamento").val(months);

        var periodico = 1;
        var porMedicao = 2;
        const isLocacaoImovel = $("#tipoContrato").val() == "Locação de Imóvel";
        if (isLocacaoImovel) {
            $("#novoContratoTipoFaturamento").val(periodico).change();
        } else {
            $("#novoContratoTipoFaturamento").val(porMedicao).change();
        }

        var diaPagamento = $("#janelaPagamento").val();
        $("#novoContratoDiaFaturamento").val(diaPagamento);


        var hiddenCODCOLCFO = $("#hiddenCODCOLCFO").val();
        var hiddenCODCFO = $("#hiddenCODCFO").val();
        var hiddenCGCCFO = $("#hiddenCGCCFO").val();
        var hiddenFORNECEDOR = $("#hiddenFORNECEDOR").val();

        $("#novoContratoFornecedor").val(`${hiddenCGCCFO} - ${hiddenFORNECEDOR}`);
        $("#novoContratoCondicaoPagamento").val('145');

        
        var valorMensalLocacao = $("#valorMensalLocacao").val();
        var temRetencao = $("#temRetencao").val() == "Sim"
        if (temRetencao) {
            // Se tem retenção calcula o valor da retenção e reduz do valor total
            var percentualRetencao = parseInt($("#percentualRetencao").val().replace("%","").trim());
            var valorRetencao = moneyToFloat(valorMensalLocacao)*percentualRetencao/100;
            valorMensalLocacao = floatToMoney(moneyToFloat(valorMensalLocacao)*(100-percentualRetencao)/100);
        }

        var codigoProduto = null;
        if (TIPO_CONTRATO == "Locação de Equipamento") {
            codigoProduto = 1727;
        }
        else if (TIPO_CONTRATO == "Locação de Equipamento - Com Mão de Obra") {
            codigoProduto = 1727;
        }

    
        //valor do item no RM = Valor por Tonelada × KM Rodado
        var valorItemRM = valorMensalLocacao;
        if (TIPO_CONTRATO == "Transporte de Materiais") {
            if ($("#formatoCobrancaTransporte").val() == "Valor por Parâmetro") {
                var _valorTon = moneyToFloat($("#valorM3Transporte").val()) || 0;   
                var _kmRodado = parseFloat($("#kmTransporte").val()) || 0; 
                valorItemRM = floatToMoney(_valorTon * _kmRodado);
            } else {
                valorItemRM = $("#valorMensalTransporte").val();                    // Valor Fixo
            }
        }

        // Se houver pelo menos um item, não adiciona mais automaticamente
        // Evitando duplicar itens a cada chegada na atvd da Controladoria
        var temPeloMenosUmItem = $("[name^='novoContratoItemProduto___']").length > 0;
        if (!temPeloMenosUmItem) {
            // Insere item do Produto
            await insereItem(codigoProduto, valorItemRM, [{ CODDEPTO: '1.3.03', PERCENTUAL: "100%" }]);

            if (temRetencao) {
                // Se tem retenção gera o item de retenção
                await insereItem(4650, floatToMoney(valorRetencao), [{ CODDEPTO: "1.3.81", PERCENTUAL: "100%" }]);
            }

        // Caso contrário, TEM item(s) salvo, então carrega
        } else {
            redenrizaItensSalvos();
        }

        promiseBuscaCodigoDoContrato(CODCOLIGADA, CCUSTO).then(ds=>{
            var CODIGOCONTRATO = ds[0].CODIGOCONTRATO;
            CODIGOCONTRATO = parseInt(CODIGOCONTRATO.split("/")[0].split("-")[1]);
            CODIGOCONTRATO++;

            CODIGOCONTRATO = `${CCUSTO}-${CODIGOCONTRATO.toString().padStart(3,"0")}/26`;
            $("#novoContratoCodigo").val(CODIGOCONTRATO);
        });
    }, 1000);

    async function insereItem(IDProduto, valorItem, rateio){
        return new Promise((resolve,reject)=>{
            try {
                $("#btnAdicionarItem").click();
                setTimeout(async () => {
                    $(".novoContratoItemValor:last").val(valorItem);
                    $("[name^='novoContratoItemProduto___']:last")[0].selectize.setValue(IDProduto);

                    var table = $(".divNovoContratoTableRateiosItens:last");

                    for (const linha of rateio) {
                        await new Promise((res) => {
                            table.find(".btnAdicionarRateio").click(); // Add mais uma linha no rateio
                            setTimeout(() => {
                                var tr = table.find("tbody tr:last");

                                tr.find("select.selectDepartamentoNovoContratoItemRateio")[0].selectize.setValue(linha.CODDEPTO);
                                tr.find(".inputValorNovoContratoItemRateio").val(linha.PERCENTUAL).change();
                                res();
                            }, 1000);
                        });
                    }
                    resolve();
                }, 1000);
            } catch (error) {
                reject(error);
            }
        });
    }
    async function redenrizaItensSalvos() {
        // 1 - Lê os dados dos itens
        var itensSalvos = [];
        $("[name^='novoContratoItemProduto___']").each(function () {
            var panel = $(this).closest(".panel");

            itensSalvos.push({
                produto: $(this).val(),
                valor:   panel.find("[name^='novoContratoItemValor___']").val(),
                rateio:  JSON.parse(panel.find("[name^='novoContratoJsonRateiosItem___']").val() || "[]")
            });
        });

        // Nada salvo, deixa o preenchimento automático rodar
        if (itensSalvos.length === 0) {
            return; 
        }

        // 2 - Remove as linhas cruas
        $("[name^='novoContratoItemProduto___']").each(function () {
            fnWdkRemoveChild($(this).closest("tr")[0]);
        });

        // 3 - Recria cada item já inicializado, com o rateio
        for (const item of itensSalvos) {
            await insereItem(item.produto, item.valor, item.rateio);
        }

        // Itens renderizados. Se o Contrato RM já foi gerado, bloqueia os campos.
        bloqueiaCamposPagIntegacaoRM_seJaGeradoContratoRM();
    }
}

//lista central dos tipos de Transporte, aplicada às 5 coligadas em regraRepresentantes
const TIPOS_TRANSPORTE_MATERIAIS = [
    "Transporte de Material - S/M.O", // Nome usado pelo RM
    "Transporte de Materiais",
    "Transporte de Materiais - Alteração de Valor",
    "Transporte de Materiais - Alteração de Prazo",
    "Transporte de Materiais - Alteração de Prazo e Valor",
    "Transporte de Materiais - Inclusão de Equipamento",
    "Transporte de Materiais - Exclusão de Equipamento",
    "Transporte de Materiais (Rescisões)",
];
function regraRepresentantes(CODCOLIGADA, TIPO_CONTRATO) {
    if (CODCOLIGADA == 1) {
        var representantes = representantesCastilho();
    } else if (CODCOLIGADA == 2) {
        var representantes = representantesMineiracao();
    } else if (CODCOLIGADA == 5) {
        var representantes = representantesEstacaoLuz();
    } else if (CODCOLIGADA == 12) {
        var representantes = representantesDromos();
    } else if (CODCOLIGADA == 13) {
        var representantes = representantesEpya();
    }

    var found = representantes.find(e => e.tipos.includes(TIPO_CONTRATO));
    if (found) {
        return found.representante;
    }
    else {
        throw "Representante não encontrado.";
    }



    function representantesCastilho() {
        return [
            {
                representante: "Jerson Godoy Leski Junior",
                tipos: [
                    "Locação de Equipamentos - S/M.O",
                    "Locação de Equipamento - Com Mão de Obra",
                    ...TIPOS_TRANSPORTE_MATERIAIS,
                    "Locação de Equipamento",
                    "Locação de Equipamento - Alteração de Valor",
                    "Locação de Equipamento - Alteração de Prazo",
                    "Locação de Equipamento - Alteração de Prazo e Valor",
                    "Locação de Equipamento - Inclusão de Equipamento",
                    "Locação de Equipamento - Exclusão de Equipamento",
                    "Locação de Equipamento - Com Mão de Obra (Rescisões)",
                    "Locação de Equipamento (Rescisões)"
                ],
            },
            {
                representante: "Augusto Cesar de Almeida Pereira de Lyra",
                tipos: [
                    "Prestação de Serviços - Sub-Empreiteiros", 
                    "Prestação de Serviços", "Prestação de Serviços - Vigilância", 
                    "Prestação de Serviços - Sub/Retenção"],
            },
            {
                representante: "Emanuel Mascarenhas Padilha Junior",
                tipos: [
                    "Locação de Imóvel", 
                    "Locação de Imóvel - Alteração de Valor", 
                    "Locação de Imóvel - Alteração de Prazo", 
                    "Locação de Imóvel - Alteração de Prazo e Valor",
                    "Locação de Imóvel (Rescisões)"
                ],
            },
        ];
    }
    function representantesMineiracao() {
        return [
            {
                representante: "Jerson Godoy Leski Junior",
                tipos: [
                    "Locação de Equipamentos - S/M.O",
                    "Locação de Equipamento - Com Mão de Obra",
                    ...TIPOS_TRANSPORTE_MATERIAIS,
                    "Locação de Equipamento - Alteração de Valor",
                    "Locação de Equipamento - Alteração de Prazo",
                    "Locação de Equipamento - Alteração de Prazo e Valor",
                    "Locação de Equipamento - Com Mão de Obra (Rescisões)",
                    "Locação de Equipamento (Rescisões)"
                ],
            },
            {
                representante: "Marcio Rinaldo Guinossi",
                tipos: [
                    "Prestação de Serviços - Sub-Empreiteiros",
                    "Prestação de Serviços",
                    "Prestação de Serviços - Vigilância",
                    "Prestação de Serviços - Sub/Retenção",
                    "Locação de Imóvel", 
                    "Locação de Imóvel - Alteração de Valor", 
                    "Locação de Imóvel - Alteração de Prazo", 
                    "Locação de Imóvel - Alteração de Prazo e Valor",
                    "Locação de Imóvel (Rescisões)"
                ],
            },
        ];
    }
    function representantesEstacaoLuz() {
        return [
            {
                representante: "Jerson Godoy Leski Junior",
                tipos: [
                    "Locação de Equipamentos - S/M.O",
                    "Locação de Equipamento - Com Mão de Obra",
                    ...TIPOS_TRANSPORTE_MATERIAIS,
                    "Locação de Equipamento - Alteração de Valor",
                    "Locação de Equipamento - Alteração de Prazo",
                    "Locação de Equipamento - Alteração de Prazo e Valor",
                    "Locação de Equipamento - Inclusão de Equipamento",
                    "Locação de Equipamento - Exclusão de Equipamento",
                    "Locação de Equipamento - Com Mão de Obra (Rescisões)",
                    "Locação de Equipamento (Rescisões)"
                ],
            },
            {
                representante: "Servulo Sanches Correa",
                tipos: [
                    "Prestação de Serviços - Sub-Empreiteiros",
                    "Prestação de Serviços",
                    "Prestação de Serviços - Vigilância",
                    "Prestação de Serviços - Sub/Retenção",
                    "Locação de Imóvel", 
                    "Locação de Imóvel - Alteração de Valor", 
                    "Locação de Imóvel - Alteração de Prazo", 
                    "Locação de Imóvel - Alteração de Prazo e Valor",
                    "Locação de Imóvel (Rescisões)"
                ],
            },
        ];
    }
    function representantesDromos() {
        return [
            {
                representante: "Mario Rogers de Castilho",
                tipos: [
                    "Locação de Equipamento - Com Mão de Obra",
                    "Locação de Equipamento",
                    "Locação de Equipamento - Alteração de Valor",
                    "Locação de Equipamento - Alteração de Prazo",
                    "Locação de Equipamento - Alteração de Prazo e Valor",
                    "Locação de Equipamento - Inclusão de Equipamento",
                    "Locação de Equipamento - Exclusão de Equipamento",
                    "Locação de Equipamento - Com Mão de Obra (Rescisões)",
                    "Locação de Equipamento (Rescisões)",

                    ...TIPOS_TRANSPORTE_MATERIAIS,
                    "Prestação de Serviços - Sub-Empreiteiros",
                    "Prestação de Serviços",
                    "Prestação de Serviços - Vigilância",
                    "Prestação de Serviços - Sub/Retenção",
                    
                   "Locação de Imóvel", 
                    "Locação de Imóvel - Alteração de Valor", 
                    "Locação de Imóvel - Alteração de Prazo", 
                    "Locação de Imóvel - Alteração de Prazo e Valor",
                    "Locação de Imóvel (Rescisões)"
                ],
            },
        ];
    }
    function representantesEpya() {
        return [
            {
                representante: "Mario Rogers de Castilho",
                tipos: [
                    "Locação de Equipamento - Com Mão de Obra", 
                    "Locação de Equipamento",
                    "Locação de Equipamento - Alteração de Valor",
                    "Locação de Equipamento - Alteração de Prazo",
                    "Locação de Equipamento - Alteração de Prazo e Valor",
                    "Locação de Equipamento - Inclusão de Equipamento",
                    "Locação de Equipamento - Exclusão de Equipamento",
                    "Locação de Equipamento - Com Mão de Obra (Rescisões)",
                    "Locação de Equipamento (Rescisões)",

                    ...TIPOS_TRANSPORTE_MATERIAIS,
                    "Prestação de Serviços - Sub-Empreiteiros",
                    "Prestação de Serviços",
                    "Prestação de Serviços - Vigilância",
                    "Prestação de Serviços - Sub/Retenção",

                    "Locação de Imóvel", 
                    "Locação de Imóvel - Alteração de Valor", 
                    "Locação de Imóvel - Alteração de Prazo", 
                    "Locação de Imóvel - Alteração de Prazo e Valor",
                    "Locação de Imóvel (Rescisões)"
                ],
            },
        ];
    }
}
function regraTipoDeContrato() {
    var tipoContrato = $("#tipoContrato").val();


    if (["Locação de Container", "Locação de Equipamento", "Locação de Sanitários"].includes(tipoContrato)) {
        return "06";
    }
    if (tipoContrato == "Locação de Imóvel") {
        return "04"
    }
    if (tipoContrato == "Locação de Equipamento - Com Mão de Obra") {
        return "09" 
    }
    if (tipoContrato == "Transporte de Materiais") {
        //CODTCN fixo do Transporte no RM
        return "11" 
    }


}


// Preenche options
async function asyncPreencheOptionsColigada() {
    try {
        var coligadas = await promiseConsultaColigadas();
        var html = "<option></option>";
        html += coligadas.map((e) => `<option value="${e.CODCOLIGADA}">${e.CODCOLIGADA} - ${e.NOMEFANTASIA}</option>`).join("");
        $("#novoContratoColigada").html(html);
    } catch (error) {
        throw error;
    }

    function promiseConsultaColigadas() {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("Coligadas", null, [DatasetFactory.createConstraint("ATIVO", "T", "T", ConstraintType.MUST)], null, {
                success: (ds) => {
                    resolve(ds.values);
                },
                error: (e) => {
                    reject(e);
                },
            });
        });
    }
}
async function asyncPreencheOptionsFilial(CODCOLIGADA) {
    try {
        var filiais = await promiseConsultaFiliais(CODCOLIGADA);
        var html = "<option></option>";
        html += filiais.map((e) => `<option value="${e.CODFILIAL}">${e.CODFILIAL} - ${e.NOMEFANTASIA}</option>`).join("");
        $("#novoContratoFilial").html(html);
    } catch (error) {
        throw error;
    }

    function promiseConsultaFiliais(CODCOLIGADA) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("GFILIAL", null, [DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST)], ["CODFILIAL"], {
                success: (ds) => {

                    resolve(ds.values.sort((a, b) => a.CODFILIAL - b.CODFILIAL));
                },
                error: (e) => {
                    reject(e);
                },
            });
        });
    }
}
async function asyncPreencheOptionsTipoDeContrato(CODCOLIGADA) {
    try {
        var tiposDeContrato = await promiseConsultaTiposDeContrato(CODCOLIGADA);
        var html = "<option></option>" + tiposDeContrato.map((e) => `<option value="${e.CODTCN}">${e.DESCRICAO}</option>`).join("");
        $("#novoContratoTipoContrato").html(html);
    } catch (error) {
        throw error;
    }

    function promiseConsultaTiposDeContrato(CODCOLIGADA) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("TTCN", null, [DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST)], ["DESCRICAO"], {
                success: (ds) => {
                    resolve(ds.values.sort((a, b) => a.DESCRICAO < b.DESCRICAO ? -1 : 1));
                },
                error: (e) => {
                    reject(e);
                },
            });
        });
    }
}
async function asyncPreencheOptionsLocalEstoque(CODCOLIGADA, CODFILIAL) {
    try {
        var tiposDeContrato = await promiseConsultaLocalEstoque(CODCOLIGADA, CODFILIAL);
        var html = "<option></option>" + tiposDeContrato.map((e) => `<option value="${e.codloc}">${e.nome}</option>`).join("");
        $("#novoContratoLocalDeEstoque").html(html);
    } catch (error) {
        throw error;
    }

    function promiseConsultaLocalEstoque(CODCOLIGADA, CODFILIAL) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("LocalRM", null, [
                DatasetFactory.createConstraint("clg", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                DatasetFactory.createConstraint("cdFl", CODFILIAL, CODFILIAL, ConstraintType.MUST),
            ], null, {
                success: (ds) => {
                    resolve(ds.values);
                },
                error: (e) => {
                    reject(e);
                },
            });
        });
    }
}
async function asyncPreencheOptionsStatus(CODCOLIGADA) {
    try {
        var status = await promiseConsultaSTATUS(CODCOLIGADA);
        var html = "<option></option>" + status.map((e) => `<option value="${e.CODSTACNT}">${e.DESCRICAO}</option>`).join("");
        $("#novoContratoSTATUS").html(html);
    } catch (error) {
        throw error;
    }

    function promiseConsultaSTATUS(CODCOLIGADA) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("TSTACNT", null, [
                DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
            ], ["DESCRICAO"], {
                success: (ds) => {
                    resolve(ds.values);
                },
                error: (e) => {
                    reject(e);
                },
            });
        });
    }
}
async function asyncPreencheOptionsCCusto(CODCOLIGADA) {
    try {
        var tiposDeContrato = await promiseConsultaCCUSTO(CODCOLIGADA);
        var html = "<option></option>" + tiposDeContrato.map((e) => `<option value="${e.CODCCUSTO}">${e.CODCCUSTO} - ${e.NOME}</option>`).join("");
        $("#novoContratoCCUSTO").html(html);
    } catch (error) {
        throw error;
    }

    function promiseConsultaCCUSTO(CODCOLIGADA) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("GCCUSTO", null, [
                DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                DatasetFactory.createConstraint("ATIVO", "T", "T", ConstraintType.MUST),
                DatasetFactory.createConstraint("CODCCUSTO", "1", "1", ConstraintType.MUST_NOT),
            ], ["CODCCUSTO"], {
                success: (ds) => {
                    var values = ds.values.sort((a, b) => a.CODCCUSTO < b.CODCCUSTO ? -1 : 1);
                    resolve(values);
                },
                error: (e) => {
                    reject(e);
                },
            });
        });
    }
}
async function asyncPreencheOptionsCondicaoPagamento(CODCOLIGADA) {
    try {
        var condicoesPagamento = await promiseConsultaCondicaoPagamento(CODCOLIGADA);
        var html = "<option></option>" + condicoesPagamento.map((e) => `<option value="${e.CODCPG}">${e.NOME}</option>`).join("");
        $("#novoContratoCondicaoPagamento").html(html);
    } catch (error) {
        throw error;
    }

    function promiseConsultaCondicaoPagamento(CODCOLIGADA) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("TCPG", null, [
                DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                DatasetFactory.createConstraint("CODCPG", "001", "001", ConstraintType.SHOULD),
                DatasetFactory.createConstraint("CODCPG", "130", "130", ConstraintType.SHOULD),
                DatasetFactory.createConstraint("CODCPG", "145", "145", ConstraintType.SHOULD),
                DatasetFactory.createConstraint("CODCPG", "160", "160", ConstraintType.SHOULD),
            ], ["NOME"], {
                success: (ds) => {
                    resolve(ds.values);
                },
                error: (e) => {
                    reject(e);
                },
            });
        });
    }
}
async function asyncPreencheOptionsRepresentante(CODCOLIGADA) {
    try {
        var representantes = await promiseConsultaRepresentantes(CODCOLIGADA);
        var html = "<option></option>" + representantes.map((e) => `<option value="${e.CODRPR}">${e.NOME}</option>`).join("");
        $("#novoContratoRepresentante").html(html);
    } catch (error) {
        throw error;
    }

    function promiseConsultaRepresentantes(CODCOLIGADA) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("TRPR", null, [
                DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                DatasetFactory.createConstraint("INATIVO", "0", "0", ConstraintType.MUST)
            ], ["NOME"], {
                success: (ds) => {
                    resolve(ds.values);
                },
                error: (e) => {
                    reject(e);
                },
            });
        });
    }
}


//Itens
async function asyncAdicionarItemNovoContrato() {
    var id = wdkAddChild("tableNovoContratoItens");

    $(".titleCounterItem:last").html("Item " + id);
    $(".btnRemoverItemNovoContrato:last").off("click").on("click", function () {
        fnWdkRemoveChild($(this).closest("tr")[0]);
    });

    $("#novoContratoItemProduto" + "___" + id).html(await promiseRetornaHtmlOptionsProdutosDeItemDeContrato());
    $("#novoContratoItemProduto" + "___" + id).selectize({});
    $("#novoContratoItemValor" + "___" + id).maskMoney({
        prefix: "R$ ",
        thousands: ".",
        decimal: ",",
        allowZero: true,
        affixesStay: true,
    });

    $(".divNovoContratoTableRateiosItens:last").html(geraTabelaRateio());
    $(".btnAdicionarRateio:last").on("click", asyncInsereNovaLinhaReteio);

    function geraTabelaRateio() {
        var html = `<table class="table table-striped table-bordered">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Departamento</th>
                    <th>Valor</th>
                    <th></th>
                </tr>
            </thead>
            <tbody></tbody>
            <tfoot>
                <tr>
                    <td colspan=4 style="text-align:center;">
                        <button class="btn btn-success btnAdicionarRateio">
                            <i class="flaticon flaticon-add-plus icon-md" aria-hidden="true"></i>
                        </button>
                    </td>
                </tr>
            </tfoot>
        </table>`;
        return html;
    }
}
async function asyncInsereNovaLinhaReteio() {
    $(this)
        .closest("table")
        .find("tbody")
        .append(await asyncGeraLinhaTabela());

    $(this).closest("table").find("tbody").find(".selectDepartamentoNovoContratoItemRateio:last").on("change", salvaJSONRateio);
    $(this).closest("table").find("tbody").find(".inputValorNovoContratoItemRateio:last").on("change", salvaJSONRateio);
    $(this).closest("table").find("tbody").find(".selectDepartamentoNovoContratoItemRateio:last").selectize({
        onChange: () => $(this)[0].dispatchEvent(new Event("change"))
    });

    console.log($(this).closest("table").find("tbody").find(".selectDepartamentoNovoContratoItemRateio:last"));
    console.log($(this).closest("table").find("tbody").find(".inputValorNovoContratoItemRateio:last"));

    $(this).closest("table").find("tbody").find(".inputValorNovoContratoItemRateio:last").maskMoney({
        suffix: "%",
        allowZero: false,
        affixesStay: true,
        precision: 0,
    });
    $(this)
        .closest("table")
        .find("tbody")
        .find(".btnRemoverLinhaRateioNovoItem")
        .on("click", function () {
            var tbody = $(this).closest("tbody"); // Pega antes de remover a linha
            $(this).closest("tr").remove();

            // .call(tbody) define o "this" da função como o tbody, para remontar o JSON só com as linhas restantes
            salvaJSONRateio.call(tbody);

            /*
                salvaJSONRateio() sozinho -> this seria o objeto errado, e a função não acharia as linhas certas.
                salvaJSONRateio.call(tbody) -> força o this a ser exatamente o <tbody> daquela tabela de rateio.

                Guardar var tbody antes do .remove(): depois que a linha (tr) é removida do DOM, o $(this) do botão fica "solto" e closest("tbody") retornaria vazio. 
                Por isso pega a referência antes.
            */
        });

    async function asyncGeraLinhaTabela() {
        var html = `<tr>
            <td>1</td>
            <td>
                <select class="selectDepartamentoNovoContratoItemRateio">${await promiseRetornaHtmlOptionsDepartamentos()}</select>
            </td>
            <td>
                <input class="form-control inputValorNovoContratoItemRateio" />
            </td>
            <td style="text-align:center;">
                <button class="btn btn-danger btnRemoverLinhaRateioNovoItem">
                    <i class="flaticon flaticon-trash icon-md" aria-hidden="true"></i>
                </button>
            </td>
        </tr>`;
        return html;
    }
}
function salvaJSONRateio() {
    var json = [];
    $(this).closest("tbody").find("tr").each(function () {
        var depto = $(this).find(".selectDepartamentoNovoContratoItemRateio").val();
        var valor = $(this).find(".inputValorNovoContratoItemRateio").val().replace("%", "");
        json.push({
            CODDEPTO: depto + "",
            PERCENTUAL: valor + ""
        });
    });
    console.log(json)
    $(this).closest(".panel").find(".novoContratoJsonRateiosItem").val(JSON.stringify(json));
}



// Consultas
function promiseRetornaHtmlOptionsDepartamentos() {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset(
            "DepartamentosRM",
            null,
            [
                DatasetFactory.createConstraint("codcoligada", $("#CODCOLIGADA").val(), $("#CODCOLIGADA").val(), ConstraintType.MUST),
                DatasetFactory.createConstraint("codfilial", $("#novoContratoFilial").val(), $("#novoContratoFilial").val(), ConstraintType.MUST),
            ],
            null,
            {
                success: (ds) => {
                    var departamentos = ds.values;
                    departamentos = departamentos.sort((a, b) => {
                        a.coddepartamento < b.coddepartamento ? -1 : 1;
                    });

                    var retorno = "<option></option>";
                    retorno += departamentos.map((e) => `<option value="${e.coddepartamento}">${e.coddepartamento} - ${e.nome}</option>`).join("");
                    resolve(retorno);
                },
                error: (e) => {
                    reject(e);
                },
            }
        );
    });
}
function promiseRetornaHtmlOptionsProdutosDeItemDeContrato() {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset(
            "DatasetProcessoContratos",
            null,
            [
                DatasetFactory.createConstraint("OPERACAO", "BuscaProduto", "BuscaProduto", ConstraintType.MUST),
                DatasetFactory.createConstraint("CODCOLIGADA", $("#CODCOLIGADA").val(), $("#CODCOLIGADA").val(), ConstraintType.MUST),
            ],
            null,
            {
                success: (ds) => {
                    var retorno = "<option></option>";
                    retorno += ds.values.map((e) => `<option value="${e.IDPRD}">${e.VISUAL}</option>`).join("");
                    resolve(retorno);
                },
                error: (e) => {
                    reject(e);
                },
            }
        );
    });
}
function promiseBuscaCodigoDoContrato(CODCOLIGADA, CCUSTO){
    return new Promise((resolve,reject)=>{
        DatasetFactory.getDataset("DatasetProcessoContratos",null,[
            DatasetFactory.createConstraint("OPERACAO", "BuscaCodContratoPorCCusto", "BuscaCodContratoPorCCusto", ConstraintType.MUST),
            DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
            DatasetFactory.createConstraint("CCUSTO", CCUSTO, CCUSTO, ConstraintType.MUST),
        ],null,{
            success:ds=>{
                resolve(ds.values);
            },
            error:e=>{
                reject(e);
            }
        });
    });
}