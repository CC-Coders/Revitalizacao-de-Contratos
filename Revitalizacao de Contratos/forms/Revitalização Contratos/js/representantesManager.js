async function asyncPreencheRepresentanteCastilho() {
    try {
        const CODCOLIGADA = $("#CODCOLIGADA").val();
        const TIPO_CONTRATO = $("#tipoContrato").val();
        var representante = regraRepresentantes(CODCOLIGADA, TIPO_CONTRATO);

        var cadastroAssinante = await promiseBuscaCadastroDeAssinantePorNome(representante);

        $("#nomeRepresentanteCastilho").val(cadastroAssinante.nome);
        $("#cpfRepresentanteCastilho").val(hex2a(cadastroAssinante.cpf));
        $("#mailRepresentanteCastilho").val(hex2a(cadastroAssinante.email));

    } catch (error) {
        showMessage("Erro ao buscar representante da Castilho: ", error, "warning");
    }
}
async function asyncVerificaSeExisteAssinanteCadastradoPorNome() {
    var nome = $(this).val();
    console.log(nome)
    try {
        var cadastroAssinante = await promiseBuscaCadastroDeAssinantePorNome(nome);
        $("#cpfRepresentanteFornecedor").val(hex2a(cadastroAssinante.cpf));
        $("#mailRepresentanteFornecedor").val(hex2a(cadastroAssinante.email));

    } catch (error) {
        console.error("Erro ao buscar assinante: ", error);
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

function hex2a(e) {
    for (var t = String(e), a = "", i = 0; i < t.length && "00" !== t.substr(i, 2); i += 2) a += String.fromCharCode(parseInt(t.substr(i, 2), 16));
    return a;
}




function onchangeTipoAssinaturaContrato() {
    var val = $("#assinaturaContrato").val();

    if (val == "Eletrônica") {

        $("#mailRepresentanteCastilho, #mailRepresentanteFornecedor").closest("div").show();
        
    } else if (val == "Manual") {
        $("#mailRepresentanteCastilho, #mailRepresentanteFornecedor").closest("div").hide();
    }
}