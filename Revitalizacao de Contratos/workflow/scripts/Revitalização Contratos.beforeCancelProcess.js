function beforeCancelProcess(colleagueId,processId){
    var tipoContrato = hAPI.getCardValue("tipoContrato");
    
    if (tipoContrato == "Locação de Equipamento") {
        resetaStatusDosEquipamentosParaPendenteContrato();
    }
}

function resetaStatusDosEquipamentosParaPendenteContrato(){
    try {
        var indexes = hAPI.getChildrenIndexes("tableEquipamentosSelecionados");
        for (var i = 0; i < indexes.length; i++) {
            var id = indexes[i];
            var PREFIXO = hAPI.getCardValue("equipamentoSelecionadoPrefixo" + "___" + id);

            var isMAouOutros = buscaCategoriaPorPrefixo(PREFIXO);
            if (isMAouOutros[0].CATEGORIA != "Outros") {
                var query = "";
                query += "UPDATE EQUIPAMENTOS_CONTRATOS_AUXILIAR SET STATUS = 1 WHERE PREFIXO = ?";
                executaUpdate(query,[
                    {type:"varchar", value:PREFIXO}
                ], "/jdbc/CastilhoCustom");
            }
            else{
                var query = "";
                query += "UPDATE EQUIPAMENTOS_CONTRATOS_AUXILIAR_OUTROS SET STATUS = 1 WHERE PREFIXO = ?";
                executaUpdate(query,[
                    {type:"varchar", value:PREFIXO}
                ], "/jdbc/CastilhoCustom");
            }

        }
    } catch (error) {
        throw error;    
    }
}
function executaUpdate(query, constraints, dataSource) {
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

        stmt.executeUpdate();
        return true;

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