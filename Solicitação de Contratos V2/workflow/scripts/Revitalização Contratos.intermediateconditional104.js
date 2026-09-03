function intermediateconditional104() {
    try {
        var returnAnalisePendente = false;
        var returnAnaliseCompleta = true;

        // Abre UMA conexão para a transação. Todos os INSERT/UPDATE da abertura
        // usam essa mesma conexão, então ou grava tudo (commit) ou nada (rollback).
        var ic = new javax.naming.InitialContext();
        var connCustom = ic.lookup("/jdbc/CastilhoCustom").getConnection();
        connCustom.setAutoCommit(false);

        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados");
        for (var i = 0; i < indexes.length; i++) {
            var id = indexes[i];
            var PREFIXO = hAPI.getCardValue("equipamentoSelecionadoPrefixo" + "___" + id);

            var query = "SELECT STATUS FROM EQUIPAMENTOS_CONTRATOS_AUXILIAR WHERE PREFIXO = ?";
            var retorno = executaQuery(query,[
                {type:"varchar", value:PREFIXO}
            ], connCustom);

            log.info("Verifica status equipamentos");
            if (retorno.length == 0) {
                log.info("Prefixo " + PREFIXO + " não encontrado.");
                continue;
            }

            log.dir(retorno);
            log.dir(retorno[0].STATUS);
            log.dir(retorno.STATUS);
            if (retorno[0].STATUS != "3") {
                log.info("Returno analise pendente");
                return returnAnalisePendente;
            }
        }

        // Chegou até aqui = todos os INSERT's / UPDATE's rodaram sem erro. Grava tudo de uma vez.
        connCustom.commit();

        log.info("Returno analise concluida");
        return returnAnaliseCompleta;

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

        log.error("## DEBUG conn -> typeof=" + (typeof dataSourceOrConn)
            + " | isString=" + (typeof dataSourceOrConn === "string")
            + " | instConn=" + (dataSourceOrConn instanceof Packages.java.sql.Connection)
            + " | valor=" + dataSourceOrConn);

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