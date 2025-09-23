async function asyncPreencheRepresentanteCastilho() {
    try {
        const CODCOLIGADA = $("#CODCOLIGADA").val();
        const TIPO_CONTRATO = $("#tipoContrato").val();
        var representante = regraRepresentantes(CODCOLIGADA, TIPO_CONTRATO);

        var cadastroAssinante = await promiseBuscaCadastroDeAssinantePorNome(representante);

        $("#nomeRepresentanteCastilho").val(cadastroAssinante.nome);
        $("#cpfRepresentanteCastilho").val(cadastroAssinante.cCpf);
        $("#mailRepresentanteCastilho").val(cadastroAssinante.cEmail);

    } catch (error) {
        showMessage("Erro ao buscar representante da Castilho: ", error, "warning");
    }
}
async function asyncVerificaSeExisteAssinanteCadastradoPorNome(nome) {
    try {
        var cadastroAssinante = await promiseBuscaCadastroDeAssinantePorNome(nome);
        $("#cpfRepresentanteFornecedor").val(cadastroAssinante.cCpf);
        $("#mailRepresentanteFornecedor").val(cadastroAssinante.cEmail);

    } catch (error) {
        showMessage("Erro ao buscar assinante: ", error, "warning");
    }
}


function promiseBuscaCadastroDeAssinantePorNome(nome) {
    return new Promise((resolve, reject) => {
        DatasetFactory.getDataset("ds_wesign_assinantes", null, [
            DatasetFactory.createConstraint("nome", nome, nome, ConstraintType.MUST)
        ], null, {
            success: ds => {
                if (ds.values.length != 1) {
                    reject("Assinante não encontrado");
                }
                else {
                    resolve(ds.values[0]);
                }
            },
            error: error => {
                reject(error);
            }
        });
    });
}


function preencheInformacoesAprovacao() {
    $("#spanNomeRepresentanteCastilho").text($("#nomeRepresentanteCastilho").val());
    $("#spanCpfRepresentanteCastilho").text($("#cpfRepresentanteCastilho").val());
    $("#spanMailRepresentanteCastilho").text($("#mailRepresentanteCastilho").val());

    $("#spanNomeRepresentanteFornecedor").text($("#nomeRepresentanteFornecedor").val());
    $("#spanCpfRepresentanteFornecedor").text($("#cpfRepresentanteFornecedor").val());
    $("#spanMailRepresentanteFornecedor").text($("#mailRepresentanteFornecedor").val());

    $("#spanAssinaturaContrato").text($("#assinaturaContrato").val());

    $("#assinaturaContrato").hide();
}




function onchangeTipoAssinaturaContrato() {
    var val = $("#assinaturaContrato").val();

    if (val == "Eletrônica") {


    } else if (val == "Manual") {

    }
}