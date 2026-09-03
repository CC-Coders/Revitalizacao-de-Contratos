function intermediateconditional58() {
    try {
        // Abre UMA conexão para a transação. Todos os INSERT/UPDATE da abertura
        // usam essa mesma conexão, então ou grava tudo (commit) ou nada (rollback).
        var ic = new javax.naming.InitialContext();
        var connCustom = ic.lookup("/jdbc/CastilhoCustom").getConnection();
        connCustom.setAutoCommit(false);

        var numProcess = getValue("WKNumProces");
        var ds = DatasetFactory.getDataset("ds_form_aux_wesign", null, [
            DatasetFactory.createConstraint("numSolic",numProcess,numProcess,ConstraintType.MUST)
        ], null);

        log.info("verificaStatusAssinatura");
        log.dir(ds);

        for (var i = 0; i < ds.rowsCount; i++) {
            var status = ds.getValue(i, "statusAssinatura");
            log.info("status");
            log.info(status);
            hAPI.setCardValue("statusAssinatura", status);


            if (status == "Assinado") {

                var dataAssinado = ds.getValue(i, "dataAssinatura");

                if (dataAssinado !== "null") {
                    hAPI.setCardValue("dataAssinatura", dataAssinado);

                    var idTcntAuxiliar = parseInt(hAPI.getCardValue("ID_TCNT_AUXILIAR"), 10);
                    if (!isNaN(idTcntAuxiliar) && idTcntAuxiliar > 0) {
                        updateTcntAuxiliar_dataAssinatura(dataAssinado, idTcntAuxiliar, connCustom);
                    } else {
                        log.warn("intermediate58 - ID_TCNT_AUXILIAR inválido, pulando update de dataAssinatura: " + hAPI.getCardValue("ID_TCNT_AUXILIAR"));
                    }
                }
            
                log.info("intermediate58 - antes do return true");
                return true;
            }

            if (status == "Pendente Assinatura") {
                return false;
            }
        }
        // Chegou até aqui = todos os INSERT's / UPDATE's rodaram sem erro. Grava tudo de uma vez.
        connCustom.commit();

        return true;

    } catch (error) {
        // Qualquer erro desfaz todos os INSERT's / UPDATE's da abertura
        log.error("## Revitalização Contratos intermediateconditional58: erro em algum INSERT/UPDATE, iniciando rollback. Erro: ");
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

function executaUpdate(query, constraints, dataSourceOrConn) {
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

        stmt.executeUpdate();
        return true;

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