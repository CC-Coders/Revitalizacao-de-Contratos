function defineStructure() { }
function onSync(lastSyncDate) { }
function createDataset(fields, constraints, sortFields) {
    var dataSource = "/jdbc/CastilhoCustom"; //nome da conexão usada no standalone
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var OPERACAO, CODCOLIGADA, CCUSTO, ANOCONTRATO, CNPJ, CODIGOPRD, IDCNT, IDPRD, CODCFO, LOCALESTOQUE, TIPOCONTRATO = null;

    var myQuery = null;

    if (constraints != null) {
        for (i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == "OPERACAO") {
                OPERACAO = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "CODCOLIGADA") {
                CODCOLIGADA = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "CCUSTO") {
                CCUSTO = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "ANOCONTRATO") {
                ANOCONTRATO = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "CNPJ") {
                CNPJ = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "CODIGOPRD") {
                CODIGOPRD = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "IDCNT") {
                IDCNT = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "IDPRD") {
                IDPRD = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "CODCFO") {
                CODCFO = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "LOCALESTOQUE") {
                LOCALESTOQUE = constraints[i].initialValue;
            }
            else if (constraints[i].fieldName == "TIPOCONTRATO") {
                TIPOCONTRATO = constraints[i].initialValue;
            }
        }
    }

    if (OPERACAO == "BuscaCodContratoPorCCusto") {
        myQuery = "SELECT max(CODIGOCONTRATO) as CODIGOCONTRATO FROM TCNT WHERE CODIGOCONTRATO like '" + CCUSTO + "%' AND CODIGOCONTRATO not like '%-9%' AND CODIGOCONTRATO not like '%-8%' AND CODCOLIGADA = " + CODCOLIGADA;
        log.info("myQuery: " + myQuery);
        return executaQuery(myQuery, "/jdbc/CastilhoRM");
    }
    else if (OPERACAO == "BuscaProduto") {
        myQuery =
            "SELECT DISTINCT\
        TPRODUTO.CODIGOPRD,\
        TPRODUTO.NOMEFANTASIA,\
        TPRODUTO.IDPRD,\
        TPRODUTO.CODCOLPRD,\
        TPRODUTO.CODIGOPRD + ' - ' + TPRODUTO.NOMEFANTASIA VISUAL,\
        TPRODUTO.TIPO\
    FROM\
        TPRODUTO\
    WHERE\
        TPRODUTO.DESCRICAO is NOT NULL\
        AND TPRODUTO.INATIVO = 0\
        AND TPRODUTO.ULTIMONIVEL = 1\
        AND TPRODUTO.CODCOLPRD = '" + CODCOLIGADA + "'\
        AND (TPRODUTO.CODIGOPRD IN ('11.001.00001', '11.001.00002', '11.004.00001', '11.004.00003', '11.001.00054', '11.003.00002', '11.003.00005', '11.004.00003', '11.004.00010', '11.006.00010', '11.006.00144', '21.001.00001', '21.001.00002') OR TPRODUTO.CODIGOPRD LIKE '41.%' OR TPRODUTO.CODIGOPRD LIKE '21.%')\
        ORDER BY NOMEFANTASIA";
        log.info("myQuery: " + myQuery);
        return executaQuery(myQuery, "/jdbc/CastilhoRM");
    }
    else if (OPERACAO == "BuscaProdutoPorCodigo") {
        myQuery = "SELECT IDPRD FROM TPRODUTO WHERE CODIGOPRD = " + CODIGOPRD + " AND CODCOLPRD = " + CODCOLIGADA;
        log.info("myQuery: " + myQuery);
        return executaQuery(myQuery, "/jdbc/CastilhoRM");
    }
    else if (OPERACAO == "BuscaProdutoPorId") {
        myQuery = "SELECT CODIGOPRD, DESCRICAO FROM TPRODUTO WHERE IDPRD = " + IDPRD + " AND CODCOLPRD = " + CODCOLIGADA;
        log.info("myQuery: " + myQuery);
        return executaQuery(myQuery, "/jdbc/CastilhoRM");
    }
    else if (OPERACAO == "BuscaFornecedorPorCNPJ") {
        myQuery = "SELECT * FROM FCFO WHERE CGCCFO = '" + CNPJ + "'";
    }
    else if (OPERACAO == "BuscaFornecedorPorId") {
        myQuery = "SELECT NOMEFANTASIA, CGCCFO FROM FCFO WHERE CGCCFO = '" + CODCFO + "'";
        log.info("myQuery: " + myQuery);
        return executaQuery(myQuery, "/jdbc/CastilhoRM");
    }
    else if (OPERACAO == "BuscaDadosContratoRM") {
        myQuery =
            "SELECT CODCOLIGADA, IDCNT, NOME, CODCCUSTO, NATUREZA, CODTCN, CODFILIAL, CODIGOCONTRATO, CODCFO, CODRPR, CODSTACNT, CODCPG, CODCPGPRAZO,DATAINICIO\
            FROM TCNT\
            WHERE CODCOLIGADA = " + CODCOLIGADA + " AND IDCNT = " + IDCNT;
        log.info("myQuery: " + myQuery);
        return executaQuery(myQuery, "/jdbc/CastilhoRM");
    }
    else if (OPERACAO == "BuscaLocEstoque") {
        myQuery = "SELECT * FROM TLOC WHERE NOME = '" + LOCALESTOQUE + "'";
        log.info("myQuery: " + myQuery);
        return executaQuery(myQuery, "/jdbc/CastilhoRM");
    }
    else if (OPERACAO == "BuscaContratos") {
        myQuery =
            "SELECT TCNT.CODCOLIGADA, TCNT.IDCNT, TCNT.CODIGOCONTRATO, FCFO.CGCCFO, FCFO.NOMEFANTASIA as FORNECEDOR, TCNT.VALORCONTRATO, TCNT.NOME AS DESCRICAOCONTRATO,\
            TTCN.DESCRICAO as TIPOCONTRATO, TCNT.CODCCUSTO, GCCUSTO.NOME AS CCUSTO, TCNT.DATACONTRATO, TSTACNT.DESCRICAO as STATUS, TCNT.DATAINICIO, TCNT.DATAFIM\
        FROM TCNT\
            INNER JOIN TTCN ON TTCN.CODCOLIGADA = TCNT.CODCOLIGADA AND TCNT.CODTCN = TTCN.CODTCN\
            INNER JOIN GCCUSTO ON GCCUSTO.CODCOLIGADA = TCNT.CODCOLIGADA AND TCNT.CODCCUSTO = GCCUSTO.CODCCUSTO\
            INNER JOIN FCFO ON FCFO.CODCFO = TCNT.CODCFO\
            INNER JOIN TSTACNT ON TCNT.CODSTACNT = TSTACNT.CODSTACNT AND TCNT.CODCOLIGADA = TSTACNT.CODCOLIGADA\
        WHERE (TCNT.CODSTACNT = 01 OR TCNT.CODSTACNT = 05) AND TCNT.CODTCN IN (01,02,04,06,07,08,09,10,11,14,15)\
            AND GCCUSTO.CODCCUSTO = '" + CCUSTO + "'\
            AND TCNT.CODCOLIGADA = " + CODCOLIGADA + " \
        ORDER BY IDCNT";
        log.info("myQuery: " + myQuery);
        return executaQuery(myQuery, "/jdbc/CastilhoRM");
    }
    else if (OPERACAO == "BuscaContratosPorFornecedorRescisao") {
        var ds = DatasetFactory.getDataset("dsGetServerURL", null, null, null);
        var URL = ds.getValue(0, "URL");
        if (URL == "http://fluig.castilho.com.br:1010") {
            var server = "CastilhoRM";
        } else {
            var server = "CastilhoRM_homologacao";
        }

        myQuery =
            "SELECT TCNT.CODCOLIGADA, TCNT.IDCNT, TCNT.CODIGOCONTRATO, TCNT_AUXILIAR_ITENS.ID_TCNT_AUXILIAR, TCNT_AUXILIAR_ITENS.NSEQITEMCNT, TCNT_AUXILIAR.IS_RETENCAO, TCNT_AUXILIAR.PERCENT_RETENCAO, FCFO.CGCCFO, FCFO.NOMEFANTASIA as FORNECEDOR, TCNT.VALORCONTRATO, TCNT_AUXILIAR_ITENS.VALOR, TCNT.NOME AS DESCRICAOCONTRATO,\
            TTCN.DESCRICAO as TIPOCONTRATO, TCNT_AUXILIAR_ITENS.DESCRICAO AS DESCRICAO_IMOVEL, TCNT_AUXILIAR_ITENS.ENDERECO AS ENDERECO_IMOVEL, TCNT_AUXILIAR.DATA_ASSINATURA, TCNT.CODCCUSTO, GCCUSTO.NOME AS CCUSTO, TCNT.DATACONTRATO, TSTACNT.DESCRICAO as STATUS, TCNT.DATAINICIO, TCNT.DATAFIM\
        FROM [SQL-2022]." + server + ".dbo.TCNT\
            INNER JOIN [SQL-2022]." + server + ".dbo.TTCN ON TTCN.CODCOLIGADA = TCNT.CODCOLIGADA AND TCNT.CODTCN = TTCN.CODTCN\
            INNER JOIN [SQL-2022]." + server + ".dbo.GCCUSTO ON GCCUSTO.CODCOLIGADA = TCNT.CODCOLIGADA AND TCNT.CODCCUSTO = GCCUSTO.CODCCUSTO\
            INNER JOIN [SQL-2022]." + server + ".dbo.FCFO ON FCFO.CODCFO = TCNT.CODCFO\
            INNER JOIN [SQL-2022]." + server + ".dbo.TSTACNT ON TCNT.CODSTACNT = TSTACNT.CODSTACNT AND TCNT.CODCOLIGADA = TSTACNT.CODCOLIGADA\
            INNER JOIN TCNT_AUXILIAR AS TCNT_AUXILIAR  ON TCNT.IDCNT = TCNT_AUXILIAR.IDCNT AND TCNT.CODCOLIGADA = TCNT_AUXILIAR.CODCOLIGADA\
            OUTER APPLY (\
                SELECT TOP 1 *\
                FROM TCNT_AUXILIAR_ITENS TAI\
                WHERE TAI.ID_TCNT_AUXILIAR = TCNT_AUXILIAR.ID\
                  AND TAI.NSEQITEMCNT = 0\
                ORDER BY TAI.ID_TCNT_AUXILIAR\
            ) AS TCNT_AUXILIAR_ITENS\
        WHERE (TCNT.CODSTACNT = 01 OR TCNT.CODSTACNT = 05) AND TCNT.CODTCN IN (01,02,04,06,07,08,09,10,11,14,15)\
            AND GCCUSTO.CODCCUSTO = '" + CCUSTO + "'\
            AND TCNT.CODCOLIGADA = " + CODCOLIGADA + " \
            AND FCFO.CGCCFO = '" + CNPJ + "' \
            AND TTCN.DESCRICAO IN (" + TIPOCONTRATO + ")\
        ORDER BY IDCNT";
        log.info("myQuery: " + myQuery);
        return executaQuery(myQuery, "/jdbc/CastilhoCustom");
    }
    else if (OPERACAO == "BuscaContratosPorFornecedorAditivo") {
        var ds = DatasetFactory.getDataset("dsGetServerURL", null, null, null);
        var URL = ds.getValue(0, "URL");
        if (URL == "http://fluig.castilho.com.br:1010") {
            var server = "CastilhoRM";
        } else {
            var server = "CastilhoRM_homologacao";
        }

        myQuery =
            "SELECT TCNT.CODCOLIGADA, TCNT.IDCNT, TCNT.CODIGOCONTRATO, TCNT_AUXILIAR_ITENS.ID_TCNT_AUXILIAR, TCNT_AUXILIAR_ITENS.NSEQITEMCNT, TCNT_AUXILIAR.IS_RETENCAO, TCNT_AUXILIAR.PERCENT_RETENCAO, FCFO.CGCCFO, FCFO.NOMEFANTASIA as FORNECEDOR, TCNT.VALORCONTRATO, TCNT_AUXILIAR_ITENS.VALOR, TCNT.NOME AS DESCRICAOCONTRATO,\
            TTCN.DESCRICAO as TIPOCONTRATO, TCNT_AUXILIAR_ITENS.DESCRICAO AS DESCRICAO_IMOVEL, TCNT_AUXILIAR_ITENS.ENDERECO AS ENDERECO_IMOVEL, TCNT_AUXILIAR.DATA_ASSINATURA, TCNT.CODCCUSTO, GCCUSTO.NOME AS CCUSTO, TCNT.DATACONTRATO, TSTACNT.DESCRICAO as STATUS, TCNT.DATAINICIO, TCNT.DATAFIM\
        FROM [SQL-2022]." + server + ".dbo.TCNT\
            INNER JOIN [SQL-2022]." + server + ".dbo.TTCN ON TTCN.CODCOLIGADA = TCNT.CODCOLIGADA AND TCNT.CODTCN = TTCN.CODTCN\
            INNER JOIN [SQL-2022]." + server + ".dbo.GCCUSTO ON GCCUSTO.CODCOLIGADA = TCNT.CODCOLIGADA AND TCNT.CODCCUSTO = GCCUSTO.CODCCUSTO\
            INNER JOIN [SQL-2022]." + server + ".dbo.FCFO ON FCFO.CODCFO = TCNT.CODCFO\
            INNER JOIN [SQL-2022]." + server + ".dbo.TSTACNT ON TCNT.CODSTACNT = TSTACNT.CODSTACNT AND TCNT.CODCOLIGADA = TSTACNT.CODCOLIGADA\
            INNER JOIN TCNT_AUXILIAR AS TCNT_AUXILIAR  ON TCNT.IDCNT = TCNT_AUXILIAR.IDCNT AND TCNT.CODCOLIGADA = TCNT_AUXILIAR.CODCOLIGADA\
            OUTER APPLY (\
                SELECT TOP 1 *\
                FROM TCNT_AUXILIAR_ITENS TAI\
                WHERE TAI.ID_TCNT_AUXILIAR = TCNT_AUXILIAR.ID\
                  AND TAI.NSEQITEMCNT = 0\
                ORDER BY TAI.ID_TCNT_AUXILIAR\
            ) AS TCNT_AUXILIAR_ITENS\
        WHERE TCNT.CODSTACNT = 01\
            AND GCCUSTO.CODCCUSTO = '" + CCUSTO + "'\
            AND TCNT.CODCOLIGADA = " + CODCOLIGADA + " \
            AND FCFO.CGCCFO = '" + CNPJ + "' \
            AND TTCN.DESCRICAO IN (" + TIPOCONTRATO + ")\
        ORDER BY IDCNT";
        log.info("myQuery: " + myQuery);
        return executaQuery(myQuery, "/jdbc/CastilhoCustom");
    }

}
function onMobileSync(user) { }

function executaQuery(query, dataSource) {
    var newDataset = DatasetBuilder.newDataset();
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var created = false;
    try {
        var conn = ds.getConnection();
        var stmt = conn.createStatement();
        var rs = stmt.executeQuery(query);
        var columnCount = rs.getMetaData().getColumnCount();

        while (rs.next()) {
            if (!created) {
                for (var i = 1; i <= columnCount; i++) {
                    newDataset.addColumn(rs.getMetaData().getColumnName(i));
                }
                created = true;
            }
            var Arr = new Array();
            for (var i = 1; i <= columnCount; i++) {
                var obj = rs.getObject(rs.getMetaData().getColumnName(i));
                if (null != obj) {
                    Arr[i - 1] = rs.getObject(rs.getMetaData().getColumnName(i)).toString();
                } else {
                    Arr[i - 1] = "   -   ";
                }
            }

            newDataset.addRow(Arr);
        }
    } catch (e) {
        log.error("ERRO==============> " + e.message);
        newDataset.addColumn("coluna");
        newDataset.addRow(["deu erro! "]);
        newDataset.addRow([e.message]);
    } finally {
        if (stmt != null) {
            stmt.close();
        }
        if (conn != null) {
            conn.close();
        }
    }
    return newDataset;
}