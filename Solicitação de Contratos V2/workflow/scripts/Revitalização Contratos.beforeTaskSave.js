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
    ANALISE_EQUIPAMENTO: 104,
    DIRETORIA: 53,
    STATUS_ASSINATURA_ELETRONICA: 58,
    ASSINATURA_ELETRONICA: 66,
    ADM_OBRA: 64,
    CONTROLADORIA_AGUARDA_RECEBIMENTO: 74,
    CONTROLADORIA_RECEBE_ASSINATURAS: 72, 
    OBRA_RECEBE_VIAS_ORIGINAIS: 76,
    FIM : [37, 62, 83]
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

var codigoStatusEquipamentos = {
    "Pendente_Contrato":1,
    "Contrato_em_Andamento_com_análise_pendente":2,
    "Contrato_em_Andamento_com_análise_realizada":3,
    "Contrato_Vigente":4,
    "Equipamento_desmobilizado":5,
    "Contrato_encerrado":6,
}

function beforeTaskSave(colleagueId, nextSequenceId, userList) {
    try {
        var ATIVIDADE_ATUAL = getValue("WKNumState");

        var connSisma = null;
        var connCustom = null;

        var atividadesComSQL = validaSeAtividadeExecutaSQL(ATIVIDADE_ATUAL);
        if (atividadesComSQL) {
            // Abre UMA conexão para a transação. Todos os INSERT/UPDATE da abertura
            // usam essa mesma conexão, então ou grava tudo (commit) ou nada (rollback).
            var ic = new javax.naming.InitialContext();
            connSisma = ic.lookup("/jdbc/Sisma").getConnection();
            connCustom = ic.lookup("/jdbc/CastilhoCustom").getConnection();
            connSisma.setAutoCommit(false);
            connCustom.setAutoCommit(false);
        }

        if (ATIVIDADE_ATUAL == ATIVIDADES.INICIO || ATIVIDADE_ATUAL == ATIVIDADES.INICIO_0) {
            beforeTaskSave_inicio(connCustom, connSisma);
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.JURIDICO) {
            beforeTaskSave_juridico(hAPI.getCardValue("ID_TCNT_AUXILIAR"), connCustom);
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.CONTROLADORIA) {
            beforeTaskSave_controladoria(hAPI.getCardValue("ID_TCNT_AUXILIAR"), connCustom);
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.ENGENHEIRO) {
            beforeTaskSave_engenheiro();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.COORDENADOR_OBRAS) {
            beforeTaskSave_coordenadorObras();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.ANALISE_EQUIPAMENTO) {
            beforeTaskSave_analiseEquipamentos();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.DIRETORIA) {
            beforeTaskSave_diretoria();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.ADM_OBRA) {
            beforeTaskSave_admObra();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.CONTROLADORIA_AGUARDA_RECEBIMENTO) {
            beforeTaskSave_controladoriaAguardaRecebimento();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.CONTROLADORIA_RECEBE_ASSINATURAS) {
            beforeTaskSave_controladoriaRecolheAssinaturas();
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.OBRA_RECEBE_VIAS_ORIGINAIS) { // Tipo de assinatura manual
            beforeTaskSave_obraRecebeViasOriginais(connCustom, connSisma);
        } else if (ATIVIDADE_ATUAL == ATIVIDADES.STATUS_ASSINATURA_ELETRONICA) { // Tipo de assintaura eletrônica, com status "Assinado"
            beforeTaskSave_statusAssinaturaEletronica(connCustom, connSisma);
        }

        if (atividadesComSQL) {
            // Chegou até aqui = todos os INSERT's / UPDATE's rodaram sem erro. Grava tudo de uma vez.
            connSisma.commit();
            connCustom.commit();
        }

    } catch (error) {

        if (atividadesComSQL) {
            // Qualquer erro desfaz todos os INSERT's / UPDATE's da abertura
            log.error("## Revitalização Contratos beforeTaskSave: erro em algum INSERT/UPDATE, iniciando rollback. Erro: ");
            log.dir(error);

            // Rollback SISMA
            try { connSisma.rollback() } catch (e) { log.error("## Erro no rollback do Sisma: " + e) }

            // Rollback Castilho Custom
            try {  connCustom.rollback() } catch (e) { log.error("## Erro no rollback do Custom: " + e) }
        }

        throw error;

    } finally {
        // O bloco finally sempre executa, com erro ou sem.
        // Garantimos que as conexões são fechadas independente se deu erro ou não.
        // Se não fechar, o banco fica com conexões presas e para de responder com o tempo.

        // Fecha somente as que abriram
        if (connSisma != null) {
            try {  connSisma.close() } catch (e) {}
        }
        if (connCustom != null) {
            try { connCustom.close() } catch (e) {}
        }
    }


    // Util
    function validaSeAtividadeExecutaSQL(atividade) {
        return atividade == ATIVIDADES.INICIO
            || atividade == ATIVIDADES.INICIO_0
            || atividade == ATIVIDADES.JURIDICO
            || atividade == ATIVIDADES.CONTROLADORIA
            || atividade == ATIVIDADES.STATUS_ASSINATURA_ELETRONICA
            || atividade == ATIVIDADES.OBRA_RECEBE_VIAS_ORIGINAIS;
    }
}

