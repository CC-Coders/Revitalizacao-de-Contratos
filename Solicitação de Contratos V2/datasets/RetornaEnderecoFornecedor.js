function defineStructure() {}

function onSync(lastSyncDate) {}

function createDataset(fields, constraints, sortFields) {
    var newDataset = DatasetBuilder.newDataset();
    var cgccfo = constraints[0].initialValue;

    if (!cgccfo) {
        log.warn("[FCFO] Nenhum CGCCFO informado.");
        return newDataset;
    }

    var query = "SELECT RUA, NUMERO, BAIRRO, CIDADE, CEP, CODETD, CGCCFO, NACIONALIDADE, PESSOAFISOUJUR " +
                "FROM FCFO WHERE CGCCFO = '" + cgccfo + "'";

    var dataSource = "/jdbc/RM";
    var ic = new javax.naming.InitialContext();
    var ds = ic.lookup(dataSource);
    var conn = null;
    var stmt = null;
    var rs = null;
log.info("query contratos:" + query)
    try {
        conn = ds.getConnection();
        stmt = conn.createStatement();
        log.info("[FCFO] Executando query: " + query);
        rs = stmt.executeQuery(query);
        var columnCount = rs.getMetaData().getColumnCount();

        // Adiciona colunas no dataset
        for (var i = 1; i <= columnCount; i++) {
            newDataset.addColumn(rs.getMetaData().getColumnName(i));
        }

        // Adiciona linhas
        while (rs.next()) {
            var row = [];
            for (var i = 1; i <= columnCount; i++) {
                var value = rs.getObject(i);
                row.push(value !== null ? value.toString() : "");
            }
            newDataset.addRow(row);
        }

        log.info("[FCFO] Dataset preenchido com sucesso.");

    } catch (e) {
        log.error("[FCFO] Erro ao consultar FCFO: " + e.message);

    } finally {
        if (rs !== null) rs.close();
        if (stmt !== null) stmt.close();
        if (conn !== null) conn.close();
    }

    return newDataset;
}

function onMobileSync(user) {
    return createDataset();
}
