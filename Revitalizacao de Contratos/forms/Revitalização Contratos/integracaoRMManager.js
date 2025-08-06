function adicionarItemNovoContrato(){
    var id = wdkAddChild("tableNovoContratoItens");

    $(".divNovoContratoTableRateiosItens:last").html(geraTabelaRateio());
    $(".btnAdicionarRateio:last").on("click", function(){
        $(this).closest("table").find("tbody").append(geraLinhaTabela());
    });

    function geraTabelaRateio(){
        var html = 
        `<table class="table table-striped">
            <thead>
                <tr>
                    <th>Rateio</th>
                    <th>Departamento</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody></tbody>
            <tfoot>
                <tr>
                    <td>
                        <button class="btn btn-primary btnAdicionarRateio">Adicionar Rateio</button>
                    </td>
                </tr>
            </tfoot>
        </table>`;
        return html;
    }
}
function geraLinhaTabela(){
    var html = 
    `<tr>
        <td>1</td>
        <td>
            <select class="form-control"></select>
        </td>
        <td>
            <input class="form-control" />
        </td>
    </tr>`;
    return html;
}