function beforeTaskSave_inicio(connCustom, connSisma) { // COM SQL
    try {
        hAPI.setCardValue("numProces", getValue("WKNumProces"));
        var origemContrato = hAPI.getCardValue("origemContrato");
        var tipoContrato = hAPI.getCardValue("tipoContrato");

        // Função centralizada
        INSERTs_UPDATEs_tabelasAuxiliares(connCustom, connSisma);

        log.info("## beforeTaskSave_inicio");
        log.info("## Resultado solicitacaoEstaSendoAberta: " + solicitacaoEstaSendoAberta());

        // Se não for abertura, faz UPDATE's
        if (!solicitacaoEstaSendoAberta()) {
            updateTcntAuxiliarCompleto_quandoContratoNovo(hAPI.getCardValue("ID_TCNT_AUXILIAR"), connCustom);
            atualizaDadosTabelasAuxiliares_porOrigemContratoTipoContrato(origemContrato, tipoContrato, connCustom);
        }
        
        var pdfIdContrato = hAPI.getCardValue("contratoPdfId");
        if (pdfIdContrato) {
            anexaDocumentoNoProcesso(pdfIdContrato);
        }
        insereHistorico(hAPI.getCardValue("observacoes"), "Enviado", "Obra");

    } catch (error) {
        throw error;   
    }


    // Util
    function INSERTs_UPDATEs_tabelasAuxiliares() {
        try {
            var tipoContrato = hAPI.getCardValue("tipoContrato");
            
            if (tipoContrato == "Locação de Equipamento" || tipoContrato == "Locação de Equipamento - Com Mão de Obra") {

                if (!solicitacaoEstaSendoAberta()) {
                    return;
                }

                atualizaStatusEquipamento("Contrato_em_Andamento_com_análise_pendente", connCustom);
                hAPI.setCardValue("dataCriadoEm", getDateNow());
            
            } else if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {
                // Insere o(s) equip(s) na tabela para poder ver na Analise do Suprimentos, mas insere com Status Desativado
                insereNaTabelaAuxiliarItens_equipNoContrato(hAPI.getCardValue("ID_TCNT_AUXILIAR"), connCustom);
                atualizaStatusEquipamento("Contrato_em_Andamento_com_análise_pendente", connCustom);
            
            } else if (tipoContrato == "Transporte de Materiais - Inclusão de Equipamento") {
                insereNaTabelaAuxiliarItens_equipNoContrato(hAPI.getCardValue("ID_TCNT_AUXILIAR"), connCustom);
            
            }

            // Cria/insere somente quando contratos novos.
            if (hAPI.getCardValue("origemContrato") == "Novos") {

                if (!solicitacaoEstaSendoAberta()) {
                    return;
                }

                var id = insereDadosNaTabelaAuxiliar(connCustom);
                insereDadosNaTabelaAuxiliarItens(id, connCustom);
                hAPI.setCardValue("ID_TCNT_AUXILIAR", id);
            }

        } catch (error) {
            // Lança erro e trava abertura da solicitação.
            throw error;
        }
    }
}
function beforeTaskSave_juridico(ID_TCNT_AUXILIAR, connCustom) { // COM SQL
    var origemContrato = hAPI.getCardValue("origemContrato");
    var tipoContrato = hAPI.getCardValue("tipoContrato");

    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Jurídico");

    updateTcntAuxiliarCompleto_quandoContratoNovo(ID_TCNT_AUXILIAR, connCustom);
    atualizaDadosTabelasAuxiliares_porOrigemContratoTipoContrato(origemContrato, tipoContrato, connCustom);
}
function beforeTaskSave_controladoria(ID_TCNT_AUXILIAR, connCustom) { // COM SQL
    try {
        var origemContrato = hAPI.getCardValue("origemContrato");
        var tipoContrato = hAPI.getCardValue("tipoContrato");
        var codColigada = hAPI.getCardValue("CODCOLIGADA");

        insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Controladoria");

        updateTcntAuxiliarCompleto_quandoContratoNovo(ID_TCNT_AUXILIAR, connCustom);
        atualizaDadosTabelasAuxiliares_porOrigemContratoTipoContrato(origemContrato, tipoContrato, connCustom);

        if (hAPI.getCardValue("decisao") == "Aprovado") {
            // Seta Diretor conforme Coligada, para Contratos Novos de Locação de Equipamento
            if (tipoContrato == "Locação de Equipamento" || tipoContrato == "Locação de Equipamento - Com Mão de Obra") {

                // Segui o integracaoRMManager.js > function(s) representante....

                // Castilho ou Mineração ou Estação Luz
                if (codColigada == 1 || codColigada == 2 || codColigada == 5) {
                    hAPI.setCardValue("diretor", "jerson");

                // Dromos ou EPYA
                } else if (codColigada == 12 || codColigada == 13) {
                    hAPI.setCardValue("diretor", "mario")
                }
            }
            var IDCNT = hAPI.getCardValue("IDCNT");
            if (origemContrato == "Novos" && IDCNT == "") {
                var IDCNT = criaNovoContrato(); // RM
                hAPI.setCardValue("IDCNT", IDCNT);
                updateTcntAuxiliar_IDCNT(IDCNT, hAPI.getCardValue("ID_TCNT_AUXILIAR"), connCustom); // SQL

            } else if (origemContrato == "Aditivos") {
                alteraStatusContrato_RM(hAPI.getCardValue("CODCOLIGADA"), hAPI.getCardValue("IDCNT"), "PENDENTE OBRA"); // RM
                // TODO - Inserir relação do Aditivo com o Contrato na tabela Custom de Contratos

            } else if (origemContrato == "Rescisões") {
                alteraStatusContrato_RM(hAPI.getCardValue("CODCOLIGADA"), hAPI.getCardValue("IDCNT"), "RESCISÃO EM ANDAMENTO"); // RM
                // TODO - Inserir relação da Rescisão com o Contrato na tabela Custom de Contratos
            }
        }
    } catch (error) {
        throw error;
    }
}
function beforeTaskSave_engenheiro() { // SEM SQL
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Aprovação Engenheiro");

    if (hAPI.getCardValue("decisao") == "Aprovado") {
        if (hAPI.getCardValue("assinaturaContrato") == "Eletrônica" && hAPI.getCardValue("tipoContrato") != "Locação de Equipamento" && hAPI.getCardValue("tipoContrato") != "Locação de Equipamento - Com Mão de Obra" && hAPI.getCardValue("coordenador") == "") {
            // Se não tiver coordenador vai para assinatura eletrônica
            criaAssinaturaEletronica();
        }else if(hAPI.getCardValue("assinaturaContrato") == "Eletrônica" && (hAPI.getCardValue("tipoContrato") == "Locação de Equipamento" || hAPI.getCardValue("tipoContrato") == "Locação de Equipamento - Com Mão de Obra") && hAPI.getCardValue("coordenador") == "" && hAPI.getCardValue("CODCOLIGADA") != 1 ){
            // Caso seja Locação de Equipamento e não tiver coordenador
            // Vai para assinatura eletrônica somente quando não for Coligada 1, pois na Coligada 1 vai para aprovação do Jerson
            criaAssinaturaEletronica();
        }
    }
}
function beforeTaskSave_coordenadorObras() { // SEM SQL
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Aprovação Coordenador");

    if (hAPI.getCardValue("decisao") == "Aprovado" && (hAPI.getCardValue("assinaturaContrato") == "Eletrônica" && hAPI.getCardValue("tipoContrato") != "Locação de Equipamento" && hAPI.getCardValue("tipoContrato") != "Locação de Equipamento - Com Mão de Obra")) {
        criaAssinaturaEletronica();
    }
}
function beforeTaskSave_analiseEquipamentos() { // SEM SQL
    insereHistorico("", "Enviado", "Análise de Equipamentos");
}
function beforeTaskSave_diretoria() { // SEM SQL
    insereHistorico(hAPI.getCardValue("observacoes"), hAPI.getCardValue("decisao"), "Aprovação Diretoria");

    if (hAPI.getCardValue("decisao") == "Aprovado" && hAPI.getCardValue("assinaturaContrato") == "Eletrônica"){
        criaAssinaturaEletronica();
    }
}
function beforeTaskSave_admObra() { // SEM SQL
    insereHistorico("", "Enviado", "Adm. Obra");
}
function beforeTaskSave_controladoriaAguardaRecebimento() { // SEM SQL
    insereHistorico("", "Enviado", "Controladoria Aguarda Recebimento");
}
function beforeTaskSave_controladoriaRecolheAssinaturas() { // SEM SQL
    insereHistorico("", "Enviado", "Controladoria Recolhe Assinaturas");
}
function beforeTaskSave_statusAssinaturaEletronica(connCustom, connSisma) { // COM SQL
    insereHistorico("", "Enviado", "Agurdando Assinatura Eletrônica");

    if (hAPI.getCardValue("statusAssinatura") == "Assinado") {
        alteraStatusContrato_RM(hAPI.getCardValue("CODCOLIGADA"), hAPI.getCardValue("IDCNT"), "ATIVO");
        regrasParaStatusAssinaturaEletronica_obraRecebeViasOriginais(connCustom, connSisma);
    }
}
function beforeTaskSave_obraRecebeViasOriginais(connCustom, connSisma) { // COM SQL
    var ID_TCNT_AUXILIAR = hAPI.getCardValue("ID_TCNT_AUXILIAR");
    var origemContrato = hAPI.getCardValue("origemContrato");

    var DATA_ASSINATURA = getDateTimeNow();
    hAPI.setCardValue("dataAssinatura", DATA_ASSINATURA);

    insereHistorico("", "Enviado", "Obra Recebe Vias Originais");

    // Só grava com ID_TCNT_AUXILIAR válido (Transporte podia vir como "   -   ").
    var idAux = parseInt(ID_TCNT_AUXILIAR, 10);
    if (!isNaN(idAux) && idAux > 0) {
        updateTcntAuxiliar_dataAssinatura(DATA_ASSINATURA, idAux, connCustom); // SQl
    } else {
        log.warn("obraRecebeViasOriginais - ID_TCNT_AUXILIAR inválido, pulando update de dataAssinatura: " + ID_TCNT_AUXILIAR);
    }


    if (origemContrato == "Novos") {
        var IDCNT = hAPI.getCardValue("IDCNT");
        alteraStatusContrato_RM(hAPI.getCardValue("CODCOLIGADA"), IDCNT, "ATIVO");
    }
    regrasParaStatusAssinaturaEletronica_obraRecebeViasOriginais(connCustom, connSisma);
}


