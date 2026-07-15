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

        // Aditivos de Transporte de Materiais mostram a vigência atual do contrato
        // vinda do RM em campos bloqueados, para o usuário ter a referência do que está prorrogando.
        if (tipoContrato.includes("Transporte de Materiais")) {
            $("#dataInicioContratoTransporte").val(data.DATAINICIO ? moment(data.DATAINICIO).format("DD/MM/YYYY") : "");
            $("#dataFimContratoTransporte").val(data.DATAFIM ? moment(data.DATAFIM).format("DD/MM/YYYY") : "");
            $("#dataAssinaturaTransporte").val(data.DATA_ASSINATURA ? moment(data.DATA_ASSINATURA).format("DD/MM/YYYY") : "");
            $("#valorMensalExclusaoTransporte").val(floatToMoney(data.VALOR));

            // A nova data de fim depende da vigência recém-carregada, então o prazo é recalculado.
            atualizaMesesAditivoTransporte();
        }

        // Quando selecionar o contrato principal, busca todos os equipamentos
        // já vinculados ao contrato via ConsultaEquipPorContrato e soma:
        // VALOR_LOCACAO + MAODEOBRA
        //
        // Esse valor será a base do #valorMensalLocacao.
        // Depois, sempre que o usuário incluir novos equipamentos, os valores deles serão somados sobre essa base.
        if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {

            // Chama a função assíncrona que consulta o dataset
            // dsConsultaEquipamentosPendentes com OPERACAO ConsultaEquipPorContrato
            // e retorna a soma de VALOR_LOCACAO + MAODEOBRA de todos os equipamentos
            // já vinculados ao contrato principal.
            var valorMensalBaseContrato = await asyncConsultaValorMensalPorContratoPrincipal(data.ID_TCNT_AUXILIAR);

            // .data() é um recurso do jQuery que permite armazenar dados
            // temporários associados a um elemento do DOM.
            //
            // Nesse caso salva no input #valorMensalLocacao
            // uma informação chamada "valor-base-contrato".
            //
            // Funciona como um pequeno "cache" em memória:
            //
            // #valorMensalLocacao
            // ├─ valor exibido no campo: ex: 12.500,00
            // └─ data("valor-base-contrato"): 9800
            //
            // Dessa forma, quando for recalcular o valor mensal depois
            // (ao incluir ou remover equipamentos), não precisamos consultar
            // o dataset novamente. Basta recuperar esse valor salvo com:
            //
            // Isso evita várias consultas ao dataset.
            $("#valorMensalLocacao").data("valor-base-contrato", valorMensalBaseContrato);


            // Nesse momento o campo recebe apenas o valor base do contrato
            // principal (sem considerar ainda as inclusões de equipamentos).
            //
            // A função floatToMoney() apenas formata o número para padrão
            // monetário (ex: 9500 → "9.500,00").
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
            $("#valorMensalExclusaoTransporte, #mesesAditivoTransporte").val("");
        }
    }
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

    if (tipoContrato.includes("Transporte de Materiais")) { // Caso a opção do usuario CONTENHA o texto "Transporte de Materiais"
        tipoContrato = "'Transporte de Material - S/M.O.'" // Passa valores que o RM usa

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