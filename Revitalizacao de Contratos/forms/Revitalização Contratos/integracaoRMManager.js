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
