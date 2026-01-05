// Modelo de Contrato
const pastasDeAnexosPorServidor = {
    DESENVOLVIMENTO: "18386",
    HOMOLOGACAO: "10540",
    PRODUCAO: "140518",
}
var ds = DatasetFactory.getDataset("dsGetServerURL", null, null, null);
const env = ds.values[0].URL == "http://homologacao.castilho.com.br:2020" ? "HOMOLOGACAO" : ds.values[0].URL == "http://desenvolvimento.castilho.com.br:3232" ? "DESENVOLVIMENTO" : "PRODUCAO";
const pastaDeAnexos = pastasDeAnexosPorServidor[env];


const codigosModelos = {
    PRODUCAO: {

    },
    HOMOLOGACAO: {
        "Locação de Imóvel": 39635,
        "Locação de Equipamento": 39636,
    },
    DESENVOLVIMENTO: {
        "Locação de Imóvel": 29328,
        "Locação de Equipamento": 30545,
    }
};

// Gera cópia do Modelo
async function asyncPreencheDocumentoComDadosDoFormulario(documentId) {
    var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId);
    var file = await geraFileFromURL(url);
    var pdf = await carregaFileProDocxTemplatereEPreencheOsValores_retornaFile(file);
    return pdf;

    function geraFileFromURL(url) {
        return new Promise((resolve, reject) => {
            PizZipUtils.getBinaryContent(url, function (error, content) {
                if (error) {
                    reject(error);
                }
                resolve(content);
            });
        });
    }
    async function carregaFileProDocxTemplatereEPreencheOsValores_retornaFile(content) {
        try {
            const zip = new PizZip(content);
            const doc = new window.docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                syntax: {
                },
            });

            var input = await buscaDadosDoFormulario($("#tipoContrato").val());
            console.log(input);
            doc.render(input);
            var file = doc.toBlob();
            var file = new File([file], geraNomeDoArquivo() + ".pdf", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
            return file;
        } catch (error) {
            console.error(error);
        }
    }
    async function buscaDadosDoFormulario(tipoContrato) {
        const meses = [
            "",
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro",
        ];
        var [ano, mes, dia] = getDateNow().split("-");


        if (tipoContrato == "Locação de Imóvel") {
            var retorno = {
                CODIGO_DO_CONTRATO: $("#novoContratoCodigo").val() || "___________",
                FORNECEDOR: $("#hiddenFORNECEDOR").val(),
                FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                    "#cidadeFornecedor"
                ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()},`,
                FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
                FORNECEDOR_NOME_REPRESENTANTE: $("#administradorFornecedor").val(),
                FORNECEDOR_CPF_REPRESENTANTE: $("#cpfAdministrador").val(),
                IMOVEL_DESCRICAO: $("#descricaoImovel").val(),
                IMOVEL_MATRICULA: $("#matriculaImovel").val(),
                IMOVEL_FINALIDADE: $("#finalidadeLocacao").val(),
                LOCACAO_PERIODO: $("#periodoLocacao").val(),
                LOCACAO_VALOR: $("#valorMensalAluguel").val(),
                LOCACAO_DIA_VENCIMENTO: $("#periodoLocacao").val(),
                LOCACAO_VALOR_CAUCAO: $("#valorCaucao").val(),
                LOCACAO_DATA_CAUCAO: $("#dataPagamentoCaucao").val(),
                BANCO: $("#banco").val(),
                BANCO_AGENCIA: $("#agencia").val(),
                BANCO_CONTA_CORRENTE: $("#contaCorrente").val(),
                DIA: dia,
                MES: meses[mes],
                ANO: ano,
                CODIGO_CENTRO_DE_CUSTO: `${$("#CODCCUSTO").val()} - ${$("#NOMECCUSTO").val()}`
            };
        } else if (tipoContrato == "Locação de Equipamento") {
            var prazo_inicio = $("#dataInicioLocacao").val().split("/").reverse().join("-");
            var prazo_fim = $("#dataFimLocacao").val().split("/").reverse().join("-");

            var retorno = {
                CODIGO_DO_CONTRATO: $("#novoContratoCodigo").val() || "___________",
                FORNECEDOR: $("#hiddenFORNECEDOR").val(),
                FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                    "#cidadeFornecedor"
                ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()},`,
                FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
                FORNECEDOR_NOME_REPRESENTANTE: $("#administradorFornecedor").val(),
                FORNECEDOR_CPF_REPRESENTANTE: $("#cpfAdministrador").val(),

                PERIODOINICIO: $("#dataInicioLocacao").val(),
                PERIODOFIM: $("#dataFimLocacao").val(),

                TEM_RETENCAO: $("#temRetencao").val(),
                PERCENTUAL_RETENCAO: $("#percentualRetencao").val(),

                TEM_REIDI: $("#temREIDI").val(),
                PERCENTUAL_REIDI: $("#percentualREIDI").val(),

                VALOR_TOTAL: $("#valorTotalLocacao").val(),
                VALOR_TOTAL_EXTENSO: numeroPorExtenso($("#valorTotalLocacao").val().replace("R$", "").replace(".", "").replace(",", ".").trim(), true),

                BANCO: $("#banco").val(),
                BANCO_AGENCIA: $("#agencia").val(),
                BANCO_CONTA_CORRENTE: $("#contaCorrente").val(),
                BANCO_TITULAR: $("#titular").val(),

                DIA: dia,
                MES: meses[mes],
                ANO: ano,
                CODIGO_CENTRO_DE_CUSTO: $("#NOMECCUSTO").val(),
                OBRA: $("#NOMECCUSTO").val(),

                PRAZO: parseInt(calculaDiferencaEmMeses(prazo_inicio, prazo_fim)),
                PRAZO_EXTENSO: numeroPorExtenso(calculaDiferencaEmMeses(prazo_inicio, prazo_fim).toString()),

                INDICE_REAJUSTE: $("#indiceReajuste").val(),

                EQUIPAMENTOS: await asyncConsultaEquipamentosSelecionados()
            };

        }
        return retorno;
    }
}
async function asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao() {
    const tipoContrato = $("#tipoContrato").val();
    const documentIdModelo = codigosModelos[env][tipoContrato];

    var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentIdModelo);

    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], geraNomeDoArquivo() + ".docx", {
        type: blob.type,
    });
    var documentId = await promiseCriaDocFluig_retornaDocumentId(file, pastaDeAnexos);
    $("#contratoDocumentId").val(documentId);

    var filePreenchido = await asyncPreencheDocumentoComDadosDoFormulario($("#contratoDocumentId").val());
    var pdf = await convertDocxToPdf(filePreenchido);
    const filePdf = new File([pdf], geraNomeDoArquivo() + ".pdf", {
        type: blob.type,
    });
    var pdfId = await promiseCriaDocFluig_retornaDocumentId(filePdf, pastaDeAnexos);
    $("#contratoPdfId").val(pdfId);
}
function geraNomeDoArquivo() {
    var CODCCUSTO = $("#CODCCUSTO").val();
    var NOME_FORNECEDOR = $("#hiddenFORNECEDOR").val();
    var TIPO_CONTRATO = $("#tipoContrato").val();

    return `${CODCCUSTO} - ${TIPO_CONTRATO} - ${NOME_FORNECEDOR}`;
}
async function salvaModeloAlterado() {
    try {
        Swal.fire({
            icon: "info",
            title: "Salvando Contrato, por favor aguarde...",
            showConfirmButton: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        var response = await promiseConverteEditorParaDocx();

        const blob = new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const file = new File([blob], geraNomeDoArquivo() + ".docx", {
            type: blob.type,
        });
        await promiseAtualizaDocumentoNoGED(file, $("#contratoDocumentId").val(), geraNomeDoArquivo() + ".docx", pastaDeAnexos);

        var filePreenchido = await asyncPreencheDocumentoComDadosDoFormulario($("#contratoDocumentId").val());
        var pdf = await convertDocxToPdf(filePreenchido, geraNomeDoArquivo() + ".pdf");
        await promiseAtualizaDocumentoNoGED(pdf, $("#contratoPdfId").val(), geraNomeDoArquivo() + ".pdf", pastaDeAnexos);

        Swal.fire({
            position: "top-end",
            icon: "success",
            toast: true,
            title: "Contrato Salvo!",
            timer: 1500,
            preConfirm: false,
        });
    } catch (error) { }

    function promiseConverteEditorParaDocx() {
        return new Promise(async (resolve, reject) => {
            const data = {
                html: ckeditor.getData(),
                css: 'figure.table {    display: table;    margin: 1em auto; }figure.table table {border-collapse: collapse !important;    width: 100%;    table-layout: auto;    border: 1px solid #ccc;}figure.table td,figure.table th {    border: 1px solid #ccc;    padding: 4px;    font-family: "Arial, sans-serif";    font-size: 12px;    vertical-align: top;}figure.table p {    margin: 0;}',
                config: {
                    document: {
                        orientation: "portrait",
                        size: "Tabloid",
                        margins: {
                            top: "20mm",
                            bottom: "20mm",
                            right: "24mm",
                            left: "24mm",
                        },
                        language: "en",
                    },
                    merge_fields: {
                        prefix: "{{",
                        suffix: "}}",
                    },
                    headers: {
                        default: {
                            html: header,
                            css: "",
                        },
                    },
                    footers: {
                        default: {
                            html: footer,
                            css: "",
                        },
                    },
                },
            };

            axios
                .post("https://docx-converter.cke-cs.com/v2/convert/html-docx", data, { responseType: "arraybuffer", headers: {
        'Authorization': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJidEJvR0tWVVlxNzlWb3FWVkFPTiIsImlhdCI6MTc2NzYxODEzMywiZXhwIjozNjAwMDAxNzY3NjE0NTMzfQ.kuApfajFgYVveQ8fP4Yb8FHEtjwpzO7GD7L1JDhG-tM"
        }})
                .then(async (response) => {
                    resolve(response);
                })
                .catch((error) => {
                    console.error("Conversion error", error);
                    reject(error);
                });
        });
    }

    async function asyncBuscaCSSDoDocx() {
        var retorno = "";
        var cssUrl = "https://cdn.ckeditor.com/ckeditor5/46.0.0/ckeditor5.css";
        var css = await fetch(cssUrl);
        retorno += await css.text();
        retorno += " ";

        var cssUrl = "https://cdn.ckeditor.com/ckeditor5-premium-features/46.0.0/ckeditor5-premium-features.css";
        var css = await fetch(cssUrl);
        retorno += await css.text();

        return retorno;
    }
}
async function geraPreContrato() {
    Swal.fire({
        icon: "info",
        title: "Gerando Contrato, por favor aguarde...",
        showConfirmButton: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
    var file = await asyncPreencheDocumentoComDadosDoFormulario($("#contratoDocumentId").val());
    var pdf = await convertDocxToPdf(file);
    Swal.close();
    saveAs(pdf, "teste.pdf");
}
async function convertDocxToPdf(docxBlob, name) {
    const formData = new FormData();
    formData.append("file", docxBlob, name);
    let html, headerHtml, footerHtml;
    try {
        const docxHtmlResponse = await axios.post("https://docx-converter.cke-cs.com/v2/convert/docx-html", formData, { responseType: "json", headers: {
        'Authorization': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJidEJvR0tWVVlxNzlWb3FWVkFPTiIsImlhdCI6MTc2NzYxODEzMywiZXhwIjozNjAwMDAxNzY3NjE0NTMzfQ.kuApfajFgYVveQ8fP4Yb8FHEtjwpzO7GD7L1JDhG-tM"
        }});
        html = docxHtmlResponse.data.html + `<div class="watermark" style="font-size: 50px;opacity: 0.5;color: black;position: fixed;left: 20%;top: 50%;transform: rotate(25deg);letter-spacing: 10px;">SEM VALOR CONTRATUAL</div>`;
        headerHtml = docxHtmlResponse.data.headers?.default?.html || "";
        footerHtml = docxHtmlResponse.data.footers?.default?.html || "";
    } catch (error) {
        console.error("DOCX to HTML conversion error", error);
        throw error;
    }
    headerHtml = headerHtml.replace("absolute", "static");

    const composedHtml = `<div>${html}</div>`;

    try {
        const pdfResponse = await axios.post(
            "https://pdf-converter.cke-cs.com/v1/convert",
            {
                html: composedHtml,
                options: {
                    format: "Tabloid",
                    margin_top: "20mm",
                    margin_bottom: "35mm",
                    margin_right: "24mm",
                    margin_left: "24mm",
                    page_orientation: "portrait",
                    header_html: headerHtml,
                    footer_html: footerHtml,
                },
            },
            { responseType: "arraybuffer" }
        );
        return new Blob([pdfResponse.data], { type: "application/pdf" });
    } catch (error) {
        console.error("HTML to PDF conversion error", error);
        throw error;
    }
}


// CK5 Editor
var ckeditor = null;
async function editarArquivoNoCKEditor() {
    Swal.fire({
        icon: "info",
        title: "Carregando Contrato, por favor aguarde...",
        showConfirmButton: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
    openModal();
    await loadCkEditor();
    setTimeout(async () => {
        await carregaDocumentoParaOCKEditor($("#contratoDocumentId").val());
    }, 200);

    function openModal() {
        var html = `<div class="main-container">
				<div class="editor-container editor-container_classic-editor editor-container_include-style editor-container_include-fullscreen"
					id="editor-container">
					<div class="editor-container__editor">
						<div id="editor"></div>
					</div>
				</div>
			</div>`;

        var myModal = FLUIGC.modal(
            {
                title: "Title",
                content: html,
                id: "fluig-modal",
                size: "full",
                actions: [
                    {
                        label: "Salvar",
                        bind: "data-open-modal",
                        autoClose: true,
                    },
                    {
                        label: "Cancelar",
                        autoClose: true,
                    },
                ],
            },
            function (err, data) {
                if (err) {
                    // do error handling
                } else {
                    $("[data-open-modal]").on("click", salvaModeloAlterado);
                }
            }
        );
    }
}
async function loadCkEditor() {
    const LICENSE_KEY =
        'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3OTcwMzM1OTksImp0aSI6ImMxYmRiODcxLTBkZjQtNDkwYi1hMTdmLWQ3MDUwNDFmMGNiOCIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiXSwid2hpdGVMYWJlbCI6dHJ1ZSwiZmVhdHVyZXMiOlsiRFJVUCIsIkRPIiwiRlAiLCJTQyIsIlRPQyIsIlRQTCIsIlBPRSIsIkNDIiwiTUYiLCJFMlAiLCJFMlciLCJNTEwiLCJTRUUiLCJFQ0giLCJFSVMiLCJMSCIsIkZPTyIsIkNNVCIsIlRDIiwiUkgiLCJSRSIsIlJDTVQiLCJSVEMiLCJSUkgiLCJJVyJdLCJ2YyI6IjYxMzAyNWJkIn0.SxKfpHP3CrGh4PCAOFbLGZRej1E6jDsyYE3JSVKry4jP5jDWvR2ctVmamF3QRHcon7pepx9ztNecmlgHOaLdeA';

    const CLOUD_SERVICES_TOKEN_URL =
        'https://riccys8ecxzq.cke-cs.com/token/dev/21a778b99face29865582bf7e8d4515fcd885eaacbc2e6d1e0b23a69215a?limit=10';


    const { ClassicEditor,
        Alignment,
        ListEditing,
        Autoformat,
        AutoImage,
        AutoLink,
        Autosave,
        BlockQuote,
        Bold,
        Bookmark,
        CKBox,
        ImageResizeEditing, ImageResizeHandles, 
        CKBoxImageEdit,
        CloudServices,
        Code,
        Emoji,
        Essentials,
        FindAndReplace,
        FontBackgroundColor,
        FontColor,
        FontFamily,
        FontSize,
        Fullscreen,
        GeneralHtmlSupport,
        Heading,
        Highlight,
        HorizontalLine,
        ImageBlock,
        ImageCaption,
        ImageEditing,
        ImageInline,
        ImageInsert,
        ImageInsertViaUrl,
        ImageResize,
        ImageStyle,
        ImageTextAlternative,
        ImageToolbar,
        ImageUpload,
        ImageUtils,
        Indent,
        IndentBlock,
        Italic,
        Link,
        LinkImage,
        List,
        ListProperties,
        Mention,
        PageBreak,
        Paragraph,
        PasteFromOffice,
        PictureEditing,
        RemoveFormat,
        SpecialCharacters,
        SpecialCharactersArrows,
        SpecialCharactersCurrency,
        SpecialCharactersEssentials,
        SpecialCharactersLatin,
        SpecialCharactersMathematical,
        SpecialCharactersText,
        Strikethrough,
        Style,
        Subscript,
        Superscript,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableProperties,
        TableToolbar,
        TextTransformation,
        TodoList,
        Base64UploadAdapter,
        Underline, } = CKEDITOR;
    const { CaseChange,
        ExportPdf,
        ExportWord,
        FormatPainter,
        ImportWord,
        LineHeight,
        MergeFields,
        MultiLevelList,
        PasteFromOfficeEnhanced,
        SlashCommand,
        TableOfContents,
        Template, } = CKEDITOR_PREMIUM_FEATURES;

    ckeditor = await ClassicEditor.create(document.querySelector('#editor'), {
        plugins: [
            Alignment,
            Base64UploadAdapter,
            CaseChange,
                ListEditing,
                Autoformat,
                AutoImage,
                AutoLink,
                Autosave,
                BlockQuote,
                Bold,
                Bookmark,
                CKBox,
                CKBoxImageEdit,
                CloudServices,
                Code,
                ImageResizeEditing, ImageResizeHandles,
                Emoji,
                Essentials,
                FindAndReplace,
                FontBackgroundColor,
                FontColor,
                FontFamily,
                FontSize,
                Fullscreen,
                GeneralHtmlSupport,
                Heading,
                Highlight,
                HorizontalLine,
                ImageBlock,
                ImageCaption,
                ImageEditing,
                ImageInline,
                ImageInsert,
                ImageInsertViaUrl,
                ImageResize,
                ImageStyle,
                ImageTextAlternative,
                ImageToolbar,
                ImageUpload,
                ImageUtils,
                Indent,
                IndentBlock,
                Italic,
                Link,
                LinkImage,
                List,
                ListProperties,
                Mention,
                PageBreak,
                Paragraph,
                PasteFromOffice,
                PictureEditing,
                RemoveFormat,
                SpecialCharacters,
                SpecialCharactersArrows,
                SpecialCharactersCurrency,
                SpecialCharactersEssentials,
                SpecialCharactersLatin,
                SpecialCharactersMathematical,
                SpecialCharactersText,
                Strikethrough,
                Style,
                Subscript,
                Superscript,
                Table,
                TableColumnResize,
                TableCaption,
                TableCellProperties,
                TableProperties,
                TableToolbar,
                TextTransformation,
                TodoList,
                Underline,
                ExportPdf,
                ExportWord,
                FormatPainter,
                ImportWord,
                LineHeight,
                MergeFields,
                MultiLevelList,
                PasteFromOfficeEnhanced,
                SlashCommand,
                TableOfContents,
                Template,
            
        ],
        toolbar:[
			'undo',
			'redo',
            "resizeImage",
			'|',
			'insertMergeField',
			'previewMergeFields',
			'|',
			'formatPainter',
			'caseChange',
			'findAndReplace',
			'fullscreen',
			'|',
			'heading',
			'|',
			'bold',
			'italic',
			'underline',
			'|',
			'emoji',
			'specialCharacters',
			'link',
			'insertImage',
			'insertTable',
			'insertTemplate',
			'blockQuote',
			'|',
			'bulletedList',
			'numberedList',
			'todoList',
			'outdent',
			'indent'
		],
        importWord: {
			tokenUrl: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJidEJvR0tWVVlxNzlWb3FWVkFPTiIsImlhdCI6MTc2NzYxODEzMywiZXhwIjozNjAwMDAxNzY3NjE0NTMzfQ.kuApfajFgYVveQ8fP4Yb8FHEtjwpzO7GD7L1JDhG-tM'
		},
        menuBar: {
            isVisible: true,
        },
        licenseKey: LICENSE_KEY,
        language: 'pt',
        table: {
            contentToolbar: [
                'tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'
            ]
        },
        image:{
            toolbar: ['imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|',
		    'toggleImageCaption', 'imageTextAlternative'
	        ]
        }

    });

    return;

}
var header = null; //Salva o cabeçalho importado do docx para usar quando for salvar pra docx novamente
var footer = null; //Salva o rodape importado do docx para usar quando for salvar pra docx novamente
async function carregaDocumentoParaOCKEditor(documentId) {
    const fileUrl = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId);
    const response = await fetch(fileUrl);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append("file", blob, "file.docx");
    axios
        .post("https://docx-converter.cke-cs.com/v2/convert/docx-html", formData, {  headers: {
        'Authorization': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJidEJvR0tWVVlxNzlWb3FWVkFPTiIsImlhdCI6MTc2NzYxODEzMywiZXhwIjozNjAwMDAxNzY3NjE0NTMzfQ.kuApfajFgYVveQ8fP4Yb8FHEtjwpzO7GD7L1JDhG-tM"
        }})
        .then((response) => {
            console.log("Conversion result", response.data);
            header = response.data.headers.default.html;
            footer = response.data.footers.default.html;
            ckeditor.setData(
                `${response.data.html}
                <style>
                        .ck-content figure.table:not(.layout-table)>table, .ck-content table.table:not(.layout-table){
                            border-collapse: collapse !important;
                        }
                </style>`
            );
            // ckeditor.config._config.exportPdf.converterOptions.header_html = header;
            // ckeditor.config._config.exportPdf.converterOptions.footer_html = footer;
            Swal.close();
        })
        .catch((error) => {
            console.log("Conversion error", error);
        });
}


// Utils
function promiseGeraFileFromURL(url) {
    return new Promise((resolve, reject) => {
        PizZipUtils.getBinaryContent(url, function (error, content) {
            if (error) {
                reject(error);
            }
            resolve(content);
        });
    });
}
function promiseAtualizaDocumentoNoGED(file, documentId, name, parentId) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = function (e) {
            var bytes = e.target.result.split("base64,")[1];
            var ds = DatasetFactory.getDataset(
                "dsAtualizaDocumentosFluig",
                null,
                [
                    DatasetFactory.createConstraint("name", name, name, ConstraintType.MUST),
                    DatasetFactory.createConstraint("ParentDocumentId", parentId, parentId, ConstraintType.MUST),
                    DatasetFactory.createConstraint("documentId", documentId, documentId, ConstraintType.MUST),
                    DatasetFactory.createConstraint("conteudo", bytes, bytes, ConstraintType.MUST),
                ],
                null
            );

            resolve(ds);
        };
    });
}
function promiseCriaDocFluig_retornaDocumentId(file, parentId) {
    return new Promise((resolve, reject) => {
        var reader = new FileReader();
        var fileName = file.name;

        reader.readAsDataURL(file);
        reader.onload = function (e) {
            var bytes = e.target.result.split("base64,")[1];
            console.log(bytes)

            // Chama Dataset de Criação de Documento
            DatasetFactory.getDataset(
                "CriacaoDocumentosFluig",
                null,
                [
                    DatasetFactory.createConstraint("conteudo", bytes, bytes, ConstraintType.MUST),
                    DatasetFactory.createConstraint("nome", fileName, fileName, ConstraintType.SHOULD),
                    DatasetFactory.createConstraint("descricao", fileName, fileName, ConstraintType.SHOULD),
                    DatasetFactory.createConstraint("pasta", parentId, parentId, ConstraintType.SHOULD),
                ],
                null,
                {
                    success: function (dataset) {
                        if (!dataset || dataset == "" || dataset == null) {
                            // Retorna com erro
                            reject("Houve um erro na comunicação com o webservice de criação de documentos. Tente novamente!");
                        }

                        if (dataset.values[0][0] == "false") {
                            // Retorna com erro
                            reject("Erro ao criar arquivo. Favor entrar em contato com o administrador do sistema. Mensagem: " + dataset.values[0][1]);
                        } else {
                            // Retorna com Sucesso
                            console.log("### GEROU docID = " + dataset.values[0].Resultado);
                            resolve(dataset.values[0].Resultado);
                        }
                    },
                    error: function (error) {
                        reject(error);
                    },
                }
            );
        };
    });
}
function numeroPorExtenso(value, centavos) {
    //retorna o numero passado por extenso
    var resposta = "";

    if (value != "" && value != " " && value != null && value != undefined) {
        var unidade = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
        var dezena = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
        var centena = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

        list = value.split(".")[0].split("");
        list = list.reverse();
        while (list[list.length - 1] == 0) list.pop();
        for (var i = list.length - 1; i >= 0; i--) {
            if (value == 0) {
                return "zero";
            }
            if (value < 20) {
                return unidade[list.reverse().join("")];
            }
            if (value == "100") {
                return "cem";
            } else if (value == "1000") {
                return "mil";
            } else {
                if (i == 5 || i == 2 || i == 8) {
                    if (list[i] == 1 && list[i - 1] == 0 && list[i - 2] == 0) {
                        resposta += "cem";
                    } else resposta += centena[parseInt(list[i])] + " ";

                    if (list[i - 1] != 0) {
                        resposta += "e ";
                    }
                } else if (i == 4 || i == 1 || i == 7) {
                    if (list[i] < 2 && list[i] > 0) {
                        resposta += unidade[parseInt(list[i] + "" + list[i - 1])];
                    } else {
                        resposta += dezena[list[i]] + " ";
                        if (list[i - 1] != 0) {
                            resposta += "e ";
                        }
                    }
                } else {
                    if ((list[i + 1] >= 2 || list[i + 1] == 0 || list[i + 1] == null) && (i != 3 || list[i] != 1)) {
                        resposta += unidade[list[i]];
                    }
                    if (i == 3) {
                        resposta += " mil ";
                        if (list[2] != 0 && list[1] == 0 && list[0] == 0) {
                            resposta += "e ";
                        }
                    }
                    if (i == 6) {
                        resposta += " milhões ";
                    }
                }
            }
        }
        resposta = resposta.split("  ");
        resposta = resposta.join(" ");

        string = resposta.substring(0, 1);
        if (string == " ") {
            resposta = resposta.substring(1, resposta.length);
        }

        do {
            string = resposta.substring(resposta.length - 1);
            if (string == " " || string == "") {
                resposta = resposta.substring(0, resposta.length - 1);
            }
        } while (string == " ");
        if (centavos) {
            resposta += " reais";
            list = value.split(".")[1].split("");
            if (list[0] != 0 || list[1] != 0) {
                if (list[0] < 2 && list[0] > 0) {
                    resposta += " e " + unidade[list[0] + "" + list[1]] + " centavos";
                } else {
                    if (list[0] > 0) {
                        resposta += " e " + dezena[list[0]];
                    }
                    if (list[1] > 0) {
                        resposta += " e " + unidade[list[1]];
                    }
                    if (list[0] == 0 && list[1] == 1) {
                        resposta += " centavo";
                    } else {
                        resposta += " centavos";
                    }
                }
            }
        }
    }
    return resposta;
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
async function visualizaDocumento() {
    var documentId = $("#contratoPdfId").val();
    var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId);
    window.open(url, '_blank');
}