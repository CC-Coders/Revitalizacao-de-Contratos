function initDataTableContratoPrincipal(){
    dataTableContratoPrincipal = new DataTable("#tableContratoPrincipal", {
        pageLength: 10,
        responsive: true,
        fixedHeader: true,
        columnDefs: [{
            className: 'dt-left', // Applies to all cells in the specified target(s)
            targets: '_all' // Applies to all columns
        }],
        columns: [
            {
                data: null,
                className: "alignCenter",
                orderable: false,
                render: function (data, type, row) {
                  return `<input type="checkbox" class="checkboxContratoPrincipal"/>`
                },
            },
            {
                data: "CODIGOCONTRATO",    
                className: "dt-left nowrap",
            },
            {
                data: "FORNECEDOR",    
                render:function(data,type,row){
                    return `${row.CGCCFO}<br>${data}`
                },
                className: "dt-left",
            },
            {
                data: "DESCRICAOCONTRATO",
                className: "dt-left",
            },
            {
                data: "TIPOCONTRATO",
                className: "dt-left",
                class: "nowrap",
                type: "string",
            },
            {
                data: "STATUS",
                className: "dt-left",
                class: "nowrap",
                type: "string",
            },
            {
                data: "DATAINICIO",
                className: "dt-left",
                render: function(data,type){
                    if (type == "sort") {
                        return data;
                    }else{
                        return data.split(" ")[0].split("-").reverse().join("/");
                    }
                }
            },
            {
                data: "DATAFIM",
                className: "dt-left",
                render: function(data,type){
                    if (type == "sort") {
                        return data;
                    }else{
                        return data.split(" ")[0].split("-").reverse().join("/");
                    }
                }
            },
        ],
        language: datatablesLanguage,
        layout: {
            bottomStart: null,
            bottom: "paging",
            bottomEnd: null,
            topStart: {
                buttons: [
                    {
                        text: "Red",
                        className: "btn btn-info",
                        extend: "excel",
                        text: "Excel",
                        exportOptions: {
                            modifier: {
                                page: "all",
                            },
                        },
                    },
                ],
            },
        },
    });

    dataTableContratoPrincipal.on("draw", function () {
        
        if ($("#origemContrato").val() == "Aditivos" || $("#origemContrato").val() == "Rescisões") {
            
            // Remove cliques antigos e registra de novo
            $(".checkboxContratoPrincipal").off("click").on("click", function () {
                // Chama a função passando o checkbox clicado
                onClickCheckContratoPrincipal(this);
            });
        }
    });

}

