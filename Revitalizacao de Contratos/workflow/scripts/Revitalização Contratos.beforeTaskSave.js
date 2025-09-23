var ATIVIDADES = {
    INICIO_0: 0,
    INICIO: 4,
    JURIDICO: 5,
    SUPRIMENTOS: 17,
    SEGURANCA: 19,
    SEGURANCA: 19,
    CONTROLADORIA: 32,
    ENGENHEIRO: 43,
    COORDENADOR_OBRAS: 48,
    DIRETORIA: 53,
    ASSINATURA_ELETRONICA: 66,
};

var STATUS_CONTRATOS = {
    ATIVO: "01",
    CANCELADO: "02",
    ENCERRADO: "03",
    "EM ANDAMENTO MTZ": "04",
    "PENDENTE OBRA": "05",
    "ENCERRADO SEM DOC.": "06",
    ESPORÁDICO: "07",
    "SEM CONTRATO": "08",
    FLUIG: "09",
    "ATIVO SEM DOC": "10",
    "RESCISÃO EM ANDAMENTO": "11",
};

var TIPOS_CONTRATO = {
    Empréstimos: "01",
    Financiamentos: "02",
    "Locação de Imóvel": "04",
    "Locação de Equipamentos - S/M.O.": "06",
    "Prestação de Serviços - Sub-Empreiteiros": "07",
    "Fornecimento de Material": "08",
    "Locação de Equipamentos - C/M.O.": "09",
    "Prestação de Serviços": "10",
    "Transporte de Material - S/M.O.": "11",
    Finame: "12",
    CDC: "13",
    "Prestação de Serviços - Vigilância": "14",
    "Prestação de Serviços - Sub/Retenção": "15",
    Clientes: "16",
    "Cartão de Crédito": "17",
    Consórcio: "18",
    PJ: "19",
};

var TIPOS_FATURAMENTO = {
    "Não Periódico": 0,
    Periódico: 1,
    "Por Medição": 2,
};

function beforeTaskSave(colleagueId, nextSequenceId, userList) {
    try {
        var ATIVIDADE_ATUAL = getValue("WKNumState");

        if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO || ATIVIDADE_ATUAL == ATIVIDADES.INICIO_0) {
            beforeTaskSave_inicio();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.JURIDICO) {
            beforeTaskSave_juridico();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.CONTROLADORIA) {
            beforeTaskSave_controladoria();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.ENGENHEIRO) {
            beforeTaskSave_engenheiro();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.COORDENADOR_OBRAS) {
            beforeTaskSave_coordenadorObras();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.DIRETORIA) {
            beforeTaskSave_diretoria();
        }
    } catch (error) {
        throw error;
    }
}

function beforeTaskSave_inicio() {
    var docIdContrato = hAPI.getCardValue("contratoDocumentId");
    hAPI.attachDocument(docIdContrato);

    insereHistorico(hAPI.getCardValue("observacoes"), "Início", "Início");
}
function beforeTaskSave_juridico() {
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Jurídico");
}
function beforeTaskSave_controladoria() {
    try {
        insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Controladoria");

        var tipo = hAPI.getCardValue("origemContrato");
        if (tipo == "Novo") {
            var criaNovoContratoRM = hAPI.getCardValue("checkboxLancarNovoContrato") == "on";
            if (criaNovoContratoRM) {
                var IDCNT = criaNovoContrato();
                hAPI.setCardValue("IDCNT", IDCNT);
            }
        } else if (tipo == "Aditivos") {
            alteraStatusContrato(hAPI.getCardValue("CODCOLIGADA"), hAPI.getCardValue("IDCNT"), "PENDENTE OBRA");
            // TODO - Inserir relação do Aditivo com o Contrato na tabela Custom de Contratos
        } else if (tipo == "Rescisões") {
            alteraStatusContrato(hAPI.getCardValue("CODCOLIGADA"), hAPI.getCardValue("IDCNT"), "RESCISÃO EM ANDAMENTO");
            // TODO - Inserir relação da Rescisão com o Contrato na tabela Custom de Contratos
        }
    } catch (error) {
        throw error;
    }
}
function beforeTaskSave_engenheiro() {
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Aprovação Engenheiro");
}
function beforeTaskSave_coordenadorObras() {
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Aprovação Coordenador");
}
function beforeTaskSave_diretoria() {
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Aprovação Diretoria");
}

