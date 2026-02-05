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
                  return `<input type="checkbox" />`
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
        
    });

}

async function atualizaDatatableContratoPrincipal(){
    try {
        var CODCOLIGADA = $("#CODCOLIGADA").val();
        var CODCCUSTO = $("#CODCCUSTO").val();
        var CNPJ = $("#hiddenCGCCFO").val();
        if (CODCOLIGADA && CODCCUSTO && CNPJ) {
            var contratos = await buscaContratos(CODCOLIGADA, CODCCUSTO, CNPJ);
            
            dataTableContratoPrincipal.clear().draw();
            dataTableContratoPrincipal.rows.add(contratos); // Add new data
            dataTableContratoPrincipal.columns.adjust().draw(); // Redraw the DataTable
            
        }

    } catch (error) {
        throw error;
    }
}

function buscaContratos(CODCOLIGADA, CCUSTO, CNPJ){
    return new Promise((resolve, reject)=>{
        DatasetFactory.getDataset("DatasetProcessoContratos", null,[
            DatasetFactory.createConstraint("OPERACAO", "BuscaContratosPorFornecedor", "BuscaContratosPorFornecedor", ConstraintType.MUST),
            DatasetFactory.createConstraint("CODCOLIGADA", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
            DatasetFactory.createConstraint("CCUSTO", CCUSTO, CCUSTO, ConstraintType.MUST),
            DatasetFactory.createConstraint("CNPJ", CNPJ, CNPJ, ConstraintType.MUST),
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