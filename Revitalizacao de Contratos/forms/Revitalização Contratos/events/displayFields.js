function displayFields(form,customHTML){
        form.setValue("atividade", getValue('WKNumState'));
        form.setValue("formMode", form.getFormMode());
        form.setValue("userCode", getValue("WKUser"));
        form.setValue("WKNumProces", getValue("WKNumProces"));
        if (getValue('WKNumState') == 0) {
                    form.setValue("solicitante", getValue("WKUser"));
         }
}