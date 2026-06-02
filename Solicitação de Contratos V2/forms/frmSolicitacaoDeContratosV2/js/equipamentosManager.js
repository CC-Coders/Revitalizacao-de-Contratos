dataTableEquipamentos=null;
dataTableEquipamentosAditivoRescisao = null;
dataTableEquipamentosParaInclusaoExclusao = null;
datatablesLanguage = {
    sEmptyTable: "Nenhum registro encontrado",
    sInfo: "Mostrando de _START_ até _END_ de _TOTAL_ registros",
    sInfoEmpty: "Mostrando 0 até 0 de 0 registros",
    sInfoFiltered: "(Filtrados de _MAX_ registros)",
    sInfoPostFix: "",
    sInfoThousands: ".",
    sLengthMenu: "_MENU_ resultados por página",
    sLoadingRecords: "Carregando...",
    sProcessing: "Processando...",
    sZeroRecords: "Nenhum registro encontrado",
    sSearch: "Pesquisar",
    oPaginate: {
        sNext: "Próximo",
        sPrevious: "Anterior",
        sFirst: "Primeiro",
        sLast: "Último",
    },
    oAria: {
        sSortAscending: ": Ordenar colunas de forma ascendente",
        sSortDescending: ": Ordenar colunas de forma descendente",
    },
    select: {
        rows: {
            _: "Selecionado %d linhas",
            0: "Nenhuma linha selecionada",
            1: "Selecionado 1 linha",
        },
    },
    buttons: {
        copy: "Copiar para a área de transferência",
        copyTitle: "Cópia bem sucedida",
        copySuccess: {
            1: "Uma linha copiada com sucesso",
            _: "%d linhas copiadas com sucesso",
        },
    },
};