// Integração RM
function criaNovoContrato() {
    try {
        var parametros = buscaParamentrosCriacaoContrato();
        validaParametros(parametros);
        log.info("Paramentros novo contrato: ");
        log.dir(parametros);
        var contexto = "CODSISTEMA=G;CODCOLIGADA=" + parametros.CODCOLIGADA + ";CODUSUARIO=fluig";
        var xml = montaXMLCriacaoDeContrato(parametros);
        log.info("XML novo Contrato: ");
        log.info(xml);

        var retorno = DatasetFactory.getDataset(
            "InsereContratoRM",
            null,
            [
                DatasetFactory.createConstraint("coligada", parametros.CODCOLIGADA, parametros.CODCOLIGADA, ConstraintType.MUST),
                DatasetFactory.createConstraint("idContrato", parametros.IDCNT, parametros.IDCNT, ConstraintType.MUST),
                DatasetFactory.createConstraint("contexto", contexto, contexto, ConstraintType.MUST),
                DatasetFactory.createConstraint("xml", xml, xml, ConstraintType.MUST),
            ],
            null
        );

        if (!retorno || retorno == "" || retorno == null) {
            throw "Houve um erro na comunicação com o webservice. Tente novamente!";
        } else {
            if (retorno.values[0][0] == "false") {
                throw "Erro ao gerar contrato. Favor entrar em contato com o administrador do sistema. Mensagem: " + retorno.values[0][1];
            } else if (retorno.values[0][0] == "true") {
                return retorno.values[0][2];
            }
        }
    } catch (error) {
        throw error;
    }
}
function buscaParamentrosCriacaoContrato() {
    var CODCOLIGADA = hAPI.getCardValue("novoContratoColigada");
    var CODFILIAL = hAPI.getCardValue("novoContratoFilial");
    var CODIGOTIPOCONTRATO = hAPI.getCardValue("novoContratoTipoContrato");
    var CODTCN = hAPI.getCardValue("novoContratoTipoContrato");
    var CODCCUSTO = hAPI.getCardValue("novoContratoCCUSTO");
    var CODIGOCONTRATO = hAPI.getCardValue("novoContratoCodigo");
    var locEstoque = hAPI.getCardValue("novoContratoLocalDeEstoque");
    var CODCFO = hAPI.getCardValue("novoContratoFornecedor");
    var CODRPR = hAPI.getCardValue("novoContratoRepresentante");
    var DATAINICIO = hAPI.getCardValue("novoContratoDataInicio");
    var DATAFIM = hAPI.getCardValue("novoContratoDataFim");
    var CODSTACNT = hAPI.getCardValue("novoContratoSTATUS");
    var NOME = hAPI.getCardValue("novoContratoObjeto");
    if (NOME.length() > 40) {
        // A coluna na base do RM tem limite de 40 caracteres
        NOME = NOME.substring(0, 40);
    }
    var CODCPG = hAPI.getCardValue("novoContratoCondicaoPagamento");
    var TIPOFATURAMENTO = hAPI.getCardValue("novoContratoTipoFaturamento");
    var DIAFATURAMENTO = hAPI.getCardValue("novoContratoDiaFaturamento");
    var QTDEFATURAMENTOS = hAPI.getCardValue("novoContratoQtdeFaturamento");
    var urlSolicitacao = getServerURL() + "/portal/p/1/pageworkflowview?app_ecm_workflowview_detailsProcessInstanceID=" + getValue("WKNumProces");

    var IDCNT = hAPI.getCardValue("novoContratoIdCnt");
    if (IDCNT == "" || IDCNT == null || IDCNT != undefined) {
        var IDCNT = -1;
    }

    var ITENS = [];
    var indexes = hAPI.getChildrenIndexes("tableNovoContratoItens");
    for (var i = 0; i < indexes.length; i++) {
        var id = indexes[i];

        ITENS.push({
            IDPRD: hAPI.getCardValue("novoContratoItemProduto" + "___" + id) + "",
            VALOR: hAPI.getCardValue("novoContratoItemValor" + "___" + id) + "",
            RATDEP: JSON.parse(hAPI.getCardValue("novoContratoJsonRateiosItem" + "___" + id) + ""),
        });
    }

    return {
        CODCOLIGADA: CODCOLIGADA + "",
        IDCNT: IDCNT + "",
        CODFILIAL: CODFILIAL + "",
        CODIGOTIPOCONTRATO: CODIGOTIPOCONTRATO + "",
        CODTCN: CODTCN + "",
        CODCCUSTO: CODCCUSTO + "",
        CODIGOCONTRATO: CODIGOCONTRATO + "",
        locEstoque: locEstoque + "",
        CODCFO: CODCFO + "",
        CODRPR: CODRPR + "",
        DATAINICIO: DATAINICIO + "",
        DATAFIM: DATAFIM + "",
        NOME: NOME + "",
        CODSTACNT: CODSTACNT + "",
        CODCPG: CODCPG + "",
        DIAFATURAMENTO: DIAFATURAMENTO + "",
        QTDEFATURAMENTOS: QTDEFATURAMENTOS + "",
        urlSolicitacao: urlSolicitacao + "",
        TIPOFATURAMENTO: TIPOFATURAMENTO + "",
        NATUREZA: "1" + "",
        ITENS: ITENS,
    };
}
function validaParametros(parametros) {

    var erroRetorno = [];
    if (parametros.CODCOLIGADA == undefined || parametros.CODCOLIGADA == null || parametros.CODCOLIGADA == "") {
        erroRetorno.push("CODCOLIGADA");
    }

    if (parametros.CODFILIAL == undefined || parametros.CODFILIAL == null || parametros.CODFILIAL == "") {
        erroRetorno.push("CODFILIAL");
    }

    if (parametros.CODIGOTIPOCONTRATO == undefined || parametros.CODIGOTIPOCONTRATO == null || parametros.CODIGOTIPOCONTRATO == "") {
        erroRetorno.push("CODIGOTIPOCONTRATO");
    }

    if (parametros.CODTCN == undefined || parametros.CODTCN == null || parametros.CODTCN == "") {
        erroRetorno.push("CODTCN");
    }

    if (parametros.CODCCUSTO == undefined || parametros.CODCCUSTO == null || parametros.CODCCUSTO == "") {
        erroRetorno.push("CODCCUSTO");
    }

    if (parametros.CODIGOCONTRATO == undefined || parametros.CODIGOCONTRATO == null || parametros.CODIGOCONTRATO == "") {
        erroRetorno.push("CODIGOCONTRATO");
    }

    if (parametros.locEstoque == undefined || parametros.locEstoque == null || parametros.locEstoque == "") {
        erroRetorno.push("locEstoque");
    }

    if (parametros.CODCFO == undefined || parametros.CODCFO == null || parametros.CODCFO == "") {
        erroRetorno.push("CODCFO");
    }

    if (parametros.CODRPR == undefined || parametros.CODRPR == null || parametros.CODRPR == "") {
        erroRetorno.push("CODRPR");
    }

    if (parametros.DATAINICIO == undefined || parametros.DATAINICIO == null || parametros.DATAINICIO == "") {
        erroRetorno.push("DATAINICIO");
    }

    if (parametros.DATAFIM == undefined || parametros.DATAFIM == null || parametros.DATAFIM == "") {
        erroRetorno.push("DATAFIM");
    }

    if (parametros.NOME == undefined || parametros.NOME == null || parametros.NOME == "") {
        erroRetorno.push("NOME");
    }

    if (parametros.CODCPG == undefined || parametros.CODCPG == null || parametros.CODCPG == "") {
        erroRetorno.push("CODCPG");
    }

    if (parametros.CODTCN == TIPOS_CONTRATO["Locação de Imóvel"]) {
        // Se for locação de imóvel, deve preenchide dia e quantidade de Faturamentos
        if (parametros.DIAFATURAMENTO == undefined || parametros.DIAFATURAMENTO == null || parametros.DIAFATURAMENTO == "") {
            erroRetorno.push("DIAFATURAMENTO");
        }
        if (parametros.QTDEFATURAMENTOS == undefined || parametros.QTDEFATURAMENTOS == null || parametros.QTDEFATURAMENTOS == "") {
            erroRetorno.push("QTDEFATURAMENTOS");
        }
    }

    if (parametros.urlSolicitacao == undefined || parametros.urlSolicitacao == null || parametros.urlSolicitacao == "") {
        erroRetorno.push("urlSolicitacao");
    }

    if (parametros.ITENS == undefined || parametros.ITENS == null || parametros.ITENS == "") {
        erroRetorno.push("ITENS");
    }

    // try {
    //     log.info(parametros.ITENS);
    //     parametros.ITENS = JSONUtil.toJSON(parametros.ITENS);
    // } catch (error) {
    //     log.info("Erro no parse do JSON ITENS");
    //     log.dir(error);
    //     erroRetorno.push("ITENS");
    // }

    for (var i = 0; i < parametros.ITENS.length; i++) {
        var item = parametros.ITENS[i];

        if (item.IDPRD == undefined || item.IDPRD == null || item.IDPRD == "") {
            erroRetorno.push("IDPRD");
        }
        if (item.VALOR == undefined || item.VALOR == null || item.VALOR == "") {
            erroRetorno.push("VALOR");
        }
        if (item.RATDEP == undefined || item.RATDEP == null || item.RATDEP == "") {
            erroRetorno.push("RATDEP");
        }

        try {
            log.info(typeof item.RATDEP);
            log.info(item.RATDEP.length);
            log.dir(item.RATDEP);

            // item.RATDEP = JSON.parse(item.RATDEP);
        } catch (error) {
            log.info("Erro no parse do JSON RATDEP");
            erroRetorno.push("Item RATDEP");
        }

        try {


            for (var j = 0; j < item.RATDEP.length; j++) {
                var RATEIO = item.RATDEP[j];
                log.dir(item.RATDEP);
                log.dir(RATEIO);
                log.dir(item.RATDEP[j]);
                log.info(RATEIO.CODDEPTO);

                if (RATEIO.CODDEPTO == undefined || item.RATDEP[j].CODDEPTO == null || item.RATDEP[j].RATEIO.CODDEPTO == "") {
                    erroRetorno.push("RATDEP DEPTO");
                }
                if (item.RATDEP[j].PERCENTUAL == undefined || item.RATDEP[j].PERCENTUAL == null || item.RATDEP[j].PERCENTUAL == "") {
                    erroRetorno.push("RATDEP PERCENTUAL");
                }
            }
        } catch (error) {
            log.dir(error);
        }
    }

    if (erroRetorno.length > 0) {
        throw erroRetorno.join(", ");
    }
}

