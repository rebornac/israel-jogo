(function(storyContent) {

    // 1. Inicialização do Story
    var story = new inkjs.Story(storyContent);
    var savePoint = "";

    // Elementos da Interface
    var storyContainer = document.querySelector('#story');
    var outerScrollContainer = document.querySelector('.outerContainer');

    // --- FUNÇÕES DE NAVEGAÇÃO (Globais para o HTML enxergar) ---
    window.startGame = function() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        continueStory(true);
    };

    window.showInstructions = function() {
        document.getElementById('modal-instructions').style.display = 'flex';
    };

    window.hideInstructions = function() {
        document.getElementById('modal-instructions').style.display = 'none';
    };

    // --- LÓGICA PRINCIPAL DA HISTÓRIA ---
    function continueStory(firstTime) {
        var delay = 0.0;
        var previousBottomEdge = firstTime ? 0 : contentBottomEdgeY();

        while (story.canContinue) {
            var paragraphText = story.Continue();
            var tags = story.currentTags;

            // Processamento de Tags
            var customClasses = [];
            for (var i = 0; i < tags.length; i++) {
                var tag = tags[i];
                var splitTag = splitPropertyTag(tag);

                // # CLEAR
                if (tag.toUpperCase() == "CLEAR") {
                    removeAll("p");
                    removeAll("img");
                    continue;
                }

                // # CLASS: nomeDaClasse
                if (splitTag && splitTag.property.toUpperCase() == "CLASS") {
                    customClasses.push(splitTag.val);
                }

                // # IMAGE: URL
                if (splitTag && splitTag.property.toUpperCase() == "IMAGE") {
                    var imageElement = document.createElement('img');
                    imageElement.src = splitTag.val;
                    storyContainer.appendChild(imageElement);
                    showAfter(delay, imageElement);
                    delay += 200.0;
                }

                // # BACKGROUND: URL
                if (splitTag && splitTag.property.toUpperCase() == "BACKGROUND") {
                    outerScrollContainer.style.backgroundImage = 'url(' + splitTag.val + ')';
                }
            }

            if (paragraphText.trim().length == 0) continue;

            // Criar o elemento de parágrafo
            var paragraphElement = document.createElement('p');
            paragraphElement.innerHTML = paragraphText;

            // Aplicar classes customizadas
            customClasses.forEach(c => paragraphElement.classList.add(c));

            storyContainer.appendChild(paragraphElement);
            showAfter(delay, paragraphElement);
            delay += 200.0;
        }

        // Atualizar interface de status (HUD)
        updateHUD();

        // Gerar Escolhas
        if (story.currentChoices.length > 0) {
            story.currentChoices.forEach(function(choice) {
                var choiceParagraphElement = document.createElement('p');
                choiceParagraphElement.classList.add("choice");
                choiceParagraphElement.innerHTML = `<a href='#'>${choice.text}</a>`;
                storyContainer.appendChild(choiceParagraphElement);
                showAfter(delay, choiceParagraphElement);
                delay += 200.0;

                var choiceAnchorEl = choiceParagraphElement.querySelector("a");
                choiceAnchorEl.addEventListener("click", function(event) {
                    event.preventDefault();
                    removeAll(".choice");
                    story.ChooseChoiceIndex(choice.index);
                    savePoint = story.state.toJson();
                    continueStory();
                });
            });
        } else {
            // FIM DO JOGO: Se não houver mais escolhas nem conteúdo
            setTimeout(showEndScreen, 1500);
        }

        if (!firstTime) scrollDown(previousBottomEdge);
    }

    // --- FUNÇÕES DE STATUS E HUD ---
    function updateHUD() {
        const fe = story.variablesState["fe"];
        const moral = story.variablesState["moral"];
        const alimento = story.variablesState["alimento"];
        const poder = story.variablesState["poder"];
        const pop = story.variablesState["populacao"];

        if(document.getElementById("val-fe")) document.getElementById("val-fe").innerText = fe;
        if(document.getElementById("val-moral")) document.getElementById("val-moral").innerText = moral;
        if(document.getElementById("val-alimento")) document.getElementById("val-alimento").innerText = alimento;
        if(document.getElementById("val-poder")) document.getElementById("val-poder").innerText = poder;
        
        if(document.getElementById("val-pop")) {
            document.getElementById("val-pop").innerText = pop >= 1000 ? (pop / 1000).toFixed(0) + "k" : pop;
        }
    }

    // --- TELA FINAL E GRÁFICO (Chart.js) ---
    function showEndScreen() {
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('end-screen').style.display = 'flex';

        const ctx = document.getElementById('statusChart').getContext('2d');
        new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: ['Fé', 'Moral', 'Alimento', 'Poder'],
                datasets: [{
                    data: [
                        story.variablesState["fe"],
                        story.variablesState["moral"],
                        story.variablesState["alimento"],
                        story.variablesState["poder"]
                    ],
                    backgroundColor: [
                        'rgba(241, 196, 15, 0.6)', 
                        'rgba(52, 152, 219, 0.6)', 
                        'rgba(230, 126, 34, 0.6)', 
                        'rgba(231, 76, 60, 0.6)'
                    ]
                }]
            },
            options: { responsive: true }
        });
    }

    // --- HELPERS (AUXILIARES) ---
    function splitPropertyTag(tag) {
        var propertySplitIdx = tag.indexOf(":");
        if (propertySplitIdx != -1) {
            return {
                property: tag.substr(0, propertySplitIdx).trim(),
                val: tag.substr(propertySplitIdx + 1).trim()
            };
        }
        return null;
    }

    function removeAll(selector) {
        var allElements = storyContainer.querySelectorAll(selector);
        for (var i = 0; i < allElements.length; i++) {
            allElements[i].parentNode.removeChild(allElements[i]);
        }
    }

    function showAfter(delay, el) {
        el.classList.add("hide");
        setTimeout(function() { el.classList.remove("hide") }, delay);
    }

    function contentBottomEdgeY() {
        var bottomElement = storyContainer.lastElementChild;
        return bottomElement ? bottomElement.offsetTop + bottomElement.offsetHeight : 0;
    }

    function scrollDown(previousBottomEdge) {
        var limit = outerScrollContainer.scrollHeight - outerScrollContainer.clientHeight;
        var target = previousBottomEdge > limit ? limit : previousBottomEdge;
        outerScrollContainer.scrollTo({ top: target, behavior: 'smooth' });
    }

    // Inicialização de botões do Inky original (opcional)
    if(document.getElementById("rewind")) {
        document.getElementById("rewind").addEventListener("click", () => location.reload());
    }

})(storyContent);