// DataTable Equipamentos Pendentes
function initDataTableEquipamentos(){
    dataTableEquipamentos = new DataTable("#tableEquipamentos", {
        pageLength: 10,
        responsive: true,
        fixedHeader: true,
        columnDefs: [{
            className: 'dt-left', // Applies to all cells in the specified target(s)
            targets: '_all' // Applies to all columns
        }],
        columns: [
            {
                render:function(data,type,row){
                    return `<button type="button" class="btn btn-success btnDetailsEquipamento"><i class="flaticon flaticon-circle-plus icon-md" aria-hidden="true"></i></button>`;
                }
            },
            {
                data: "PREFIXO",    
                className: "dt-left",
            },
            {
                data: "MODELO",    
                className: "dt-left",
            },
            {
                data: "DESCRICAO",
                className: "dt-left",
            },
            {
                data: "POTENCIAHP",
                className: "dt-left",
                class: "nowrap",
                type: "string",
            },
            {
                data: "CAPACIDADE",
                defaultContent: "",
                className: "dt-left",
                class: "nowrap",
                type: "string",
            },
            {
                data: "PLACA",
                className: "dt-left",
            },
            {
                data: "FABRICANTE",
                type: "num",
                className: "dt-left",
            },
            {
                data: "FORNECEDOR",
                className: "dt-left",
                render: function (data, type, row) {
                    return `${row.FORNECEDOR_CNPJ} - ${row.FORNECEDOR}`;
                },
            },
            {
                data: "VALOR_LOCACAO",
                className: "dt-left",
                render: function (data, type, row) {
                    var total = parseFloat(row.VALOR_LOCACAO);
                    if (row.MAODEOBRA && row.MAODEOBRA != "null") {
                        total+= parseFloat(row.MAODEOBRA);
                    }

                    return floatToMoney(total);
                },
            },
            {
                data: null,
                className: "alignCenter",
                orderable: false,
                render: function (data, type, row) {
                    //if (row.STATUS == 1 || row.STATUS == 5) { // Status 5 porque são equipamentos com Contrato rescindido // Testes
                    if (row.STATUS == 1) { // "Equipamento cadastrado e disponível para seleção no processo de Contratos"
                        return `<input type="checkbox" class="checkboxSelecionaEquipamento" />`;
                    }
                    else if(row.STATUS == 2){ // STATUS 2 = Contrato em Andamento com análise pendente
                        var  list = retornaListaComEquipamentosSelecionadosPeloUsuario();
                        if (list.includes(row.PREFIXO)) {
                            return `<input type="checkbox" checked class="checkboxSelecionaEquipamento" />`;
                        }
                        else{
                            return `<a taget="_blanck" href="/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${row.NUMPROCES_CONTRATO}" class="btn btn-primary">Em Andamento</a>`;
                        }
                    }
                },
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

    dataTableEquipamentos.on("draw", function () {
      $(".btnDetailsEquipamento").off("click").on("click", function(){
            onClickDetailsEquipamento(this);
      });
      $(".checkboxSelecionaEquipamento").off("click").on("click", function(){
            onClickCheckEquipamento(this);
      });
    });

    function retornaListaComEquipamentosSelecionadosPeloUsuario(){
        var list = [];
        $(".equipamentoSelecionadoPrefixo:not(:first)").each(function(){
            list.push($(this).val());
        });

        return list;
    }
}
//async function preencheListaDeEquipamentos(){
//    try {
//        const CODCOLIGADA = $("#CODCOLIGADA").val();
//        const CCUSTO = $("#CODCCUSTO").val();
//        const CNPJ = $("#hiddenCGCCFO").val();
//
//        var equipamentos = await consultaEquipamentosPendentes(CODCOLIGADA, CCUSTO, CNPJ);
//        dataTableEquipamentos.clear().draw();
//        dataTableEquipamentos.rows.add(equipamentos); // Add new data
//        dataTableEquipamentos.columns.adjust().draw(); // Redraw the DataTable
//    } catch (error) {
//        console.error(error);
//    }
//}

async function preencheListaDeEquipamentos(){
    try {
        const CODCOLIGADA = $("#CODCOLIGADA").val();
        const CCUSTO = $("#CODCCUSTO").val();
        const CNPJ = $("#hiddenCGCCFO").val();

        var equipamentos = await consultaEquipamentosPendentes(CODCOLIGADA, CCUSTO, CNPJ);

        var tipoContrato = $("#tipoContrato").val();
        if (tipoContrato === "Transporte de Materiais") {
            equipamentos = equipamentos.filter(function (e) {
                return e.CATEGORIA && e.CATEGORIA.toUpperCase() === "PA";
            });
        }

        dataTableEquipamentos.clear().draw();
        dataTableEquipamentos.rows.add(equipamentos);
        dataTableEquipamentos.columns.adjust().draw();
    } catch (error) {
        console.error(error);
    }
}

function consultaEquipamentosPendentes(CODCOLIGADA, CCUSTO, CNPJ){
    return new Promise((resolve, reject)=>{
        DatasetFactory.getDataset("dsConsultaEquipamentosPendentes", null, [
            DatasetFactory.createConstraint("OPERACAO","ConsultaEquipPorCcustoFornecedor","ConsultaEquipPorCcustoFornecedor",ConstraintType.MUST),
            DatasetFactory.createConstraint("CODCOLIGADA",CODCOLIGADA,CODCOLIGADA,ConstraintType.MUST),
            DatasetFactory.createConstraint("CCUSTO",CCUSTO,CCUSTO,ConstraintType.MUST),
            DatasetFactory.createConstraint("CNPJ",CNPJ,CNPJ,ConstraintType.MUST),
        ],null,{
            success:ds=>{
                if (ds.values[0].STATUS != "SUCCESS") {
                    reject(ds.values[0].MENSAGEM);
                }else{
                    resolve(JSON.parse(ds.values[0].RESULT));
                }
            },
            error:e=>reject(e)
        });
    });
}
async function onClickDetailsEquipamento(that) {
    var self = that;
    var tr = $(self).closest('tr');
    var tableId = $(self).closest('table').attr("id");
    var dt =
        tableId == "tableEquipamentosAditivoRescisao" ? dataTableEquipamentosAditivoRescisao :
        tableId == "tableEquipamentosParaInclusaoExclusao" ? dataTableEquipamentosParaInclusaoExclusao :
        dataTableEquipamentos;

    var permitiAlterar = (tableId != "tableEquipamentosAditivoRescisao");
    var row = dt.row(tr);
    console.log(row)
    if (row.child.isShown()) {
        // Fecha a linha expandida
        $('div', row.child()).slideUp();
        tr.removeClass('shown');
        row.child.hide();
    } else {
        // Abre a linha expandida
        row.child(await geraDetailsRow(row.data())).show();
        tr.addClass('shown');
        tr.next().addClass('child');

        $('div', row.child()).slideDown();
        $("div").find(".btnAnexosEquipamento").on("click", { equipamento: row.data() }, async function (event) {
            FLUIGC.modal({
                title: `Anexos ${event.data.equipamento.PREFIXO}`,
                content: await geraHtmlAnexos(event.data.equipamento),
                id: 'fluig-modal',
                actions: [{
                    'label': 'Fechar',
                    'autoClose': true
                }]
            }, function (err, data) {
                if (err) {
                    // do error handling
                } else {
                    // do something with data
                }
            });
        });
        if (permitiAlterar) {
            $("div").find(".btnAlterarEquipamento").on("click", { equipamento: row.data() }, async function (event) {
                modalAlterarEquipamento(event.data.equipamento)
            });
        }

    }

    async function geraDetailsRow(data) {

        // ?? é o operador de coalescência nula (nullish coalescing operator) do JavaScript
        // Exemplo: a ?? b
        // a se a NÃO for null nem undefined
        // b se a for null ou undefined

        // Diferença para || (OR lógico)
        // valor || "padrão"
        // Troca o valor se ele for falsy: 0, "", false, null, undefined

        // valor ?? "padrão"
        // Troca o valor somente se for nulo: null, undefined

        try {
            console.log(data)
            var html = `
        <div class="divChildRowEquipamento">
            <h3>Equipamento</h3>
            <div class="row">
                <div class="col-md-4">
                    <label>Cadastro: </label><a target="_blank" href="/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${data.NUMPROCES_CADASTROEQUIPAMENTOS}"> ${data.NUMPROCES_CADASTROEQUIPAMENTOS}</a>
                </div>
                <div class="col-md-4">
                    <label>Data Chegada: </label> ${data.DATA_CHEGADA.split(" ")[0].split("-").reverse().join("/")}
                </div>
                <div class="col-md-4">
                    <label>Ano Modelo: </label> ${data.ANO_MODELO}
                </div>
                <div class="col-md-4">
                    <label>Ano Fabricação: </label> ${data.ANO_FABRICACAO}
                </div>
            </div>
            <hr>
            <h3>Valores</h3>
            <div class="row">
                <div class="col-md-4">
                    <label>Valor Locação:</label> ${floatToMoney(data.VALOR_LOCACAO)}
                </div>
                ${data.VALOR_MOBILIZADO ?
                    `<div class="col-md-4">
                        <label>Valor Mobilização: </label> ${floatToMoney(Number(data.VALOR_MOBILIZADO) || 0)} ${data.UN_MOBILIZADO ?? ""}
                    </div>`: ""
                }
                ${data.VALOR_DESMOBILIZACAO ?
                    `<div class="col-md-4">
                        <label>Valor Desmobilização: </label> ${floatToMoney(Number(data.VALOR_DESMOBILIZACAO) || 0)} ${data.UN_DESMOBILIZACAO ?? ""}
                    </div>`: ""
                }
                ${data.VALOR_EXTRA ?
                    `<div class="col-md-4">
                        <label>Valor Hora Extra: </label> ${floatToMoney(data.VALOR_EXTRA)} ${data.UN_EXTRA}
                    </div>`: ""
                }
                ${data.MAODEOBRA ?
                    `<div class="col-md-4">
                        <label>Valor Mão de Obra: </label> ${floatToMoney(data.MAODEOBRA)}
                    </div>`: ""
                }
            </div>
            <hr>
            <div class="row">
                <div class="col-md-12" style="text-align:center;">
                    <button class="btn btn-primary btnAnexosEquipamento">
                        <i class="flaticon flaticon-paperclip icon-sm" aria-hidden="true"></i>
                        Anexos
                    </button>
                    ${permitiAlterar && data.STATUS == 1 ?
                    `<button class="btn btn-primary btnAlterarEquipamento">
                            <i class="flaticon flaticon-edit icon-sm" aria-hidden="true"></i>
                            Alterar
                        </button>`: ``
                }
                    <a target="_blank" href="/portal/p/1/consulta-de-equipamentos?prefixo=${data.PREFIXO}" class="btn btn-primary btnLinkPainelEquipamentos">
                        <i class="flaticon flaticon-import icon-sm" aria-hidden="true"></i>
                        Painel de Equipamentos
                    </a>
                </div>
            </div>       
        </div>`;

            return html;
        } catch (error) {
            throw error;
        }


        async function geraHtmlAnexos(data) {
            var html = "";

            for (const documentId of data.ANEXOS_FOTOS.split(",")) {
                var documentName = await promiseGetDocumentDescription(documentId)
                html += await htmlNovoAnexo(documentId, documentName);
            }
            for (const documentId of data.ANEXOS_DOCUMENTACAO.split(",")) {
                var documentName = await promiseGetDocumentDescription(documentId)
                html += await htmlNovoAnexo(documentId, documentName);
            }
            for (const documentId of data.ANEXOS_LAUDO.split(",")) {
                var documentName = await promiseGetDocumentDescription(documentId)
                html += await htmlNovoAnexo(documentId, documentName);
            }
            for (const documentId of data.ANEXOS_PLANO_MANUTENCAO.split(",")) {
                var documentName = await promiseGetDocumentDescription(documentId)
                html += await htmlNovoAnexo(documentId, documentName);
            }
            for (const documentId of data.ANEXOS_ART.split(",")) {
                var documentName = await promiseGetDocumentDescription(documentId)
                html += await htmlNovoAnexo(documentId, documentName);
            }
            return html;
        }
        async function htmlNovoAnexo(documentId, documentName) {
            var html =
                `<div class="btn btn-default btnAnexo">
            <b><a target="_blank" href=${documentId == "#" ? "#" : await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId)}>${documentName}</a></b>
        </div>`;

            return html;
        }
    }
}
async function onClickCheckEquipamento(that) {
    var self = that;
    var tr = $(self).closest('tr');  
    var row = dataTableEquipamentos.row(tr);
    var data = row.data();
    console.log(data)

    if ($(self).is(":checked")) {
        salvaPrefixoSelecionado(data.PREFIXO);
    }else{
        removePrefixoSelecionado(data.PREFIXO);
    }

    function salvaPrefixoSelecionado(PREFIXO){
        // Flag de controle para saber se o prefixo já existe na tabela pai-filho
        var jaExiste = false;

        // Percorre todas as linhas da tabela pai-filho
        // :not(:first) -> ignora a primeira linha (template escondido do Fluig)
        $("#tableEquipamentosSelecionados>tbody>tr:not(:first)").each(function () {

            // Para cada linha, pega o valor do input hidden que guarda o prefixo
            var prefixoLinha = $(this).find(".equipamentoSelecionadoPrefixo").val();

            // Compara o prefixo atual da linha com o prefixo que estamos tentando inserir
            if (prefixoLinha == PREFIXO) {

                // Se encontrar igual, marca como existente
                jaExiste = true;

                // Interrompe o loop imediatamente (equivalente a um break)
                return false;
            }
        });

        // Após percorrer todas as linhas:
        // Se já existir o prefixo, NÃO faz nada (evita duplicação)
        if (jaExiste) {
            return;
}

        var id = wdkAddChild("tableEquipamentosSelecionados");
        $("#equipamentoSelecionadoPrefixo" + "___" + id).val(PREFIXO);
        atualizaValorTotalLocacao_prazo();
    }
    function removePrefixoSelecionado(PREFIXO){
        $("#tableEquipamentosSelecionados>tbody>tr:not(:first)").each(function(){
            if($(this).find(".equipamentoSelecionadoPrefixo").val() == PREFIXO){
                fnWdkRemoveChild(this);
                atualizaValorTotalLocacao_prazo();
            }
        });
    }
}
async function modalAlterarEquipamento(data) {
    var html = 
    `<div style="min-height:200px">
        <div class="row">
            <div class="col-md-4">
                <label>Campo: </label>
                <select class="form-control selectCampoAlteracao">
                    <option></option>
                    <option>CNPJ</option>
                    <option>Valor de Locação</option>
                    <option>Valor de Mão de Obra</option>
                </select>
            </div>
            <div class="col-md-4">
                <label>Valor Atual: </label>
                <input type="text" class="form-control atualValorAlteracao" readonly/>
            </div>
            <div class="col-md-4">
                <label>Valor Novo: </label>
                <input type="text" class="form-control novoValorAlteracao"/>
            </div>
        </div>
    </div>`;
    var modal = FLUIGC.modal({
        title: 'Alterar ' + data.PREFIXO,
        content: html,
        id: 'fluig-modal',
        size:"full",
        actions: [{
            'label': 'Alterar',
            'bind': 'data-alterar',
        },{
            'label': 'Cancelar',
            'autoClose': true
        }]
    }, function(err) {
        if(err) {
            // do error handling
        } else {
            $(".selectCampoAlteracao").on("change", function(){
                console.log(data);

                if ($(this).val() == "CNPJ") {
                    $(".atualValorAlteracao").val(data.FORNECEDOR_CNPJ + " - " + data.FORNECEDOR);
                    $(".novoValorAlteracao").maskMoney("destroy");
                    $(".novoValorAlteracao").selectize({
                          maxItems: 1,
                    });
                    $(".novoValorAlteracao").removeClass("form-control");
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
                                $(".novoValorAlteracao")[0].selectize.clearOptions();
                                $(".novoValorAlteracao")[0].selectize.addOption(fornecedores.values.map(e=>{return {value:`${e.CODCFO} - ${e.CGCCFO} - ${e.NOMEFANTASIA}`, text:`${e.CGCCFO} - ${e.NOMEFANTASIA}`}}));
                            }
                        },
                        error: (error) => {
                            FLUIGC.toast({
                                title: "Erro ao buscar fornecedores: ",
                                message: error,
                                type: "warning",
                            });
                        },
                    });

                }
                else if ($(this).val() == "Valor de Locação") {
                    $(".atualValorAlteracao").val(floatToMoney(data.VALOR_LOCACAO));
                    $(".novoValorAlteracao").maskMoney({ thousands: '.', decimal: ',', prefix: 'R$' });
                    $(".novoValorAlteracao").addClass("form-control");
                    $(".novoValorAlteracao")[0].selectize.destroy()
                }
                else if ($(this).val() == "Valor de Mão de Obra") {
                    $(".atualValorAlteracao").val(floatToMoney(data.MAODEOBRA));
                    $(".novoValorAlteracao").maskMoney({ thousands: '.', decimal: ',', prefix: 'R$' });
                    $(".novoValorAlteracao").addClass("form-control");
                    $(".novoValorAlteracao")[0].selectize.destroy()
                }

            });

            $("[data-alterar]").on("click", function(){
                var retorno = alteraDadosEquipamento(data.IDEQUI, data.PREFIXO);
                if (retorno!="SUCCESS") {
                    showMessage("Erro ao atualizar equipamento: ",retorno,"warning");
                }else{
                    showMessage("Equipamento alterado!","","success");
                    preencheListaDeEquipamentos();
                }
                modal.remove();
            });
        }
    });
}
function alteraDadosEquipamento(IDEQUI, PREFIXO){
    const campo = $(".selectCampoAlteracao").val()
    const VALORATUAL = $(".atualValorAlteracao").val()
    var valor = $(".novoValorAlteracao").val()


    if (campo == "Valor de Locação" || campo == "Valor de Mão de Obra") {
        valor = moneyToFloat(valor);
    }else{
        valor = valor.split(" - ")[1];
    }

    var ds = DatasetFactory.getDataset("dsAlteraDadosEquipamento", null,[
        DatasetFactory.createConstraint("CAMPO",campo,campo,ConstraintType.MUST),
        DatasetFactory.createConstraint("VALOR",valor,valor,ConstraintType.MUST),
        DatasetFactory.createConstraint("VALORATUAL",VALORATUAL,VALORATUAL,ConstraintType.MUST),
        DatasetFactory.createConstraint("IDEQUI",IDEQUI,IDEQUI,ConstraintType.MUST),
        DatasetFactory.createConstraint("PREFIXO",PREFIXO,PREFIXO,ConstraintType.MUST),
    ],null);
    if (ds.values[0].STATUS == "SUCCESS") {
        return "SUCCESS";
    }else{
        return ds.values[0].MENSAGEM;
    }
}
function atualizaValorTotalLocacao_prazo(){
    var valorTotalMensal = 0;
    $("#tableEquipamentos>tbody>tr").each(function(){
        if ($(this).find(".checkboxSelecionaEquipamento").is(":checked")) {
            var row = dataTableEquipamentos.row(this);
            var data = row.data();
            console.log(data)
            valorTotalMensal += parseFloat(data.VALOR_LOCACAO);
            if (data.MAODEOBRA && data.MAODEOBRA != "null") {
                valorTotalMensal += parseFloat(data.MAODEOBRA);
            }
        }
    });
    console.log(valorTotalMensal);


    var prazo_inicio = $("#dataInicioLocacao").val().split("/").reverse().join("-");
    var prazo_fim = $("#dataFimLocacao").val().split("/").reverse().join("-");
    var prazoEmMeses = calculaDiferencaEmMeses(prazo_inicio, prazo_fim);

    $("#prazoLocacao").val(prazoEmMeses + " meses");
    
    if (valorTotalMensal != 0) {
        $("#valorMensalLocacao").val(floatToMoney(valorTotalMensal));
        $("#valorTotalLocacao").val(floatToMoney(valorTotalMensal*prazoEmMeses))
    }
}