function montaXMLCriacaoDeContrato(parametros) {
    var xml = "";
    xml += "<CTRCNT>";
    xml += "    <TCNT>";
    xml += "        <CODCOLIGADA>" + parametros.CODCOLIGADA + "</CODCOLIGADA>";
    xml += "        <IDCNT>" + parametros.IDCNT + "</IDCNT>";
    xml += "        <CODCOLCFO>0</CODCOLCFO>";
    xml += "        <NOME>" + parametros.NOME + "</NOME>";
    xml += "        <CODCCUSTO>" + parametros.CODCCUSTO + "</CODCCUSTO>";
    xml += "        <NATUREZA>" + parametros.NATUREZA + "</NATUREZA>";
    xml += "        <CODTCN>" + parametros.CODTCN + "</CODTCN>";
    xml += "        <CODFILIAL>" + parametros.CODFILIAL + "</CODFILIAL>";
    xml += "        <CODIGOCONTRATO>" + parametros.CODIGOCONTRATO + "</CODIGOCONTRATO>";
    xml += "        <CODCFO>" + parametros.CODCFO + "</CODCFO>";
    xml += "        <CODRPR>" + parametros.CODRPR + "</CODRPR>";
    xml += "        <CODSTACNT>" + parametros.CODSTACNT + "</CODSTACNT>";
    xml += "        <CODCPG>" + parametros.CODCPG + "</CODCPG>";
    xml += "        <CODCPGPRAZO>130</CODCPGPRAZO>";
    xml += "        <DATACONTRATO>" + setDateXMLFormat(parametros.DATAINICIO) + "</DATACONTRATO>";
    xml += "        <DATAINICIO>" + setDateXMLFormat(parametros.DATAINICIO) + "</DATAINICIO>";
    xml += "        <DATAFIM>" + setDateXMLFormat(parametros.DATAFIM) + "T00:00:00</DATAFIM>";
    xml += "        <CODMOEVALORCONTRATO>R$</CODMOEVALORCONTRATO>";
    xml += "        <IMPRIMEMOV>1</IMPRIMEMOV>";
    if (parametros.TIPOFATURAMENTO == TIPOS_FATURAMENTO["Periódico"]) {
        xml += "    <DIAFATURAMENTO>" + parametros.DIAFATURAMENTO + "</DIAFATURAMENTO>";
        xml += "    <QTDEFATURAMENTOS>" + parametros.QTDEFATURAMENTOS + "</QTDEFATURAMENTOS>";
    }
    xml += "        <CODUSUARIO>" + getValue("WKUser") + "</CODUSUARIO>";
    xml += "    </TCNT>";
    xml += "    <TCNTHISTORICO>";
    xml += "        <CODCOLIGADA>" + parametros.CODCOLIGADA + "</CODCOLIGADA>";
    xml += "        <IDCNT>" + parametros.IDCNT + "</IDCNT>";
    xml += "        <HISTORICOLONGO>" + parametros.urlSolicitacao + "</HISTORICOLONGO>";
    xml += "    </TCNTHISTORICO>";
    xml += "    <TCNTCOMPL>";
    xml += "        <CODCOLIGADA>" + parametros.CODCOLIGADA + "</CODCOLIGADA>";
    xml += "        <IDCNT>" + parametros.IDCNT + "</IDCNT>";
    xml += "    </TCNTCOMPL>";
    xml += geraXML_TITMCNT(parametros);
    xml += geraXML_TITMCNTRATCCU(parametros);
    xml += geraXML_TITMCNTRATDEP(parametros);
    xml += "</CTRCNT>";

    return xml;
}
function geraXML_TITMCNT(parametros) {
    var xml = "";

    for (var i = 0; i < parametros.ITENS.length; i++) {
        var item = parametros.ITENS[i];

        xml += "<TITMCNT>";
        xml += "    <CODCOLIGADA>" + parametros.CODCOLIGADA + "</CODCOLIGADA>";
        xml += "    <IDCNT>" + parametros.IDCNT + "</IDCNT>";
        xml += "    <NSEQITMCNT>" + (i + 1) + "</NSEQITMCNT>";
        xml += "    <IDPRD>" + item.IDPRD + "</IDPRD>";
        xml += "    <CODFILIALFAT>" + parametros.CODFILIAL + "</CODFILIALFAT>";
        xml += "    <CODLOCFATURAM>" + parametros.locEstoque + "</CODLOCFATURAM>";
        xml += "    <CODCCUSTO>" + parametros.CODCCUSTO + "</CODCCUSTO>";
        xml += "    <CODCFO>" + parametros.CODCFO + "</CODCFO>";
        xml += "    <QUANTIDADE>1</QUANTIDADE>";
        xml += "    <CODCPG>" + parametros.CODCPG + "</CODCPG>";
        xml += "    <CODMOEPRECOFATURAMENTO>R$</CODMOEPRECOFATURAMENTO>";
        xml += "    <CODSTACNT>" + parametros.CODSTACNT + "</CODSTACNT>";
        xml += "    <CODTMV>" + (parametros.CODTCN == TIPOS_CONTRATO["Locação de Imóvel"] ? "1.1.98" : "1.1.99") + "</CODTMV>";
        xml += "    <EPERIODICO>" + parametros.TIPOFATURAMENTO + "</EPERIODICO>";
        xml += "    <DATAINICIO>" + setDateXMLFormat(parametros.DATAINICIO) + "</DATAINICIO>";
        xml += "    <DATAFIM>" + setDateXMLFormat(parametros.DATAFIM) + "T00:00:00</DATAFIM>";
        xml += "    <CODCPGPRAZO>130</CODCPGPRAZO>";
        xml += "    <CODRPR>" + parametros.CODRPR + "</CODRPR>";
        if (parametros.CODCPG == TIPOS_FATURAMENTO["Periódico"]) {
            xml += "<DIAFATURAMENTO>" + parametros.DIAFATURAMENTO + "</DIAFATURAMENTO>";
            xml += "<QTDEFATURAMENTOS>" + parametros.QTDEFATURAMENTOS + "</QTDEFATURAMENTOS>";
        }
        xml += "    <PRECOFATURAMENTO>" + ValorToFloat(item.VALOR).toString().replace(".", ",") + "</PRECOFATURAMENTO>";
        xml += "    <CODMOEREAJUSTE>R$</CODMOEREAJUSTE>";
        xml += "    <CODCOLCFODEST>0</CODCOLCFODEST>";
        xml += "    <CODCFODEST>" + parametros.CODCFO + "</CODCFODEST>";
        xml += "</TITMCNT>";
    }

    return xml;
}
function geraXML_TITMCNTRATCCU(parametros) {
    var xml = "";
    for (var i = 0; i < parametros.ITENS.length; i++) {
        var item = parametros.ITENS[i];

        xml += "<TITMCNTRATCCU>";
        xml += "    <CODCOLIGADA>" + parametros.CODCOLIGADA + "</CODCOLIGADA> ";
        xml += "    <IDCNT>" + parametros.IDCNT + "</IDCNT>";
        xml += "    <NSEQITMCNT>" + (i + 1) + "</NSEQITMCNT>";
        xml += "    <CODCCUSTO>" + parametros.CODCCUSTO + "</CODCCUSTO>";
        xml += "    <PERCENTUAL>100</PERCENTUAL>";
        xml += "</TITMCNTRATCCU>";
    }

    return xml;
}
function geraXML_TITMCNTRATDEP(parametros) {
    var xml = "";

    for (var i = 0; i < parametros.ITENS.length; i++) {
        var item = parametros.ITENS[i];

        var RATEIOS = item.RATDEP;
        for (var j = 0; j < RATEIOS.length; j++) {
            var RATDEPTO = RATEIOS[j];
            xml += "<TITMCNTRATDEP>";
            xml += "    <CODCOLIGADA>" + parametros.CODCOLIGADA + "</CODCOLIGADA>";
            xml += "    <IDCNT>" + parametros.IDCNT + "</IDCNT>";
            xml += "    <NSEQITMCNT>" + (i + 1) + "</NSEQITMCNT>";
            xml += "    <CODFILIAL>" + parametros.CODFILIAL + "</CODFILIAL>";
            xml += "    <CODDEPARTAMENTO>" + RATDEPTO.CODDEPTO + "</CODDEPARTAMENTO>";
            xml += "    <PERCENTUAL>" + RATDEPTO.PERCENTUAL + "</PERCENTUAL>";
            xml += "</TITMCNTRATDEP>";
        }
    }
    return xml;
}