async function atualizaDatatableContratoPrincipal(){
    if (isForModeView()) return;

    try {
        var tipoContrato = $("#tipoContrato").val();
        var CODCOLIGADA = $("#CODCOLIGADA").val();
        var CODCCUSTO = $("#CODCCUSTO").val();
        var CNPJ = $("#hiddenCGCCFO").val();
        
        // Não se utiiliza a tabela de contratos quando vai criar um contrato.
        if ($("#origemContrato").val() == "Novos") {
            return;
        }

        if (CODCOLIGADA && CODCCUSTO && CNPJ) {
            var contratos = await buscaContratos(CODCOLIGADA, CODCCUSTO, CNPJ, tipoContrato);
            
            dataTableContratoPrincipal.clear().draw();

            if (!contratos || contratos.length === 0 || !contratos[0].CODIGOCONTRATO) {
                FLUIGC.toast({
                    title: "Contrato não encontrado: ",
                    message: "Não existe contrato ativo para o fornecedor / tipo de contrato selecionado.",
                    type: "danger"
                });

                return;
            }

            dataTableContratoPrincipal.rows.add(contratos); // Add new data
            dataTableContratoPrincipal.columns.adjust().draw(); // Redraw the DataTable
            
        }

    } catch (error) {
        throw error;
    }
}
async function onClickCheckContratoPrincipal(that) {
    var tipoContrato = $("#tipoContrato").val();

    // Checkbox que foi clicado/marcado
    var checked = $(that);

    // Pega a linha (tr) onde o checkbox está
    var tr = checked.closest("tr");

    // Recupera a linha do DataTable
    var row = dataTableContratoPrincipal.row(tr);

    // Pega o objeto completo do dataset
    var data = row.data();

    if (data.ENDERECO_IMOVEL.trim() == "-") {
        data.ENDERECO_IMOVEL = "";
    }
    
    if (data.DATA_ASSINATURA.trim() == "-") {
        data.DATA_ASSINATURA = "";
    }
    console.log(data);

    // Se o checkbox foi marcado
    if (checked.is(":checked")) {
        salva_excluiDadosContratoSelecionadoNoHidden(data);
        // Desmarca todos os outros checkbox
        $(".checkboxContratoPrincipal").not(checked).prop("checked", false);

        // Mantem marcado somente o que foi clicado
        checked.prop("checked", true);

        // Atualiza input's
        $("#dataAssinatura").val(data.DATA_ASSINATURA ? moment(data.DATA_ASSINATURA).format("DD/MM/YYYY") : "");
        $("#enderecoImovel").val(data.ENDERECO_IMOVEL || "");
        $("#valorMensalAluguel").val(floatToMoney(data.VALOR));
        $("#IDCNT").val(data.IDCNT);
        $("#codigoContratoPrincipal").val(data.CODIGOCONTRATO);
        $("#ID_TCNT_AUXILIAR").val(data.ID_TCNT_AUXILIAR).trigger("change");
        $("#NSEQITEMCNT").val(data.NSEQITEMCNT); // Nº de sequencia do item do contrato
        $("#temRetencao").val(data.IS_RETENCAO == "true" ? "Sim" : "Não");
        $("#percentualRetencao").val(data.PERCENT_RETENCAO);
        if (data.DESCRICAO_IMOVEL.trim() == "-") {
            $("#descricaoImovel").val("");

        } else {
            $("#descricaoImovel").val(data.DESCRICAO_IMOVEL);
        }

        // MELHORIA TRANSPORTE: aditivos de Transporte de Materiais mostram a vigência atual do contrato
        if (tipoContrato.includes("Transporte de Materiais")) {
            $("#dataInicioContratoTransporte").val(formataDataDoRM(data.DATAINICIO));
            $("#dataFimContratoTransporte").val(formataDataDoRM(data.DATAFIM));
            $("#dataAssinaturaTransporte").val(formataDataDoRM(data.DATA_ASSINATURA));
            // MELHORIA TRANSPORTE: pré-preenche o Valor Mensal (novo campo do Formato de Cobrança) com o valor do RM
            $("#valorMensalAditivoTransporte").val(floatToMoney(parseFloat(data.VALOR) || 0));

            atualizaMesesAditivoTransporte();
        }

    
        if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {

           
            var valorMensalBaseContrato = await asyncConsultaValorMensalPorContratoPrincipal(data.ID_TCNT_AUXILIAR);

            $("#valorMensalLocacao").data("valor-base-contrato", valorMensalBaseContrato);
            $("#valorMensalLocacao").val(floatToMoney(valorMensalBaseContrato));
        }
    } else {
        $("#tableContratoPrincipalSelecionado tbody").empty();
        $("#tableContratoPrincipalSelecionado").hide();

        // Limpa a base salva quando desmarcar o contrato principal
        $("#valorMensalLocacao").data("valor-base-contrato", 0);
        $("#valorMensalLocacao").val(floatToMoney(0));

        if (tipoContrato.includes("Transporte de Materiais")) {
            $("#dataInicioContratoTransporte, #dataFimContratoTransporte, #dataAssinaturaTransporte").val("");
            // MELHORIA TRANSPORTE: limpa os campos do Formato de Cobrança do aditivo ao desmarcar o contrato
            $("#valorMensalAditivoTransporte, #valorTAditivoTransporte, #kmAditivoTransporte, #mesesAditivoTransporte").val("");
            $("#formatoCobrancaAditivo").val("").trigger("change.transporte");
        }
    }
}

