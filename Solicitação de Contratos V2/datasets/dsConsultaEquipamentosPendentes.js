function createDataset(fields, constraints, sortFields) {
    try {
        var c = getConstraints(constraints);
        lancaErroSeConstraintsObrigatoriasNaoInformadas(c, ["OPERACAO"]);

        var operacao = (c.OPERACAO);
        var query = null;
        var params = null;

        if (operacao == "ConsultaEquipPorCcustoFornecedor") {
            lancaErroSeConstraintsObrigatoriasNaoInformadas(c, ["CCUSTO", "CNPJ"]);

            query = "SELECT * FROM VIEW_EQUIPAMENTOS_CONTRATOS WHERE (STATUS = 1 OR STATUS = 2) AND CCUSTO = ? AND FORNECEDOR_CNPJ = ?;";

            params = [
                {type: "varchar", value: c.CCUSTO},
                {type: "varchar", value: c.CNPJ}
            ];

        } else if (operacao == "ConsultaEquipPorContrato") {
            lancaErroSeConstraintsObrigatoriasNaoInformadas(c, ["ID_TCNT_AUXILIAR"]);

            query = 
                "SELECT DISTINCT\
                VIEW_EQUIPAMENTOS_CONTRATOS.NUMPROCES_CADASTROEQUIPAMENTOS,\
                VIEW_EQUIPAMENTOS_CONTRATOS.FORNECEDOR_CNPJ,\
                VIEW_EQUIPAMENTOS_CONTRATOS.FORNECEDOR,\
                TCNT_AUXILIAR_ITENS.PREFIXO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.PLACA,\
                VIEW_EQUIPAMENTOS_CONTRATOS.CHASSI,\
                '' AS RENAVAM,\
                VIEW_EQUIPAMENTOS_CONTRATOS.DESCRICAO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.MODELO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.ANO_MODELO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.FABRICANTE,\
                VIEW_EQUIPAMENTOS_CONTRATOS.ANO_FABRICACAO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.POTENCIAHP,\
                VIEW_EQUIPAMENTOS_CONTRATOS.DATA_CHEGADA,\
                VIEW_EQUIPAMENTOS_CONTRATOS.CAPACIDADE_COMBUSTIVEL,\
                VIEW_EQUIPAMENTOS_CONTRATOS.VALOR_MOBILIZADO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.UN_MOBILIZADO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.VALOR_DESMOBILIZACAO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.UN_DESMOBILIZACAO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.MAODEOBRA,\
                VIEW_EQUIPAMENTOS_CONTRATOS.VALOR_LOCACAO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.VALOR_EXTRA,\
                VIEW_EQUIPAMENTOS_CONTRATOS.UN_EXTRA,\
                VIEW_EQUIPAMENTOS_CONTRATOS.ANEXOS_DOCUMENTACAO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.ANEXOS_ART,\
                VIEW_EQUIPAMENTOS_CONTRATOS.ANEXOS_FOTOS,\
                VIEW_EQUIPAMENTOS_CONTRATOS.ANEXOS_LAUDO,\
                VIEW_EQUIPAMENTOS_CONTRATOS.ANEXOS_PLANO_MANUTENCAO,\
            	VIEW_EQUIPAMENTOS_CONTRATOS.CATEGORIA\
            FROM TCNT_AUXILIAR_ITENS\
                JOIN VIEW_EQUIPAMENTOS_CONTRATOS AS VIEW_EQUIPAMENTOS_CONTRATOS ON VIEW_EQUIPAMENTOS_CONTRATOS.PREFIXO = TCNT_AUXILIAR_ITENS.PREFIXO\
            WHERE TCNT_AUXILIAR_ITENS.ID_TCNT_AUXILIAR = ?\
            AND TCNT_AUXILIAR_ITENS.ATIVO = 1";

            params = [
                {type: "int", value: c.ID_TCNT_AUXILIAR}
            ];
        }

        var retorno = executaQuery(query, params, "/jdbc/CastilhoCustom");
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