function alteraStatusContrato(STATUS) {
    try {


        var CODSTACNT = STATUS_CONTRATOS[STATUS];
        if (!CODSTACNT || CODSTACNT == null || CODSTACNT == "") {
            throw "Necessário informar CODSTACNT";
        }

        var xml = "";
        xml += "<CTRCNT>";
        xml += "    <TCNT>";
        xml += "         <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA>";
        xml += "         <IDCNT>" + IDCNT + "</IDCNT>";
        xml += "         <CODSTACNT>" + CODSTACNT + "</CODSTACNT>";
        xml += "     </TCNT>";
        xml += "</CTRCNT>";

        var contexto = "CODSISTEMA=G;CODCOLIGADA=" + CODCOLIGADA + ";CODUSUARIO=fluig";

        var retorno = DatasetFactory.getDataset(
            "InsereContratoRM",
            null,
            [
                DatasetFactory.createConstraint("coligada", CODCOLIGADA, CODCOLIGADA, ConstraintType.MUST),
                DatasetFactory.createConstraint("idContrato", IDCNT, IDCNT, ConstraintType.MUST),
                DatasetFactory.createConstraint("contexto", contexto, contexto, ConstraintType.MUST),
                DatasetFactory.createConstraint("xml", xml, xml, ConstraintType.MUST),
            ],
            null
        );
        if (retorno.values[0][0] == "false") {
            throw "Erro ao gerar contrato. Favor entrar em contato com o administrador do sistema. Mensagem: " + retorno.values[0][1];
        } else if (retorno.values[0][0] == "true") {
            return true;

        }

    } catch (error) {
        throw error;
    }
}


