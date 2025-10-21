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
function conusltaEquipamentosPendentes(){
    return new Promise((resolve, reject)=>{
        DatasetFactory.getDataset("dsConsultaEquipamentosPendentes", null, [
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
        var equipamentos = await conusltaEquipamentosPendentes();
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
                data: "CAPACIDADE",
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
                    var total = parseFloat(row.VALOR_LOCACAO) + parseFloat(row.MAODEOBRA);
                    return floatToMoney(total);
                },
            },
            {
                data: null,
                className: "alignCenter",
                orderable: false,
                render: function (data, type, row) {
                    return `<input type="checkbox" class="checkboxSelecionaEquipamento" />`;
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
      $(".btnDetailsEquipamento").on("click", function(){
            onClickDetailsEquipamento(this);
      });
      $(".checkboxSelecionaEquipamento").on("click", function(){
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
    }

}
async function geraDetailsRow(data){
    try {
    console.log(data)
    var html = `
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
        <div class="row">
            <div class="col-md-4">
                <label>Cadastro: </label><a target="_blank" href="/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=${data.NUMPROCES_CADASTROEQUIPAMENTOS}"> ${data.NUMPROCES_CADASTROEQUIPAMENTOS}</a>
            </div>
            <div class="col-md-4">
                <label>Data Chegada: </label>${data.DATA_CHEGADA}
            </div>
            <div class="col-md-4">
                <label>Ano Modelo: </label>${data.ANO_MODELO}
            </div>
            <div class="col-md-4">
                <label>Ano Fabricação: </label>${data.ANO_FABRICACAO}
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <h3>Anexos</h3>
                ${await geraHtmlAnexos(data)}
            </div>
        </div>       
    `;

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

function atualizaValorTotalLocacao(){
    var valorTotalMensal = 0;
    $("#tableEquipamentos>tbody>tr").each(function(){
        if ($(this).find(".checkboxSelecionaEquipamento").is(":checked")) {
            var row = dataTableEquipamentos.row(this);
            var data = row.data();
            console.log(data)
            valorTotalMensal += parseFloat(data.VALOR_LOCACAO);
            valorTotalMensal += parseFloat(data.MAODEOBRA);
        }
    });
    console.log(valorTotalMensal);


    var [prazo_inicio, prazo_fim] = $("#periodoLocacao").val().split(" até ");
    prazo_inicio = prazo_inicio.split("/").reverse().join("-");
    prazo_fim = prazo_fim.split("/").reverse().join("-");

    prazo_inicio = moment(prazo_inicio);
    prazo_fim = moment(prazo_fim);

    const prazoEmMeses = Math.abs(prazo_inicio.diff(prazo_fim, 'months', true));
    console.log(prazoEmMeses);


    $("#valorTotalLocacao").val(floatToMoney(valorTotalMensal*prazoEmMeses))

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
        var prefixos = [];
        $("#tableEquipamentosSelecionados>tbody>tr:not(:first)").each(function(){
            prefixos.push($(this).find(".equipamentoSelecionadoPrefixo").val());
        });

        var equipamento = await promiseConsultaEquipamento(prefixos[0]);
        $("#divEquipamentosSelecionados").append(await geraHtmlEquipamento(equipamento[0]));
        
    }
    catch(error){
        showMessage("Erro ao consultar equipamentos selecionados", error, "warning");
        throw error;
    }

    function promiseConsultaEquipamento(PREFIXO){
        return new Promise((resolve,reject)=>{
            DatasetFactory.getDataset("dsConsultaVIEW_EQUIPAMENTOS_CONTRATOS",null,[
                DatasetFactory.createConstraint("PREFIXO", PREFIXO, PREFIXO, ConstraintType.MUST)
            ],null,{
                success:ds=>{
                    if (ds.values[0].STATUS != "SUCCESS") {
                        reject(ds.values[0].MENSAGEM);
                    }else{
                        resolve(JSON.parse(ds.values[0].RESULT));
                    }
                },
                error:e=>{
                    reject(e);
                }
            });
        });
    }
    async function geraHtmlEquipamento(equipamento){
        console.log(equipamento)
        var html = 
        `<div class="divEquipamento">
            <label style="float: right;">Valor de Locação</label>
            <br>
            <div class="row">
                <div class="col-md-12">
                    <h3 style="display: flex; justify-content: space-between; margin-top:0px; margin-bottom:0px;">
                        <span>${equipamento.DESCRICAO.toUpperCase()}</span>  
                        <span>${floatToMoney(equipamento.VALOR_LOCACAO)}</span>
                    </h3>
                </div>   
            </div>
            <div class="row">
                <div class="col-md-6">
                    <label>Prefixo: </label> <span>${equipamento.PREFIXO}</span>
                    <label>Modelo: </label> <span>${equipamento.MODELO}</span>
                </div>
                <div class="col-md-6" style="text-align: right;">
                    <label>Valor do Equipamento: </label> <span>${equipamento.PREFIXO}</span>
                </div>
            </div>
            <hr>
            <div class="divDetailsEquipamento">
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
                <div>
                    <h4>Anexos: </h4>
                    <div>
                        ${await geraHtmlAnexos(equipamento)}
                    </div>
                </div>
            </div>
        </div>`;

        return html;
    }
    async function geraHtmlAnexos(equipamento){
        var html = "";

        for (const documentId of equipamento.ANEXOS_FOTOS.split(",")) {
            html += await htmlNovoAnexo(documentId,await promiseGetDocumentDescription(documentId));
        }
        for (const documentId of equipamento.ANEXOS_DOCUMENTACAO.split(",")) {
            html += await htmlNovoAnexo(documentId,await promiseGetDocumentDescription(documentId));
        }
        for (const documentId of equipamento.ANEXOS_LAUDO.split(",")) {
            html += await htmlNovoAnexo(documentId,await promiseGetDocumentDescription(documentId));
        }
        for (const documentId of equipamento.ANEXOS_PLANO_MANUTENCAO.split(",")) {
            html += await htmlNovoAnexo(documentId,await promiseGetDocumentDescription(documentId));
        }
        for (const documentId of equipamento.ANEXOS_ART.split(",")) {
            html += await htmlNovoAnexo(documentId,await promiseGetDocumentDescription(documentId));
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