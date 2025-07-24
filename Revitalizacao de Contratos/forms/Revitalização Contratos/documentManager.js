// Modelo de Conrato
const pastaDeAnexos = 18386;
async function asyncPreencheDocumentoComDadosDoFormulario(documentId) {
    var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId);
    var file = await geraFileFromURL(url);
    carregaFileProDocxTemplatereEPreencheOsValores_retornaFile(file)

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
        doc.render(buscaDadosDoFormulario());
        var file = doc.toBlob()
        var file = new File([file], "file.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        return file;
    }
    function buscaDadosDoFormulario() {
        var retorno = {
            FORNECEDOR: "SEM CAMPO",
            FORNECEDOR_ENDERECO: `${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$("#cidadeFornecedor").val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()},`,
            FORNECEDOR_CNPJ: $("#locador").val(),
            FORNECEDOR_NOME_REPRESENTANTE: $("#representante").val(),
            FORNECEDOR_CPF_REPRESENTANTE: "SEM CAMPO",
            IMOVEL_DESCRICAO: "SEM CAMPO",
            IMOVEL_MATRICULA: $("#matriculaImovel").val(),
            IMOVEL_FINALIDADE: $("#finalidadeLocacao").val(),
            LOCACAO_PERIODO: $("#periodoLocacao").val(),
            LOCACAO_VALOR: "SEM CAMPO",
            LOCACAO_DIA_VENCIMENTO: $("#periodoLocacao").val(),
            LOCACAO_VALOR_CAUCAO: $("#valorCaucao").val(),
            LOCACAO_DATA_CAUCAO: $("#dataPagamentoCaucao").val(),
            BANCO: $("#banco").val(),
            BANCO_AGENCIA: $("#agencia").val(),
            BANCO_CONTA_CORRENTE: $("#contaCorrente").val(),
            DIA: "22",
            MES: "Julho",
            ANO: "2025",
        }
        return retorno;
    }
}
async function asyncGeraCopiaDoModeloDoContratoEAnexaNaSolicitacao() {
    const documentIdModelo = 29328;
    var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentIdModelo);
    var file = await promiseGeraFileFromURL(url);
    var documentId = await promiseCriaDocFluig_retornaDocumentId(file, pastaDeAnexos);
    $("#contratoDocumentId").val(documentId);
}
async function salvaModeloAlterado() {
    try {
        var response = await promiseConverteEditorParaDocx();

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        const file = new File([blob], 'document.docx', {
            type: blob.type
        });
        await promiseAtualizaDocumentoNoGED(file, $("#contratoDocumentId").val());

    } catch (error) {

    }

    function promiseConverteEditorParaDocx() {
        return new Promise((resolve, reject) => {
            const data = {
                html: ckeditor.getData(),
                css: "",
                config: {
                    document: {
                        orientation: "portrait",
                        size: "Tabloid",
                        margins: {
                            top: "20mm",
                            bottom: "20mm",
                            right: "24mm",
                            left: "24mm"
                        },
                        language: "en"
                    },
                    merge_fields: {
                        prefix: "{{",
                        suffix: "}}"
                    },
                    headers: {
                        default: {
                            html: header,
                            css: ""
                        }
                    },
                    footers: {
                        default: {
                            html: footer,
                            css: ""
                        }
                    }
                }
            };

            axios.post('https://docx-converter.cke-cs.com/v2/convert/html-docx', data, { responseType: 'arraybuffer' })
                .then(async response => {
                    resolve(response);
                }).catch(error => {
                    console.error('Conversion error', error);
                    reject(error);
                });
        });
    }
}



