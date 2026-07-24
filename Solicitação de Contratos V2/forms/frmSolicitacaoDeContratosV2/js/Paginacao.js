function mostrarPagina(indice, move) {
    if (move == "set") {
        var indiceAtivo = $(".pagination-active").attr("data-index");
        if (indiceAtivo > indice) {
            move = "prev";
        } else {
            move = "next";
        }
    }

    $(".pagination-active").removeClass("pagination-active", 250);
    $(`.pagination[data-index='${indice}']`).addClass("pagination-active", 250);

    $(`.pagina.ativa[data-index!='${indice}']`).removeClass("ativa").addClass(move == "next" ? "escondida-para-esquerda" : "escondida-para-direita").css("position", "absolute");
    $(`.pagina[data-index='${indice}']`).addClass("ativa", 250).removeClass("escondida-para-direita", 250).removeClass("escondida-para-esquerda", 250).css("position", "relative");
    $(window).scrollTop(0)

    //dataTableEquipamentosAditivoRescisao
    if (typeof dataTableEquipamentosAditivoRescisao !== "undefined" && dataTableEquipamentosAditivoRescisao &&
        $(`.pagina[data-index='${indice}']`).find("#tableEquipamentosAditivoRescisao").length) {
        setTimeout(function () {
            dataTableEquipamentosAditivoRescisao.columns.adjust().draw(false);
        }, 300);
    }
}
function avancarPagina() {
    var active = $(".pagination-active");
    var index = $(active).nextAll(".pagination:not('.hidden'):first").attr("data-index");
    if (index) {
        mostrarPagina(index, "next");
    }
}
function voltarPagina() {
    var active = $(".pagination-active");
    var index = $(active).prevAll(".pagination:not('.hidden')").attr("data-index");
    if (index) {
        mostrarPagina(index, "prev");
    }
}
function setAtividadeAtivaProgresso(atividadesConcluidas) {
    var counter = 0;
    $(".wizard-progress")
        .find("div")
        .each(function () {
            if (counter < atividadesConcluidas) {
                $(this).addClass("completed");
            } else if (counter == atividadesConcluidas) {
                $(this).addClass("active");
            }
            counter++;
        });
}