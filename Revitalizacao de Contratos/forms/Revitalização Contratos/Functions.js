function preencherObrasDoUsuario() {
    const userCode = $("#solicitante").val();
    if (!userCode) {
        console.error("O valor de 'solicitante' está vazio ou não foi encontrado.");
        FLUIGC.toast({
            title: "Erro:",
            message: "O usuário solicitante não está definido.",
            type: "warning"
        });
        return;
    }

    try {
        const permissoes = buscaObrasPorPermissaoDoUsuario(userCode, true);
        if (permissoes.length > 0) {
            const selectObra = $("#obra");
            selectObra.empty();

            let optionsObra = "<option value='' id='option'>Selecione uma obra</option>";
            let codcoligadaAtual = "";

            permissoes.forEach(ccusto => {
                if (codcoligadaAtual !== ccusto.CODCOLIGADA) {
                    if (codcoligadaAtual !== "") {
                        optionsObra += "</optgroup>";
                    }
                    optionsObra += `<optgroup label="${ccusto.CODCOLIGADA} - ${ccusto.NOMEFANTASIA}">`;
                    codcoligadaAtual = ccusto.CODCOLIGADA;
                }

                const optionValue = `${ccusto.CODCOLIGADA} - ${ccusto.CODCCUSTO} - ${ccusto.perfil}`;
                const optionLabel = `${ccusto.CODCCUSTO} - ${ccusto.perfil}`;

                optionsObra += `<option value="${optionValue}">${optionLabel}</option>`;
            });

            optionsObra += "</optgroup>";
            selectObra.append(optionsObra);
        } else {
            FLUIGC.toast({
                title: "Aviso:",
                message: "Nenhuma permissão encontrada para o usuário.",
                type: "warning"
            });
        }
    } catch (error) {
        console.error("Erro ao preencher obras do usuário:", error);
        FLUIGC.toast({
            title: "Erro ao preencher obras do usuário:",
            message: error.message || error,
            type: "danger"
        });
    }
}

function BuscaFornecedores() {
    DatasetFactory.getDataset("FCFO", ["CGCCFO", "NOMEFANTASIA"], [
        DatasetFactory.createConstraint("ATIVO", 1, 1, ConstraintType.MUST),
        DatasetFactory.createConstraint("CODCOLIGADA", 0, 0, ConstraintType.MUST),
    ], null, {
        success: (fornecedores) => {
            if (fornecedores.columns[0] == "error") {
                FLUIGC.toast({
                    title: "Erro ao buscar fornecedores: ",
                    message: fornecedores.values[0].error,
                    type: "warning"
                });
            } else {
                var optSelected = $("#locador").val();
                $("#locador").html("<option></option>");
                fornecedores.values.forEach(fornecedor => {
                    $("#locador").append($("<option></option>")
                        .attr("value", fornecedor.CGCCFO)
                        .text(fornecedor.CGCCFO + " - " + fornecedor.NOMEFANTASIA));
                });
                $("#locador").val(optSelected);
                $('#locador').select2({
                    height: "34px",
                    width: "100%",
                    minimumInputLength: 4,
                    language: {
                        inputTooShort: () => "Digite pelo menos 4 caracteres",
                        noResults: () => "Nenhum resultado encontrado",
                        searching: () => "Buscando..."
                    }
                });
                $(".select2-container").off("click").on("click", function () {
                    $(this).removeClass("has-error");
                });
            }
        },
        error: (error) => {
            FLUIGC.toast({
                title: "Erro ao buscar fornecedores: ",
                message: error,
                type: "warning"
            });
        }
    });
}

