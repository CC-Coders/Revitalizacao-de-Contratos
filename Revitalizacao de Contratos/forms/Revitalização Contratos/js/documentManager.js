// Modelo de Contrato
const pastasDeAnexosPorServidor = {
    DESENVOLVIMENTO:"18386",
    HOMOLOGACAO:"10540",
    PRODUCAO:"140518",
}
var ds = DatasetFactory.getDataset("dsGetServerURL", null, null, null);
const env = ds.values[0].URL == "http://homologacao.castilho.com.br:2020" ? "HOMOLOGACAO" : ds.values[0].URL == "http://desenvolvimento.castilho.com.br:3232" ? "DESENVOLVIMENTO":"PRODUCAO";
const pastaDeAnexos = pastasDeAnexosPorServidor[env];


const codigosModelos = {
    PRODUCAO:{

    },
    DESENVOLVIMENTO:{
        "Locação de Imóvel":29328,
        "Locação de Equipamento":30545,
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
        const zip = new PizZip(content);
        const doc = new window.docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            syntax: {
                changeDelimiterPrefix: "$",
            },
        });

        var input = await buscaDadosDoFormulario($("#tipoContrato").val());
        console.log(input);
        doc.render(input);
        var file = doc.toBlob();
        var file = new File([file], geraNomeDoArquivo()+".pdf", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        return file;
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
        var [ano,mes,dia] = getDateNow().split("-");
        

        if (tipoContrato == "Locação de Imóvel") {
            var retorno = {
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
                ANO:ano,
                CODIGO_CENTRO_DE_CUSTO: `${$("#CODCCUSTO").val()} - ${$("#NOMECCUSTO").val()}`
            };
        }else if(tipoContrato == "Locação de Equipamento"){
            var prazo_inicio = $("#dataInicioLocacao").val().split("/").reverse().join("-");
            var prazo_fim = $("#dataFimLocacao").val().split("/").reverse().join("-");

            var retorno = {
                FORNECEDOR: $("#hiddenFORNECEDOR").val(),
                FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$(
                    "#cidadeFornecedor"
                ).val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()},`,
                FORNECEDOR_CNPJ: $("#hiddenCGCCFO").val(),
                FORNECEDOR_NOME_REPRESENTANTE: $("#administradorFornecedor").val(),
                FORNECEDOR_CPF_REPRESENTANTE: $("#cpfAdministrador").val(),
                
                PERIODOINICIO:$("#dataInicioLocacao").val(),
                PERIODOFIM:$("#dataFimLocacao").val(),

                TEM_RETENCAO:$("#temRetencao").val(),
                PERCENTUAL_RETENCAO:$("#percentualRetencao").val(),

                TEM_REIDI:$("#temREIDI").val(),
                PERCENTUAL_REIDI:$("#percentualREIDI").val(),

                VALOR_TOTAL:$("#valorTotalLocacao").val(),
                VALOR_TOTAL_EXTENSO: numeroPorExtenso($("#valorTotalLocacao").val().replace("R$","").replace(".","").trim(), true),

                BANCO: $("#banco").val(),
                BANCO_AGENCIA: $("#agencia").val(),
                BANCO_CONTA_CORRENTE: $("#contaCorrente").val(),
                BANCO_TITULAR: $("#titular").val(),

                DIA: dia,
                MES: meses[mes],
                ANO:ano,
                CODIGO_CENTRO_DE_CUSTO:$("#NOMECCUSTO").val(),
                OBRA:$("#NOMECCUSTO").val(),

                PRAZO:parseInt(calculaDiferencaEmMeses(prazo_inicio, prazo_fim)),
                PRAZO_EXTENSO:numeroPorExtenso(calculaDiferencaEmMeses(prazo_inicio, prazo_fim).toString()),

                INDICE_REAJUSTE:$("#indiceReajuste").val(),

                EQUIPAMENTOS:await asyncConsultaEquipamentosSelecionados()
            };

        }
        return retorno;
    }
}
async function asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao() {
    const tipoContrato = $("#tipoContrato").val();
    const documentIdModelo = codigosModelos["DESENVOLVIMENTO"][tipoContrato];

    var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentIdModelo);

    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], geraNomeDoArquivo()+".docx", {
        type: blob.type,
    });
    var documentId = await promiseCriaDocFluig_retornaDocumentId(file, pastaDeAnexos);
    $("#contratoDocumentId").val(documentId);

    var filePreenchido = await asyncPreencheDocumentoComDadosDoFormulario($("#contratoDocumentId").val());
    var pdf = await convertDocxToPdf(filePreenchido);
    const filePdf = new File([pdf], geraNomeDoArquivo()+".pdf", {
        type: blob.type,
    });
    var pdfId = await promiseCriaDocFluig_retornaDocumentId(filePdf, pastaDeAnexos);
    $("#contratoPdfId").val(pdfId);
}
function geraNomeDoArquivo(){
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

        const file = new File([blob], geraNomeDoArquivo()+".docx", {
            type: blob.type,
        });
        await promiseAtualizaDocumentoNoGED(file, $("#contratoDocumentId").val(), geraNomeDoArquivo()+".docx", pastaDeAnexos);

        var filePreenchido = await asyncPreencheDocumentoComDadosDoFormulario($("#contratoDocumentId").val());
        var pdf = await convertDocxToPdf(filePreenchido, geraNomeDoArquivo()+".pdf");
        await promiseAtualizaDocumentoNoGED(pdf, $("#contratoPdfId").val(), geraNomeDoArquivo()+".pdf", pastaDeAnexos);

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
                .post("https://docx-converter.cke-cs.com/v2/convert/html-docx", data, { responseType: "arraybuffer" })
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
        const docxHtmlResponse = await axios.post("https://docx-converter.cke-cs.com/v2/convert/docx-html", formData, { responseType: "json" });
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
    const {
        ClassicEditor,
        Alignment,
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
        Underline,
    } = window.CKEDITOR;
    const {
        CaseChange,
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
    } = window.CKEDITOR_PREMIUM_FEATURES;

    const LICENSE_KEY =
        "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NjM1MTAzOTksImp0aSI6IjYwNDE3NWRkLTQ0ZWEtNDY5Mi1iMjYyLTcwZmY4NDg5YWQ0YSIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImNhYzRlNDBjIn0.2mUK5kw3jdNRg3UsURe08DObpPFeM5MmaDuBIYi8KuMrni8nxyCUsuy5aSSPsroJ4MG9eQcBBc1gMp-3jAq64g";

    const CLOUD_SERVICES_TOKEN_URL = "https://afwbxzt3zsv0.cke-cs.com/token/dev/0c54bb51e7ae04bad7166d63f91681292def83e919f079228773aca12cba?limit=10";

    const editorConfig = {
        toolbar: {
            items: [
                "undo",
                "redo",
                "|",
                "insertMergeField",
                "previewMergeFields",
                "|",
                "importWord",
                "exportWord",
                "exportPdf",
                "formatPainter",
                "caseChange",
                "findAndReplace",
                "fullscreen",
                "|",
                "heading",
                "style",
                "|",
                "fontSize",
                "fontFamily",
                "fontColor",
                "fontBackgroundColor",
                "|",
                "bold",
                "italic",
                "underline",
                "strikethrough",
                "subscript",
                "superscript",
                "code",
                "removeFormat",
                "|",
                "emoji",
                "specialCharacters",
                "horizontalLine",
                "pageBreak",
                "link",
                "bookmark",
                "insertImage",
                "insertImageViaUrl",
                "ckbox",
                "insertTable",
                "tableOfContents",
                "insertTemplate",
                "highlight",
                "blockQuote",
                "|",
                "alignment",
                "lineHeight",
                "|",
                "bulletedList",
                "numberedList",
                "multiLevelList",
                "todoList",
                "outdent",
                "indent",
            ],
            shouldNotGroupWhenFull: true,
        },
        plugins: [
            Alignment,
            Autoformat,
            AutoImage,
            AutoLink,
            Autosave,
            BlockQuote,
            Bold,
            Bookmark,
            CaseChange,
            CKBox,
            CKBoxImageEdit,
            CloudServices,
            Code,
            Emoji,
            Essentials,
            ExportPdf,
            ExportWord,
            FindAndReplace,
            FontBackgroundColor,
            FontColor,
            FontFamily,
            FontSize,
            FormatPainter,
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
            ImportWord,
            Indent,
            IndentBlock,
            Italic,
            LineHeight,
            Link,
            LinkImage,
            List,
            ListProperties,
            Mention,
            MergeFields,
            MultiLevelList,
            PageBreak,
            Paragraph,
            PasteFromOffice,
            PasteFromOfficeEnhanced,
            PictureEditing,
            RemoveFormat,
            SlashCommand,
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
            TableOfContents,
            TableProperties,
            TableToolbar,
            Template,
            TextTransformation,
            TodoList,
            Underline,
        ],
        cloudServices: {
            tokenUrl: CLOUD_SERVICES_TOKEN_URL,
        },
        exportPdf: {
            stylesheets: [
                /* This path should point to the content stylesheets on your assets server. */
                /* See: https://ckeditor.com/docs/ckeditor5/latest/features/converters/export-pdf.html */
                "Style.css",
                /* Export PDF needs access to stylesheets that style the content. */
                "https://cdn.ckeditor.com/ckeditor5/46.0.0/ckeditor5.css",
                "https://cdn.ckeditor.com/ckeditor5-premium-features/46.0.0/ckeditor5-premium-features.css",
            ],
            dataCallback: (editor) => {
                return `
                    <style>
                        .ck-content figure.table:not(.layout-table)>table, .ck-content table.table:not(.layout-table){
                            border-collapse: collapse !important;
                        }
                    </style>
					${editor.getData()}
					<div class="watermark">SEM VALOR CONTRATUAL</div>
					<div class="header" style="position: fixed;left: 70;top: -5;">${header}</div>
					<div class="footer" style="position: fixed;left: 30;top: 95;">${footer}</div>
				`;
            },
            fileName: "export-pdf-demo.pdf",
            converterOptions: {
                format: "Tabloid",
                margin_top: "20mm",
                margin_bottom: "20mm",
                margin_right: "24mm",
                margin_left: "24mm",
                page_orientation: "portrait",
                header_html: undefined,
                footer_html: undefined,
            },
        },
        exportWord: {
            stylesheets: [
                /* This path should point to the content stylesheets on your assets server. */
                /* See: https://ckeditor.com/docs/ckeditor5/latest/features/converters/export-word.html */
                "./style.css",
                /* Export Word needs access to stylesheets that style the content. */
                "https://cdn.ckeditor.com/ckeditor5/46.0.0/ckeditor5.css",
                "https://cdn.ckeditor.com/ckeditor5-premium-features/46.0.0/ckeditor5-premium-features.css",
            ],
            fileName: "export-word-demo.docx",
            converterOptions: {
                document: {
                    orientation: "portrait",
                    size: "Tabloid",
                    margins: {
                        top: "20mm",
                        bottom: "20mm",
                        right: "24mm",
                        left: "24mm",
                    },
                },
            },
        },
        importWord: {
            tokenUrl: CLOUD_SERVICES_TOKEN_URL,
        },
        fontFamily: {
            supportAllValues: true,
        },
        fontSize: {
            options: [10, 12, 14, "default", 18, 20, 22],
            supportAllValues: true,
        },
        fullscreen: {
            onEnterCallback: (container) =>
                container.classList.add(
                    "editor-container",
                    "editor-container_classic-editor",
                    "editor-container_include-style",
                    "editor-container_include-fullscreen",
                    "main-container"
                ),
        },
        heading: {
            options: [
                {
                    model: "paragraph",
                    title: "Paragraph",
                    class: "ck-heading_paragraph",
                },
                {
                    model: "heading1",
                    view: "h1",
                    title: "Heading 1",
                    class: "ck-heading_heading1",
                },
                {
                    model: "heading2",
                    view: "h2",
                    title: "Heading 2",
                    class: "ck-heading_heading2",
                },
                {
                    model: "heading3",
                    view: "h3",
                    title: "Heading 3",
                    class: "ck-heading_heading3",
                },
                {
                    model: "heading4",
                    view: "h4",
                    title: "Heading 4",
                    class: "ck-heading_heading4",
                },
                {
                    model: "heading5",
                    view: "h5",
                    title: "Heading 5",
                    class: "ck-heading_heading5",
                },
                {
                    model: "heading6",
                    view: "h6",
                    title: "Heading 6",
                    class: "ck-heading_heading6",
                },
            ],
        },
        htmlSupport: {
            allow: [
                {
                    name: /^.*$/,
                    styles: true,
                    attributes: true,
                    classes: true,
                },
            ],
        },
        image: {
            toolbar: [
                "toggleImageCaption",
                "imageTextAlternative",
                "|",
                "imageStyle:inline",
                "imageStyle:wrapText",
                "imageStyle:breakText",
                "|",
                "resizeImage",
                "|",
                "ckboxImageEdit",
            ],
        },
        initialData: "",
        licenseKey: LICENSE_KEY,
        lineHeight: {
            supportAllValues: true,
        },
        link: {
            addTargetToExternalLinks: true,
            defaultProtocol: "https://",
            decorators: {
                toggleDownloadable: {
                    mode: "manual",
                    label: "Downloadable",
                    attributes: {
                        download: "file",
                    },
                },
            },
        },
        list: {
            properties: {
                styles: true,
                startIndex: true,
                reversed: true,
            },
        },
        mention: {
            feeds: [
                {
                    marker: "@",
                    feed: [
                        /* See: https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html */
                    ],
                },
            ],
        },
        menuBar: {
            isVisible: true,
        },
        mergeFields: {
            /* Read more: https://ckeditor.com/docs/ckeditor5/latest/features/merge-fields.html#configuration */
        },
        placeholder: "Type or paste your content here!",
        style: {
            definitions: [
                {
                    name: "Article category",
                    element: "h3",
                    classes: ["category"],
                },
                {
                    name: "Title",
                    element: "h2",
                    classes: ["document-title"],
                },
                {
                    name: "Subtitle",
                    element: "h3",
                    classes: ["document-subtitle"],
                },
                {
                    name: "Info box",
                    element: "p",
                    classes: ["info-box"],
                },
                {
                    name: "CTA Link Primary",
                    element: "a",
                    classes: ["button", "button--green"],
                },
                {
                    name: "CTA Link Secondary",
                    element: "a",
                    classes: ["button", "button--black"],
                },
                {
                    name: "Marker",
                    element: "span",
                    classes: ["marker"],
                },
                {
                    name: "Spoiler",
                    element: "span",
                    classes: ["spoiler"],
                },
            ],
        },
        table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
        },
        template: {
            definitions: [
                {
                    title: "Introduction",
                    description: "Simple introduction to an article",
                    icon: '<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">\n    <g id="icons/article-image-right">\n        <rect id="icon-bg" width="45" height="45" rx="2" fill="#A5E7EB"/>\n        <g id="page" filter="url(#filter0_d_1_507)">\n            <path d="M9 41H36V12L28 5H9V41Z" fill="white"/>\n            <path d="M35.25 12.3403V40.25H9.75V5.75H27.7182L35.25 12.3403Z" stroke="#333333" stroke-width="1.5"/>\n        </g>\n        <g id="image">\n            <path id="Rectangle 22" d="M21.5 23C21.5 22.1716 22.1716 21.5 23 21.5H31C31.8284 21.5 32.5 22.1716 32.5 23V29C32.5 29.8284 31.8284 30.5 31 30.5H23C22.1716 30.5 21.5 29.8284 21.5 29V23Z" fill="#B6E3FC" stroke="#333333"/>\n            <path id="Vector 1" d="M24.1184 27.8255C23.9404 27.7499 23.7347 27.7838 23.5904 27.9125L21.6673 29.6268C21.5124 29.7648 21.4589 29.9842 21.5328 30.178C21.6066 30.3719 21.7925 30.5 22 30.5H32C32.2761 30.5 32.5 30.2761 32.5 30V27.7143C32.5 27.5717 32.4391 27.4359 32.3327 27.3411L30.4096 25.6268C30.2125 25.451 29.9127 25.4589 29.7251 25.6448L26.5019 28.8372L24.1184 27.8255Z" fill="#44D500" stroke="#333333" stroke-linejoin="round"/>\n            <circle id="Ellipse 1" cx="26" cy="25" r="1.5" fill="#FFD12D" stroke="#333333"/>\n        </g>\n        <rect id="Rectangle 23" x="13" y="13" width="12" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 24" x="13" y="17" width="19" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 25" x="13" y="21" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 26" x="13" y="25" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 27" x="13" y="29" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 28" x="13" y="33" width="16" height="2" rx="1" fill="#B4B4B4"/>\n    </g>\n    <defs>\n        <filter id="filter0_d_1_507" x="9" y="5" width="28" height="37" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">\n            <feFlood flood-opacity="0" result="BackgroundImageFix"/>\n            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>\n            <feOffset dx="1" dy="1"/>\n            <feComposite in2="hardAlpha" operator="out"/>\n            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.29 0"/>\n            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_507"/>\n            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_507" result="shape"/>\n        </filter>\n    </defs>\n</svg>\n',
                    data: "<h2>Introduction</h2><p>In today's fast-paced world, keeping up with the latest trends and insights is essential for both personal growth and professional development. This article aims to shed light on a topic that resonates with many, providing valuable information and actionable advice. Whether you're seeking to enhance your knowledge, improve your skills, or simply stay informed, our comprehensive analysis offers a deep dive into the subject matter, designed to empower and inspire our readers.</p>",
                },
            ],
        },
    };

    ckeditor = await ClassicEditor.create(document.querySelector("#editor"), editorConfig);
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
        .post("https://docx-converter.cke-cs.com/v2/convert/docx-html", formData)
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
            ckeditor.config._config.exportPdf.converterOptions.header_html = header;
            ckeditor.config._config.exportPdf.converterOptions.footer_html = footer;
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
            list = value.split(",")[1].split("");
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