// CK5 Editor
var ckeditor = null;
async function editarArquivo() {
    await loadCkEditor();
    setTimeout(async () => {
        await carregaDocumentoParaOCKEditor($("#contratoDocumentId").val());
    }, 200);
}
async function loadCkEditor() {
    const LICENSE_KEY =
        'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NTQ0MzgzOTksImp0aSI6Ijg5YmUwMzM4LWE1M2EtNDEzZC1hMjY4LTA4YTdiMzNhMGY4ZiIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImM1YzRkMTUwIn0.IC4kRbMDckN9tAYgF3gfIqdC-IcIFwskVaS5OkVgJEWNLxqbUL_XrqPp5jxq6uYdbXcuIVdodUL2oPF2WTxZHw';
    const CLOUD_SERVICES_TOKEN_URL =
        'https://kgpduuc7hd0x.cke-cs.com/token/dev/407f4638faf927a773c40624a83b760abd427256264bba2c07f63af67045?limit=10';

    const editorConfig = {
        toolbar: {
            items: carregaBotoesDoWord(),
            shouldNotGroupWhenFull: false
        },
        plugins: carregaListaDePlugins(),
        cloudServices: {
            tokenUrl: CLOUD_SERVICES_TOKEN_URL
        },
        exportPdf: {
            stylesheets: [
                /* This path should point to the content stylesheets on your assets server. */
                /* See: https://ckeditor.com/docs/ckeditor5/latest/features/converters/export-pdf.html */
                './style.css',
                /* Export PDF needs access to stylesheets that style the content. */
                'https://cdn.ckeditor.com/ckeditor5/46.0.0/ckeditor5.css',
                'https://cdn.ckeditor.com/ckeditor5-premium-features/46.0.0/ckeditor5-premium-features.css'
            ],
            fileName: 'export-pdf-demo.pdf',
            converterOptions: {
                format: 'Tabloid',
                margin_top: '20mm',
                margin_bottom: '20mm',
                margin_right: '24mm',
                margin_left: '24mm',
                page_orientation: 'portrait'
            }
        },
        exportWord: {
            stylesheets: [
                /* This path should point to the content stylesheets on your assets server. */
                /* See: https://ckeditor.com/docs/ckeditor5/latest/features/converters/export-word.html */
                './style.css',
                /* Export Word needs access to stylesheets that style the content. */
                'https://cdn.ckeditor.com/ckeditor5/46.0.0/ckeditor5.css',
                'https://cdn.ckeditor.com/ckeditor5-premium-features/46.0.0/ckeditor5-premium-features.css'
            ],
            fileName: 'export-word-demo.docx',
            converterOptions: {
                document: {
                    orientation: 'portrait',
                    size: 'Tabloid',
                    margins: {
                        top: '20mm',
                        bottom: '20mm',
                        right: '24mm',
                        left: '24mm'
                    }
                }
            }
        },
        importWord: {
            tokenUrl: 'https://kgpduuc7hd0x.cke-cs.com/token/dev/407f4638faf927a773c40624a83b760abd427256264bba2c07f63af67045?limit=10'
        },
        fontFamily: {
            supportAllValues: true
        },
        fontSize: {
            options: [10, 12, 14, 'default', 18, 20, 22],
            supportAllValues: true
        },
        fullscreen: {
            onEnterCallback: container =>
                container.classList.add(
                    'editor-container',
                    'editor-container_classic-editor',
                    'editor-container_include-style',
                    'editor-container_include-fullscreen',
                    'main-container'
                )
        },
        heading: {
            options: carregaListaDeHeadings()
        },
        htmlSupport: {
            allow: [
                {
                    name: /^.*$/,
                    styles: true,
                    attributes: true,
                    classes: true
                }
            ]
        },
        image: {
            toolbar: [
                'toggleImageCaption',
                'imageTextAlternative',
                '|',
                'imageStyle:inline',
                'imageStyle:wrapText',
                'imageStyle:breakText',
                '|',
                'resizeImage',
                '|',
                'ckboxImageEdit'
            ]
        },
        initialData: '',
        licenseKey: LICENSE_KEY,
        lineHeight: {
            supportAllValues: true
        },
        link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
            decorators: {
                toggleDownloadable: {
                    mode: 'manual',
                    label: 'Downloadable',
                    attributes: {
                        download: 'file'
                    }
                }
            }
        },
        list: {
            properties: {
                styles: true,
                startIndex: true,
                reversed: true
            }
        },
        mention: {
            feeds: [
                {
                    marker: '@',
                    feed: [
                        /* See: https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html */
                    ]
                }
            ]
        },
        menuBar: {
            isVisible: true
        },
        mergeFields: {
            /* Read more: https://ckeditor.com/docs/ckeditor5/latest/features/merge-fields.html#configuration */
        },
        placeholder: 'Type or paste your content here!',
        style: {
            definitions: carregaListaDeStyles()
        },
        table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
        }
    };

    configUpdateAlert(editorConfig);

    ckeditor = await ClassicEditor.create(document.querySelector('#editor'), editorConfig);


    /**
     * This function exists to remind you to update the config needed for premium features.
     * The function can be safely removed. Make sure to also remove call to this function when doing so.
     */
    function configUpdateAlert(config) {
        if (configUpdateAlert.configUpdateAlertShown) {
            return;
        }

        const isModifiedByUser = (currentValue, forbiddenValue) => {
            if (currentValue === forbiddenValue) {
                return false;
            }

            if (currentValue === undefined) {
                return false;
            }

            return true;
        };

        const valuesToUpdate = [];

        configUpdateAlert.configUpdateAlertShown = true;

        if (!isModifiedByUser(config.licenseKey, '<YOUR_LICENSE_KEY>')) {
            valuesToUpdate.push('LICENSE_KEY');
        }

        if (!isModifiedByUser(config.cloudServices?.tokenUrl, '<YOUR_CLOUD_SERVICES_TOKEN_URL>')) {
            valuesToUpdate.push('CLOUD_SERVICES_TOKEN_URL');
        }

        if (valuesToUpdate.length) {
            window.alert(
                [
                    'Please update the following values in your editor config',
                    'to receive full access to Premium Features:',
                    '',
                    ...valuesToUpdate.map(value => ` - ${value}`)
                ].join('\n')
            );
        }
    }

    function carregaListaDePlugins() {
        const pluginsPremium = window.CKEDITOR_PREMIUM_FEATURES;
        const plugins = window.CKEDITOR;
        var listPlugins = [
            ClassicEditor,
            plugins.Alignment,
            plugins.Autoformat,
            plugins.AutoImage,
            plugins.AutoLink,
            plugins.Autosave,
            plugins.BlockQuote,
            plugins.Bold,
            plugins.Bookmark,
            plugins.CKBox,
            plugins.CKBoxImageEdit,
            plugins.CloudServices,
            plugins.Code,
            plugins.Emoji,
            plugins.Essentials,
            plugins.FindAndReplace,
            plugins.FontBackgroundColor,
            plugins.FontColor,
            plugins.FontFamily,
            plugins.FontSize,
            plugins.Fullscreen,
            plugins.GeneralHtmlSupport,
            plugins.Heading,
            plugins.Highlight,
            plugins.HorizontalLine,
            plugins.ImageBlock,
            plugins.ImageCaption,
            plugins.ImageEditing,
            plugins.ImageInline,
            plugins.ImageInsert,
            plugins.ImageInsertViaUrl,
            plugins.ImageResize,
            plugins.ImageStyle,
            plugins.ImageTextAlternative,
            plugins.ImageToolbar,
            plugins.ImageUpload,
            plugins.ImageUtils,
            plugins.Indent,
            plugins.IndentBlock,
            plugins.Italic,
            plugins.Link,
            plugins.LinkImage,
            plugins.List,
            plugins.ListProperties,
            plugins.Mention,
            plugins.PageBreak,
            plugins.Paragraph,
            plugins.PasteFromOffice,
            plugins.PictureEditing,
            plugins.RemoveFormat,
            plugins.SpecialCharacters,
            plugins.SpecialCharactersArrows,
            plugins.SpecialCharactersCurrency,
            plugins.SpecialCharactersEssentials,
            plugins.SpecialCharactersLatin,
            plugins.SpecialCharactersMathematical,
            plugins.SpecialCharactersText,
            plugins.Strikethrough,
            plugins.Style,
            plugins.Subscript,
            plugins.Superscript,
            plugins.Table,
            plugins.TableCaption,
            plugins.TableCellProperties,
            plugins.TableColumnResize,
            plugins.TableProperties,
            plugins.TableToolbar,
            plugins.TextTransformation,
            plugins.TodoList,
            plugins.Underline,
            pluginsPremium.CaseChange,
            pluginsPremium.ExportPdf,
            pluginsPremium.ExportWord,
            pluginsPremium.FormatPainter,
            pluginsPremium.ImportWord,
            pluginsPremium.LineHeight,
            pluginsPremium.MergeFields,
            pluginsPremium.MultiLevelList,
            pluginsPremium.PasteFromOfficeEnhanced,
            pluginsPremium.SlashCommand,
            pluginsPremium.TableOfContents,
            pluginsPremium.Template
        ];
        return listPlugins;
    }
    function carregaBotoesDoWord() {
        return [
            'undo',
            'redo',
            '|',
            'insertMergeField',
            'previewMergeFields',
            '|',
            'importWord',
            'exportWord',
            'exportPdf',
            'formatPainter',
            'caseChange',
            'findAndReplace',
            'fullscreen',
            '|',
            'heading',
            'style',
            '|',
            'fontSize',
            'fontFamily',
            'fontColor',
            'fontBackgroundColor',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'subscript',
            'superscript',
            'code',
            'removeFormat',
            '|',
            'emoji',
            'specialCharacters',
            'horizontalLine',
            'pageBreak',
            'link',
            'bookmark',
            'insertImage',
            'insertImageViaUrl',
            'ckbox',
            'insertTable',
            'tableOfContents',
            'insertTemplate',
            'highlight',
            'blockQuote',
            '|',
            'alignment',
            'lineHeight',
            '|',
            'bulletedList',
            'numberedList',
            'multiLevelList',
            'todoList',
            'outdent',
            'indent'
        ]
    }
    function carregaListaDeHeadings() {
        return [
            {
                model: 'paragraph',
                title: 'Paragraph',
                class: 'ck-heading_paragraph'
            },
            {
                model: 'heading1',
                view: 'h1',
                title: 'Heading 1',
                class: 'ck-heading_heading1'
            },
            {
                model: 'heading2',
                view: 'h2',
                title: 'Heading 2',
                class: 'ck-heading_heading2'
            },
            {
                model: 'heading3',
                view: 'h3',
                title: 'Heading 3',
                class: 'ck-heading_heading3'
            },
            {
                model: 'heading4',
                view: 'h4',
                title: 'Heading 4',
                class: 'ck-heading_heading4'
            },
            {
                model: 'heading5',
                view: 'h5',
                title: 'Heading 5',
                class: 'ck-heading_heading5'
            },
            {
                model: 'heading6',
                view: 'h6',
                title: 'Heading 6',
                class: 'ck-heading_heading6'
            }
        ]
    }
    function carregaListaDeStyles() {
        return [
            {
                name: 'Article category',
                element: 'h3',
                classes: ['category']
            },
            {
                name: 'Title',
                element: 'h2',
                classes: ['document-title']
            },
            {
                name: 'Subtitle',
                element: 'h3',
                classes: ['document-subtitle']
            },
            {
                name: 'Info box',
                element: 'p',
                classes: ['info-box']
            },
            {
                name: 'CTA Link Primary',
                element: 'a',
                classes: ['button', 'button--green']
            },
            {
                name: 'CTA Link Secondary',
                element: 'a',
                classes: ['button', 'button--black']
            },
            {
                name: 'Marker',
                element: 'span',
                classes: ['marker']
            },
            {
                name: 'Spoiler',
                element: 'span',
                classes: ['spoiler']
            }
        ]
    }
}
var header = null;//Salva o cabeçalho importado do docx para usar quando for salvar pra docx novamente
var footer = null;//Salva o rodape importado do docx para usar quando for salvar pra docx novamente
async function carregaDocumentoParaOCKEditor(documentId) {
    const fileUrl = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId);
    const response = await fetch(fileUrl);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('file', blob, 'file.docx');
    axios.post('https://docx-converter.cke-cs.com/v2/convert/docx-html', formData)
        .then(response => {
            console.log('Conversion result', response.data);
            header = response.data.headers.default.html;
            footer = response.data.footers.default.html;
            ckeditor.setData(`${response.data.html}`);
        }).catch(error => {
            console.log('Conversion error', error);
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
function promiseAtualizaDocumentoNoGED(file, documentId) {
    var name = "Teste.docx";
    var parentId = "18386";
    var parentId = "18386";

    return new Promise((resolve, reject) => {
        var reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = function (e) {
            var bytes = e.target.result.split("base64,")[1];
            var ds = DatasetFactory.getDataset("dsAtualizaDocumentosFluig", null, [
                DatasetFactory.createConstraint("name", name, name, ConstraintType.MUST),
                DatasetFactory.createConstraint("ParentDocumentId", parentId, parentId, ConstraintType.MUST),
                DatasetFactory.createConstraint("documentId", documentId, documentId, ConstraintType.MUST),
                DatasetFactory.createConstraint("conteudo", bytes, bytes, ConstraintType.MUST),
            ], null);

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

            // Chama Dataset de Criação de Documento
            DatasetFactory.getDataset("CriacaoDocumentosFluig", null, [
                DatasetFactory.createConstraint("conteudo", bytes, bytes, ConstraintType.MUST),
                DatasetFactory.createConstraint("nome", fileName, fileName, ConstraintType.SHOULD),
                DatasetFactory.createConstraint("descricao", fileName, fileName, ConstraintType.SHOULD),
                DatasetFactory.createConstraint("pasta", parentId, parentId, ConstraintType.SHOULD),
            ], null, {
                success: function (dataset) {
                    if (!dataset || dataset == "" || dataset == null) {
                        // Retorna com erro
                        reject("Houve um erro na comunicação com o webservice de criação de documentos. Tente novamente!");
                    }

                    if (dataset.values[0][0] == "false") {
                        // Retorna com erro
                        reject("Erro ao criar arquivo. Favor entrar em contato com o administrador do sistema. Mensagem: " + dataset.values[0][1]);
                    }
                    else {
                        // Retorna com Sucesso
                        console.log("### GEROU docID = " + dataset.values[0].Resultado);
                        resolve(dataset.values[0].Resultado);
                    }
                },
                error: function (error) {
                    reject(error);
                }
            });
        };
    });
}