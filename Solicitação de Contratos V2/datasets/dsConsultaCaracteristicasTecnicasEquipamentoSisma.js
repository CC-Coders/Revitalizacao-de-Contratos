function createDataset(fields, constraints, sortFields) {
    try {
        var constraints = getConstraints(constraints);
        lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, ["IDEQUI"]);


        var query = "";
        query += "SELECT ";
        query += "    EQUIPAMENTO_CARACTEC.IDEQUI, ";
        query += "    CARACTECNICA.DESCRICAO, ";
        query += "    EQUIPAMENTO_CARACTEC.VALOR, ";
        query += "    UNIDADE.SIGLA ";
        query += "FROM  ";
        query += "  ( ";
        query += "    SELECT  ";
        query += "        EQUIPAMENTO.IDEQUI, ";
        query += "        CASE  ";
        query += "            WHEN EQUIPCARTEC.TIPOCARAC IS NOT NULL THEN EQUIPCARTEC.TIPOCARAC ";
        query += "            ELSE MODCARTEC.TIPOCARAC ";
        query += "        END AS TIPOCARAC, ";
        query += "        CASE  ";
        query += "            WHEN EQUIPCARTEC.CODICATC IS NOT NULL THEN EQUIPCARTEC.CODICATC ";
        query += "            ELSE MODCARTEC.CODICATC ";
        query += "        END AS CODICATC, ";
        query += "        CASE  ";
        query += "            WHEN ITEMEQUIPCARTEC.ITEM IS NOT NULL THEN ITEMEQUIPCARTEC.ITEM ";
        query += "            ELSE ITEMMODCARTEC.ITEM ";
        query += "        END AS ITEM, ";
        query += "        CASE  ";
        query += "            WHEN ITEMEQUIPCARTEC.VALOR IS NOT NULL THEN ITEMEQUIPCARTEC.VALOR ";
        query += "            ELSE ITEMMODCARTEC.VALOR ";
        query += "        END AS VALOR ";
        query += "    FROM EQUIPAMENTO ";
        query += "    LEFT JOIN EQUIPCARTEC ON  ";
        query += "        EQUIPAMENTO.IDEQUI = EQUIPCARTEC.IDEQUI ";
        query += "    LEFT JOIN ITEMEQUIPCARTEC ON  ";
        query += "        ITEMEQUIPCARTEC.IDEQUI = EQUIPCARTEC.IDEQUI  ";
        query += "        AND ITEMEQUIPCARTEC.TIPOCARAC = EQUIPCARTEC.TIPOCARAC  ";
        query += "        AND ITEMEQUIPCARTEC.CODICATC = EQUIPCARTEC.CODICATC ";
        query += "    INNER JOIN MODCARTEC ON  ";
        query += "        EQUIPAMENTO.IDMODE = MODCARTEC.IDMODE ";
        query += "    LEFT JOIN ITEMMODCARTEC ON  ";
        query += "        ITEMMODCARTEC.IDMODE = MODCARTEC.IDMODE  ";
        query += "        AND ITEMMODCARTEC.TIPOCARAC = MODCARTEC.TIPOCARAC  ";
        query += "        AND ITEMMODCARTEC.CODICATC = MODCARTEC.CODICATC ";
        query += "  ) as EQUIPAMENTO_CARACTEC ";
        query += "INNER JOIN CARACTECNICA ON  ";
        query += "    CARACTECNICA.TIPOCARAC = EQUIPAMENTO_CARACTEC.TIPOCARAC  ";
        query += "    AND CARACTECNICA.CODICATC = EQUIPAMENTO_CARACTEC.CODICATC ";
        query += "INNER JOIN ITEMCARACTEC ON  ";
        query += "    EQUIPAMENTO_CARACTEC.ITEM = ITEMCARACTEC.ITEM ";
        query += "INNER JOIN UNIDADE ON  ";
        query += "    ITEMCARACTEC.CODIUNID = UNIDADE.CODIUNID  ";
        query += "    AND UNIDADE.CODIINES = 0 ";
        query += "WHERE EQUIPAMENTO_CARACTEC.IDEQUI = ?";

        var retorno = executaQuery(query,[
            {type:"int", value:constraints.IDEQUI}
        ], "/jdbc/Sisma");


        return returnDataset("SUCCESS", "", JSON.stringify(retorno));

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