// Assinatura Eletrônica
function criaAssinaturaEletronica() {
    var ds = DatasetFactory.getDataset("ds_auxiliar_wesign", null, [
        DatasetFactory.createConstraint("nmArquivo", NomeArquivo, NomeArquivo, ConstraintType.MUST),
        DatasetFactory.createConstraint("codArquivo", IdArquivo, IdArquivo, ConstraintType.MUST),
        DatasetFactory.createConstraint("vrArquivo", versaoArquivo, versaoArquivo, ConstraintType.MUST),
        DatasetFactory.createConstraint("codPasta", idPasta, idPasta, ConstraintType.MUST),
        DatasetFactory.createConstraint("codRemetente", CodRemetente, CodRemetente, ConstraintType.MUST),
        DatasetFactory.createConstraint("nmRemetente", BuscaNomeUsuario(CodRemetente), BuscaNomeUsuario(CodRemetente), ConstraintType.MUST),
        DatasetFactory.createConstraint("status", "Enviando para assinatura", "Enviando para assinatura", ConstraintType.MUST),
        DatasetFactory.createConstraint("metodo", "create", "create", ConstraintType.MUST),
        DatasetFactory.createConstraint("jsonSigners", JSONUtil.toJSON(arrSigners), JSONUtil.toJSON(arrSigners), ConstraintType.MUST),
        DatasetFactory.createConstraint("numSolic", getValue("WKNumProces"), getValue("WKNumProces"), ConstraintType.MUST),
    ], null);

    if (ds.getValue(0, "Result") == "OK") {
        return true;
    } else {
        log.error(ds.getValue("Erro ao enviar Assinatura Eletronica"));
        log.error(ds.getValue(0, "mensagem"));
        throw "Erro ao Criar a Assinatura Eletrôncia: " + ds.getValue(0, "mensagem");
    }
}



