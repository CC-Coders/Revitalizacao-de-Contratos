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
    "Locação de Equipamento - Com Mão de Obra": "09",
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
    try {
        hAPI.setCardValue("numProces", getValue("WKNumProces"));

        if (hAPI.getCardValue("tipoContrato") == "Locação de Equipamento" || hAPI.getCardValue("tipoContrato") == "Locação de Equipamento - Com Mão de Obra") {
            atualizaStatusEquipamento("Contrato_em_Andamento_com_análise_pendente");
            hAPI.setCardValue("dataCriadoEm", getDateNow());
        }

        var id = insereDadosNaTabelaAuxiliar();
        insereDadosNaTabelaAuxiliarItens(id);
        hAPI.setCardValue("ID_TCNT_AUXILIAR", id);
    
 
        var pdfIdContrato = hAPI.getCardValue("contratoPdfId");
        if (pdfIdContrato) {
            anexaDocumentoNoProcesso(pdfIdContrato);
        }
        insereHistorico(hAPI.getCardValue("observacoes"), "Início", "Início");
    } catch (error) {
        throw error;   
    }
}
function beforeTaskSave_juridico() {
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Jurídico");
}
function beforeTaskSave_controladoria() {
    try {
        insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Controladoria");
        if (hAPI.getCardValue("decisao") == "Aprovar") {
            var tipo = hAPI.getCardValue("origemContrato");
            if (tipo == "Novo") {
                var IDCNT = criaNovoContrato();
                hAPI.setCardValue("IDCNT", IDCNT);
                updateTcntAuxiliar(IDCNT, hAPI.getCardValue("ID_TCNT_AUXILIAR"));
            } else if (tipo == "Aditivos") {
                alteraStatusContrato(hAPI.getCardValue("CODCOLIGADA"), hAPI.getCardValue("IDCNT"), "PENDENTE OBRA");
                // TODO - Inserir relação do Aditivo com o Contrato na tabela Custom de Contratos
            } else if (tipo == "Rescisões") {
                alteraStatusContrato(hAPI.getCardValue("CODCOLIGADA"), hAPI.getCardValue("IDCNT"), "RESCISÃO EM ANDAMENTO");
                // TODO - Inserir relação da Rescisão com o Contrato na tabela Custom de Contratos
            }
        }
    } catch (error) {
        throw error;
    }
}
function beforeTaskSave_engenheiro() {
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Aprovação Engenheiro");

    if (hAPI.getCardValue("decisao") == "Aprovar") {
        if (hAPI.getCardValue("tipoContrato") != "Locação de Equipamento" && hAPI.getCardValue("tipoContrato") != "Locação de Equipamento - Com Mão de Obra" && hAPI.getCardValue("coordenador") == "") {
            // Se não tiver coordenador vai para assinatura eletrônica
            criaAssinaturaEletronica();
        }else if((hAPI.getCardValue("tipoContrato") == "Locação de Equipamento" || hAPI.getCardValue("tipoContrato") == "Locação de Equipamento - Com Mão de Obra") && hAPI.getCardValue("coordenador") == "" && hAPI.getCardValue("CODCOLIGADA") != 1 ){
            // Caso seja Locação de Equipamento e não tiver coordenador
            // Vai para assinatura eletrônica somente quando não for Coligada 1, pois na Coligada 1 vai para aprovação do Jerson
            criaAssinaturaEletronica();
        }
    }
}
function beforeTaskSave_coordenadorObras() {
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Aprovação Coordenador");

    if (hAPI.getCardValue("decisao") == "Aprovar" && (hAPI.getCardValue("tipoContrato") != "Locação de Equipamento" && hAPI.getCardValue("tipoContrato") != "Locação de Equipamento - Com Mão de Obra")) {
        criaAssinaturaEletronica();
    }
}
function beforeTaskSave_diretoria() {
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Aprovação Diretoria");

    if (hAPI.getCardValue("decisao") == "Aprovar" ){
        criaAssinaturaEletronica();
    }
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
    var CODCFO = hAPI.getCardValue("hiddenCODCFO");
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
    xml += "        <DATAFIM>" + setDateXMLFormat(parametros.DATAFIM) + "</DATAFIM>";
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


function insereDadosNaTabelaAuxiliar(){
    try {
        
        var query = "INSERT INTO TCNT_AUXILIAR (";
        query += " CODCOLIGADA, ";
        query += " IS_MODELO_CASTILHO, ";
        query += " IS_RETENCAO, ";
        query += " PERCENT_RETENCAO, ";
        query += " IS_REIDI, ";
        query += " PERCENT_REIDI, ";
        query += " TIPO_ASSINATURA, ";
        query += " TIPO_CONTRATO, ";
        query += " PERCENT_DESCONTO_CHUVA, ";
        query += " PERCENT_DESCONTO_DIAS_PARADO, ";
        query += " ID_FLUIG ";
        query += ") ";
        query += " VALUES (?,?,?,?,?,?,?,?,?,?, ?);";


        var id = executeInsert(query,[
            {type:"int", value:hAPI.getCardValue("CODCOLIGADA")},
            {type:"int", value:hAPI.getCardValue("modeloContrato") == "Modelo Castilho" ? 1:0},
            {type:"int", value:hAPI.getCardValue("temRetencao") == "Sim" ? 1:0},//Tem Retencao
            {type:"float", value:hAPI.getCardValue("percentualRetencao").replace("%","")},// Percentual Retencao
            {type:"int", value:hAPI.getCardValue("temREIDI") == "Sim" ? 1:0},// Tem REIDI
            {type:"float", value:hAPI.getCardValue("percentualREIDI")},//Percentual REIDI
            {type:"varchar", value:hAPI.getCardValue("assinaturaContrato")},//TIPO_ASSINATURA
            {type:"varchar", value:hAPI.getCardValue("tipoContrato")},//TIPO_CONTRATO
            {type:"varchar", value:hAPI.getCardValue("descontoPorDiaChuva").replace("%","")},//PERCENT_DESCONTO_CHUVA
            {type:"varchar", value:hAPI.getCardValue("descontoPorDiaParado").replace("%","")},//PERCENT_DESCONTO_DIAS_PARADO
            {type:"int", value:getValue("WKNumProces")},//TIPO_CONTRATO
        ], "/jdbc/CastilhoCustom");

        return id;
    } catch (error) {
        throw error;
    }
}
function insereDadosNaTabelaAuxiliarItens(ID_TCNT_AUXILIAR){
    try {
        var tipo_contrato = hAPI.getCardValue("tipoContrato");

        if (tipo_contrato == "Locação de Equipamento") {
            insereItensLocacaoDeEquipamento(ID_TCNT_AUXILIAR);
        }
        if (tipo_contrato == "Locação de Equipamento - Com Mão de Obra") {
            insereItensLocacaoDeEquipamento(ID_TCNT_AUXILIAR);
        }
        else if(tipo_contrato == "Locação de Imóvel"){
            insereItensLocacaoDeImovel(ID_TCNT_AUXILIAR);
        }

       
    } catch (error) {
        throw error;
    }
}
function insereItensLocacaoDeEquipamento(ID_TCNT_AUXILIAR){
    try {        
        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados");
        var counter = 0;
        for (var i = 0; i < indexes.length; i++) {
            var id = indexes[i]
            var prefixo = hAPI.getCardValue("equipamentoSelecionadoPrefixo" + "___" + id);

            var query = "INSERT INTO TCNT_AUXILIAR_ITENS (";
            query += "ID_TCNT_AUXILIAR, ";
            query += "NSEQITEMCNT, ";
            query += "PREFIXO) ";
            query += "VALUES (?,?,?)";

            executeInsert(query,[
                {type:"int", value:ID_TCNT_AUXILIAR},//ID_TCNT_AUXILIAR
                {type:"int", value:counter},//NSEQITEMCNT
                {type:"varchar", value:prefixo},//PREFIXO
            ], "/jdbc/CastilhoCustom");
            counter++;
        }
    } catch (error) {
        throw error;
    }
}
function insereItensLocacaoDeImovel(ID_TCNT_AUXILIAR){
 try {        
        var query = "INSERT INTO TCNT_AUXILIAR_ITENS (";
        query += "ID_TCNT_AUXILIAR, ";
        query += "NSEQITEMCNT, ";
        query += "TIPO, ";
        query += "DESCRICAO, ";
        query += "VALOR, ";
        query += "UN) ";
        query += "VALUES (?,?,?,?,?,?)";

        executeInsert(query,[
            {type:"int", value:ID_TCNT_AUXILIAR},//ID_TCNT_AUXILIAR
            {type:"int", value:"0"},//NSEQITEMCNT
            {type:"varchar", value:hAPI.getCardValue("finalidadeLocacao")},//TIPO
            {type:"varchar", value:hAPI.getCardValue("descricaoImovel")},//DESCRICAO
            {type:"float", value:ValorToFloat(hAPI.getCardValue("valorMensalAluguel")+"")},//VALOR
            {type:"varchar", value:"MES"},//UN
        ], "/jdbc/CastilhoCustom");  

    } catch (error) {
        throw error;
    }
}

function updateTcntAuxiliar(IDCNT, ID_TCNT_AUXILIAR){
    try {
        var query = "UPDATE TCNT_AUXILIAR SET IDCNT = ? WHERE ID = ?";
        executaUpdate(query, [
            {type:"int", value:IDCNT},
            {type:"int", value:ID_TCNT_AUXILIAR},
        ], "/jdbc/CastilhoCustom");
    } catch (error) {
        throw error;   
    }
}


// Equipamentos
var codigoStatusEquipamentos = {
    "Pendente_Contrato":1,
    "Contrato_em_Andamento_com_análise_pendente":2,
    "Contrato_em_Andamento_com_análise_realizada":3,
    "Contrato_Vigente":4,
    "Equipamento_desmobilizado":5,
    "Contrato_encerrado":6,
}

function atualizaStatusEquipamento(status){
    try {
        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados");
 
        for (var i = 0; i < indexes.length; i++) {
            var id = indexes[i]
            var prefixo = hAPI.getCardValue("equipamentoSelecionadoPrefixo" + "___" + id);

            var isMAouOutros = buscaCategoriaPorPrefixo(prefixo);
            if (isMAouOutros[0].CATEGORIA != "Outros") {
                var query = "UPDATE EQUIPAMENTOS_CONTRATOS_AUXILIAR SET ";
                query += "STATUS = ? ";
                query +="WHERE PREFIXO = ?";

                executeInsert(query, [
                    {type:"int", value:codigoStatusEquipamentos[status]},
                    {type:"varchar", value:prefixo},
                ], "/jdbc/CastilhoCustom");
            }else{
                var query = "UPDATE EQUIPAMENTOS_CONTRATOS_AUXILIAR_OUTROS SET ";
                query += "STATUS = ? ";
                query +="WHERE PREFIXO = ?";

                executeInsert(query, [
                    {type:"int", value:codigoStatusEquipamentos[status]},
                    {type:"varchar", value:prefixo},
                ], "/jdbc/CastilhoCustom");
            }
        }
    } catch (error) {
        throw error;
    }
}

function buscaCategoriaPorPrefixo(PREFIXO){
    try {
        var query = "SELECT CATEGORIA FROM VIEW_EQUIPAMENTOS_CONTRATOS WHERE PREFIXO = ?";
        var retorno = executaQuery(query, [
            {type:"varchar", value:PREFIXO}
        ], "/jdbc/CastilhoCustom");

        return retorno;
    } catch (error) {
        throw error;
    }
}


// Assinatura Eletrônica
function criaAssinaturaEletronica() {
    try {
        var documentId = hAPI.getCardValue("contratoPdfId");
        var CodRemetente = hAPI.getCardValue("solicitante");
        var document = buscaDadosDoArquivo(documentId);
        log.info("dados do arquivo");
        log.dir(document);

        var parentId = document.parentId;
        var version = document.version;
        var documentName = document.description;

        var arrSigners = [];
        arrSigners.push({
            nome: hAPI.getCardValue("nomeRepresentanteFornecedor"),
            email: hAPI.getCardValue("mailRepresentanteFornecedor"),
            cpf: hAPI.getCardValue("cpfRepresentanteFornecedor"),
            tipo: "E",
            status: "Pendente",
        });
        arrSigners.push({
            nome: hAPI.getCardValue("nomeRepresentanteCastilho"),
            email: hAPI.getCardValue("mailRepresentanteCastilho"),
            cpf: hAPI.getCardValue("cpfRepresentanteCastilho"),
            tipo: "E",
            status: "Pendente",
        });

        var testemunhas = JSON.parse(hAPI.getCardValue("jsonTestemunhas"));
        for (var i = 0; i < testemunhas.length; i++) {
            var testemunha = testemunhas[i];
  
            arrSigners.push({
                nome: testemunha.nome,
                email: testemunha.email,
                cpf: testemunha.cpf,
                tipo: "E",
                status: "Pendente",
            });            
        }

        var ds = DatasetFactory.getDataset("ds_auxiliar_wesign", null, [
            DatasetFactory.createConstraint("nmArquivo", documentName, documentName, ConstraintType.MUST),
            DatasetFactory.createConstraint("codArquivo", documentId, documentId, ConstraintType.MUST),
            DatasetFactory.createConstraint("vrArquivo", version, version, ConstraintType.MUST),
            DatasetFactory.createConstraint("codPasta", parentId, parentId, ConstraintType.MUST),
            DatasetFactory.createConstraint("codRemetente", CodRemetente, CodRemetente, ConstraintType.MUST),
            DatasetFactory.createConstraint("nmRemetente", BuscaNomeUsuario(CodRemetente), BuscaNomeUsuario(CodRemetente), ConstraintType.MUST),
            DatasetFactory.createConstraint("status", "Enviando para assinatura", "Enviando para assinatura", ConstraintType.MUST),
            DatasetFactory.createConstraint("metodo", "create", "create", ConstraintType.MUST),
            DatasetFactory.createConstraint("jsonSigners", JSONUtil.toJSON(arrSigners), JSONUtil.toJSON(arrSigners), ConstraintType.MUST),
            DatasetFactory.createConstraint("numSolic", getValue("WKNumProces"), getValue("WKNumProces"), ConstraintType.MUST),
        ], null);

        if (ds.getValue(0, "Result") == "OK") {
            var ds_upload = DatasetFactory.getDataset("ds_upload_wesign_manual", null, [
                DatasetFactory.createConstraint('codArquivo', documentId, documentId, ConstraintType.MUST)
            ], null);
            return true;
        } else {
            log.error(ds.getValue("Erro ao enviar Assinatura Eletronica"));
            log.error(ds.getValue(0, "mensagem"));
            throw "Erro ao Criar a Assinatura Eletrôncia: " + ds.getValue(0, "mensagem");
        }
    } catch (error) {
        throw error;    
    }
}
function buscaDadosDoArquivo(documentId){
    try {
        var clientService = fluigAPI.getAuthorizeClientService();
        var data = {
            companyId: getValue("WKCompany") + '',
            serviceCode: 'ServicoFluig',
            endpoint: '/content-management/api/v2/documents/' + documentId,
            method: 'get',
            options: {
                encoding: 'UTF-8',
                mediaType: 'application/json',
                useSSL: true
            },
            headers: {
                "Content-Type": 'application/json;charset=UTF-8'
            }
        };

        var vo = clientService.invoke(JSON.stringify(data));

        if (vo.getResult() == null || vo.getResult().isEmpty()) {
            throw "Erro ao consultar o arquivo do Contrato";
        } else{
            var result = vo.getResult();
            if (vo.httpStatusResult != 200) {
                throw result;
            }else{
                return JSON.parse(result);
            }
        }
    } catch (error) {
        throw error;
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
function getDateNow() {
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

    var dateTime = [ano, mes, dia].join("-");
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
function BuscaNomeUsuario(CodUsuario) {
    var ds = DatasetFactory.getDataset("colleague", ["colleagueName"], [
        DatasetFactory.createConstraint("colleagueId", CodUsuario, CodUsuario, ConstraintType.MUST)
    ], null);

    return ds.getValue(0, "colleagueName");
}
function executaQuery(query, constraints, dataSource) {
    try {
        var dataSource = dataSource;
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup(dataSource);

        var conn = ds.getConnection();
        var stmt = conn.prepareStatement(query);

        var counter = 1;
        for (var i = 0; i < constraints.length; i++) {
            var val = constraints[i];
            if (val.type == "int") {
                stmt.setInt(counter, val.value);
            }
            else if (val.type == "float") {
                stmt.setFloat(counter, val.value);
            }
            else if (val.type == "date") {
                stmt.setString(counter, val.value);
            }
            else if (val.type == "datetime") {
                stmt.setString(counter, val.value);
            } else {
                stmt.setString(counter, val.value);
            }
            counter++;
        }

        var rs = stmt.executeQuery();
        var columnCount = rs.getMetaData().getColumnCount();
        var retorno = [];

        while (rs.next()) {
            var linha = {};
            for (var j = 1; j < columnCount + 1; j++) {
                linha[rs.getMetaData().getColumnName(j)] = rs.getObject(rs.getMetaData().getColumnName(j)) + "";
            }
            retorno.push(linha);
        }

        return retorno;

    } catch (e) {
        log.error("ERRO==============> " + e.message);
        throw e;
    } finally {
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }
}
function executeInsert(query, constraints, dataSource) {
    var conn = null;
    var stmt = null;
    var insertedId = null;
    try {
        log.info("executandoQuery");
        log.info(query);
        log.dir(constraints);

        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup(dataSource);

        conn = ds.getConnection();
        stmt = conn.prepareStatement(query, Packages.java.sql.Statement.RETURN_GENERATED_KEYS);

        var counter = 1;
        for (var i = 0; i < constraints.length; i++) {
            var val = constraints[i];
            if (val.type == "int") {
                stmt.setInt(counter, val.value);
            }
            else if (val.type == "float") {
                stmt.setFloat(counter, val.value);
            }
            else if (val.type == "date") {
                stmt.setString(counter, val.value);
            }
            else if (val.type == "datetime") {
                stmt.setString(counter, val.value);
            } else {
                stmt.setString(counter, val.value);
            }
            counter++;
        }

        // Use executeUpdate for INSERT and then try getGeneratedKeys
        var rowsAffected = stmt.executeUpdate();
        log.info("rowsAffected: " + rowsAffected);

        var rsKeys = stmt.getGeneratedKeys();
        if (rsKeys != null) {
            try {
                if (rsKeys.next()) {
                    insertedId = rsKeys.getInt(1);
                    log.info("generated id (getGeneratedKeys): " + insertedId);
                }
            } finally {
                try { rsKeys.close(); } catch (e) { }
            }
        }

        // Fallback for SQL Server when driver doesn't return generated keys
        if (insertedId == null) {
            try {
                var fallbackSql = "SELECT SCOPE_IDENTITY() AS ID";
                var fallbackStmt = conn.prepareStatement(fallbackSql);
                var rsScope = fallbackStmt.executeQuery();
                try {
                    if (rsScope.next()) {
                        insertedId = rsScope.getInt("ID");
                        log.info("generated id (SCOPE_IDENTITY): " + insertedId);
                    }
                } finally {
                    try { rsScope.close(); } catch (e) { }
                    try { fallbackStmt.close(); } catch (e) { }
                }
            } catch (e) {
                log.info("SCOPE_IDENTITY fallback failed: " + e);
            }
        }

    } catch (error) {
        var msg = "";
        if (error && error.javaException) {
            msg = error.javaException.getMessage();
        } else if (error && error.message) {
            if (error.message.Error) {
            } else {
                msg = error.message;
            }
        } else {
            msg = String(error);
        }

        log.error("ERRO==============> " + msg);
        log.error("Type of error: " + typeof error);
        log.error("Type of msg: " + typeof msg);

        throw "Erro ao executar Dataset: " + msg;

    } finally {
        if (stmt != null) {
            try { stmt.close(); } catch (e) { }
        }
        if (conn != null) {
            try { conn.close(); } catch (e) { }
        }
    }

    return insertedId;
}
function anexaDocumentoNoProcesso(documentId){
    var attachments = hAPI.listAttachments();
    var isAnexado = false;

    for (var i = 0; i < attachments.size(); i++) {
        if (documentId == attachments.get(i).getDocumentId()) {
            isAnexado = true;
        }
    }

    if (!isAnexado) {
        hAPI.attachDocument(documentId);
    }
}