// Aditivos
function initDataTableEquipamentos_aditivoRescisao(){
    dataTableEquipamentosAditivoRescisao = new DataTable("#tableEquipamentosAditivoRescisao", {
        pageLength: 10,
        responsive: true,
        fixedHeader: true,
        columnDefs: [{
            className: 'dt-left', // Applies to all cells in the specified target(s)
            targets: '_all' // Applies to all columns
        }],
        columns: [
            {
                render:function(data,type,row){
                    return `<button type="button" class="btn btn-success btnDetailsEquipamento"><i class="flaticon flaticon-circle-plus icon-md" aria-hidden="true"></i></button>`;
                }
            },
            {
                data: "PREFIXO",    
                className: "dt-left",
            },
            {
                data: "MODELO",    
                className: "dt-left",
            },
            {
                data: "DESCRICAO",
                className: "dt-left",
            },
            {
                data: "POTENCIAHP",
                className: "dt-left",
                class: "nowrap",
                type: "string",
            },
            {
                data: "CAPACIDADE",
                defaultContent: "",
                className: "dt-left",
                class: "nowrap",
                type: "string",
            },
            {
                data: "PLACA",
                className: "dt-left",
            },
            {
                data: "FABRICANTE",
                type: "num",
                className: "dt-left",
            },
            {
                data: "FORNECEDOR",
                className: "dt-left",
                render: function (data, type, row) {
                    return `${row.FORNECEDOR_CNPJ} - ${row.FORNECEDOR}`;
                },
            },
            {
                data: "VALOR_LOCACAO",
                className: "dt-left",
                render: function (data, type, row) {
                    var total = parseFloat(row.VALOR_LOCACAO);
                    if (row.MAODEOBRA && row.MAODEOBRA != "null") {
                        total+= parseFloat(row.MAODEOBRA);
                    }

                    return floatToMoney(total);
                },
            },
            {
                data: "VALOR_LOCACAO_REAJUSTADO",
                className: "dt-left",
                orderable: false,
                render: function (data, type, row) {
                    return `<input type="text" class="form-control inputValorLocacaoReajustado" data-prefixo="${row.PREFIXO}"></input>`
                },
            },
            {
                data: null,
                className: "alignCenter",
                orderable: false,
                render: function (data, type, row) {
                    var list = retornaListaComEquipamentosSelecionadosAditivo();
                    return `<input type="checkbox" class="checkboxSelecionaEquipamentoAditivo" ${list.includes(row.PREFIXO) ? "checked" : ""} />`;
                },
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

    dataTableEquipamentosAditivoRescisao.on("draw", function () {

        $(".inputValorLocacaoReajustado").off("change").on("change", function () {
            getEquipamentosAditivo_insereNaTabelaPaiFilho();

            // Quando o valor de qualquer input com a classe "inputValorLocacaoReajustado" for alterado (evento change),
            // executa a função "atualizaValorLocacao_valorReajustado" para recalcular e atualizar os totais no form.
            atualizaValorMensal_valorReajustado();
        });

        $(".btnDetailsEquipamento").off("click").on("click", function(){
            onClickDetailsEquipamento(this);
        });

        $(".checkboxSelecionaEquipamentoAditivo").off("click").on("click", function(){
            onClickCheckEquipamento_aditivoRescisao(this);
        });
        
        $(".inputValorLocacaoReajustado").maskMoney({
            thousands: '.',
            decimal: ',',
            prefix: 'R$ '
        });

        aplicaValoresReajusteSalvos();

        });

        function retornaListaComEquipamentosSelecionadosAditivo(){
            var list = [];
            $(".equipSelecionado_aditivos:not(:first)").each(function(){
                list.push($(this).val());
            });
            return list;
        }

        function aplicaValoresReajusteSalvos() {

            // Percorre todos os inputs de valor reajustado exibidos na grid (DataTable)
            // Cada input representa o valor de reajuste de um equipamento na interface
            $(".inputValorLocacaoReajustado").each(function () {

                // Pega o prefixo do equipamento da linha atual da grid
                // O equipamento exibido na grid com a linha correspondente na tabela pai-filho
                var prefixo = $(this).data("prefixo");

                // Busca na tabela pai-filho a linha correspondente ao equipamento atual
                // Primeiro seleciona todas as linhas da tabela (ignorando a primeira linha padrão do Fluig)
                // Depois utiliza .filter() para manter somente a linha cujo campo "equipSelecionado_aditivos" possui o mesmo prefixo do equipamento da grid
                var valorSalvo = $("#tableEquipamentosSelecionados_aditivos>tbody>tr:not(:first)")
                    .filter(function () {

                        // Dentro do filter, "this" representa cada linha da tabela pai-filho
                        // Aqui verificamos se o prefixo salvo nessa linha é igual ao prefixo da grid
                        return $(this).find(".equipSelecionado_aditivos").val() == prefixo;

                    })

                    // Após encontrar a linha correta, busca dentro dela o campo que armazena o valor reajustado do equipamento
                    .find(".equipSelecionado_aditivoValorReajustado")

                    // Obtém o valor salvo
                    .val();

                // Se existir valor salvo para esse equipamento
                // reaplica o valor no input correspondente da grid
                if (valorSalvo) {

                    // Define o valor no input
                    $(this).val(valorSalvo)

                    // Dispara o evento change para que as regras já existentes no formulário
                    // (como atualização de totais) sejam executadas automaticamente
                    .trigger("change");
                }
            });

            // Após reaplicar todos os valores individuais,
            // recalcula o valor total do campo "Valor Locação Reajustado"
            // que é a soma de todos os equipamentos
            atualizaValorMensal_valorReajustado();
        }
}
function initDataTableEquipamentosParaInclusaoExclusao() {

    var atividade = parseInt($("#atividade").val());
    var tipoContrato = $("#tipoContrato").val();

    if (atividade == ATIVIDADES.INICIO || atividade == ATIVIDADES.INICIO_0) {
        if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {
            $("#tituloExclusaoEquip").hide();
            $("#divEquipamentosParaInclusaoExclusao, #tituloInclusaoEquip").show();

        } else if (tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {
            $("#tituloInclusaoEquip").hide();
            $("#divEquipamentosParaInclusaoExclusao, #tituloExclusaoEquip").show();

        } else {
            $("#divEquipamentosParaInclusaoExclusao, #tituloInclusaoEquip, #divEquipamentosParaInclusaoExclusao, #tituloExclusaoEquip").hide();
        }
    }

    dataTableEquipamentosParaInclusaoExclusao = new DataTable("#tableEquipamentosParaInclusaoExclusao", {
        pageLength: 10,
        responsive: true,
        fixedHeader: true,
        columnDefs: [{
            className: "dt-left",
            targets: "_all"
        }],
        columns: [
            {
                render: function (data, type, row) {
                    return '<button type="button" class="btn btn-success btnDetailsEquipamentoExclusao"><i class="flaticon flaticon-circle-plus icon-md" aria-hidden="true"></i></button>';
                }
            },
            {
                data: "PREFIXO",
                className: "dt-left"
            },
            {
                data: "MODELO",
                className: "dt-left"
            },
            {
                data: "DESCRICAO",
                className: "dt-left"
            },
            {
                data: "POTENCIAHP",
                className: "dt-left",
                class: "nowrap",
                type: "string"
            },
            {
                data: "CAPACIDADE",
                defaultContent: "",
                className: "dt-left",
                class: "nowrap",
                type: "string"
            },
            {
                data: "PLACA",
                className: "dt-left"
            },
            {
                data: "FABRICANTE",
                className: "dt-left"
            },
            {
                render: function (data, type, row) {
                    return (row.FORNECEDOR_CNPJ || "") + (row.FORNECEDOR ? " - " + row.FORNECEDOR : "");
                },
                className: "dt-left"
            },
            {
                render: function (data, type, row) {
                    var valorMensal = parseFloat(row.VALOR_LOCACAO || 0) + parseFloat(row.MAODEOBRA || 0);
                    return floatToMoney(valorMensal);
                },
                className: "dt-left",
                class: "nowrap",
                type: "string"
            },
            {
                render: function (data, type, row) {
                    return '<button type="button" class="btn btn-danger btnRemoverEquipExclusao"><i class="flaticon flaticon-trash icon-md" aria-hidden="true"></i></button>';
                }
            }
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

    $("#tableEquipamentosParaInclusaoExclusao").on("click", ".btnDetailsEquipamentoExclusao", function () {
        onClickDetailsEquipamento(this);
    });

    $("#tableEquipamentosParaInclusaoExclusao").on("click", ".btnRemoverEquipExclusao", function () {
        btnRemoverEquip(this);
    });
}
function onClickCheckEquipamento_aditivoRescisao(that) {
    var tipoContrato = $("#tipoContrato").val();
    var self = that;
    var tr = $(self).closest('tr');  
    var row = dataTableEquipamentosAditivoRescisao.row(tr);
    var data = row.data();
    console.log(data);

    if (tipoContrato == "Locação de Equipamento - Exclusão de Equipamento" || 
        tipoContrato == "Locação de Equipamento - Inclusão de Equipamento"
    ) {
        if ($(that).is(":checked")) {
            adicionarEquipParaInclusaoExclusao(that);
        }
        return;
    }

    if ($(self).is(":checked")) {
        salvaPrefixoSelecionado(data.PREFIXO);
    }else{
        removePrefixoSelecionado(data.PREFIXO);
    }

    function salvaPrefixoSelecionado(PREFIXO){
        var id = wdkAddChild("tableEquipamentosSelecionados_aditivos");
        $("#equipSelecionado_aditivos" + "___" + id).val(PREFIXO);
        atualizaValorTotalLocacao_prazo();
    }
    function removePrefixoSelecionado(PREFIXO){
        $("#tableEquipamentosSelecionados_aditivos>tbody>tr:not(:first)").each(function(){
            if($(this).find(".equipSelecionado_aditivos").val() == PREFIXO){
                fnWdkRemoveChild(this);
                atualizaValorTotalLocacao_prazo();
            }
        });
    }
}
function adicionarEquipParaInclusaoExclusao(that) {
    var tr = $(that).closest("tr");
    var row = dataTableEquipamentosAditivoRescisao.row(tr);
    var data = row.data();

    var id = wdkAddChild("tableEquipamentosSelecionados_aditivos");

    var valorMensal = parseFloat(data.VALOR_LOCACAO || 0);
    if (data.MAODEOBRA && data.MAODEOBRA != "null") {
        valorMensal += parseFloat(data.MAODEOBRA || 0);
    }

    $("#equipSelecionado_aditivos___" + id).val(data.PREFIXO || "");
    $("#equipModeloAditivo___" + id).val(data.MODELO || "");
    $("#equipDescricaoAditivo___" + id).val(data.DESCRICAO || "");
    $("#equipPotenciaAditivo___" + id).val(data.POTENCIAHP || "");
    $("#equipCapacidadeAditivo___" + id).val(data.CAPACIDADE || "");
    $("#equipPlacaSerieAditivo___" + id).val(data.PLACA || data.SERIE || "");
    $("#equipFabricanteAditivo___" + id).val(data.FABRICANTE || "");
    $("#equipFornecedorAditivo___" + id).val((data.FORNECEDOR_CNPJ || "") + " - " + (data.FORNECEDOR || ""));
    $("#equipValorMensalAditivo___" + id).val(floatToMoney(valorMensal));

    dataTableEquipamentosParaInclusaoExclusao.row.add(data).draw(false);
    row.remove().draw(false);

    atualizaValorMensal_valorReajustado();

    if ($("#tipoAlteracao").val() == "Inclusão de Equipamento") {
        FLUIGC.toast({
            title: "",
            message: "Equipamento " + data.PREFIXO + " adicionado para inclusão.",
            type: "success",
            timeout: 3000 // Milissegundos (3 segundos)
        });
    } else if ($("#tipoAlteracao").val() == "Exclusão de Equipamento") {
        FLUIGC.toast({
            title: "",
            message: "Equipamento " + data.PREFIXO + " adicionado para exclusão.",
            type: "success",
            timeout: 3000 // Milissegundos (3 segundos)
        });
    }
}
function btnRemoverEquip(btn) {

    // Pega a linha (tr) da tabela onde o botão de lixeira foi clicado
    var tr = $(btn).closest("tr");

    // Obtém a referência da linha dentro da DataTable da tabela de baixo
    var row = dataTableEquipamentosParaInclusaoExclusao.row(tr);

    // Recupera os dados do equipamento dessa linha (PREFIXO, VALOR_LOCACAO, etc.)
    var data = row.data();

    // REMOVE O PREFIXO DA TABELA PAI-FILHO DE EQUIPAMENTOS SELECIONADOS
    // Essa tabela pai-filho (tableEquipamentosSelecionados_aditivos)
    // é utilizada para armazenar quais equipamentos foram selecionados.
    //
    // Se não removermos o PREFIXO daqui antes de voltar o equipamento
    // para a tabela principal, o render do checkbox entende que ele
    // ainda está selecionado e o checkbox volta marcado.
    $("#tableEquipamentosSelecionados_aditivos > tbody > tr:not(:first)").each(function () {

        // Verifica se o PREFIXO da linha do pai-filho é igual ao PREFIXO do equipamento removido
        if ($(this).find(".equipSelecionado_aditivos").val() == data.PREFIXO) {

            // Remove a linha correspondente do pai-filho
            fnWdkRemoveChild(this);

            // Interrompe o loop após encontrar
            return false;
        }
    });

    // DEVOLVE O EQUIPAMENTO PARA A TABELA PRINCIPAL (TABELA DE CIMA)
    // Como o PREFIXO já foi removido do pai-filho acima,
    // o render do checkbox não encontrará mais esse registro,
    // fazendo com que o checkbox volte DESMARCADO.
    dataTableEquipamentosAditivoRescisao.row.add(data).draw(false);

    // REMOVE A LINHA DA TABELA DE BAIXO
    // Remove o equipamento da tabela de equipamentos selecionados
    row.remove().draw(false);

    // RECALCULA OS VALORES DA LOCAÇÃO
    // Atualiza os valores mensais e reajustados após a remoção
    atualizaValorMensal_valorReajustado();

    if ($("#tipoAlteracao").val() == "Inclusão de Equipamento") {
        FLUIGC.toast({
            title: "",
            message: "Equipamento " + data.PREFIXO + " removido da inclusão.",
            type: "warning",
            timeout: 3000 // Milissegundos (3 segundos)
        });
    } else if ($("#tipoAlteracao").val() == "Exclusão de Equipamento") {
        FLUIGC.toast({
            title: "",
            message: "Equipamento " + data.PREFIXO + " removido da exclusão.",
            type: "warning",
            timeout: 3000 // Milissegundos (3 segundos)
        });
    }
}
function consultaEquipamentos(ID_TCNT_AUXILIAR){
    var tipoContrato = $("#tipoContrato").val();

    if (tipoContrato == "Locação de Equipamento - Alteração de Valor" || 
        tipoContrato == "Locação de Equipamento - Alteração de Prazo" ||
        tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor" || 
        tipoContrato == "Locação de Equipamento - Exclusão de Equipamento" || 
        tipoContrato == "Locação de Equipamento (Rescisões)" || tipoContrato == "Locação de Equipamento - Com Mão de Obra (Rescisões)"
    )
    {
        return new Promise((resolve, reject)=>{
            DatasetFactory.getDataset("dsConsultaEquipamentosPendentes", null, [
                DatasetFactory.createConstraint("OPERACAO","ConsultaEquipPorContrato","ConsultaEquipPorContrato",ConstraintType.MUST),
                DatasetFactory.createConstraint("ID_TCNT_AUXILIAR",ID_TCNT_AUXILIAR,ID_TCNT_AUXILIAR,ConstraintType.MUST),
            ],null,{
                success:ds=>{
                    if (ds.values[0].STATUS != "SUCCESS") {
                        reject(ds.values[0].MENSAGEM);
                    }else{
                        resolve(JSON.parse(ds.values[0].RESULT));
                    }
                },
                error:e=>reject(e)
            });
        });
        
    
    } else if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {
        var CCUSTO = $("#CODCCUSTO").val();
        var CNPJ = $("#hiddenCGCCFO").val();

        // Busca os equipamentos sem contratos ativos por Centro de Custo e Fornecedor
        return new Promise((resolve, reject)=>{
            DatasetFactory.getDataset("dsConsultaEquipamentosPendentes", null, [
                DatasetFactory.createConstraint("OPERACAO","ConsultaEquipPorCcustoFornecedor","ConsultaEquipPorCcustoFornecedor",ConstraintType.MUST),
                DatasetFactory.createConstraint("CCUSTO",CCUSTO,CCUSTO,ConstraintType.MUST),
                DatasetFactory.createConstraint("CNPJ",CNPJ,CNPJ,ConstraintType.MUST),
            ],null,{
                success:ds=>{
                    if (ds.values[0].STATUS != "SUCCESS") {
                        reject(ds.values[0].MENSAGEM);
                    }else{
                        resolve(JSON.parse(ds.values[0].RESULT));
                    }
                },
                error:e=>reject(e)
            });
        });
    }
}
async function preencheListaDeEquipamentos_aditivosRescisao() {
    var tipoContrato = $("#tipoContrato").val();

    // Limpa tabela de Inclusão/Exclusão antes de remontar, para não ficar equipamentos de outros contratos.
    $("#tableEquipamentosParaInclusaoExclusao tbody").empty();
    
    // Limpa tabela de equip(s) selecionados aditivo/rescisao antes de remontar, para não ficar equipamentos de outros contratos ou duplicado.
    $("#tableEquipamentosSelecionados_aditivos > tbody > tr:not(:first)").empty();
    
    if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {
        
        // Sempre limpa a tabela
        dataTableEquipamentosAditivoRescisao.clear().draw();

        try {

            // OPERACAO ConsultaEquipPorCcustoFornecedor
            var equipamentos = await consultaEquipamentos();
            dataTableEquipamentosAditivoRescisao.clear().draw();
            dataTableEquipamentosAditivoRescisao.rows.add(equipamentos); // Add new data
            dataTableEquipamentosAditivoRescisao.columns.adjust().draw(); // Redraw the DataTable
            carregarTabelaEquipParaIncluirExcluir();

            // Recalcula o valor mensal considerando:
            // base do contrato principal + inclusões já selecionadas
            atualizaValorMensal_valorReajustado();
        } catch (error) {
            console.error(error);
        }

    } else if (tipoContrato == "Locação de Equipamento - Alteração de Valor" || 
        tipoContrato == "Locação de Equipamento - Alteração de Prazo" ||
        tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor" ||
        tipoContrato == "Locação de Equipamento - Exclusão de Equipamento" || 
        tipoContrato == "Locação de Equipamento (Rescisões)" || tipoContrato == "Locação de Equipamento - Com Mão de Obra (Rescisões)")
    {
        // Sempre limpa a tabela
        dataTableEquipamentosAditivoRescisao.clear().draw();

        try {
            const ID_TCNT_AUXILIAR = $("#ID_TCNT_AUXILIAR").val();

            if (ID_TCNT_AUXILIAR.trim() == "-" || "") {
                return;
            }

            $("#valorLocacaoReajustado").val(floatToMoney(0));
            $("#valorMensalLocacao").val(floatToMoney(0));

            // OPERACAO ConsultaEquipPorContrato
            var equipamentos = await consultaEquipamentos(ID_TCNT_AUXILIAR);
            dataTableEquipamentosAditivoRescisao.clear().draw();
            dataTableEquipamentosAditivoRescisao.rows.add(equipamentos); // Add new data
            dataTableEquipamentosAditivoRescisao.columns.adjust().draw(); // Redraw the DataTable
            atualizaValorMensal_valorReajustado();
            
            if (tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {
                carregarTabelaEquipParaIncluirExcluir();

            } else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo" || 
            tipoContrato == "Locação de Equipamento (Rescisões)" ||
            tipoContrato == "Locação de Equipamento - Com Mão de Obra (Rescisões)") {
                
                preencheTabelaDeAditivo();
            }


        } catch (error) {
            console.error(error);
        }
    }
    function carregarTabelaEquipParaIncluirExcluir() {

        // Limpa completamente a tabela visual de exclusão antes de reconstruir.
        // Isso evita duplicação quando a função é chamada novamente.
        dataTableEquipamentosParaInclusaoExclusao.clear().draw();


        // Array que irá guardar os PREFIXOS salvos na tabela pai-filho
        // (tableEquipamentosSelecionados_aditivos)
        var prefixos = [];


        // Percorre todas as linhas da tabela pai-filho
        // Ignorando a primeira linha template
        $("#tableEquipamentosSelecionados_aditivos > tbody > tr:not(:first)").each(function () {

            // Pega o PREFIXO salvo na linha
            var prefixo = $(this).find(".equipSelecionado_aditivos").val();

            // Se existir, adiciona no array
            if (prefixo) {
                prefixos.push(prefixo);
            }

        });


        // Se não houver prefixos selecionados, não faz nada
        if (prefixos.length == 0) return;


        // Array que irá guardar os dados das linhas que devem ir para a tabela de exclusão
        var linhasParaMover = [];

        // Array que irá guardar os índices das linhas que devem ser removidas da tabela principal
        var indexesParaRemover = [];


        // Percorre todas as linhas da tabela principal (equipamentos do contrato)
        dataTableEquipamentosAditivoRescisao.rows().every(function () {

            // Dados da linha atual
            var data = this.data();

            // Se o PREFIXO da linha estiver na lista da pai-filho
            if (data && prefixos.indexOf(data.PREFIXO) !== -1) {

                // Guarda os dados para adicionar na tabela de exclusão
                linhasParaMover.push(data);

                // Guarda o índice da linha para remover depois
                // (não removemos agora para evitar bug de pular linhas)
                indexesParaRemover.push(this.index());
            }
        });


        // Adiciona as linhas na tabela visual de exclusão
        for (var i = 0; i < linhasParaMover.length; i++) {
            dataTableEquipamentosParaInclusaoExclusao.row.add(linhasParaMover[i]);
        }

        // Atualiza a tabela de exclusão
        dataTableEquipamentosParaInclusaoExclusao.draw(false);


        // Agora remove todas as linhas da tabela principal de uma vez
        // (evita problema de remover durante o loop)
        if (indexesParaRemover.length > 0) {
            dataTableEquipamentosAditivoRescisao.rows(indexesParaRemover).remove().draw(false);
        }
    }
    function preencheTabelaDeAditivo() {

        // Percorre todos os registros da DataTable
        dataTableEquipamentosAditivoRescisao.rows().every(function () {
            var row = this.data();

            if (!row) {
                return;
            }

            var id = wdkAddChild("tableEquipamentosSelecionados_aditivos");

            $("#equipSelecionado_aditivos___" + id).val(row.PREFIXO || "");
        });
    }
}
function getEquipamentosAditivo_insereNaTabelaPaiFilho() {

    // Limpa tudo antes de recriar
    $("#tableEquipamentosSelecionados_aditivos > tbody > tr:not(:first)").each(function () {
        fnWdkRemoveChild(this);
    });
    // rows().every() percorre TODOS os registros da DataTable,
    // independentemente de paginação, filtro ou ordenação.
    dataTableEquipamentosAditivoRescisao.rows().every(function () {
            
    // Pega o objeto de dados da linha atual, que vem do dataset
    var row = this.data();

    // Se não tiver dados então encerra aqui.
    if (!row) {
        return;
    }

    // Busca o input que tem o data-prefixo igual o PREFIXO da linha atual
    var input = $(".inputValorLocacaoReajustado[data-prefixo='" + row.PREFIXO + "']");

    // Pega o valor de locação que vem do dataset e converte para numero float
    var valorLocacao = parseFloat(row.VALOR_LOCACAO || 0);

    // Pega o valor de mão de obra que vem do dataset e converte para numero float
    var maoDeObra = 0;
    if (row.MAODEOBRA && row.MAODEOBRA != "null") {
        maoDeObra = parseFloat(row.MAODEOBRA || 0);
    }

    // Pega o valor digitado no input e converte para numero float
    var valorReajuste = moneyToFloat(input.val() || '0');

    // Valor mensal original do equipamento
    var valorMensal = valorLocacao + maoDeObra;

    // Se valor de reajuste for diferente de 0 e não for igual ao valor de valorMensal
    if (valorReajuste != 0 && valorMensal != valorReajuste) {

        // Cria nova linha na tabela pai-filho
        var id = wdkAddChild("tableEquipamentosSelecionados_aditivos");

        // Preenche o campo hidden com o prefixo e seu ID gerado pelo o Fluig
        $("#equipSelecionado_aditivos___" + id).val(row.PREFIXO);

        // Preenche campo hidden com o valor reajustado digitado para o prefixo
        $("#valorReajustado_aditivos___" + id).val(floatToMoney(valorReajuste));

        // Preenhce campo hidden com o valor mensal (valor locação + mão de obra)
        $("#valorMensalOriginalAditivo___" + id).val(floatToMoney(valorMensal));

        // Preenche campo hidden com o valor de mão de obra, para poder usar na subtração
        // de valor mensal no beforeTaskSave, para pegar o valor locação
        $("#valorMaoDeObraAditivos___" + id).val(floatToMoney(maoDeObra));
        }
    });
}
function atualizaValorMensal_valorReajustado() {
    var tipoContrato = $("#tipoContrato").val();

    if (tipoContrato == "Locação de Equipamento - Alteração de Valor" || tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor") {
        var valorReajustado = 0;
        var valorMensal = 0;

        // dataTableEquipamentosAditivoRescisao é a instância da DataTable
        // rows() retorna todas as linhas da tabela
        // every() percorre cada linha da DataTable (similar ao each)
        dataTableEquipamentosAditivoRescisao.rows().every(function () {

            // this aqui representa a linha atual da DataTable
            // this.data() retorna o objeto de dados dessa linha
            var row = this.data();

            // Se por algum motivo não existir dados na linha então interrompe esta iteração
            if (!row) {
                return;
            }

            // Pega o valor de locação vindo do dataset
            // parseFloat garante que o valor seja tratado como número
            // || 0 evita NaN caso venha null/undefined
            var valorLocacao = parseFloat(row.VALOR_LOCACAO || 0);

            // Pega o valor de mão de obra da linha atual
            // Também converte para número e garante 0 caso esteja vazio
            var maoDeObra = 0;
            if (row.MAODEOBRA && row.MAODEOBRA != "null") {
                maoDeObra = parseFloat(row.MAODEOBRA || 0);
            }

            // Valor base da locação do equipamento
            // É composto pela soma da locação do equipamento + mão de obra
            var valorBase = valorLocacao + maoDeObra;

            // Busca o input correspondente ao equipamento atual
            // O vínculo é feito através do atributo data-prefixo que contém o PREFIXO do equipamento
            var input = $(".inputValorLocacaoReajustado[data-prefixo='" + row.PREFIXO + "']");

            // Pega o valor digitado no input de reajuste
            // input.val() pega o valor digitado
            // || '0' garante que se estiver vazio será considerado zero
            // moneyToFloat converte o valor formatado (ex: "R$ 1.000,00") para número decimal (1000.00)
            var valorInput = moneyToFloat(input.val() || '0');

            // Soma também ao valor mensal
            valorMensal += valorBase;

            // Só considera o valor digitado como reajuste válido se:
            // 1 - O valor digitado for maior que zero
            // 2 - O valor digitado for diferente do valor base do equipamento
            // Isso evita registrar reajuste quando o valor não foi alterado
            if (valorInput > 0 && valorInput != valorBase) {

                // Soma o valor reajustado ao total de reajustes
                valorReajustado += valorInput;
            }
        });        

        // Atualiza o campo do formulário com o total de valores reajustados
        // floatToMoney converte número para formato monetário (ex: 1000 -> "R$ 1.000,00")
        $("#valorLocacaoReajustado").val(floatToMoney(valorReajustado));

        // Atualiza o campo com o valor mensal total da locação
        $("#valorMensalLocacao").val(floatToMoney(valorMensal));

    } else if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {

        // Valor base do contrato principal,
        // salvo quando o usuário marcou o checkbox do contrato principal
        var valorMensalBaseContrato = parseFloat($("#valorMensalLocacao").data("valor-base-contrato") || 0);

        // Variável que irá acumular o valor total dos equipamentos
        // que estão sendo incluídos no aditivo
        var valorMensalInclusoes = 0;

        // Percorre todas as linhas da DataTable que representa
        // a tabela de equipamentos selecionados para inclusão (tabela de baixo)
        dataTableEquipamentosParaInclusaoExclusao.rows().every(function () {

            // Recupera os dados da linha atual da DataTable
            // (objeto com PREFIXO, VALOR_LOCACAO, MAODEOBRA, etc.)
            var row = this.data();

            // Caso a linha não tenha dados, interrompe a execução dessa iteração
            if (!row) {
                return;
            }

            // referente ao equipamento da linha atual
            var maoDeObra = 0;

            // Verifica se o campo MAODEOBRA possui valor válido
            // Alguns registros podem vir como null ou string "null"
            if (row.MAODEOBRA && row.MAODEOBRA != "null") {

                // Converte o valor de mão de obra para número
                maoDeObra = parseFloat(row.MAODEOBRA || 0);
            }

            // Soma ao total de inclusões:
            // VALOR_LOCACAO do equipamento + MAODEOBRA (se houver)
            valorMensalInclusoes += parseFloat(row.VALOR_LOCACAO || 0) + maoDeObra;
        });

        // valor base do contrato principal + valor dos equipamentos incluídos
        var valorMensalFinal = valorMensalBaseContrato + valorMensalInclusoes;

        // Atualiza o campo do formulário #valorMensalLocacao,convertendo o número para formato monetário
        $("#valorMensalLocacao").val(floatToMoney(valorMensalFinal));

    } else if (tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {

        var valorTotalEquipamentos = 0;
        var valorEquipamentosRemover = 0;

        // Percorre TODOS os equipamentos da DataTable
        dataTableEquipamentosAditivoRescisao.rows().every(function () {

            var row = this.data();

            if (!row) {
                return;
            }

            var maoDeObra = 0;

            if (row.MAODEOBRA && row.MAODEOBRA != "null") {
                maoDeObra = parseFloat(row.MAODEOBRA || 0);
            }

            var valorEquip = parseFloat(row.VALOR_LOCACAO || 0) + maoDeObra;

            // Soma no total de todos equipamentos
            valorTotalEquipamentos += valorEquip;

            // Se o checkbox da linha estiver marcado
            var tr = $(this.node());
            if (tr.find(".checkboxSelecionaEquipamentoAditivo").is(":checked")) {
                valorEquipamentosRemover += valorEquip;
            }

        });

        // Subtrai os selecionados
        var valorMensalFinal = valorTotalEquipamentos - valorEquipamentosRemover;

        $("#valorMensalLocacao").val(floatToMoney(valorMensalFinal));

    } else if (tipoContrato == "Locação de Equipamento (Rescisões)" || tipoContrato == "Locação de Equipamento - Com Mão de Obra (Rescisões)") {
        var valorMensalContrato = 0;

        // Percorre TODOS os equipamentos da DataTable
        dataTableEquipamentosAditivoRescisao.rows().every(function () {

            var row = this.data();

            if (!row) {
                return;
            }

            var maoDeObra = 0;

            if (row.MAODEOBRA && row.MAODEOBRA != "null") {
                maoDeObra = parseFloat(row.MAODEOBRA || 0);
            }

            var valorEquip = parseFloat(row.VALOR_LOCACAO || 0) + maoDeObra;

            // Soma no total de todos equipamentos
            valorMensalContrato += valorEquip;

        });

        $("#valorMensalLocacao").val(floatToMoney(valorMensalContrato));
    }
}

// Equipamentos Selecionados nas telas de Aprovação
async function geraEquipamentosSelecionados(){
    var origemContrato = $("#origemContrato").val() ? $("#origemContrato").val():$("#origemContrato").text();

    // Sempre limpa os dois divs antes de renderizar de novo
    $("#divEquipamentosSelecionados").empty();
    $("#divEquipamentosSelecionadosAditivoRescisao").empty();

    if (origemContrato == "Novos") {
        try {
            $("#tableEquipamentos").hide();
            var equipamentos = await asyncConsultaEquipamentosSelecionados();

            for (const equipamento of equipamentos) {
                $("#negociacaoHeaderEquipamentos").val(equipamento.NEGOCIACAO_SUPRIMENTOS == "S" ? "Sim":equipamento.NEGOCIACAO_SUPRIMENTOS == "N" ? "Não":"");
                $("#divEquipamentosSelecionados").append(await geraHtmlEquipamento(equipamento));
                $(".btnAnexosEquipamento:last").on("click", {equipamento:equipamento}, async function(event){
                    console.log(event)
                    FLUIGC.modal({
                        title: `Anexos ${event.data.equipamento.PREFIXO}`,
                        content: await geraHtmlAnexos(event.data.equipamento),
                        id: 'fluig-modal',
                        actions: [{
                            'label': 'Fechar',
                            'autoClose': true
                        }]
                    }, function(err, data) {
                        if(err) {
                            // do error handling
                        } else {
                            // do something with data
                        }
                    });

                });
            }
            $(".divHeaderEquipamento").on("click", function(){
                $(this).siblings(".divDetailsEquipamento").slideToggle();
            });
            
        }
        catch(error){
            showMessage("Erro ao consultar equipamentos selecionados", error, "warning");
            throw error;
        }
    } else if (origemContrato == "Aditivos" || origemContrato == "Rescisões") {
        try {
            $("#tableEquipamentosAditivoRescisao").hide();
            var equipamentos = await asyncConsultaEquipamentosSelecionados_aditivos();

            for (const equipamento of equipamentos) {
                $("#negociacaoHeaderEquipamentos").closest("div").hide(); // Oculta já que não passa por Análise do Suprimentos
                $("#divEquipamentosSelecionadosAditivoRescisao").append(await geraHtmlEquipamento(equipamento));
                $(".btnAnexosEquipamento:last").on("click", {equipamento:equipamento}, async function(event){
                    console.log(event)
                    FLUIGC.modal({
                        title: `Anexos ${event.data.equipamento.PREFIXO}`,
                        content: await geraHtmlAnexos(event.data.equipamento),
                        id: 'fluig-modal',
                        actions: [{
                            'label': 'Fechar',
                            'autoClose': true
                        }]
                    }, function(err, data) {
                        if(err) {
                            // do error handling
                        } else {
                            // do something with data
                        }
                    });

                });
            }
            $(".divHeaderEquipamento").on("click", function(){
                $(this).siblings(".divDetailsEquipamento").slideToggle();
            });
            
        }
        catch(error){
            showMessage("Erro ao consultar equipamentos selecionados", error, "warning");
            throw error;
        }
    }


    async function geraHtmlEquipamento(equipamento){
        console.log(equipamento)
        console.log(equipamento.caracteristicaTecnica)
        var html = 
        `<div class="row">
            <div class="col-md-12">
                <div class="divEquipamento">
                    <div class="divHeaderEquipamento">
                        <label style="float: right;">Valor de Locação</label>
                        <br>
                        <div class="row">
                            <div class="col-md-12">
                                <h2 style="display: flex; justify-content: space-between; margin-top:0px; margin-bottom:0px;">
                                    <span>${equipamento.DESCRICAO.toUpperCase()}</span>  
                                    <span style="color: var(--yellow-castilho) !important;">${floatToMoney(parseFloat(equipamento.VALOR_LOCACAO) + (equipamento.MAODEOBRA && equipamento.MAODEOBRA != "null" ?  parseFloat(equipamento.MAODEOBRA) : 0) )}</span>
                                </h2>
                            </div>   
                        </div>
                        <div class="row">
                            <div class="col-md-8">
                                <label>Prefixo: </label> <span style="margin-right:10px">${equipamento.PREFIXO}</span>
                                <label>Modelo: </label> <span style="margin-right:10px">${equipamento.MODELO}</span>
                                <label>Placa/Chassi: </label> <span style="margin-right:10px">${equipamento.PLACA?equipamento.PLACA:equipamento.CHASSI}</span>
                                ${equipamento.CLASSIFICACAO_BEM != null && equipamento.CLASSIFICACAO_BEM != "null" ? `<label>Avaliação do Bem: </label> <span style="margin-right:10px">${equipamento.CLASSIFICACAO_BEM}% ${equipamento.CLASSIFICACAO_BEM < 3 ? `<i class="flaticon flaticon-arrow-up icon-sm" style="color:green"; aria-hidden="true"></i>`:`<i class="flaticon flaticon-arrow-down icon-sm" style="color:red"; aria-hidden="true"></i>`}</span>`:""}                           
                            </div>
                            <div class="col-md-4" style="text-align: right;">
                                ${
                                    (equipamento.VALOR_EQUIPAMENTO && equipamento.VALOR_EQUIPAMENTO != "null") ?
                                        `<label>Valor do Equipamento: </label> <span>${floatToMoney(equipamento.VALOR_EQUIPAMENTO)}</span>`:""                                    
                                }
                            </div>
                        </div>
                    </div>
                    <div class="divDetailsEquipamento" style="display:none;">
                        <hr>
                        <h3>Equipamento: </h3>
                        <div class="row">
                            <div class="col-md-3">
                                <label>Fabricante:</label><br>
                                <span>${equipamento.FABRICANTE}</span>
                            </div>
                            <div class="col-md-3">
                                <label>Ano Fabricação:</label><br>
                                <span>${equipamento.ANO_FABRICACAO}</span>
                            </div>
                            <div class="col-md-3">
                                <label>Ano Modelo:</label><br>
                                <span>${equipamento.ANO_MODELO}</span>
                            </div>
                            <div class="col-md-3">
                                <label>Classe Operacional:</label><br>
                                <span>${equipamento.CLASSEOPERACIONAL}</span>
                            </div>
                        </div>
                        <br>
                        <div class="row">
                            <div class="col-md-3">
                                <label>Potência do Motor:</label><br>
                                <span>${equipamento.POTENCIAHP} HP</span>
                            </div>
                            <div class="col-md-3">
                                <label>Tipo Combustivel:</label><br>
                                <span>${equipamento.COMBUSTIVEL}</span>
                            </div>
                            <div class="col-md-3">
                                <label>${(equipamento.caracteristicaTecnica?.length > 0 && equipamento.caracteristicaTecnica[0].DESCRICAO) ? equipamento.caracteristicaTecnica[0].DESCRICAO:  ""}:</label><br>
                                <span>${(equipamento.caracteristicaTecnica?.length > 0 && equipamento.caracteristicaTecnica[0].VALOR) ? equipamento.caracteristicaTecnica[0].VALOR:  ""} ${(equipamento.caracteristicaTecnica?.length > 0 && equipamento.caracteristicaTecnica[0].SIGLA) ? equipamento.caracteristicaTecnica[0].SIGLA : ""}</span>
                            </div>
                        </div>
                        <br>
                        <hr>
                        <h3>Análise Financeira:</h3>
                        <div class="row">
                            <div class="col-md-3">
                                <label>Valor Locação:</label><br>
                                <span>${floatToMoney(equipamento.VALOR_LOCACAO)}</span>
                                <br><br>
                            </div>
                            ${
                                (equipamento.MAODEOBRA && equipamento.MAODEOBRA != "null") ?
                                `<div class="col-md-3">
                                    <label>Valor Mão de Obra:</label><br>
                                    <span>${floatToMoney(equipamento.MAODEOBRA)}</span>
                                    <br><br>
                                </div>` : ""
                            }
                            <div class="col-md-3">
                                <label>Valor Mobilização:</label><br>
                                <span>${floatToMoney(equipamento.VALOR_MOBILIZADO)} ${equipamento.UN_MOBILIZADO}</span>
                                <br><br>
                            </div>
                            <div class="col-md-3">
                                <label>Valor Desmobilização:</label><br>
                                <span>${floatToMoney(equipamento.VALOR_DESMOBILIZACAO)} ${equipamento.UN_DESMOBILIZACAO}</span>
                                <br><br>
                            </div>

                            ${equipamento.STATUS == 3 ? 
                                `<div class="col-md-3">
                                    <label>Valor Fipe:</label><br>
                                    <span>${floatToMoney(equipamento.VALOR_FIPE)}</span>
                                    <br><br>
                                </div>
                                <div class="col-md-3">
                                    <label>Valor Implemento:</label><br>
                                    <span>${floatToMoney(equipamento.VALOR_IMPLEMENTO)}</span>
                                    <br><br>
                                </div>
                                <div class="col-md-3">
                                    <label>Valor Implemento Depreciado:</label><br>
                                    <span>${floatToMoney(equipamento.VALOR_IMPLEMENTO)}</span>
                                    <br><br>
                                </div>
                                <div class="col-md-3">
                                    <label>Preço Equipamento:</label><br>
                                    <span>${floatToMoney(equipamento.PRECO_EQUIPAMENTO)}</span>
                                    <br><br>
                                </div>
                                <div class="col-md-3">
                                    <label>Valor Final da Locação:</label><br>
                                    <span>${floatToMoney((equipamento.VALOR_LOCACAO) * parseInt($("#prazoLocacao").val().split(" ")[0]))}</span>
                                    <br><br>
                                </div>

                                `:""
                            }
                        </div>
                        <hr>
                        <div style="text-align:center;">
                            <button class="btn btn-primary btnAnexosEquipamento">
                                <i class="flaticon flaticon-paperclip icon-sm" aria-hidden="true"></i>
                                Anexos
                            </button>
                            <a target="_blanck" href="/portal/p/1/consulta-de-equipamentos?prefixo=${equipamento.PREFIXO}" class="btn btn-primary btnLinkPainelEquipamentos">
                                <i class="flaticon flaticon-import icon-sm" aria-hidden="true"></i>
                                Painel de Equipamentos
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        return html;
    }
}
async function geraHtmlAnexos(equipamento) {
    console.log(equipamento)
    var html = "";

    html += "<h4>Fotos: </h4>";
    html += "<div style='display:flex;'>";
    for (const documentId of equipamento.ANEXOS_FOTOS.split(",")) {
        html += await htmlNovoAnexo(documentId, await promiseGetDocumentDescription(documentId));
    }
    html += "</div>";

    html += "<br><h4>Documentação: </h4>";
    html += "<div style='display:flex;'>";
    for (const documentId of equipamento.ANEXOS_DOCUMENTACAO.split(",")) {
        html += await htmlNovoAnexo(documentId, await promiseGetDocumentDescription(documentId));
    }
    html += "</div>";

    html += "<br><h4>Laudo Técnico: </h4>";
    html += "<div style='display:flex;'>";
    for (const documentId of equipamento.ANEXOS_LAUDO.split(",")) {
        html += await htmlNovoAnexo(documentId, await promiseGetDocumentDescription(documentId));
    }
    html += "</div>";


    html += "<br><h4>Plano de Manutenção: </h4>";
    html += "<div style='display:flex;'>";
    for (const documentId of equipamento.ANEXOS_PLANO_MANUTENCAO.split(",")) {
        html += "<div style='dispay:flex;'>" + await htmlNovoAnexo(documentId, await promiseGetDocumentDescription(documentId)) + "</div>";
    }
    html += "</div>";

    html += "<br><h4>ART: </h4>";
    html += "<div style='display:flex;'>";
    for (const documentId of equipamento.ANEXOS_ART.split(",")) {
        html += "<div style='dispay:flex;'>" + await htmlNovoAnexo(documentId, await promiseGetDocumentDescription(documentId)) + "</div>";
    }
    html += "</div>";

    return html;
}
async function htmlNovoAnexo(documentId, documentName) {
    var html =
        `<div class="btn btn-default btnAnexo">
            <b><a target="_blank" href=${documentId == "#" ? "#" : await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId)}>${documentName}</a></b>
        </div>`;

    return html;
}
function geraCabecalhoEquipamentos(){
    $("#divHeaderEquipamentos").show();

    var origemContrato = $("#origemContrato").val() ? $("#origemContrato").val():$("#origemContrato").text();
    var tipoContrato = $("#tipoContrato").val() ? $("#tipoContrato").val():$("#tipoContrato").text();

    if ($("#formMode").val() == "VIEW") {
        $("#obraHeaderEquipamentos").text($("#NOMECCUSTO").val());
        $("#tipoContratoHeaderEquipamentos").text($("#tipoContrato").text() || $("#tipoContrato").val());
        $("#periodoHeaderEquipamentos").text($("#prazoLocacao").text());
        $("#valorMensalHeaderEquipamentos").text($("#valorMensalLocacao").text());
        $("#valorTotalHeaderEquipamentos").text($("#valorTotalLocacao").text());

    } else {
        $("#obraHeaderEquipamentos").val($("#NOMECCUSTO").val());
        $("#tipoContratoHeaderEquipamentos").val($("#tipoContrato").val());
        $("#periodoHeaderEquipamentos").val($("#prazoLocacao").val());
        $("#valorMensalHeaderEquipamentos").val($("#valorMensalLocacao").val());
        $("#valorTotalHeaderEquipamentos").val($("#valorTotalLocacao").val());
    }

    if (origemContrato == "Aditivos") {
        if (tipoContrato == "Locação de Equipamento - Alteração de Valor") {
            $("#periodoHeaderEquipamentos, #valorTotalHeaderEquipamentos, #negociacaoHeaderEquipamentos").closest("div").hide();

        } else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo") {
            $("#valorTotalHeaderEquipamentos, #negociacaoHeaderEquipamentos").closest("div").hide();

        } else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor") {
            $("#valorTotalHeaderEquipamentos, #negociacaoHeaderEquipamentos").closest("div").hide();

        } else if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento" || tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {
            $("#periodoHeaderEquipamentos, #valorTotalHeaderEquipamentos, #negociacaoHeaderEquipamentos").closest("div").hide();
        }

    } else if (origemContrato == "Rescisões") {
        $("#periodoHeaderEquipamentos, #valorTotalHeaderEquipamentos, #negociacaoHeaderEquipamentos").closest("div").hide();

    } else {
        $("#divHeaderEquipamentos").show();
    }
}
async function asyncConsultaEquipamentosSelecionados() {
    // Percorre a tabela pai x filho que guarda os PREFIXOS selecionados e salva na "prefixos"
    var prefixos = [];
    $("#tableEquipamentosSelecionados>tbody>tr:not(:first)").each(function () {
        prefixos.push($(this).find(".equipamentoSelecionadoPrefixo").val());
    });

    // Para cada Prefixo, consulta os dados do equipamento
    var retorno = [];
    for (const prefixo of prefixos) {
        var equipamento = await promiseConsultaEquipamento(prefixo);
        if (equipamento.IDEQUI && equipamento.IDEQUI != "null") {
            equipamento.caracteristicaTecnica = await promiseConsultaCaracteristicaTecnicaEquipamento(equipamento.IDEQUI);
        }
        retorno.push(equipamento);
    }

    return retorno;

    function promiseConsultaEquipamento(PREFIXO) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("dsConsultaVIEW_EQUIPAMENTOS_CONTRATOS", null, [
                DatasetFactory.createConstraint("PREFIXO", PREFIXO, PREFIXO, ConstraintType.MUST)
            ], null, {
                success: ds => {
                    if (ds.values[0].STATUS != "SUCCESS") {
                        reject(ds.values[0].MENSAGEM);
                    } else {
                        resolve(JSON.parse(ds.values[0].RESULT)[0]);
                    }
                },
                error: e => {
                    reject(e);
                }
            });
        });
    }
    function promiseConsultaCaracteristicaTecnicaEquipamento(IDEQUI){
        return new Promise((resolve, reject)=>{
            DatasetFactory.getDataset("dsConsultaCaracteristicasTecnicasEquipamentoSisma", null,[
                DatasetFactory.createConstraint("IDEQUI", IDEQUI,IDEQUI,ConstraintType.MUST)
            ], null,{
                success:ds=>{
                    if (ds.values[0].STATUS !="SUCCESS") {
                        reject(ds.values[0].MENSAGEM);
                    } else{
                        resolve(JSON.parse(ds.values[0].RESULT))
                    }
                },
                error:e=>{
                    reject(e);
                }
            })
        });
    }
}
async function asyncConsultaEquipamentosSelecionados_aditivos() {
    // Pecorre a tabela pai-filho de aditivos e pega os prefixos
    var prefixos = [];
    $("#tableEquipamentosSelecionados_aditivos>tbody>tr:not(:first)").each(function () {
        prefixos.push($(this).find(".equipSelecionado_aditivos").val());
    });

    var retorno = [];
    for (const prefixo of prefixos) {
        var equipamento = await promiseConsultaEquipamento(prefixo);
        retorno.push(equipamento);
    }
    return retorno;

    function promiseConsultaEquipamento(PREFIXO) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("dsConsultaVIEW_EQUIPAMENTOS_CONTRATOS", null, [
                DatasetFactory.createConstraint("PREFIXO", PREFIXO, PREFIXO, ConstraintType.MUST)
            ], null, {
                success: ds => {
                    if (ds.values[0].STATUS != "SUCCESS") {
                        reject(ds.values[0].MENSAGEM);
                    } else {
                        resolve(JSON.parse(ds.values[0].RESULT)[0]);
                    }
                },
                error: e => {
                    reject(e);
                }
            });
        });
    }
}

// Consulta equip do Contrato selecionado para inclusão/exclusão de equip, e para Rescisão
async function asyncConsultaEquipamentosPorContrato(ID_TCNT_AUXILIAR) {
    var equipamentosContrato = await promiseConsultaPrefixosContrato(ID_TCNT_AUXILIAR);

    var retorno = [];
    for (const item of equipamentosContrato) {
        var equipamento = await promiseConsultaEquipamento(item.PREFIXO);
        retorno.push(equipamento);
    }

    return retorno;

    // Consulta os equipamentos vinculados ao contrato e retorna os prefixos
    function promiseConsultaPrefixosContrato(ID_TCNT_AUXILIAR) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("dsConsultaEquipamentosPendentes", null, [
                DatasetFactory.createConstraint("OPERACAO", "ConsultaEquipPorContrato", "ConsultaEquipPorContrato", ConstraintType.MUST),
                DatasetFactory.createConstraint("ID_TCNT_AUXILIAR", ID_TCNT_AUXILIAR, ID_TCNT_AUXILIAR, ConstraintType.MUST)
            ], null, {
                success: ds => {
                    if (ds.values[0].STATUS != "SUCCESS") {
                        reject(ds.values[0].MENSAGEM);
                    } else {
                        resolve(JSON.parse(ds.values[0].RESULT));
                    }
                },
                error: e => reject(e)
            });
        });
    }

    // Consulta os dados completos do equipamento pelo prefixo
    function promiseConsultaEquipamento(PREFIXO) {
        return new Promise((resolve, reject) => {
            DatasetFactory.getDataset("dsConsultaVIEW_EQUIPAMENTOS_CONTRATOS", null, [
                DatasetFactory.createConstraint("PREFIXO", PREFIXO, PREFIXO, ConstraintType.MUST)
            ], null, {
                success: ds => {
                    if (ds.values[0].STATUS != "SUCCESS") {
                        reject(ds.values[0].MENSAGEM);
                    } else {
                        resolve(JSON.parse(ds.values[0].RESULT)[0]);
                    }
                },
                error: e => reject(e)
            });
        });
    }
}

// Cosulta equip do Contrato Selecionado para pegar o valor mensal
// Para uso quando Inclusão de Equipamento
async function asyncConsultaValorMensalPorContratoPrincipal(ID_TCNT_AUXILIAR) {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("dsConsultaEquipamentosPendentes", null, [
            DatasetFactory.createConstraint("OPERACAO", "ConsultaEquipPorContrato", "ConsultaEquipPorContrato", ConstraintType.MUST),
            DatasetFactory.createConstraint("ID_TCNT_AUXILIAR", ID_TCNT_AUXILIAR, ID_TCNT_AUXILIAR, ConstraintType.MUST),
        ], null, {
            success: ds => {
                if (ds.values[0].STATUS != "SUCCESS") {
                    reject(ds.values[0].MENSAGEM);
                } else {
                    var equipamentosContrato = JSON.parse(ds.values[0].RESULT);
                    var valorMensalBase = 0;

                    // Soma todos os equipamentos que já pertencem ao contrato principal
                    for (var i = 0; i < equipamentosContrato.length; i++) {
                        var item = equipamentosContrato[i];

                        valorMensalBase += parseFloat(item.VALOR_LOCACAO || 0);

                        if (item.MAODEOBRA && item.MAODEOBRA != "null") {
                            valorMensalBase += parseFloat(item.MAODEOBRA || 0);
                        }
                    }

                    resolve(valorMensalBase);
                }
            },
            error: e => reject(e)
        });
    });
}

// Util
function promiseGetDocumentDescription(documentId){
    return new Promise((resolve, reject)=> {
        $.ajax({
            url: `/content-management/api/v2/documents/${documentId}`,
            contentType: "application/json",
            method: "GET",
            error: function (x, e) {
                console.log(x);
                console.log(e);
                FLUIGC.toast({
                    message: "Erro ao buscar documento: " + e,
                    type: "warning"
                });
                reject("Erro ao buscar boletim de medição!");
            },
            success: function (data) {
                resolve(data.description);
            }
        });
    });
}
function calculaDiferencaEmMeses(diaInicio, diaFim){
    const init = moment(diaInicio);
    const end = moment(diaFim);

    return Math.round(Math.abs(init.diff(end, 'months', true)))
}
function promiseGetDocumentDescription(documentId){
    return new Promise((resolve, reject)=> {
        $.ajax({
            url: `/content-management/api/v2/documents/${documentId}`,
            contentType: "application/json",
            method: "GET",
            error: function (x, e) {
                console.log(x);
                console.log(e);
                FLUIGC.toast({
                    message: "Erro ao buscar documento: " + e,
                    type: "warning"
                });
                reject("Erro ao buscar boletim de medição!");
            },
            success: function (data) {
                resolve(data.description);
            }
        });
    });
}