function buscarEnderecoFornecedor(cgccfo) {
    DatasetFactory.getDataset("RetornaEnderecoFornecedor", null, [
        DatasetFactory.createConstraint("CGCCFO", cgccfo, cgccfo, ConstraintType.MUST)
    ], null, {
        success: (dataset) => {
            if (dataset.values && dataset.values.length > 0) {
                const endereco = dataset.values[0];
                $("#ruaFornecedor").val(endereco.RUA || "");
                $("#numeroFornecedor").val(endereco.NUMERO || "");
                $("#bairroFornecedor").val(endereco.BAIRRO || "");
                $("#cidadeFornecedor").val(endereco.CIDADE || "");
                $("#cepFornecedor").val(endereco.CEP || "");
                $("#estadoFornecedor").val(endereco.CODETD || "");
                $(".endereco-fornecedor").slideDown();
            } else {
                FLUIGC.toast({
                    title: "Endereço não encontrado",
                    message: "Nenhum endereço localizado para este CGCCFO",
                    type: "warning"
                });
                $(".endereco-fornecedor").slideUp();
            }
        },
        error: (err) => {
            console.error("Erro ao buscar endereço:", err);
            FLUIGC.toast({
                title: "Erro ao buscar endereço",
                message: err.message || "Erro desconhecido",
                type: "danger"
            });
        }
    });
}

function buscaBancos() {
    DatasetFactory.getDataset("GBANCO", null, null, null, {
        success: ds => {
            if (ds.values[0].STATUS != "SUCCESS") {
                showMessage("Erro ao buscar Bancos: ", ds.values[0].MENSAGEM, "warning");
                throw ds.values[0].MENSAGEM;
            }
            var bancos = JSON.parse(ds.values[0].RESULT);
            const selectBanco = $('#banco');
            selectBanco.empty();
            selectBanco.append('<option value="">Selecione um banco</option>');
            bancos.forEach(banco => {
                selectBanco.append(`<option value="${banco.NUMBANCO}">${banco.NUMBANCO} - ${banco.NOME}</option>`);
            });
            selectBanco.select2({
                placeholder: "Selecione um banco",
                allowClear: true,
                width: '100%'
            });
        },
        error: e => {
            console.error(e);
            showMessage("Erro ao buscar Bancos: ", " favor entrar em contato com o Administrador.", "warning");
        }
    });
}

function inicializarCalendario() {
    FLUIGC.calendar(".date", {
        pickDate: true,
        pickTime: false,
        minDate: "01/01/2024",
        maxDate: "12/31/2030",
        language: "pt-br",
        dateFormat: "dd/mm/yyyy"
    });
}


function inicializarPeriodoLocacao() {
    const periodoLocacao = document.getElementById("periodoLocacao");

    if (periodoLocacao) {
        flatpickr(periodoLocacao, {
            mode: "range",
            dateFormat: "d/m/Y",
            locale: "pt",
            minDate: "01/01/2024",
            maxDate: "31/12/2030",
            allowInput: true,
            clickOpens: true,
            disableMobile: true,
            onOpen: function () {
                periodoLocacao.classList.remove("disabled");
            },
            onClose: function (selectedDates) {
                if (selectedDates.length === 2) {
                    const [start, end] = selectedDates;
                    const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

                    if (diffInMonths > 12) {
                        FLUIGC.toast({
                            message: "Período máximo: 12 meses.",
                            type: "warning"
                        });
                        periodoLocacao.value = "";
                    }
                }
            }
        });
    }
}


