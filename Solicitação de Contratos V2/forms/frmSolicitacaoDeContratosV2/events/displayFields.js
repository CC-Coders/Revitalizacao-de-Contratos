function displayFields(form, customHTML) {
	form.setValue("atividade", getValue('WKNumState'));
	form.setValue("formMode", form.getFormMode());
	form.setValue("isMobile", form.getMobile());
	form.setValue("userCode", getValue("WKUser"));
	form.setValue("numProces", getValue("WKNumProces"));
	
	if (getValue('WKNumState') == 0) {
		form.setValue("solicitante", getValue("WKUser"));
		form.setValue("dataAberturaSol", getDateNow());
	}

	// Limpa os campos
	form.setValue("decisao","");
	form.setValue("observacoes","");

	 form.setHidePrintLink(true);
}

function getDateNow() {
    var date = new Date();
    var dia = date.getDate();
    if (dia < 10) {
        dia = "0" + dia;
    }
    var mes = date.getMonth() + 1;
    if (mes < 10) {
        mes = "0" + mes;
    }

    var ano = date.getFullYear();

    var dateTime = [ano, mes, dia].join("-");
    return dateTime;
}