// Utils
function insereHistorico(observacao, acao, atividade) {
    var USER = getValue("WKUser");
    var DATA = getDateTimeNow();

    var novaLinha = new java.util.HashMap();
    novaLinha.put("tableHistoricoUsuario", USER);
    novaLinha.put("tableHistoricoData", DATA);
    novaLinha.put("tableHistoricoAtividade", atividade);
    novaLinha.put("tableHistoricoObservacao", observacao);
    novaLinha.put("tableHistoricoAcao", acao);

    hAPI.addCardChild("tableHistorico", novaLinha);
    hAPI.setCardValue("observacao", "");

}

function getDateTimeNow() {
    var date = new Date();
    var dia = date.getDate();
    if (dia < 10) {
        dia = "0" + dia;
    }
    var mes = date.getMonth() + 1;
    if (mes < 10) {
        mes = "0" + mes;
    }

    var ano = date.getFullYear();

    var hora = date.getHours();
    if (hora < 10) {
        hora = "0" + hora;
    }

    var minutos = date.getMinutes();
    if (minutos < 10) {
        minutos = "0" + minutos;
    }

    var dateTime = [ano, mes, dia].join("-") + " " + hora + ":" + minutos;
    return dateTime;
}
function getServerURL() {
    var ds = DatasetFactory.getDataset("dsGetServerURL", null, null, null);
    return ds.getValue(0, "URL");
}
function setDateXMLFormat(data, sql) {
    // Formata data para inserção no XML
    var retorno = "";
    var n = data.indexOf("/");
    data = data.trim();
    var joinDtHr = "";
    if (sql == 1) {
        joinDtHr = " ";
    } else {
        joinDtHr = "T";
    }
    if (n == -1) {
        var tam = data.length;
        if (tam > 10) {
            retorno = retorno.replace(" ", joinDtHr);
            retorno = retorno + "00";
        } else {
            retorno = retorno + joinDtHr + "00:00:00";
        }
    }

    if (n == 2) {
        var temp = data.split("/");
        retorno = [temp[2], temp[1], temp[0]].join("-");
        retorno = retorno + joinDtHr + "00:00:00";
    }
    if (n == 4) {
        retorno = data.replace("/", "-");
        retorno = retorno + joinDtHr + "00:00:00";
    }
    return retorno;
}
function ValorToFloat(valor) {
    if (valor.split("R$").length > 1) {
        valor = valor.split("R$")[1].trim();
    }
    valor = valor.split(".").join("").split(",").join(".");
    return parseFloat(valor);
}
