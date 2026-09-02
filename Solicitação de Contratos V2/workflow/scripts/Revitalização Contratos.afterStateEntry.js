function afterStateEntry(sequenceId) {

    // Atualiza somente o nome da atividade de destino no historico na aba "Histórico e Decisão"
    atualizaProximaAtividadeUltimoHistorico(sequenceId);
}

// Historico
function atualizaProximaAtividadeUltimoHistorico(sequenceId) {
    var nomeAtividadeAtual = nomeAtividadePorCodigo(sequenceId);

    var indexes = hAPI.getChildrenIndexes("tableHistorico");
    var ultimoIndex = indexes[indexes.length - 1];

    hAPI.setCardValue("tableHistoricoProximaAtividade___" + ultimoIndex, nomeAtividadeAtual);
}

// Utils
function nomeAtividadePorCodigo(codigoAtividade) {

    if (codigoAtividade == ATIVIDADES.INICIO || codigoAtividade == ATIVIDADES.INICIO_0) {
        return "Solicitante";

    } else if (codigoAtividade == ATIVIDADES.JURIDICO) {
        return "Jurídico";

    } else if (codigoAtividade == ATIVIDADES.CONTROLADORIA) {
        return "Controladoria";

    }  else if (codigoAtividade == ATIVIDADES.ENGENHEIRO) {
        return "Aprovação Engenheiro";

    }  else if (codigoAtividade == ATIVIDADES.COORDENADOR_OBRAS) {
        return "Aprovação Coord. Obras";

    }  else if (codigoAtividade == ATIVIDADES.ANALISE_EQUIPAMENTO) {
        return "Análise de Equipamentos";

    }  else if (codigoAtividade == ATIVIDADES.DIRETORIA) {
        return "Aprovação Diretoria";

    }  else if (codigoAtividade == ATIVIDADES.STATUS_ASSINATURA_ELETRONICA) {
        return "Aguardando Assinatura Eletrônica";

    }  else if (codigoAtividade == ATIVIDADES.STATUS_ASSINATURA_ELETRONICA) {
        return "Assinatura Eletrônica Assinada";

    }  else if (codigoAtividade == ATIVIDADES.ADM_OBRA) {
        return "Adm. Obra";

    }  else if (codigoAtividade == ATIVIDADES.CONTROLADORIA_AGUARDA_RECEBIMENTO) {
        return "Controladoria Aguarda Recebimento";

    }  else if (codigoAtividade == ATIVIDADES.CONTROLADORIA_RECEBE_ASSINATURAS) {
        return "Controladoria Recebe Vias Originais";

    }  else if (ATIVIDADES.FIM.indexOf(codigoAtividade) !== -1) {
        return "Fim";

    }
}