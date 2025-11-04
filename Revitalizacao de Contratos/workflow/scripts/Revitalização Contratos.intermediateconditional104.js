function intermediateconditional104() {
  var returnAnalisePendente = false;
    var returnAnaliseCompleta = true;

    var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados");
    for (var i = 0; i < indexes.length; i++) {
        var id = indexes[i];
        var PREFIXO = hAPI.getCardValue("equipamentoSelecionadoPrefixo" + "___" + id);

        var query = "SELECT STATUS FROM EQUIPAMENTOS_CONTRATOS_AUXILIAR WHERE PREFIXO = ?";
        var retorno = executaQuery(query,[
            {type:"varchar", value:PREFIXO}
        ], "/jdbc/CastilhoCustom");

        log.info("Verifica status equipamentos");
        log.dir(retorno);
        log.dir(retorno[0].STATUS);
        log.dir(retorno.STATUS);
        if (retorno[0].STATUS != "7") {
            log.info("Returno analise pendente");
            return returnAnalisePendente;
        }
    }

    log.info("Returno analise concluida");
    return returnAnaliseCompleta;
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