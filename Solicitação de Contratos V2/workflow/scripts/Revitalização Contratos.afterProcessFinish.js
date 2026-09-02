function afterProcessFinish(processId) {
    try {
        // Abre UMA conexão para a transação. Todos os INSERT/UPDATE da abertura
        // usam essa mesma conexão, então ou grava tudo (commit) ou nada (rollback).
        var ic = new javax.naming.InitialContext();
        var connCustom = ic.lookup("/jdbc/CastilhoCustom").getConnection();
        connCustom.setAutoCommit(false);

        var TIPO_CONTRATO = hAPI.getCardValue("tipoContrato");

        if (TIPO_CONTRATO == "Locação de Equipamento" || TIPO_CONTRATO == "Locação de Equipamento - Com Mão de Obra") {
            atualizaStatusEquipamento("Contrato_Vigente", connCustom);
        }

        // Chegou até aqui = todos os INSERT's / UPDATE's rodaram sem erro. Grava tudo de uma vez.
        connCustom.commit();

    } catch (error) {

        // Qualquer erro desfaz todos os INSERT's / UPDATE's da abertura
        log.error("## Revitalização Contratos afterProcessFinish: erro em algum UPDATE, iniciando rollback. Erro: ");
        log.dir(error);

        // Rollback Castilho Custom
        try {  connCustom.rollback() } catch (e) { log.error("## Erro no rollback do Custom: " + e) }

        throw error;

    } finally {
        // O bloco finally sempre executa, com erro ou sem.
        // Garantimos que as conexões são fechadas independente se deu erro ou não.
        // Se não fechar, o banco fica com conexões presas e para de responder com o tempo.
        try { connCustom.close() } catch (e) {}
    }
}