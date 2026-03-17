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
                if (ds.values.length < 1) {
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
        $("#tableQuadroStatusAssinatura>tbody").html("");
        for (const assinatura of assinaturas) {
            const assinantes = JSON.parse(assinatura.jsonSigners);

            html += 
            `<tr>
                <td>${assinatura.nmArquivo}</td>
                <td><button class="btn btn-primary btnAssinantes">${assinantes.length} Assinantes </button></td>
                <td>${assinatura.dataEnvio} ${assinatura.horaEnvio}</td>
                <td>${assinatura.nmRemetente}</td>
                <td>
                    ${assinatura.msgErro ? assinatura.msgErro:assinatura.statusAssinatura}
                </td>
            </tr>`;

            $("#tableQuadroStatusAssinatura>tbody").append(html);
            $("#tableQuadroStatusAssinatura>tbody>tr:last").find(".btnAssinantes").on("click",{assinantes:assinantes, title:assinatura.nmArquivo}, function(event){
                const assinantes = event.data.assinantes;
                const title = event.data.title;
                modalAssinantes(assinantes, title);

            });
        }

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
function modalAssinantes(assinantes, title){
    FLUIGC.modal({
        title: title,
        content: geraHtmlModal(assinantes),
        id: 'fluig-modal',
        size: 'full',
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


    function geraHtmlModal(assinantes){
        var html = 
        `<table class="table table-bordered">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>CPF</th>
                    <th>Status</th>
                    <th>Link</th>
                </tr>
            </thead>
            <tbody>
                ${geraLinhasTabelaAssinantes(assinantes)}
            </tbody>
        </table`;

        return html;
    }
    function geraLinhasTabelaAssinantes(assinantes){
        var html = "";

        for (const assinante of assinantes) {
            html += 
            `<tr>
                <td>${assinante.nome}</td>
                <td>${hex2a(assinante.email)}</td>
                <td>${hex2a(assinante.cpf)}</td>
                <td>${assinante.status}</td>
                <td>${assinante.signUrl}</td>
            </tr>`;
        }

        return html;
    }
}


// Testemunhas
function abreModalCadastrarAssinante(){
   var myModal = FLUIGC.modal({
        title: 'Adicionar testemunha',
        content: modalHtml(),
        id: 'fluig-modal',
        size: 'full',
        actions: [{
            'label': 'Cadastrar',
            'bind': 'data-open-modal',
        },{
            'label': 'Cancelar',
            'autoClose': true
        }]
    }, function(err, data) {
        if(err) {
         
        } else {
            $(".cpfCadastroAssinante").mask("000.000.000-00", { placeholder: "___.___.___-__" });
            $("[data-open-modal]").on("click", async function(){
                var nome = $(".nomeCadastroAssinante").val();
                var email = $(".emailCadastroAssinante").val();
                var cpf = $(".cpfCadastroAssinante").val();

                var assinantesCadastrados = await promiseBuscaAssinantes();
                var found = assinantesCadastrados.find(e=>hex2a(e.email) == email || e.email == email);
                if (found) {
                    showMessage("E-mail já cadastrado.","","warning");
                    return;
                }
                
                var ds = DatasetFactory.getDataset('ds_auxiliar_wesign', null, [
                    DatasetFactory.createConstraint("nome", nome, nome, ConstraintType.MUST),
                    DatasetFactory.createConstraint("email", email, email, ConstraintType.MUST),
                    DatasetFactory.createConstraint("cEmail", email, email, ConstraintType.MUST),
                    DatasetFactory.createConstraint("tipo", "E", "E", ConstraintType.MUST),
                    DatasetFactory.createConstraint("cpf", cpf, cpf, ConstraintType.MUST),
                    DatasetFactory.createConstraint("cCpf", cpf, cpf, ConstraintType.MUST),
                    DatasetFactory.createConstraint("titulo", "", "", ConstraintType.MUST),
                    DatasetFactory.createConstraint("empresa", "", "", ConstraintType.MUST),
                    DatasetFactory.createConstraint("metodo", "createSigner", "createSigner", ConstraintType.MUST)
                ], null);

                if (ds.values[0].Result == "OK") {
                    asyncAtualizaListaDeAssinantes();
                    $(window["fluig-modal"]).find("[data-dismiss]").click();
                }
                else {
                    FLUGIC.toast({
                        title:"Erro ao cadastrar assinante",
                        message:"",
                        type:"warning",
                    });
                }
            });
        }
    });

    function modalHtml(){
        return `
            <div class="row">
                <div class="col-md-12">
                    <label>Nome: </label>
                    <input type="text" class="form-control nomeCadastroAssinante"/>
                </div>
                <div class="col-md-12">
                    <label>E-mail: </label>
                    <input type="text" class="form-control emailCadastroAssinante"/>
                </div>
                <div class="col-md-12">
                    <label>CPF: </label>
                    <input type="text" class="form-control cpfCadastroAssinante"/>
                </div>
            </div>
        `;
    }
}
function promiseBuscaAssinantes(){
    return new Promise((resolve, reject)=>{
        DatasetFactory.getDataset("dsCadastroAssinantesWesign",null,null,null,{
            success:ds=>{
                if (ds.values[0].STATUS != "SUCCESS") {
                    reject(ds.values[0].MENSAGEM)
                }
                else{
                    resolve(JSON.parse(ds.values[0].RESULT));
                }

            },
            error:e=>{
                console.error(e);
                reject(e);
            }
        });
    });
}
async function asyncAtualizaListaDeAssinantes(){
    var assinantes = await promiseBuscaAssinantes();
    $("#selectTestemunha")[0].selectize.addOption(assinantes.map(e=>{return {value:`${e.NOME} - ${hex2a(e.email)} - ${hex2a(e.cpf)}`, text:`${e.NOME} - ${hex2a(e.email)} - ${hex2a(e.cpf)}`}}));
}
function salvaTestemunhasNoCampoHidden(){
    var json = [];
    $("#tableTestemunhas>tbody>tr").each(function(){
        var list = [];
        $(this).find("td:not(:last)").each(function(){
            list.push($(this).text());
        });
        var [nome, email, cpf] = list;
        json.push({nome, email, cpf});
    });

    $("#jsonTestemunhas").val(JSON.stringify(json));
}
function carregaTestemunhas(edita){
    var json = $("#jsonTestemunhas").val();
    if(!json){
        return;
    }
    json = JSON.parse(json);
    var html = "";
    for (const testemunha of json) {
        html += 
        `<tr>
            <td>${testemunha.nome}</td>
            <td>${testemunha.email}</td>
            <td>${testemunha.cpf}</td>
            <td>${edita ? 
                    `<button class="btn btn-danger btnDelete">
                        <i class="flaticon flaticon-trash icon-md" aria-hidden="true"></i>
                    </button>`:""
                }
            </td>
        </tr>`;
        
        if (edita) {
            $("#tableTestemunhas>tbody>tr").find(".btnDelete").on("click", function () {
                $(this).closest("tr").remove();
                salvaTestemunhasNoCampoHidden();
            });
        }
    }


    
    $("#tableTestemunhas>tbody").html(html);
}

// Utils
function hex2a(e) {
    for (
        var t = String(e), a = "", i = 0;
        i < t.length && "00" !== t.substr(i, 2);
        i += 2
    )
        a += String.fromCharCode(parseInt(t.substr(i, 2), 16));
    return a;
}
function a2hex(e) {
    for (var t = [], a = 0, i = (e = String(e)).length; a < i; a++) {
        var o = Number(e.charCodeAt(a)).toString(16);
        t.push(o);
    }
    return t.join("");
}
