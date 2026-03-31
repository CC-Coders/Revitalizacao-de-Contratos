function intermediateconditional58() {
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

        // Se o status da assinatura for igual a "Assinado"
        if (status == "Assinado") {

            // Pega a data de assinatura do form "ds_form_aux_wesign" do campo dataAssinatura (mesmo nome)
            var dataAssinado = ds.getValue(i, "dataAssinatura");

            // Se dataAssinatura (do form "ds_form_aux_wesign") não estiver como "null" então seta a data no campo dataAssinatura do form de Revitalização de Contrato.
            if (dataAssinado !== "null") {
                hAPI.setCardValue("dataAssinatura", dataAssinado);
                updateTcntAuxiliar_dataAssinatura(dataAssinado, hAPI.getCardValue("ID_TCNT_AUXILIAR"));
            }
            
            log.info("intermediate58 - antes do return true");
            return true;
        }

        if (status == "Pendente Assinatura") {
            return false;
        }
    }
}

function updateTcntAuxiliar_dataAssinatura(DATA_ASSINATURA, ID_TCNT_AUXILIAR){
    try {
        var query = "UPDATE TCNT_AUXILIAR SET DATA_ASSINATURA = ? WHERE ID = ?";
        executaUpdate(query, [
            {type:"date", value:DATA_ASSINATURA},
            {type:"int", value:ID_TCNT_AUXILIAR},
        ], "jdbc/CastilhoCustom");
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