// Centralização Funções - Assinatura Eletronica & Assinatura Manual
function regrasParaStatusAssinaturaEletronica_obraRecebeViasOriginais(connCustom, connSisma) {

    // Formata valor monetario para float
    var valorLocacaoReajustado = ValorToFloat(hAPI.getCardValue("valorLocacaoReajustado"));

    var IDCNT = hAPI.getCardValue("IDCNT");
    var ID_TCNT_AUXILIAR = hAPI.getCardValue("ID_TCNT_AUXILIAR");
    var tipoContrato = hAPI.getCardValue("tipoContrato");
    var origemContrato = hAPI.getCardValue("origemContrato");
    var dataFimLocacao = hAPI.getCardValue("dataFimLocacao");

    // Locação de Equipamento
    var tiposContratoLocacaoEquip_aditivo_rescisao = 
        tipoContrato == "Locação de Equipamento - Alteração de Valor" || 
        tipoContrato == "Locação de Equipamento - Alteração de Prazo" ||
        tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor" || 
        tipoContrato == "Locação de Equipamento - Inclusão de Equipamento" ||
        tipoContrato == "Locação de Equipamento - Exclusão de Equipamento" || 
        tipoContrato == "Locação de Equipamento (Rescisões)" || 
        tipoContrato == "Locação de Equipamento - Com Mão de Obra (Rescisões)";

    // Locação de Imóvel
    var tiposContratoLocacaoImovel_aditivo_rescisao =
        tipoContrato == "Locação de Imóvel - Alteração de Valor" || 
        tipoContrato == "Locação de Imóvel - Alteração de Prazo" || 
        tipoContrato == "Locação de Imóvel - Alteração de Prazo e Valor" ||
        tipoContrato == "Locação de Imóvel (Rescisões)";

    try {

        if (origemContrato == "Aditivos" || origemContrato == "Rescisões") {

            // Locação de Equipamento
            if (tiposContratoLocacaoEquip_aditivo_rescisao) {
                insereDadosNaTabelaAuxiliar_aditivoRescisao_equipamento(tipoContrato, ID_TCNT_AUXILIAR, connCustom); // SQL
            }

            // Locação de Imóvel
            else if (tiposContratoLocacaoImovel_aditivo_rescisao) {
                insereDadosNaTabelaAuxiliar_aditivoRescisao_imovel(tipoContrato, ID_TCNT_AUXILIAR, connCustom); // SQL
            }

            alteraStatusContrato_RM(hAPI.getCardValue("CODCOLIGADA"), IDCNT, "ATIVO"); // RM
        }
        
        if (tipoContrato == "Locação de Imóvel - Alteração de Prazo") {
            // Chama a função de UPDATE e passa os parametros/dados esperados pela a função.
            updateTCNT_alteracaoPrazo_imovel(IDCNT, hAPI.getCardValue("dataFimLocacao")); // RM

        } else if (tipoContrato == "Locação de Imóvel - Alteração de Valor") {
            // Chama a função de UPDATE e passa os parametros/dados esperados pela a função.
            updateTcntAuxiliarItens_alteracaoValorAluguel_imovel(valorLocacaoReajustado, ID_TCNT_AUXILIAR, hAPI.getCardValue("NSEQITEMCNT"), connCustom); // SQL
            updateTCNT_alteracaoValorAluguel_imovel(IDCNT); // RM

        } else if (tipoContrato == "Locação de Imóvel - Alteração de Prazo e Valor") {
            // Chama a função de UPDATE e passa os parametros/dados esperados pela a função.
            updateTCNT_alteracaoPrazo_imovel(IDCNT, dataFimLocacao); // RM
            updateTcntAuxiliarItens_alteracaoValorAluguel_imovel(valorLocacaoReajustado, ID_TCNT_AUXILIAR, hAPI.getCardValue("NSEQITEMCNT"), connCustom); // SQL
            updateTCNT_alteracaoValorAluguel_imovel(IDCNT); // RM

        } else if (tipoContrato == "Locação de Imóvel (Rescisões)") { // Rescisão
            // Chama a função de UPDATE/INSERT e passa os parametros/dados esperados pela a função.
            alteraStatusContrato_RM(hAPI.getCardValue("CODCOLIGADA"), IDCNT, "CANCELADO"); // RM
        
        } else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo") {
            // Chama a função de UPDATE e passa os parametros/dados esperados pela a função.
            updateTCNT_alteracaoPrazo_equipamento(IDCNT, dataFimLocacao); // RM

        } else if (tipoContrato == "Locação de Equipamento - Alteração de Valor") {
            // Chama a função de UPDATE e passa os parametros/dados esperados pela a função.
            updateTCNT_alteracaoValorLocacao_equipamento(tipoContrato, IDCNT); // RM
            updateSISMA_alteracaoAluguelContrato_equipamento(connSisma); // SQL

        } else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor") {
            // Chama a função de UPDATE e passa os parametros/dados esperados pela a função.
            updateTCNT_alteracaoPrazo_equipamento(IDCNT, dataFimLocacao); // RM
            updateTCNT_alteracaoValorLocacao_equipamento(tipoContrato, IDCNT); // RM
            updateSISMA_alteracaoAluguelContrato_equipamento(connSisma); // SQL

        } else if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {
            // Chama a função de UPDATE e passa os parametros/dados esperados pela a função.
            updateTCNT_alteracaoValorLocacao_equipamento(tipoContrato, IDCNT); // RM

            // Atualiza o ATIVO para ativado ( 1 ) do(s) equip(s), porque aqui já estará aprovado esse aditivo
            updateTcntAuxiliarItens_statusEquipNoContrato("1", ID_TCNT_AUXILIAR, connCustom); // SQL
            atualizaStatusEquipamento("Contrato_Vigente", connCustom); // SQL

        } else if (tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {
            // Chama a função de UPDATE e passa os parametros/dados esperados pela a função.
            updateTCNT_alteracaoValorLocacao_equipamento(tipoContrato, IDCNT); // RM

            // Desativa equipamentos no SISMA
            updateSISMA_statusEquipamento(connSisma); // SQL

            // Atualiza o ATIVO para desativado ( 0 ) do(s) equip(s), porque aqui já estará aprovado esse aditivo
            updateTcntAuxiliarItens_statusEquipNoContrato("0", ID_TCNT_AUXILIAR, connCustom); // SQL
            atualizaStatusEquipamento("Equipamento_desmobilizado", connCustom);

        } else if (tipoContrato == "Locação de Equipamento (Rescisões)" || tipoContrato == "Locação de Equipamento - Com Mão de Obra (Rescisões)") {
            // Chama a função de UPDATE/INSERT e passa os parametros/dados esperados pela a função.
            alteraStatusContrato_RM(hAPI.getCardValue("CODCOLIGADA"), IDCNT, "CANCELADO"); // RM

            // Atualiza o ATIVO para desativado ( 0 ) do(s) equip(s), porque aqui já estará aprovado essa rescisão
            updateTcntAuxiliarItens_statusEquipNoContrato("0", ID_TCNT_AUXILIAR, connCustom); // SQl
            atualizaStatusEquipamento("Equipamento_desmobilizado", connCustom);

            // Desativa equipamentos no SISMA
            updateSISMA_statusEquipamento(connSisma); // SQL

        } else if (tipoContrato == "Transporte de Materiais - Inclusão de Equipamento") {

            updateTcntAuxiliarItens_statusEquipNoContrato("1", ID_TCNT_AUXILIAR, connCustom); // SQL

        } else if (tipoContrato == "Transporte de Materiais - Exclusão de Equipamento") {
            // MELHORIA TRANSPORTE — desativa (ATIVO=0) os equipamentos selecionados para exclusão do contrato.
            updateTcntAuxiliarItens_statusEquipNoContrato("0", ID_TCNT_AUXILIAR, connCustom); // SQL

        } else if (tipoContrato == "Transporte de Materiais - Alteração de Valor") {
            //MELHORIA TRANSPORTE — grava o novo valor do aditivo no item do contrato no RM
            updateTCNT_alteracaoValor_transporte(IDCNT); // RM

        } else if (tipoContrato == "Transporte de Materiais - Alteração de Prazo") {
            //MELHORIA TRANSPORTE — grava a nova data fim no contrato no RM (reaproveita a função de prazo, que é genérica: IDCNT + data)
            updateTCNT_alteracaoPrazo_equipamento(IDCNT, hAPI.getCardValue("novaDataFimTransporte")); // RM

        } else if (tipoContrato == "Transporte de Materiais - Alteração de Prazo e Valor") {
            //MELHORIA TRANSPORTE — grava a nova data fim E o novo valor no contrato no RM
            updateTCNT_alteracaoPrazo_equipamento(IDCNT, hAPI.getCardValue("novaDataFimTransporte")); // RM
            updateTCNT_alteracaoValor_transporte(IDCNT); // RM
        }

    } catch (error) {
        // Lança erro
        throw error;
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
    log.info("Antes de validaParametros, CODTCN = " + parametros.CODTCN);

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


// XML's
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
        xml += "    <DESCRICAO> - </DESCRICAO>";
        xml += "    <CODCPG>" + parametros.CODCPG + "</CODCPG>";
        xml += "    <CODMOEPRECOFATURAMENTO>R$</CODMOEPRECOFATURAMENTO>";
        xml += "    <CODSTACNT>" + parametros.CODSTACNT + "</CODSTACNT>";
        xml += "    <CODTMV>" + (parametros.CODTCN == TIPOS_CONTRATO["Locação de Imóvel"] ? "1.1.98" : "1.1.99") + "</CODTMV>";
        xml += "    <EPERIODICO>" + parametros.TIPOFATURAMENTO + "</EPERIODICO>";
        xml += "    <DATAINICIO>" + setDateXMLFormat(parametros.DATAINICIO) + "</DATAINICIO>";
        xml += "    <DATAFIM>" + setDateXMLFormat(parametros.DATAFIM) + "T00:00:00</DATAFIM>";
        xml += "    <CODCPGPRAZO>130</CODCPGPRAZO>";
        xml += "    <CODRPR>" + parametros.CODRPR + "</CODRPR>";
        if (parametros.TIPOFATURAMENTO  == TIPOS_FATURAMENTO["Periódico"]) { // Antes era parametros.CODCPG
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


// Update RM
function updateTCNT_alteracaoPrazo_imovel(IDCNT, dataFimLocacao) {

    var CODCOLIGADA = hAPI.getCardValue("CODCOLIGADA");

    var xml = "";
    xml += "<CTRCNT>";
    xml += "  <TCNT>";
    xml += "    <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA>";
    xml += "    <IDCNT>" + IDCNT + "</IDCNT>";
    xml += "    <DATAFIM>" + setDateXMLFormat(dataFimLocacao, 0) + "</DATAFIM>";
    xml += "  </TCNT>";
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
        throw "Erro ao alterar prazo: " + retorno.values[0][1];
    }
}
function updateTCNT_alteracaoValorAluguel_imovel(IDCNT) {

    var CODCOLIGADA = hAPI.getCardValue("CODCOLIGADA");
    var valorMensalLocacao = hAPI.getCardValue("valorLocacaoReajustado");

    var xml = "";
    xml += "<CTRCNT>";

    // Tabela TCNT
    xml += "  <TCNT>";
    xml += "    <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA>";
    xml += "    <IDCNT>" + IDCNT + "</IDCNT>";
    xml += "  </TCNT>";

    // Tabela TITMCNT
    xml += "  <TITMCNT>";
    xml += "    <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA>";
    xml += "    <IDCNT>" + IDCNT + "</IDCNT>";
    xml += "    <NSEQITMCNT>" + 1 + "</NSEQITMCNT>";
    xml += "    <PRECOFATURAMENTO>" + ValorToFloat(valorMensalLocacao).toString().replace(".", ",") + "</PRECOFATURAMENTO>";
    xml += "  </TITMCNT>";
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
        throw "Erro ao alterar valor: " + retorno.values[0][1];
    }
}
function updateTCNT_alteracaoPrazo_equipamento(IDCNT, dataFimLocacao) {

    var CODCOLIGADA = hAPI.getCardValue("CODCOLIGADA");

    var xml = "";
    xml += "<CTRCNT>";
    xml += "  <TCNT>";
    xml += "    <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA>";
    xml += "    <IDCNT>" + IDCNT + "</IDCNT>";
    xml += "    <DATAFIM>" + setDateXMLFormat(dataFimLocacao, 0) + "</DATAFIM>";
    xml += "  </TCNT>";
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
        throw "Erro ao alterar prazo: " + retorno.values[0][1];
    }
}
function updateTCNT_alteracaoValorLocacao_equipamento(tipoContrato, IDCNT) {
    var CODCOLIGADA = hAPI.getCardValue("CODCOLIGADA");

    var temRetencao = hAPI.getCardValue("temRetencao");
    var percentualRetencao = parseFloat(String(hAPI.getCardValue("percentualRetencao") || "0").replace("%", ""));

    var valorMensalLocacao = 0;

    if (tipoContrato == "Locação de Equipamento - Alteração de Valor" || tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor") {

        // Valor mensal original total do contrato
        // Contém todos os equipamentos, tanto os que terão reajuste quanto os que não terão
        var valorTotalContrato = ValorToFloat(hAPI.getCardValue("valorMensalLocacao"));
        var somaValoresOriginaisAlterados = 0;
        var somaValoresReajustadosAlterados = 0;

        // Percorre as linhas do pai-filho com os equipamentos selecionados no aditivo
        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados_aditivos");
        for (var i = 0; i < indexes.length; i++) {
            var id = indexes[i];

            // Valor original do equipamento antes do reajuste
            var valorMensalOriginalAditivo = ValorToFloat(hAPI.getCardValue("valorMensalOriginalAditivo___" + id));

            // Valor reajustado informado no aditivo
            var valorReajustadoAditivo = ValorToFloat(hAPI.getCardValue("valorReajustado_aditivos___" + id));

            somaValoresOriginaisAlterados += valorMensalOriginalAditivo;
            somaValoresReajustadosAlterados += valorReajustadoAditivo;
        }

        // Remove os valores antigos dos equipamentos alterados, e soma os novos valores reajustados
        valorMensalLocacao = valorTotalContrato - somaValoresOriginaisAlterados + somaValoresReajustadosAlterados;

    } else if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento"|| tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {

        // O campo valorMensalLocacao do formulário já foi calculado
        valorMensalLocacao = ValorToFloat(hAPI.getCardValue("valorMensalLocacao"));
    }

    var valorRetencao = 0;
    var valorLiquido = 0;

    // Se houver retenção, separa o valor entre item principal e item de retenção
    if (temRetencao == "Sim" && percentualRetencao > 0) {
        valorRetencao = (valorMensalLocacao * percentualRetencao) / 100;
        valorLiquido = valorMensalLocacao - valorRetencao;
    } else {
        valorLiquido = valorMensalLocacao;
    }

    var xml = "";
    xml += "<CTRCNT>";

    // Tabela TCNT
    xml += "  <TCNT>";
    xml += "    <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA>";
    xml += "    <IDCNT>" + IDCNT + "</IDCNT>";
    xml += "  </TCNT>";

    // Tabela TITMCNT - Item 1 (Principal)
    xml += "  <TITMCNT>";
    xml += "    <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA>";
    xml += "    <IDCNT>" + IDCNT + "</IDCNT>";
    xml += "    <NSEQITMCNT>1</NSEQITMCNT>";
    xml += "    <PRECOFATURAMENTO>" + valorLiquido.toString().replace(".", ",") + "</PRECOFATURAMENTO>";
    xml += "  </TITMCNT>";

    // Tabela TITMCNT - Item 2 (Retenção)
    if (temRetencao == "Sim" && percentualRetencao > 0) {
        xml += "  <TITMCNT>";
        xml += "    <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA>";
        xml += "    <IDCNT>" + IDCNT + "</IDCNT>";
        xml += "    <NSEQITMCNT>2</NSEQITMCNT>";
        xml += "    <PRECOFATURAMENTO>" + valorRetencao.toString().replace(".",",") + "</PRECOFATURAMENTO>";
        xml += "  </TITMCNT>";
    }

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
        throw "Erro ao alterar valor: " + retorno.values[0][1];
    }
}
function updateTCNT_alteracaoValor_transporte(IDCNT) {
    //MELHORIA TRANSPORTE: grava no RM o novo valor do item do contrato para o aditivo de Alteração de Valor de Transporte

    var CODCOLIGADA = hAPI.getCardValue("CODCOLIGADA");

    //calcula o novo valor conforme o Formato de Cobrança escolhido no aditivo
    var formato = hAPI.getCardValue("formatoCobrancaAditivo");
    var novoValor = 0;
    if (formato == "Valor por Parâmetro") {
        //Valor por Km por T = Valor por Tonelada x KM Rodado
        var valorTonelada = ValorToFloat(hAPI.getCardValue("valorTAditivoTransporte"));
        var kmRodado = parseFloat(String(hAPI.getCardValue("kmAditivoTransporte") || "0").replace(",", "."));
        novoValor = valorTonelada * kmRodado;
    } else {
        //Valor Mensal
        novoValor = ValorToFloat(hAPI.getCardValue("valorMensalAditivoTransporte"));
    }

    //monta o XML para atualizar o PRECOFATURAMENTO do item principal (NSEQITMCNT = 1) do contrato
    var xml = "";
    xml += "<CTRCNT>";
    xml += "  <TCNT>";
    xml += "    <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA>";
    xml += "    <IDCNT>" + IDCNT + "</IDCNT>";
    xml += "  </TCNT>";
    xml += "  <TITMCNT>";
    xml += "    <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA>";
    xml += "    <IDCNT>" + IDCNT + "</IDCNT>";
    xml += "    <NSEQITMCNT>1</NSEQITMCNT>";
    xml += "    <PRECOFATURAMENTO>" + novoValor.toString().replace(".", ",") + "</PRECOFATURAMENTO>";
    xml += "  </TITMCNT>";
    xml += "</CTRCNT>";

    var contexto = "CODSISTEMA=G;CODCOLIGADA=" + CODCOLIGADA + ";CODUSUARIO=fluig";

    //reaproveita o mesmo web service usado pela criação/alteração de contrato no RM
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
        throw "Erro ao alterar valor do aditivo de Transporte: " + retorno.values[0][1];
    }
}
function alteraStatusContrato_RM(CODCOLIGADA, IDCNT, STATUS) {
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


// INSERT Sql
function insereDadosNaTabelaAuxiliar(conn) { //Contratos Novos
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
        ], conn);

        return id;
    } catch (error) {
        throw error;
    }
}
function insereDadosNaTabelaAuxiliar_aditivoRescisao_imovel(tipoContrato, ID_TCNT_AUXILIAR, conn) { //Tabela Historico de Aditivo/Rescisão
    var valorMensalAluguel = hAPI.getCardValue("valorMensalAluguel");
    var valorLocacaoReajustado = hAPI.getCardValue("valorLocacaoReajustado");
    var dataInicioLocacao = hAPI.getCardValue("dataInicioLocacao");
    var dataFimLocacao = hAPI.getCardValue("dataFimLocacao");
    var dataAtual = getDateNow();
    var descricao = null;

    // Monta/usa DESCRICAO conforme #tipoContrato
    if (tipoContrato == "Locação de Imóvel - Alteração de Prazo e Valor") {
        descricao = "Alterado prazo e valor do contrato, prazo de " + dataInicioLocacao + " para " + dataFimLocacao + ", e valor de " + valorMensalAluguel + " para " + valorLocacaoReajustado;
    }
        
    else if (tipoContrato == "Locação de Imóvel - Alteração de Valor") {
        descricao = "Alterado valor do contrato de " + valorMensalAluguel + " para " + valorLocacaoReajustado;

    } else if (tipoContrato == "Locação de Imóvel - Alteração de Prazo") {
        descricao = "Alterado prazo do contrato de " + dataInicioLocacao + " para " + dataFimLocacao;

    } else if (tipoContrato == "Locação de Imóvel (Rescisões)") {
        descricao = "Contrato rescindido";
    }

    try {
        var query = "INSERT INTO TCNT_AUXILIAR_ADITIVOS_RESCISOES (";
        query += " ID_TCNT_AUXILIAR, ";
        query += " TIPO, ";
        query += " DESCRICAO, ";
        query += " ID_FLUIG, ";
        query += " DATA, ";
        query += " DATA_ASSINATURA ";
        query += ") ";
        query += " VALUES (?,?,?,?,?,?);";

        var id = executeInsert(query,[
            {type:"int", value: ID_TCNT_AUXILIAR},
            {type:"varchar", value: hAPI.getCardValue("tipoContrato")}, // Tipo do contrato
            {type:"varchar", value: descricao}, // Descrição do que foi alterado no Contrato
            {type:"int", value: getValue("WKNumProces")}, // Nº da Solicitação Fluig
            {type:"date", value: dataAtual}, // Data atual do processo
            {type:"date", value: dataAtual}, // Data de assinatura (Data atual considerando assinado já que foi aprovado/finalizado o processo)
        ], conn);

        return id;
    } catch (error) {
        throw error;
    }
}
function insereDadosNaTabelaAuxiliar_aditivoRescisao_equipamento(tipoContrato, ID_TCNT_AUXILIAR, conn) { //Tabela Historico de Aditivo/Rescisão
    try {
        var valorTotalContrato = ValorToFloat(hAPI.getCardValue("valorMensalLocacao"));
        var valorTotalContartoMask = hAPI.getCardValue("valorMensalLocacao");
        var dataInicioLocacao = hAPI.getCardValue("dataInicioLocacao");
        var dataFimLocacao = hAPI.getCardValue("dataFimLocacao");
        var dataAtual = getDateNow();
        var dataReajuste = hAPI.getCardValue("dataReajuste");
        var descricao = null;

        // Soma dos valores originais apenas dos equipamentos alterados
        var somaValoresOriginaisAlterados = 0;
        // Soma dos valores reajustados apenas dos equipamentos alterados
        var somaValoresReajustadosAlterados = 0;

        // hAPI.getChildrenIndexes retorna uma array de indexes que contém na tabela, exemplo ["1", "2", "3"]
        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados_aditivos");

        // Cria array para armazenar todos os prefixos encontrados na tabela, para depois concatenar prefixos separado por ,
        var listaPrefixos = [];

        // Pecorre cada linha da tabela
        for (var i = 0; i < indexes.length; i++) {

            // Pega o indice atual da tabela
            var id = indexes[i]

            // Monta o nome do campo para buscar o valor salvo na linha
            var prefixo = hAPI.getCardValue("equipSelecionado_aditivos" + "___" + id);

            // Pega o valor mensal original salvo para o prefixo alterado
            var valorMensalOriginalAditivo = ValorToFloat(hAPI.getCardValue("valorMensalOriginalAditivo___" + id));

            // Pega o valor reajustado salvo para o prefixo alterado
            var valorReajustadoAditivo = ValorToFloat(hAPI.getCardValue("valorReajustado_aditivos___" + id));

            // Soma os valores originais dos equipamentos alterados
            somaValoresOriginaisAlterados += valorMensalOriginalAditivo;
            // Soma os valores reajustados dos equipamentos alterados
            somaValoresReajustadosAlterados += valorReajustadoAditivo;

            // Se prefixo não vazio adiciona o prefixo na array de listaPrefixos
            if (prefixo) {
                listaPrefixos.push(prefixo);
            }
        }

        // Novo valor mensal do contrato:
        // valor original total
        // menos os valores originais dos equipamentos alterados
        // mais os valores reajustados dos equipamentos alterados
        var valorMensalLocacao = valorTotalContrato - somaValoresOriginaisAlterados + somaValoresReajustadosAlterados;

        // Formata para valor monetario
        var novoValorContrato = FloatToMoney(valorMensalLocacao);

        // Concatena os prefixos seperando eles por ,
        var prefixos = listaPrefixos.join(", ");

        // Monta/usa DESCRICAO conforme #tipoContrato
        if (tipoContrato == "Locação de Equipamento - Alteração de Prazo e Valor") {
            descricao = 
            "Alterado prazo e valor do contrato, prazo de " + dataInicioLocacao + " para " + dataFimLocacao + ", e valor de " + valorTotalContartoMask + " para " + novoValorContrato + " dos equipamentos: " + prefixos;

        } else if (tipoContrato == "Locação de Equipamento - Alteração de Valor") {
            descricao = "Alterado valor do contrato de " + valorTotalContartoMask + " para " + novoValorContrato + " dos equipamentos: " + prefixos;

        } else if (tipoContrato == "Locação de Equipamento - Alteração de Prazo") {
            descricao = "Alterado prazo do contrato de " + dataInicioLocacao + " para " + dataFimLocacao + " dos equipamentos: " + prefixos;

        } else if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {
            descricao = "Incluído no contrato os equipamentos: " + prefixos;

            // Usa a mesma data atual porque não tem data de reajuste.
            dataReajuste = dataAtual;

        } else if (tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {
            descricao = "Excluído do contrato os equipamentos: " + prefixos;

            // Usa a mesma data atual porque não tem data de reajuste.
            dataReajuste = dataAtual;

        } else if (tipoContrato == "Locação de Equipamento (Rescisões)" || tipoContrato == "Locação de Equipamento - Com Mão de Obra (Rescisões)") {
            descricao = "Contrato rescindido, dos equipamentos: " + prefixos;

            // Usa a mesma data atual porque não tem data de reajuste.
            dataReajuste = dataAtual;
        }

        var query = "INSERT INTO TCNT_AUXILIAR_ADITIVOS_RESCISOES (";
        query += " ID_TCNT_AUXILIAR, ";
        query += " TIPO, ";
        query += " DESCRICAO, ";
        query += " ID_FLUIG, ";
        query += " DATA, ";
        query += " DATA_ASSINATURA ";
        query += ") ";
        query += " VALUES (?,?,?,?,?,?)";

        var id = executeInsert(query,[
            {type:"int", value: ID_TCNT_AUXILIAR},
            {type:"varchar", value: hAPI.getCardValue("tipoContrato")}, // Tipo do contrato
            {type:"varchar", value: descricao}, // Descrição do que foi alterado no Contrato
            {type:"int", value: getValue("WKNumProces")}, // Nº da Solicitação Fluig
            {type:"date", value: dataReajuste}, // Data do reajuste informado no form
            {type:"date", value: dataAtual}, // Data de assinatura (Data atual considerando assinado já que foi aprovado/finalizado o processo)
        ], conn);
        
    } catch (error) {
        throw error;
    }
}
function insereNaTabelaAuxiliarItens_equipNoContrato(ID_TCNT_AUXILIAR, conn) { //Inclusão de Equip
    try {
        var tipoContrato = hAPI.getCardValue("tipoContrato");

        // hAPI.getChildrenIndexes retorna uma array de indexes que contém na tabela, exemplo ["1", "2", "3"]
        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados_aditivos");

        // Busca o próximo NSEQITEMCNT disponível para esse contrato auxiliar
        var proximoNSEQITEMCNT = getNSEQITEMCNT_porID_TCNT_AUXILIAR(tipoContrato, ID_TCNT_AUXILIAR, conn);

        // Pecorre cada linha da tabela
        for (var i = 0; i < indexes.length; i++) {

            // Pega o indice atual da tabela
            var id = indexes[i]

            // Monta o nome do campo para buscar o valor salvo na linha
            var prefixo = hAPI.getCardValue("equipSelecionado_aditivos" + "___" + id);

            // Se não tiver prefixo, ignora a linha
            if (!prefixo) {
                continue;
            }

            var query = "";
            query += "INSERT INTO TCNT_AUXILIAR_ITENS";
            query += "( ";
            query += "ID_TCNT_AUXILIAR, ";
            query += "NSEQITEMCNT, ";
            query += "PREFIXO, ";
            query += "ATIVO "
            query += ") "
            query += "VALUES (?,?,?,?)";

            executeInsert(query, [
                { type : "int", value: ID_TCNT_AUXILIAR },
                { type: "int", value: proximoNSEQITEMCNT },
                { type: "varchar", value: prefixo },
                { type: "int", value: '0' }, // STATUS Desativado, vai ser reativado depois no final do Solict caso seja aprovado o Aditivo/Rescisão
            ], conn);

            // Próximo item já vai com a próxima sequência
            proximoNSEQITEMCNT++;
        }

    } catch (error) {
        // O bloco catch captura qualquer erro lançado dentro do try.
        // Em JavaScript/TypeScript, o valor capturado pode ser qualquer coisa
        // (Error, string, objeto, número, etc).

        if (error instanceof Error) {
            // Se o erro já for uma instância da classe Error,
            // simplesmente relança o mesmo erro.
            throw error;
        } else {
            // Caso o erro NÃO seja um Error (ex: string, objeto, número),
            // criamos um novo Error para padronizar o tipo de erro lançado.

            throw new Error(
                // Se for uma string, usamos diretamente como mensagem
                typeof error === "string"
                    ? error
                    // Caso contrário, converte o valor para JSON
                    // para gerar uma mensagem legível.
                    : JSON.stringify(error)
            );
        }
    }
}
function insereDadosNaTabelaAuxiliarItens(ID_TCNT_AUXILIAR, conn) { //Contratos novos
    try {
        var tipo_contrato = hAPI.getCardValue("tipoContrato");

        if (tipo_contrato == "Locação de Equipamento") {
            insereItensLocacaoDeEquipamento(ID_TCNT_AUXILIAR, conn);
        }
        if (tipo_contrato == "Locação de Equipamento - Com Mão de Obra") {
            insereItensLocacaoDeEquipamento(ID_TCNT_AUXILIAR, conn);
        }
        else if(tipo_contrato == "Locação de Imóvel"){
            insereItensLocacaoDeImovel(ID_TCNT_AUXILIAR, conn);
        }

       
    } catch (error) {
        throw error;
    }
}
function insereItensLocacaoDeEquipamento(ID_TCNT_AUXILIAR, conn) { //Contratos novos

    // Nos testes vai pode ser inserido mais de 1 PREFIXO igual para o mesmo ID_TCNT_AUXILIAR
    // Mas em produção o PREFIXO será único, 
    // já que sempre o novo processo de Cadastro de equip exigirá um PREFIXO não existente na base do SISMA
    try {        
        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados");
        var counter = 0;
        for (var i = 0; i < indexes.length; i++) {
            var id = indexes[i]
            var prefixo = hAPI.getCardValue("equipamentoSelecionadoPrefixo" + "___" + id);

            var query = "INSERT INTO TCNT_AUXILIAR_ITENS (";
            query += "ID_TCNT_AUXILIAR, ";
            query += "NSEQITEMCNT, ";
            query += "PREFIXO,  ";
            query += "ATIVO) "
            query += "VALUES (?,?,?,?)";

            executeInsert(query,[
                {type:"int", value:ID_TCNT_AUXILIAR},//ID_TCNT_AUXILIAR
                {type:"int", value:counter},//NSEQITEMCNT
                {type:"varchar", value:prefixo},//PREFIXO
                {type:"int", value: "1"}, // Ativado
            ], conn);
            counter++;
        }
    } catch (error) {
        throw error;
    }
}
function insereItensLocacaoDeImovel(ID_TCNT_AUXILIAR, conn) { //Contratos novos
 try {        
        var query = "INSERT INTO TCNT_AUXILIAR_ITENS (";
        query += "ID_TCNT_AUXILIAR, ";
        query += "NSEQITEMCNT, ";
        query += "TIPO, ";
        query += "DESCRICAO, ";
        query += "VALOR, ";
        query += "UN, ";
        query += "ENDERECO) "
        query += "VALUES (?,?,?,?,?,?,?)";

        executeInsert(query,[
            {type:"int", value:ID_TCNT_AUXILIAR},//ID_TCNT_AUXILIAR
            {type:"int", value:"0"},//NSEQITEMCNT
            {type:"varchar", value:hAPI.getCardValue("finalidadeLocacao")},//TIPO
            {type:"varchar", value:hAPI.getCardValue("descricaoImovel")},//DESCRICAO
            {type:"float", value:ValorToFloat(hAPI.getCardValue("valorMensalAluguel")+"")},//VALOR
            {type:"varchar", value:"MES"},//UN
            {type:"date", value:hAPI.getCardValue("enderecoImovel")},// ENDERECO
        ], conn);

    } catch (error) {
        throw error;
    }
}


// UPDATE Sql | UPDATE RM
function updateTcntAuxiliarCompleto_quandoContratoNovo(ID_TCNT_AUXILIAR, connCustom) { // Tabela de Contrato

    log.info("## updateTcntAuxiliarCompleto_quandoContratoNovo_eAntesContratoGeradoRM chamada.");
    log.info("Atividade: " + hAPI.getCardValue("atividade"));

    if (hAPI.getCardValue("origemContrato") != "Novos" || !hAPI.getCardValue("ID_TCNT_AUXILIAR")) {
        return; // Só continua se for "Novos" E tiver ID_TCNT_AUXILIAR
    }

    // Campos do Form
    var CODCOLIGADA = hAPI.getCardValue("CODCOLIGADA");
    var modeloContrato = hAPI.getCardValue("modeloContrato") == "Modelo Castilho" ? 1 : 0;
    var temRetencao = hAPI.getCardValue("temRetencao") == "Sim" ? 1 : 0;
    var percentualRetencao = hAPI.getCardValue("percentualRetencao").replace("%","");
    var temREIDI = hAPI.getCardValue("temREIDI") == "Sim" ? 1 : 0;
    var percentualREIDI = hAPI.getCardValue("percentualREIDI");
    var tipoAssinatura = hAPI.getCardValue("assinaturaContrato");
    var tipoContrato = hAPI.getCardValue("tipoContrato");
    var percentualDescontoChuva = hAPI.getCardValue("descontoPorDiaChuva").replace("%","");
    var percentualDescontoDiasParado = hAPI.getCardValue("descontoPorDiaParado").replace("%","");

    // Executa Update
    updateTcntAuxiliar_porID_TCNT_AUXILIAR({
        CODCOLIGADA:                    { type: "int",     value: CODCOLIGADA },
        IS_MODELO_CASTILHO:             { type: "int",     value: modeloContrato },
        IS_RETENCAO:                    { type: "int",     value: temRetencao },
        PERCENT_RETENCAO:               { type: "float",   value: percentualRetencao },
        IS_REIDI:                       { type: "int",     value: temREIDI },
        PERCENT_REIDI:                  { type: "float",   value: percentualREIDI },
        TIPO_ASSINATURA:                { type: "varchar", value: tipoAssinatura },
        TIPO_CONTRATO:                  { type: "varchar", value: tipoContrato },
        PERCENT_DESCONTO_CHUVA:         { type: "varchar", value: percentualDescontoChuva },
        PERCENT_DESCONTO_DIAS_PARADO:   { type: "varchar", value: percentualDescontoDiasParado }
    });


    // Util
    function updateTcntAuxiliar_porID_TCNT_AUXILIAR(campos) {
        try {
            var colunas = []; // Guarda as colunas que irá no SET
            var constraints = []; // Guarda os valores do SET, que são os  "?"

            for (var coluna in campos) {
                colunas.push( coluna + " = ?" ); // Monta: "NOME_COLUNA = ?", e add (push) na lista do SET
                constraints.push({ type: campos[coluna].type, value: campos[coluna].value }); // Empilha o tipo e o valor daquela coluna
            }

            // Junta os pedaços da colunas com virgula e monta o UPDATE completo, com o WHERE pel o ID
            var query = "UPDATE TCNT_AUXILIAR SET " + colunas.join(", ") + " WHERE ID = ?";

            // Adiciona por ultimo o valor do "?"  WHERE
            constraints.push({ type: "int", value: ID_TCNT_AUXILIAR });

            // Executa o UPDATE
            executaUpdate(query, constraints, connCustom);
            log.info("## updateTcntAuxiliar_porID_TCNT_AUXILIAR, query: ");
            log.dir(query);

        } catch (error) {
            throw error;
        }
    }
}
function atualizaDadosTabelasAuxiliares_porOrigemContratoTipoContrato(origemContrato, tipoContrato, connCustom) {

    log.info("## atualizaDadosTabelasAuxiliares_porOrigemContratoTipoContrato chamada.");
    log.info("Atividade: " + hAPI.getCardValue("atividade"));

    var ID_TCNT_AUXILIAR = hAPI.getCardValue("ID_TCNT_AUXILIAR");

    // Formata valor monetario para float
    var valorLocacaoReajustado = ValorToFloat(hAPI.getCardValue("valorLocacaoReajustado"));

    // ============================
    // Origem Contrato: NOVOS
    // ============================

    if (origemContrato == "Novos") {
        // Locação de Imóvel
        if (tipoContrato == "Locação de Imóvel") {
            updateTcntAuxiliarItens_locacaoDeImovel(ID_TCNT_AUXILIAR, connCustom); // SQL
        }
    }


    // Utils
    function updateTcntAuxiliarItens_locacaoDeImovel(ID_TCNT_AUXILIAR, connCustom) { // Locação de Imóvel
        try {
            var query = "UPDATE TCNT_AUXILIAR_ITENS SET ";
            query += "TIPO = ?, ";
            query += "DESCRICAO = ?, ";
            query += "VALOR = ?, ";
            query += "ENDERECO = ? ";
            query += "WHERE ID_TCNT_AUXILIAR = ? AND NSEQITEMCNT = ?";

            executaUpdate(query,[
                { type: "varchar", value: hAPI.getCardValue("finalidadeLocacao") }, //TIPO
                { type: "varchar", value: hAPI.getCardValue("descricaoImovel") }, //DESCRICAO
                { type: "float", value: ValorToFloat(hAPI.getCardValue("valorMensalAluguel")+"") }, //VALOR
                { type: "date", value: hAPI.getCardValue("enderecoImovel") }, // ENDERECO
                { type: "int", value: ID_TCNT_AUXILIAR }, // ID_TCNT_AUXILIAR
                { type: "int", value: "0" }, // NSEQITEMCNT, Imóvel é fixo 0 (somente 1 item)
            ], connCustom);

        } catch (error) {
            throw error;
        }
    }
}


// UPDATE Sql - Geral
function updateTcntAuxiliar_IDCNT(IDCNT, ID_TCNT_AUXILIAR, conn){
    try {
        var query = "UPDATE TCNT_AUXILIAR SET IDCNT = ? WHERE ID = ?";
        executaUpdate(query, [
            {type:"int", value:IDCNT},
            {type:"int", value:ID_TCNT_AUXILIAR},
        ], conn);
    } catch (error) {
        throw error;   
    }
}
function updateTcntAuxiliar_dataAssinatura(DATA_ASSINATURA, ID_TCNT_AUXILIAR, conn){
    try {
        var query = "UPDATE TCNT_AUXILIAR SET DATA_ASSINATURA = ? WHERE ID = ?";
        executaUpdate(query, [
            {type:"date", value:DATA_ASSINATURA},
            {type:"int", value:ID_TCNT_AUXILIAR},
        ], conn);
    } catch (error) {
        throw error;
    }
}
function updateTcntAuxiliarItens_alteracaoValorAluguel_imovel(valorLocacaoReajustado, ID_TCNT_AUXILIAR, NSEQITEMCNT, conn) {
    try {
        // Inicia um bloco de proteção contra erros, se algo der errado durante a execução, o erro será capturado.

        // Monta a query que será enviada ao banco e atualizar o campos VALOR
        var query = "UPDATE TCNT_AUXILIAR_ITENS SET VALOR = ? WHERE ID_TCNT_AUXILIAR = ? AND NSEQITEMCNT = ?";

        // Executa o comando no banco.
        // Os "?" da query serão substituídos pelos valores abaixo, na mesma ordem em que aparecem.
        executaUpdate(query, [
            
            // Primeiro "?" > novo valor de aluguel
            {type: "float", value: valorLocacaoReajustado},
            // Segundo "?" > código do contrato que será atualizado
            {type: "int", value: ID_TCNT_AUXILIAR},
            // Terceiro "?" > numero de sequencia do item do contrato
            {type: "int", value: NSEQITEMCNT},

        ], conn);
        // "jdbc/CastilhoCustom" é o nome da conexão usada para acessar o banco.

    } catch (error) {
        // Se ocorrer algum erro durante a execução da query, ele é capturado aqui.

        // O erro é reenviado para quem chamou essa função, permitindo que seja tratado em outro ponto do sistema.
        throw error;
    }
}
function updateTcntAuxiliarItens_statusEquipNoContrato(ATIVO, ID_TCNT_AUXILIAR, conn) { //Inclusão/Exclusão de Equip
    try {
        // hAPI.getChildrenIndexes retorna uma array de indexes que contém na tabela, exemplo ["1", "2", "3"]
        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados_aditivos");

        // Pecorre cada linha da tabela
        for (var i = 0; i < indexes.length; i++) {

            // Pega o indice atual da tabela
            var id = indexes[i]

            // Monta o nome do campo para buscar o valor salvo na linha
            var prefixo = hAPI.getCardValue("equipSelecionado_aditivos" + "___" + id);

            // Se não tiver prefixo, ignora a linha
            if (!prefixo) {
                continue;
            }

            var query = "";
            query += "UPDATE TCNT_AUXILIAR_ITENS SET ATIVO = ? WHERE PREFIXO = ? AND ID_TCNT_AUXILIAR = ? "

            executeInsert(query, [
                { type: "int", value: ATIVO },
                { type: "varchar", value: prefixo },
                { type : "int", value: ID_TCNT_AUXILIAR }
            ], conn);
        }

    } catch (error) {
        // O bloco catch captura qualquer erro lançado dentro do try.
        // Em JavaScript/TypeScript, o valor capturado pode ser qualquer coisa
        // (Error, string, objeto, número, etc).

        if (error instanceof Error) {
            // Se o erro já for uma instância da classe Error,
            // simplesmente relança o mesmo erro.
            throw error;
        } else {
            // Caso o erro NÃO seja um Error (ex: string, objeto, número),
            // criamos um novo Error para padronizar o tipo de erro lançado.

            throw new Error(
                // Se for uma string, usamos diretamente como mensagem
                typeof error === "string"
                    ? error
                    // Caso contrário, convertemos o valor para JSON
                    // para gerar uma mensagem legível.
                    : JSON.stringify(error)
            );
        }
    }
}
function updateSISMA_statusEquipamento(conn) { 
    try {
        var dataAtual = getDateNow() + " 00:00:00";

        // hAPI.getChildrenIndexes retorna uma array de indexes que contém na tabela, exemplo ["1", "2", "3"]
        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados_aditivos");

        // Pecorre cada linha da tabela
        for (var i = 0; i < indexes.length; i++) {

            // Pega o indice atual da tabela
            var id = indexes[i]

            // Monta o nome do campo para buscar o valor salvo na linha
            var prefixo = hAPI.getCardValue("equipSelecionado_aditivos" + "___" + id);

            // Se não tiver prefixo, ignora a linha
            if (!prefixo) {
                continue;
            }

            var query = "";
            query += "UPDATE EQUIPAMENTO SET CODIINES = ?, DATADESA = CONVERT(datetime, ?, 120) WHERE NUMEEQUI = ?"

            executeInsert(query, [
                { type: "int", value: '1' },
                { type: "datetime", value: dataAtual },
                { type: "varchar", value: prefixo }
            ], conn);
        }

    } catch (error) {


        if (error instanceof Error) {
            
            throw error;
        } else {
            

            throw new Error(
                typeof error === "string"
                    ? error
                    //
                    : JSON.stringify(error)
            );
        }
    }
}
function updateSISMA_alteracaoAluguelContrato_equipamento(conn) {
    try {
        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados_aditivos");
        var counter = 0;
        for (var i = 0; i < indexes.length; i++) {
            var id = indexes[i]
            var prefixo = hAPI.getCardValue("equipSelecionado_aditivos___" + id);
            var valorReajustado = ValorToFloat(hAPI.getCardValue("valorReajustado_aditivos___" + id));
            var valorMaoDeObra = ValorToFloat(hAPI.getCardValue("valorMaoDeObraAditivos___" + id));
            var valorAluguelContrato = valorReajustado - valorMaoDeObra;

            var query = "UPDATE EQUIPAMENTO SET ALUGUEL_CONTRATO = ? WHERE NUMEEQUI = ?";
            executaUpdate(query, [
                {type:"float", value: valorAluguelContrato},
                {type:"varchar", value: prefixo},
            ], conn);
            counter++;
        }
    } catch (error) {
        throw error;
    }
}
function atualizaStatusEquipamento(status, conn){
    var origemContrato = hAPI.getCardValue("origemContrato");

    if (origemContrato == "Novos") {
        try {
            var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados");
    
            for (var i = 0; i < indexes.length; i++) {
                var id = indexes[i]
                var prefixo = hAPI.getCardValue("equipamentoSelecionadoPrefixo" + "___" + id);

                // MA / PA
                var isMAouOutros = buscaCategoriaPorPrefixo(prefixo, conn);
                if (isMAouOutros[0].CATEGORIA != "Outros") {
                    var query = "UPDATE EQUIPAMENTOS_CONTRATOS_AUXILIAR SET ";
                    query += "STATUS = ? ";
                    query +="WHERE PREFIXO = ?";

                    executeInsert(query, [
                        {type:"int", value:codigoStatusEquipamentos[status]},
                        {type:"varchar", value:prefixo},
                    ], conn);

                // Outros
                } else {
                    var query = "UPDATE EQUIPAMENTOS_CONTRATOS_AUXILIAR_OUTROS SET ";
                    query += "STATUS = ? ";
                    query +="WHERE PREFIXO = ?";

                    executeInsert(query, [
                        {type:"int", value:codigoStatusEquipamentos[status]},
                        {type:"varchar", value:prefixo},
                    ], conn);
                }
            }
        } catch (error) {
            throw error;
        }
    } else if (origemContrato == "Aditivos" || origemContrato == "Rescisões") {
        try {
            var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados_aditivos");
    
            for (var i = 0; i < indexes.length; i++) {
                var id = indexes[i]
                var prefixo = hAPI.getCardValue("equipSelecionado_aditivos" + "___" + id);

                var query = "UPDATE EQUIPAMENTOS_CONTRATOS_AUXILIAR SET ";
                query += "STATUS = ? ";
                query +="WHERE PREFIXO = ?";

                executeInsert(query, [
                    {type:"int", value:codigoStatusEquipamentos[status]},
                    {type:"varchar", value:prefixo},
                ], conn);
                
            }
        } catch (error) {
            throw error;
        }
    }
}


// SELECT sql
function buscaCategoriaPorPrefixo(PREFIXO, conn){
    try {
        var query = "SELECT CATEGORIA FROM VIEW_EQUIPAMENTOS_CONTRATOS WHERE PREFIXO = ?";
        var retorno = executaQuery(query, [
            {type:"varchar", value:PREFIXO}
        ], conn);

        return retorno;
    } catch (error) {
        throw error;
    }
}
function getNSEQITEMCNT_porID_TCNT_AUXILIAR(tipoContrato, ID_TCNT_AUXILIAR, conn) {
    try {
        if (tipoContrato == "Locação de Equipamento - Inclusão de Equipamento") {
            var query = "SELECT MAX(NSEQITEMCNT) +1 AS NSEQITEMCNT FROM TCNT_AUXILIAR_ITENS WHERE ID_TCNT_AUXILIAR = ?"

            var result = executaQuery(query, [
                { type: "int", value: ID_TCNT_AUXILIAR }
            ], conn);

            return parseInt(result[0].NSEQITEMCNT);

        } else if (tipoContrato == "Transporte de Materiais - Inclusão de Equipamento") {

            var query = "SELECT COALESCE(MAX(NSEQITEMCNT), -1) + 1 AS NSEQITEMCNT FROM TCNT_AUXILIAR_ITENS WHERE ID_TCNT_AUXILIAR = ?"

            var result = executaQuery(query, [
                { type: "int", value: ID_TCNT_AUXILIAR }
            ], conn);

            return parseInt(result[0].NSEQITEMCNT);

        } else if (tipoContrato == "Locação de Equipamento - Exclusão de Equipamento") {


        }

    } catch (error) {


        if (error instanceof Error) {
            
            throw error;
        } else {


            throw new Error(
              
                typeof error === "string"
                    ? error
                    : JSON.stringify(error)
            );
        }
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


// Historico
function insereHistorico(observacao, acao, atividade) {
    var USER = getValue("WKUser");
    var DATA = getDateTimeNow();
    var atividadeAtual = getValue("WKNumState");

    // Quando não estiver sendo movimentada (false), não executa inserção de histórico
    if (getValue("WKCompletTask") == "false") {
        return;
    }

    // Quando for iniciar a solicit
    if (solicitacaoEstaSendoAberta()) {
        acao = "Abertura Solicitação"
    }

    // Quando atvd "Análise de Equipamentos"
    if (atividadeAtual == ATIVIDADES.ANALISE_EQUIPAMENTO) {
        // Usa o usuário do Fluig
        // Para constar no historico o Fluig como se o Fluig tivesse movimentado
        // Por que é movimentado automático quando passa por analise
        USER = "fluig";
    }

    var novaLinha = new java.util.HashMap();
    novaLinha.put("tableHistoricoUsuario", USER);
    novaLinha.put("tableHistoricoData", DATA);
    novaLinha.put("tableHistoricoAtividade", atividade);
    novaLinha.put("tableHistoricoProximaAtividade", "");
    novaLinha.put("tableHistoricoObservacao", observacao);
    novaLinha.put("tableHistoricoAcao", acao);

    hAPI.addCardChild("tableHistorico", novaLinha);
}


// Utils
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
    valor = String(valor);

    if (valor.split("R$").length > 1) {
        valor = valor.split("R$")[1].trim();
    }
    valor = valor.split(".").join("").split(",").join(".");
    return parseFloat(valor);
}
function FloatToMoney(valor) {
    // Converte o valor recebido para número.
    // Se vier vazio, null ou undefined, usa 0.
    // toFixed(2) garante que sempre teremos duas casas decimais.
    valor = parseFloat(valor || 0).toFixed(2);

    // Troca o ponto decimal por vírgula para seguir o padrão brasileiro
    // Ex: 14635.25 ? 14635,25
    valor = valor.replace(".", ",");

    // Insere separadores de milhar (pontos) na parte inteira do número
    // Ex: 14635,25 ? 14.635,25
    // A expressão regular encontra posições corretas para inserir os pontos
    return "R$ " + valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function BuscaNomeUsuario(CodUsuario) {
    var ds = DatasetFactory.getDataset("colleague", ["colleagueName"], [
        DatasetFactory.createConstraint("colleagueId", CodUsuario, CodUsuario, ConstraintType.MUST)
    ], null);

    return ds.getValue(0, "colleagueName");
}
function executaQuery(query, constraints, dataSourceOrConn) {
    // O terceiro parâmetro era sempre uma string com o nome do banco (ex: "/jdbc/Sisma").
    // Renomeamos para dataSourceOrConn porque agora pode ser duas coisas:
    //   - Uma string "/jdbc/Sisma" -> comportamento antigo, abre e fecha conexão aqui dentro
    //   - Um objeto de conexão já aberta -> usa ela e NÃO fecha (quem abriu é responsável)

    try {
        log.info("executandoQuery");
        log.info(query);
        log.dir(constraints);

        var ic = new javax.naming.InitialContext();

        // dataSourceOrConn pode ser:
        //   - String com o nome do datasource ("/jdbc/Sisma") -> abrimos e fechamos aqui
        //   - Conexão já aberta (modo transação)              -> usamos e NÃO fechamos
        var isConexaoCompartilhada = (dataSourceOrConn instanceof Packages.java.sql.Connection);
        var ownConn = !isConexaoCompartilhada;

        if (ownConn) {
            var ds = ic.lookup(dataSourceOrConn);
            conn = ds.getConnection();
        } else {
            conn = dataSourceOrConn;   // usa a conexão da transação
        }

        var stmt = conn.prepareStatement(query, Packages.java.sql.Statement.RETURN_GENERATED_KEYS);

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
        // Só fecha conexão se foi a gente que abriu (ownConn = true)
        // Se veio de fora (ownConn = false), deixa aberta - quem abriu fecha
        // Fecha antes do commit/rollback cancela a transação inteira, evitando cadastro "quebrado"
        if (ownConn && conn != null) {
            conn.close();
        }
    }
}
function executeInsert(query, constraints, dataSourceOrConn) {
    // O terceiro parâmetro era sempre uma string com o nome do banco (ex: "/jdbc/Sisma").
    // Renomeamos para dataSourceOrConn porque agora pode ser duas coisas:
    //   - Uma string "/jdbc/Sisma" -> comportamento antigo, abre e fecha conexão aqui dentro
    //   - Um objeto de conexão já aberta -> usa ela e NÃO fecha (quem abriu é responsável)

    try {
        log.info("executandoQuery");
        log.info(query);
        log.dir(constraints);

        var ic = new javax.naming.InitialContext();

        // dataSourceOrConn pode ser:
        //   - String com o nome do datasource ("/jdbc/Sisma") -> abrimos e fechamos aqui
        //   - Conexão já aberta (modo transação)              -> usamos e NÃO fechamos
        var isConexaoCompartilhada = (dataSourceOrConn instanceof Packages.java.sql.Connection);
        var ownConn = !isConexaoCompartilhada;

        if (ownConn) {
            var ds = ic.lookup(dataSourceOrConn);
            conn = ds.getConnection();
        } else {
            conn = dataSourceOrConn;   // usa a conexão da transação
        }

        var stmt = conn.prepareStatement(query, Packages.java.sql.Statement.RETURN_GENERATED_KEYS);

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


        stmt.execute();

        var generatedKeys = stmt.getGeneratedKeys();
        if (generatedKeys.next()) {
            var id = generatedKeys.getInt(1);
            log.info("ID gerado: " + id);
            return id;
        }
    } catch (error) {
        var msg = "";
            // Try to extract useful message safely
            if (error && error.javaException) {
                msg = error.javaException.getMessage();
            } else if (error && error.message) {
                if (error.message.Error) {
                }else{
                    msg = error.message;
                }


            } else {
                msg = String(error);
            }

            log.error("ERRO==============> " + msg);
            log.error("Type of error: " + typeof error);
            log.error("Type of msg: " + typeof msg);

            // Safely rethrow as standard JS error
            throw "Erro ao executar Dataset: " + msg;

    } finally {
        if (stmt != null) {
            stmt.close();
        }
        // Só fecha conexão se foi a gente que abriu (ownConn = true)
        // Se veio de fora (ownConn = false), deixa aberta - quem abriu fecha
        // Fecha antes do commit/rollback cancela a transação inteira, evitando cadastro "quebrado"
        if (ownConn && conn != null) {
            conn.close();
        }
    }
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
function solicitacaoEstaSendoAberta() {

    /*
        Form Modes Fluig

        ADD: O formulário está em modo de criação (nova solicitação).
        MOD: O formulário está em modo de edição (uma solicitação existente sendo alterada ou movimentada).
        VIEW: O formulário está em modo de apenas visualização (consulta).
    */
    
    if (hAPI.getCardValue("formMode") == "ADD") {
        log.info("## function solicitacaoEstaSendoAberta");
        log.info("formMode: " + hAPI.getCardValue("formMode"));
        return true;

    } else {
        return false
    }
}