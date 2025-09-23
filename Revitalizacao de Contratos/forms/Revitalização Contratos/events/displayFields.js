function displayFields(form, customHTML) {
	form.setValue("atividade", getValue('WKNumState'));
	form.setValue("formMode", form.getFormMode());
	form.setValue("isMobile", form.getMobile());
	form.setValue("userCode", getValue("WKUser"));

	if (getValue('WKNumState') == 0) {
		form.setValue("solicitante", getValue("WKUser"));
	}


	// Limpa os campos
	form.setValue("decisao","");
	form.setValue("observacoes","");

	 form.setHidePrintLink(true);
}