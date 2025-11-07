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
    $("#spanNomeRepresentanteCastilho").text($("#nomeRepresentanteCastilho").val() ? $("#nomeRepresentanteCastilho").val():$("#nomeRepresentanteCastilho").text());
    $("#spanCpfRepresentanteCastilho").text($("#cpfRepresentanteCastilho").val() ? $("#cpfRepresentanteCastilho").val():$("#cpfRepresentanteCastilho").text());
    $("#spanMailRepresentanteCastilho").text($("#mailRepresentanteCastilho").val() ? $("#mailRepresentanteCastilho").val():$("#mailRepresentanteCastilho").text());

    $("#spanNomeRepresentanteFornecedor").text($("#nomeRepresentanteFornecedor").val()?$("#nomeRepresentanteFornecedor").val():$("#nomeRepresentanteFornecedor").text());
    $("#spanCpfRepresentanteFornecedor").text($("#cpfRepresentanteFornecedor").val()?$("#cpfRepresentanteFornecedor").val():$("#cpfRepresentanteFornecedor").text());
    $("#spanMailRepresentanteFornecedor").text($("#mailRepresentanteFornecedor").val()?$("#mailRepresentanteFornecedor").val():$("#mailRepresentanteFornecedor").text());

    $("#spanAssinaturaContrato").text($("#assinaturaContrato").val()?$("#assinaturaContrato").val():$("#assinaturaContrato").text());

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

async function asyncGeraQuadroStatusAssinatura(){
    try {
        const assinaturas = await promiseConsultaAssinaturaEnviadasPeloProcesso();
        var html = "";
        for (const assinatura of assinaturas) {
            const assinantes = JSON.parse(assinatura.jsonSigners);

            html += 
            `<tr>
                <td>${assinatura.nmArquivo}</td>
                <td><button class="btn btn-primary">${assinantes.length} Assinantes </button></td>
                <td>${assinatura.dataEnvio} ${assinatura.horaEnvio}</td>
                <td>${assinatura.nmRemetente}</td>
                <td>
                    ${assinatura.msgErro ? assinatura.msgErro:assinatura.statusAssinatura}
                </td>

            </tr>`;
        }

        $("#tableQuadroStatusAssinatura>tbody").html(html);
    } catch (error) {
        showMessage("Não foi possível gerar o quadro de assinaturas: " + error);
    }


    function promiseConsultaAssinaturaEnviadasPeloProcesso(){
        return new Promise((resolve,reject)=>{
            const numProces = $("#numProces").val();

            DatasetFactory.getDataset("ds_form_aux_wesign",null,[
                DatasetFactory.createConstraint("numSolic", numProces,numProces, ConstraintType.MUST),
            ],null,{
                success:ds=>{
                    if (ds.values.length == 0) {
                        reject("Nenhuma assinatura foi encontrada!");
                    }else{
                        resolve(ds.values);
                    }
                },
                error:e=>reject(e)
            });
        });
    }

}