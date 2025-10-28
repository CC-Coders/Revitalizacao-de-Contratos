function createDataset(fields, constraints, sortFields) {
    try {
        var constraints = getConstraints(constraints);
        lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, ["CAMPO","VALOR", "IDEQUI"]);

        if (constraints.CAMPO == "CNPJ") {
            var query = "";
            query += "UPDATE EQUIPAMENTO SET ";
            query += "    CODIPROP =	CASE ";
            query += "                    WHEN CODIESPE = 1 THEN (SELECT CODIPROP FROM PROPRIETARIO WHERE INSCESTADUAL = ?) ";
            query += "                ELSE 0 ";
            query += "                END, ";
            query += "    CODITERC = CASE ";
            query += "                    WHEN CODIESPE = 5 THEN (SELECT CODITERC FROM TERCEIRO WHERE INSCESTADUAL = ?) ";
            query += "                    ELSE 0 ";
            query += "                END ";
            query += "WHERE IDEQUI = ? ";


            executeInsert(query,[
                {"type":"varchar", value:constraints.VALOR},
                {"type":"varchar", value:constraints.VALOR},
                {"type":"int", value:constraints.IDEQUI},
            ], "/jdbc/Sisma");

            return returnDataset("SUCCESS","","");
        }
        else if(constraints.CAMPO == "Valor de Locação"){
            var query = "";
            query += "UPDATE EQUIPAMENTO SET ";
            query += "ALUGUEL_CONTRATO = ? ";
            query += "WHERE IDEQUI = ? ";

            executeInsert(query,[
                {"type":"float", value:constraints.VALOR},
                {"type":"int", value:constraints.IDEQUI},
            ], "/jdbc/Sisma");
        }
        else if(constraints.CAMPO == "Valor de Mão de Obra"){
            var query = "";
            query += "UPDATE EQUIPAMENTOS_CONTRATOS_AUXILIAR SET ";
            query += "MAODEOBRA = ? ";
            query += "WHERE PREFIXO = ? ";

            executeInsert(query,[
                {"type":"float", value:constraints.VALOR},
                {"type":"varchar", value:constraints.IDEQUI},
            ], "/jdbc/Sisma");
        }


    } catch (error) {
        if (typeof error == "object") {
            var mensagem = "";
            var keys = Object.keys(error);
            for (var i = 0; i < keys.length; i++) {
                mensagem += (keys[i] + ": " + error[keys[i]]) + " - ";
            }
            log.info("Erro ao executar Dataset:");
            log.dir(error);
            log.info(mensagem);

            return returnDataset("ERRO", mensagem, null);
        } else {
            return returnDataset("ERRO", error, null);
        }
    }
}


// Utils
function getConstraints(constraints) {
    var retorno = {};
    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            var constraint = constraints[i];
            retorno[constraint.fieldName] = constraint.initialValue;
        }
    }
    return retorno;
}
function returnDataset(STATUS, MENSAGEM, RESULT) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("STATUS");
    dataset.addColumn("MENSAGEM");
    dataset.addColumn("RESULT");
    dataset.addRow([STATUS, MENSAGEM, RESULT]);
    return dataset;
}
function lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, listConstrainstObrigatorias) {
    try {
        var retornoErro = [];
        for (var i = 0; i < listConstrainstObrigatorias.length; i++) {
            if (constraints[listConstrainstObrigatorias[i]] == null || constraints[listConstrainstObrigatorias[i]] == "" || constraints[listConstrainstObrigatorias[i]] == undefined) {
                retornoErro.push(listConstrainstObrigatorias[i]);
            }
        }

        if (retornoErro.length > 0) {
            throw "Constraints obrigatorias nao informadas (" + retornoErro.join(", ") + ")";
        }
    } catch (error) {
        throw error;
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