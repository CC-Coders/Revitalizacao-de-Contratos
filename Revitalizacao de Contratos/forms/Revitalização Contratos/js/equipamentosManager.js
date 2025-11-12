dataTableEquipamentos=null;
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
function conusltaEquipamentosPendentes(CODCOLIGADA, CCUSTO, CNPJ){
    return new Promise((resolve, reject)=>{
        DatasetFactory.getDataset("dsConsultaEquipamentosPendentes", null, [
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

async function preencheListaDeEquipamentos(){
    try {
        const CODCOLIGADA = $("#CODCOLIGADA").val();
        const CCUSTO = $("#CODCCUSTO").val();
        const CNPJ = $("#hiddenCGCCFO").val();

        var equipamentos = await conusltaEquipamentosPendentes(CODCOLIGADA, CCUSTO, CNPJ);
        dataTableEquipamentos.clear().draw();
        dataTableEquipamentos.rows.add(equipamentos); // Add new data
        dataTableEquipamentos.columns.adjust().draw(); // Redraw the DataTable
    } catch (error) {
        console.error(error);
    }
}

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
                data: "POTENCIAHP",
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
                    if (row.STATUS == 1) {
                        return `<input type="checkbox" class="checkboxSelecionaEquipamento" />`;
                    }
                    else if(row.STATUS == 2){
                        return `<a taget="_blanck" href="/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${row.NUMPROCES_CONTRATO}" class="btn btn-primary">Em Andamento</a>`;
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
}

async function onClickDetailsEquipamento(that){
    var self = that;
    
    var tr = $(self).closest('tr');  
    var row = dataTableEquipamentos.row(tr);
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
        $("div").find(".btnAlterarEquipamento").on("click", { equipamento: row.data() }, async function (event) {
           modalAlterarEquipamento(event.data.equipamento)
        });
            
    }

}
async function geraDetailsRow(data){
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
                    <label>Data Chegada: </label>${data.DATA_CHEGADA.split(" ")[0].split("-").reverse().join("/")}
                </div>
                <div class="col-md-4">
                    <label>Ano Modelo: </label>${data.ANO_MODELO}
                </div>
                <div class="col-md-4">
                    <label>Ano Fabricação: </label>${data.ANO_FABRICACAO}
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
                        <label>Valor Mobilização: ${floatToMoney(data.VALOR_MOBILIZADO)} ${data.UN_MOBILIZADO}</label>
                    </div>`:""
                }
                ${data.VALOR_EXTRA ?
                    `<div class="col-md-4">
                        <label>Valor Hora Extra: ${floatToMoney(data.VALOR_EXTRA)} ${data.UN_EXTRA}</label>
                    </div>`:""
                }
                ${data.MAODEOBRA ?
                    `<div class="col-md-4">
                        <label>Valor Mão de Obra: ${floatToMoney(data.MAODEOBRA)}</label>
                    </div>`:""
                }
            </div>
            <hr>
            <div class="row">
                <div class="col-md-12" style="text-align:center;">
                    <button class="btn btn-primary btnAnexosEquipamento">
                        <i class="flaticon flaticon-paperclip icon-sm" aria-hidden="true"></i>
                        Anexos
                    </button>
                    ${
                        data.STATUS == 1 ? 
                        `<button class="btn btn-primary btnAlterarEquipamento">
                            <i class="flaticon flaticon-edit icon-sm" aria-hidden="true"></i>
                            Alterar
                        </button>`:``
                    }
                    <a target="_blank" href="/portal/p/1/paola-tester?prefixo=${data.PREFIXO}" class="btn btn-primary btnLinkPainelEquipamentos">
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


    async function geraHtmlAnexos(data){
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

    async function htmlNovoAnexo(documentId, documentName){
        var html = 
        `<div class="btn btn-default btnAnexo">
            <b><a target="_blank" href=${documentId == "#"? "#": await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId)}>${documentName}</a></b>
        </div>`;

        return html;
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
        var id = wdkAddChild("tableEquipamentosSelecionados");
        $("#equipamentoSelecionadoPrefixo" + "___" + id).val(PREFIXO);
        atualizaValorTotalLocacao();
    }
    function removePrefixoSelecionado(PREFIXO){
        $("#tableEquipamentosSelecionados>tbody>tr:not(:first)").each(function(){
            if($(this).find(".equipamentoSelecionadoPrefixo").val() == PREFIXO){
                fnWdkRemoveChild(this);
                atualizaValorTotalLocacao();
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


function atualizaValorTotalLocacao(){
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

    $("#valorMensalLocacao").val(floatToMoney(valorTotalMensal));
    $("#prazoLocacao").val(prazoEmMeses + " meses");




    $("#valorTotalLocacao").val(floatToMoney(valorTotalMensal*prazoEmMeses))
}
function calculaDiferencaEmMeses(diaInicio, diaFim){
    const init = moment(diaInicio);
    const end = moment(diaFim);

    return Math.abs(init.diff(end, 'months', true))
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


async function geraEquipamentosSelecionados(){
    try {
        $("#tableEquipamentos").hide();
        var equipamentos = await asyncConsultaEquipamentosSelecionados();

        for (const equipamento of equipamentos) {
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
                            <div class="col-md-6">
                                <label>Prefixo: </label> <span style="margin-right:10px">${equipamento.PREFIXO}</span>
                                <label>Modelo: </label> <span style="margin-right:10px">${equipamento.MODELO}</span>
                                <label>Placa/Chassi: </label> <span style="margin-right:10px">${equipamento.PLACA?equipamento.PLACA:equipamento.CHASSI}</span>
                                ${equipamento.CLASSIFICACAO_BEM != null && equipamento.CLASSIFICACAO_BEM != "null" ? `<label>Avaliação do Bem: </label> <span style="margin-right:10px">${equipamento.CLASSIFICACAO_BEM}% ${equipamento.CLASSIFICACAO_BEM < 3 ? `<i class="animaliaicon animaliaicon-arrow-circle-up icon-sm" style="color:green"; aria-hidden="true"></i>`:`<i class="animaliaicon animaliaicon-arrow-circle-down icon-sm" style="color:red"; aria-hidden="true"></i>`}</span>`:""}                           
                            </div>
                            <div class="col-md-6" style="text-align: right;">
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
                                <label>${(equipamento.caracteristicaTecnica.length > 0 && equipamento.caracteristicaTecnica[0].DESCRICAO) ? equipamento.caracteristicaTecnica[0].DESCRICAO:  ""}:</label><br>
                                <span>${(equipamento.caracteristicaTecnica.length > 0 && equipamento.caracteristicaTecnica[0].VALOR) ? equipamento.caracteristicaTecnica[0].VALOR:  ""} ${(equipamento.caracteristicaTecnica.length > 0 && equipamento.caracteristicaTecnica[0].SIGLA) ? equipamento.caracteristicaTecnica[0].SIGLA : ""}</span>
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

                            ${equipamento.STATUS == 7 ? 
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
                            <a target="_blanck" href="/portal/p/1/paola-tester?prefixo=${equipamento.PREFIXO}" class="btn btn-primary btnLinkPainelEquipamentos">
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
    $("#obraHeaderEquipamentos").val($("#NOMECCUSTO").val() ?  $("#NOMECCUSTO").val() : $("#NOMECCUSTO").text());
    $("#tipoContratoHeaderEquipamentos").val($("#tipoContrato").val() ?  $("#tipoContrato").val() : $("#tipoContrato").text());
    $("#periodoHeaderEquipamentos").val($("#prazoLocacao").val() ?  $("#prazoLocacao").val() : $("#prazoLocacao").text());
    $("#valorMensalHeaderEquipamentos").val($("#valorMensalLocacao").val() ?  $("#valorMensalLocacao").val() : $("#valorMensalLocacao").text());
    $("#valorTotalHeaderEquipamentos").val($("#valorTotalLocacao").val() ?  $("#valorTotalLocacao").val() : $("#valorTotalLocacao").text());
}





// Consultas
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