// Preenche Modelo do Contrato
async function buscaModeloDoContrato() {
    try {
        // ID do Locação de Imóvel
    
        var url = await asyncBuscaUrlDoModeloDeContrato();


        var file = await loadFile(url);
        console.log(file);
        loadDocx(file)


    } catch (error) {
        showMessage("ERRO AO GERAR MODELO: ", error, "warning");
    }


    function loadFile(url) {
        return new Promise((resolve, reject)=>{
            PizZipUtils.getBinaryContent(url,  function (error, content) {
                if (error) {
                    reject(error);
                }
                resolve(content);
            });

        })
    }
    function loadDocx(content){
        const zip = new PizZip(content);
        console.log(zip);
        const doc = new window.docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
             syntax: {
        changeDelimiterPrefix: "$",
            },
        });
        console.log(doc);
        doc.render(buscaDadosPreenchimento());


        /*
         * Output the document using Data-URI
         * This method `toBlob()` is available since docxtemplater@3.62.0
         */
        saveAs(doc.toBlob(), "output.docx");
    }
    function buscaDadosPreenchimento(){
        var retorno = {
            FORNECEDOR:"SEM CAMPO",
            FORNECEDOR_ENDERECO:`${$("#ruaFornecedor").val()}, nº ${$("#numeroFornecedor").val()}, bairro ${$("#bairroFornecedor").val()}, na cidade de ${$("#cidadeFornecedor").val()}, no estado ${$("#estadoFornecedor").val()} - CEP: ${$("#cepFornecedor").val()},`,
            FORNECEDOR_CNPJ:$("#locador").val(),
            FORNECEDOR_NOME_REPRESENTANTE:$("#representante").val(),
            FORNECEDOR_CPF_REPRESENTANTE:"SEM CAMPO",
            IMOVEL_DESCRICAO:"SEM CAMPO",
            IMOVEL_MATRICULA:$("#matriculaImovel").val(),
            IMOVEL_FINALIDADE:$("#finalidadeLocacao").val(),
            LOCACAO_PERIODO:$("#periodoLocacao").val(),
            LOCACAO_VALOR:"SEM CAMPO",
            LOCACAO_DIA_VENCIMENTO:$("#periodoLocacao").val(),
            LOCACAO_VALOR_CAUCAO:$("#valorCaucao").val(),
            LOCACAO_DATA_CAUCAO:$("#dataPagamentoCaucao").val(),
            BANCO:$("#banco").val(),
            BANCO_AGENCIA:$("#agencia").val(),
            BANCO_CONTA_CORRENTE:$("#contaCorrente").val(),
            DIA:"22",
            MES:"Julho",
            ANO:"2025",
        }
        return retorno;
    }
}

async function asyncBuscaUrlDoModeloDeContrato() {
         const documentId = 29328;
        var url = await promiseBuscaDownloadUrlDocumentoNoFLuig(documentId);
        return url;
}

// const response = await fetch(await asyncBuscaUrlDoModeloDeContrato());
// const arrayBuffer = await response.arrayBuffer();
// ckeditor.execute('importWord', { file });


// var file = await urlToFile(await asyncBuscaUrlDoModeloDeContrato(), "Teste.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
//   ckeditor.execute('importWord', { file });

