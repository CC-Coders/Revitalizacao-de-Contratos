function bindingCamposIntegracaoRM(){
    $("#checkboxLancarNovoContrato").on("change", async function(){
        if ($(this).is(":checked")) {
            $("#dadosRMNovoContrato").show();
            await asyncPreencheOptionsColigada();
            preencheCamposAutomaticamente();
        }
        else{
            $("#dadosRMNovoContrato").hide();
        }
    });
    $("#novoContratoColigada").on("change", function(){
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
    $("#novoContratoFilial").on("change", function(){
        var CODCOLIGADA = $("#novoContratoColigada").val();
        var CODFILIAL = $(this).val();
        asyncPreencheOptionsLocalEstoque(CODCOLIGADA, CODFILIAL);
    });
}


function preencheCamposAutomaticamente() {
    var CODCOLIGADA = $("#CODCOLIGADA").val();
    $("#novoContratoColigada").val(CODCOLIGADA).trigger("change");
    setTimeout(() => {
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
        if (TIPO_CONTRATO == "Locação de Imóvel") {
            $("#novoContratoTipoContrato").val(regraTipoDeContrato());
        }

        var CCUSTO = $("#CODCCUSTO").val();
        $("#novoContratoCCUSTO").val(CCUSTO);

        
        var representante = regraRepresentantes(CODCOLIGADA, TIPO_CONTRATO);
        $("#novoContratoRepresentante option").each(function(){
            if ($(this).text() == representante) {
                $("#novoContratoRepresentante").val($(this).val());
            }
        });

    }, 1000);
}
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

    var found = representantes.find(e=>e.tipos.includes(TIPO_CONTRATO));
    if (found) {
        return found.representante;
    }
    else{
        throw "Representante não encontrado.";
    }


    
    function representantesCastilho(){
        return [
            {
                representante: "Jerson Godoy Leski Junior",
                tipos: ["Locação de Equipamentos - S/M.O", "Locação de Equipamentos - C/M.O", "Transporte de Material - S/M.O"],
            },
            {
                representante: "Augusto Cesar de Almeida Pereira de Lyra",
                tipos: ["Prestação de Serviços - Sub-Empreiteiros", "Prestação de Serviços", "Prestação de Serviços - Vigilância", "Prestação de Serviços - Sub/Retenção"],
            },
            {
                representante: "Emanuel Mascarenhas Padilha Junior",
                tipos: ["Locação de Imóvel"],
            },
        ];
    }
    function representantesMineiracao(){
        return [
            {
                representante: "Jerson Godoy Leski Junior",
                tipos: ["Locação de Equipamentos - S/M.O", "Locação de Equipamentos - C/M.O", "Transporte de Material - S/M.O"],
            },
            {
                representante: "Marcio Rinaldo Guinossi",
                tipos: [
                    "Prestação de Serviços - Sub-Empreiteiros",
                    "Prestação de Serviços",
                    "Prestação de Serviços - Vigilância",
                    "Prestação de Serviços - Sub/Retenção",
                    "Locação de Imóvel",
                ],
            },
        ];
    }
    function representantesEstacaoLuz(){
        return [
            {
                representante: "Jerson Godoy Leski Junior",
                tipos: ["Locação de Equipamentos - S/M.O", "Locação de Equipamentos - C/M.O", "Transporte de Material - S/M.O"],
            },
            {
                representante: "Servulo Sanches Correa",
                tipos: [
                    "Prestação de Serviços - Sub-Empreiteiros",
                    "Prestação de Serviços",
                    "Prestação de Serviços - Vigilância",
                    "Prestação de Serviços - Sub/Retenção",
                    "Locação de Imóvel",
                ],
            },
        ];
    }
    function representantesDromos(){
        return [
            {
                representante: "Mario Rogers de Castilho",
                tipos: [
                    "Locação de Equipamentos - S/M.O",
                    "Locação de Equipamentos - C/M.O",
                    "Transporte de Material - S/M.O",
                    "Prestação de Serviços - Sub-Empreiteiros",
                    "Prestação de Serviços",
                    "Prestação de Serviços - Vigilância",
                    "Prestação de Serviços - Sub/Retenção",
                    "Locação de Imóvel",
                ],
            },
        ];
    }
    function representantesEpya(){
        return [
            {
                representante: "Mario Rogers de Castilho",
                tipos: [
                    "Locação de Equipamentos - S/M.O",
                    "Locação de Equipamentos - C/M.O",
                    "Transporte de Material - S/M.O",
                    "Prestação de Serviços - Sub-Empreiteiros",
                    "Prestação de Serviços",
                    "Prestação de Serviços - Vigilância",
                    "Prestação de Serviços - Sub/Retenção",
                    "Locação de Imóvel",
                ],
            },
        ];
    }
}
function regraTipoDeContrato(){
    var tipoContrato = $("#tipoContrato").val();


    if (["Locação de Container", "Locação de Equipamento", "Locação de Sanitários"].includes(tipoContrato)) {
        return "06";
    }
    if (tipoContrato == "Locação de Imóvel") {
        return "04"
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

                    resolve(ds.values.sort((a,b)=>a.CODFILIAL-b.CODFILIAL));
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
                    resolve(ds.values.sort((a,b)=>a.DESCRICAO<b.DESCRICAO ? -1:1));
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
            DatasetFactory.getDataset("LocalRM",null,[
                    DatasetFactory.createConstraint("clg", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                    DatasetFactory.createConstraint("cdFl", CODFILIAL, CODFILIAL, ConstraintType.MUST),
                ],null,{
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
            DatasetFactory.getDataset("TSTACNT",null,[
                    DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                ],["DESCRICAO"],{
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
            DatasetFactory.getDataset("GCCUSTO",null,[
                    DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                    DatasetFactory.createConstraint("ATIVO", "T", "T", ConstraintType.MUST),
                    DatasetFactory.createConstraint("CODCCUSTO", "1", "1", ConstraintType.MUST_NOT),
                ],["CODCCUSTO"],{
                    success: (ds) => {
                        var values = ds.values.sort((a,b)=>a.CODCCUSTO < b.CODCCUSTO ? -1: 1);
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
            DatasetFactory.getDataset("TCPG",null,[
                    DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                    DatasetFactory.createConstraint("CODCPG", "001", "001", ConstraintType.SHOULD),
                    DatasetFactory.createConstraint("CODCPG", "130", "130", ConstraintType.SHOULD),
                    DatasetFactory.createConstraint("CODCPG", "145", "145", ConstraintType.SHOULD),
                    DatasetFactory.createConstraint("CODCPG", "160", "160", ConstraintType.SHOULD),
                ],["NOME"],{
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
            DatasetFactory.getDataset("TRPR",null,[
                    DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                    DatasetFactory.createConstraint("INATIVO", "0", "0", ConstraintType.MUST)
                ],["NOME"],{
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
    $(".btnRemoverItemNovoContrato:last").off("click").on("click", function(){
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
    $(this).closest("table").find("tbody").find(".selectDepartamentoNovoContratoItemRateio:last").selectize({});
    $(this).closest("table").find("tbody").find(".inputValorNovoContratoItemRateio:last").maskMoney({
        prefix: "R$ ",
        thousands: ".",
        decimal: ",",
        allowZero: true,
        affixesStay: true,
    });

    $(this).closest("table").find("tbody").find(".btnRemoverLinhaRateioNovoItem").on("click", function(){
        $(this).closest("tr").remove();
    })
}
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
                DatasetFactory.createConstraint("CODCOLIGADA", 1, 1, ConstraintType.MUST),
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
