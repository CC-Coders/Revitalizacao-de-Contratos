function createDataset(fields, constraints, sortFields) {
    try {
        var constraints = getConstraints(constraints);
        lancaErroSeConstraintsObrigatoriasNaoInformadas(constraints, ["name", "ParentDocumentId"]);

        var ServiceDocumentName = "ECMDocumentServiceFluig"; // O ServiceDocumentName corresponde ao código do serviço criado no studio. Para este exemplo, crie o serviço como CXF
        var PublisherId = "fluig"; // Matricula do usuario publicador


        // neste momento, sera instanciado o servidor ECMDocumentService
        var webServiceProvider = ServiceManager.getServiceInstance(ServiceDocumentName);
        var webServiceLocator = webServiceProvider.instantiate("ws.ECMDocumentServiceService");
        var webService = webServiceLocator.getDocumentServicePort();
        var codEmpresa = 1; // Informe o codigo da empresa

        var DTOs = criaDocumentDTO(webServiceProvider, codEmpresa, PublisherId, constraints, constraints.conteudo, constraints.name);

        var loginAdm = "fluig"; // Usuario integrador - login do usuário administrador 
        var senhaAdm = "flu!g@cc#2018"; // Usuario integrador - Senha do usuário administrador


        var retornoDocumento = webService.createDocument(loginAdm, senhaAdm, codEmpresa, DTOs.documentoArray, DTOs.attachmentArray, DTOs.documentSecurityConfigDtoArray, DTOs.approverDtoArray, DTOs.relatedDocumentDtoArray);
        var idDocumento = retornoDocumento.getItem().get(0).getDocumentId();

        log.info("## [Dataset: createDocument] - Documento criado com SUCESSO! Código: " + idDocumento);

        return returnDataset("SUCCESS", "", idDocumento);

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

function criaDocumentDTO(webServiceProvider, codEmpresa, PublisherId, constraints, conteudo, fileName) {
    try {


        var documentoArray = webServiceProvider.instantiate("ws.DocumentDtoArray");
        var documento = webServiceProvider.instantiate("ws.DocumentDto");

        // agora sera definida as propriedades do documento, a lista completa de propriedade pode ser vista aqui: http://tdn.totvs.com/x/l4eADQ
        documento.setApprovalAndOr(false);
        documento.setAtualizationId(1);
        documento.setColleagueId(PublisherId);
        documento.setCompanyId(codEmpresa);
        documento.setDeleted(false);
        documento.setDocumentDescription(constraints.name);
        documento.setDocumentType("2"); // 1 - Pasta; 2 - Documento; 3 - Documento Externo; 4 - Fichario; 5 - Fichas; 9 - Aplicativo; 10 - Relatorio.
        documento.setDownloadEnabled(true);
        documento.setExpires(false);
        documento.setInheritSecurity(true);
        documento.setDocumentId(parseInt(constraints.documentId));
        documento.setParentDocumentId(parseInt(constraints.ParentDocumentId));
        documento.setPrivateDocument(false);
        documento.setPublisherId(PublisherId);
        documento.setUpdateIsoProperties(true);
        documento.setUserNotify(false);
        documento.setVersionOption("0");
        documento.setDocumentPropertyNumber(0);
        documento.setDocumentPropertyVersion(0);
        documento.setVolumeId("Default");
        documento.setApproved(false);
        //documento.setIconId(2);
        documento.setLanguageId("pt");
        documento.setIndexed(true);//o default era false
        documento.setActiveVersion(true);
        documento.setTranslated(false);
        documento.setTopicId(1);
        documento.setExternalDocumentId("");
        documento.setDatasetName("");
        documento.setVersionDescription("");
        documento.setKeyWord("");
        documento.setImutable(false);
        documento.setProtectedCopy(false);
        documento.setAccessCount(0);
        documento.setVersion(1000);


        documentoArray.getItem().add(documento);

        var attachmentArray = webServiceProvider.instantiate("ws.AttachmentArray");
        var attachment = webServiceProvider.instantiate("ws.Attachment");


        try {
            var decodedString = java.util.Base64.getDecoder().decode(conteudo.getBytes("UTF-8"));
        } catch (e) {
            throw ("Erro ao decodificar base64: " + e.message);
        }

        attachment.setFileName(fileName);
        attachment.setPrincipal(true);
        attachment.setFilecontent(decodedString);
        attachmentArray.getItem().add(attachment);

        var documentSecurityConfigDtoArray = webServiceProvider.instantiate("ws.DocumentSecurityConfigDtoArray");
        var approverDtoArray = webServiceProvider.instantiate("ws.ApproverDtoArray");
        var relatedDocumentDtoArray = webServiceProvider.instantiate("ws.RelatedDocumentDtoArray");

        return {
            documentoArray: documentoArray,
            attachmentArray: attachmentArray,
            documentSecurityConfigDtoArray: documentSecurityConfigDtoArray,
            approverDtoArray: approverDtoArray,
            relatedDocumentDtoArray: relatedDocumentDtoArray,
        }
    } catch (error) {
        throw error;
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