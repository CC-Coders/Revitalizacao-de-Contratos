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
        hAPI.setCardValue("statusAssinatura", status)

        if (status == "Pendente Assinatura") {
            return false;
        }
    }

    return true;
}