// Editor de Conteudo
var ckeditor = null;
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
		Underline
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
		Template
	} = window.CKEDITOR_PREMIUM_FEATURES;

	const LICENSE_KEY =
		'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NTQ0MzgzOTksImp0aSI6Ijg5YmUwMzM4LWE1M2EtNDEzZC1hMjY4LTA4YTdiMzNhMGY4ZiIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImM1YzRkMTUwIn0.IC4kRbMDckN9tAYgF3gfIqdC-IcIFwskVaS5OkVgJEWNLxqbUL_XrqPp5jxq6uYdbXcuIVdodUL2oPF2WTxZHw';

	const CLOUD_SERVICES_TOKEN_URL =
		'https://kgpduuc7hd0x.cke-cs.com/token/dev/407f4638faf927a773c40624a83b760abd427256264bba2c07f63af67045?limit=10';

	const editorConfig = {
		toolbar: {
			items: [
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
			],
			shouldNotGroupWhenFull: false
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
			Underline
		],
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
			options: [
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
		initialData:
			'<h2>Congratulations on setting up CKEditor 5! 🎉</h2>\n<p>\n\tYou\'ve successfully created a CKEditor 5 project. This powerful text editor\n\twill enhance your application, enabling rich text editing capabilities that\n\tare customizable and easy to use.\n</p>\n<h3>What\'s next?</h3>\n<ol>\n\t<li>\n\t\t<strong>Integrate into your app</strong>: time to bring the editing into\n\t\tyour application. Take the code you created and add to your application.\n\t</li>\n\t<li>\n\t\t<strong>Explore features:</strong> Experiment with different plugins and\n\t\ttoolbar options to discover what works best for your needs.\n\t</li>\n\t<li>\n\t\t<strong>Customize your editor:</strong> Tailor the editor\'s\n\t\tconfiguration to match your application\'s style and requirements. Or\n\t\teven write your plugin!\n\t</li>\n</ol>\n<p>\n\tKeep experimenting, and don\'t hesitate to push the boundaries of what you\n\tcan achieve with CKEditor 5. Your feedback is invaluable to us as we strive\n\tto improve and evolve. Happy editing!\n</p>\n<h3>Helpful resources</h3>\n<ul>\n\t<li>📝 <a href="https://portal.ckeditor.com/checkout?plan=free">Trial sign up</a>,</li>\n\t<li>📕 <a href="https://ckeditor.com/docs/ckeditor5/latest/installation/index.html">Documentation</a>,</li>\n\t<li>⭐️ <a href="https://github.com/ckeditor/ckeditor5">GitHub</a> (star us if you can!),</li>\n\t<li>🏠 <a href="https://ckeditor.com">CKEditor Homepage</a>,</li>\n\t<li>🧑‍💻 <a href="https://ckeditor.com/ckeditor-5/demo/">CKEditor 5 Demos</a>,</li>\n</ul>\n<h3>Need help?</h3>\n<p>\n\tSee this text, but the editor is not starting up? Check the browser\'s\n\tconsole for clues and guidance. It may be related to an incorrect license\n\tkey if you use premium features or another feature-related requirement. If\n\tyou cannot make it work, file a GitHub issue, and we will help as soon as\n\tpossible!\n</p>\n',
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
			definitions: [
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
		},
		table: {
			contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
		},
		template: {
			definitions: [
				{
					title: 'Introduction',
					description: 'Simple introduction to an article',
					icon: '<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">\n    <g id="icons/article-image-right">\n        <rect id="icon-bg" width="45" height="45" rx="2" fill="#A5E7EB"/>\n        <g id="page" filter="url(#filter0_d_1_507)">\n            <path d="M9 41H36V12L28 5H9V41Z" fill="white"/>\n            <path d="M35.25 12.3403V40.25H9.75V5.75H27.7182L35.25 12.3403Z" stroke="#333333" stroke-width="1.5"/>\n        </g>\n        <g id="image">\n            <path id="Rectangle 22" d="M21.5 23C21.5 22.1716 22.1716 21.5 23 21.5H31C31.8284 21.5 32.5 22.1716 32.5 23V29C32.5 29.8284 31.8284 30.5 31 30.5H23C22.1716 30.5 21.5 29.8284 21.5 29V23Z" fill="#B6E3FC" stroke="#333333"/>\n            <path id="Vector 1" d="M24.1184 27.8255C23.9404 27.7499 23.7347 27.7838 23.5904 27.9125L21.6673 29.6268C21.5124 29.7648 21.4589 29.9842 21.5328 30.178C21.6066 30.3719 21.7925 30.5 22 30.5H32C32.2761 30.5 32.5 30.2761 32.5 30V27.7143C32.5 27.5717 32.4391 27.4359 32.3327 27.3411L30.4096 25.6268C30.2125 25.451 29.9127 25.4589 29.7251 25.6448L26.5019 28.8372L24.1184 27.8255Z" fill="#44D500" stroke="#333333" stroke-linejoin="round"/>\n            <circle id="Ellipse 1" cx="26" cy="25" r="1.5" fill="#FFD12D" stroke="#333333"/>\n        </g>\n        <rect id="Rectangle 23" x="13" y="13" width="12" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 24" x="13" y="17" width="19" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 25" x="13" y="21" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 26" x="13" y="25" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 27" x="13" y="29" width="6" height="2" rx="1" fill="#B4B4B4"/>\n        <rect id="Rectangle 28" x="13" y="33" width="16" height="2" rx="1" fill="#B4B4B4"/>\n    </g>\n    <defs>\n        <filter id="filter0_d_1_507" x="9" y="5" width="28" height="37" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">\n            <feFlood flood-opacity="0" result="BackgroundImageFix"/>\n            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>\n            <feOffset dx="1" dy="1"/>\n            <feComposite in2="hardAlpha" operator="out"/>\n            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.29 0"/>\n            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_507"/>\n            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_507" result="shape"/>\n        </filter>\n    </defs>\n</svg>\n',
					data: "<h2>Introduction</h2><p>In today's fast-paced world, keeping up with the latest trends and insights is essential for both personal growth and professional development. This article aims to shed light on a topic that resonates with many, providing valuable information and actionable advice. Whether you're seeking to enhance your knowledge, improve your skills, or simply stay informed, our comprehensive analysis offers a deep dive into the subject matter, designed to empower and inspire our readers.</p>"
				}
			]
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

}

async function urlToFile(url, filename, mimeType) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType });
}