//trata data vazia do RM
function formataDataDoRM(valor) {
    if (!valor || valor.trim() == "-" || valor.trim() == "") {
        return "";
    }

    var data = moment(valor);
    if (!data.isValid() || data.year() <= 1900) {
        return "";
    }

    return data.format("DD/MM/YYYY");
}
function salva_excluiDadosContratoSelecionadoNoHidden(data) {

    $("#contratoSelecCodigo").val(data.CODIGOCONTRATO || "");
    $("#contratoSelecdoFornecedor").val((data.CGCCFO || "") + " - " + (data.FORNECEDOR || ""));
    $("#contratoSelecDescricao").val(data.DESCRICAOCONTRATO || "");
    $("#contratoSelecoTipo").val(data.TIPOCONTRATO || "");
    $("#contratoSelecStatus").val(data.STATUS || "");
    $("#contratoSelecDataInicio").val(data.DATAINICIO ? moment(data.DATAINICIO).format("DD/MM/YYYY") : "");
    $("#contratoSelecDataFim").val(data.DATAFIM ? moment(data.DATAFIM).format("DD/MM/YYYY") : "");
}
function carregaTabelaContratoPrincipalSelecionado() {

    var linha = `
        <tr>
            <td>${$("#contratoSelecCodigo").val() || ""}</td>
            <td>${$("#contratoSelecdoFornecedor").val() || ""}</td>
            <td>${$("#contratoSelecDescricao").val() || ""}</td>
            <td>${$("#contratoSelecoTipo").val() || ""}</td>
            <td>${$("#contratoSelecStatus").val() || ""}</td>
            <td>${$("#contratoSelecDataInicio").val() || ""}</td>
            <td>${$("#contratoSelecDataFim").val() || ""}</td>
        </tr>
    `;

    $("#tableContratoPrincipalSelecionado tbody").empty().append(linha);
    $("#tableContratoPrincipalSelecionado").show();
}

function buscaContratos(CODCOLIGADA, CCUSTO, CNPJ, tipoContrato){

    //mapeia o tipo do formulário 
    if (tipoContrato.includes("Transporte de Materiais")) {
        tipoContrato = "'Transporte de Material - S/M.O.'" 

    } else if (tipoContrato.includes("Locação de Imóvel")) { // Caso a opção do usuario CONTENHA o texto "Locação de Imóvel"
        tipoContrato = "'Aluguel Imóveis', 'Locação de Imóvel', 'Aluguel'" // Passa valores que o RM usa

    } else if (tipoContrato == "Locação de Equipamento (Rescisões)") {
        tipoContrato = "'Locação de Equipamentos - S/M.O.'"

    } else if (tipoContrato == "Locação de Equipamento - Com Mão de Obra (Rescisões)") {
        tipoContrato = "'Locação de Equipamentos - C/M.O.'"

    } else if (tipoContrato.includes("Locação de Equipamento")) { // Caso a opção do usuario CONTENHA o texto "Locação de Equipamento"
        tipoContrato = "'Locação de Equipamentos - S/M.O.','Locação de Equipamentos - C/M.O.'" // Passa valores que o RM usa
    }

    var origemContrato = $("#origemContrato").val();

    if (origemContrato == "Aditivos") {

        return new Promise((resolve, reject)=>{
            DatasetFactory.getDataset("DatasetProcessoContratos", null,[
                DatasetFactory.createConstraint("OPERACAO", "BuscaContratosPorFornecedorAditivo", "BuscaContratosPorFornecedor", ConstraintType.MUST),
                DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                DatasetFactory.createConstraint("CCUSTO", CCUSTO, CCUSTO, ConstraintType.MUST),
                DatasetFactory.createConstraint("CNPJ", CNPJ, CNPJ, ConstraintType.MUST),
                DatasetFactory.createConstraint("TIPOCONTRATO", tipoContrato, tipoContrato, ConstraintType.MUST),
            ],null,{
                success:ds=>{
                    resolve(ds.values);
                },
                error:e=>{
                    reject(e);
                }
            });
        });

    } else if (origemContrato == "Rescisões") {

        return new Promise((resolve, reject)=>{
            DatasetFactory.getDataset("DatasetProcessoContratos", null,[
                DatasetFactory.createConstraint("OPERACAO", "BuscaContratosPorFornecedorRescisao", "BuscaContratosPorFornecedorRescisao", ConstraintType.MUST),
                DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                DatasetFactory.createConstraint("CCUSTO", CCUSTO, CCUSTO, ConstraintType.MUST),
                DatasetFactory.createConstraint("CNPJ", CNPJ, CNPJ, ConstraintType.MUST),
                DatasetFactory.createConstraint("TIPOCONTRATO", tipoContrato, tipoContrato, ConstraintType.MUST),
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

    
}