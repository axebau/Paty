class TabuGame {
    constructor() {
        this.cards = [];
        this.shuffledCardIndices = []; // Lista aleatoria de índices de cartas
        this.currentCardIndex = 0; // Puntero al índice actual en la lista aleatoria
        this.currentCard = null;
        this.nextCard = null;
        this.playedCards = [];
        this.gameState = 'initial';
        this.timer = null;
        this.timeLeft = 0;
        this.counters = {
            correct: 0,
            pass: 0,
            total: 0
        };
        this.maxPasses = 30;
        this.isMobile = window.innerWidth <= 768;
        
        this.initializeElements();
        this.bindEvents();
        this.showLoading();
        this.loadCards();
        
        // Detectar cambios de orientación/tamaño
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
        });
    }

    initializeElements() {
        this.elements = {
            timer: document.getElementById('timer'),
            initialScreen: document.getElementById('initial-screen'),
            gameArea: document.getElementById('game-area'),
            reviewArea: document.getElementById('review-area'),
            
            start60: document.getElementById('start-60'),
            start120: document.getElementById('start-120'),
            pauseBtn: document.getElementById('pause-btn'),
            
            currentCard: document.getElementById('current-card'),
            nextCard: document.getElementById('next-card'),
            cardWord: document.getElementById('card-word'),
            cardForbidden: document.getElementById('card-forbidden'),
            
            correctBtn: document.getElementById('correct-btn'),
            passBtn: document.getElementById('pass-btn'),
            errorBtn: document.getElementById('error-btn'),
            
            discardedCardsDesktop: document.getElementById('discarded-cards-desktop'),
            discardedCardsMobile: document.getElementById('discarded-cards-mobile'),
            reviewSummary: document.getElementById('review-summary'),
            reviewTitle: document.getElementById('review-title'),
            
            newRound60: document.getElementById('new-round-60'),
            newRound120: document.getElementById('new-round-120'),
            
            // Elementos para mapa y reglas
            showMap: document.getElementById('show-map'),
            showRules: document.getElementById('show-rules'),
            mapScreen: document.getElementById('map-screen'),
            rulesScreen: document.getElementById('rules-screen'),
            closeMap: document.getElementById('close-map'),
            closeRules: document.getElementById('close-rules'),
            downloadMapBtn: document.getElementById('download-map-btn'),
            
            errorOverlay: document.getElementById('error-overlay'),
            errorText: document.getElementById('error-text'),
            errorClose: document.getElementById('error-close'),
            
            gameErrorAnimation: document.getElementById('game-error-animation'),
            gameTimeAnimation: document.getElementById('game-time-animation'),
            loadingOverlay: document.getElementById('loading-overlay')
        };
        
        // Verificar elementos críticos
        const criticalElements = ['gameErrorAnimation', 'gameTimeAnimation', 'errorBtn', 'gameArea', 'reviewArea'];
        criticalElements.forEach(elementKey => {
            if (!this.elements[elementKey]) {
                console.error(`❌ Elemento crítico no encontrado: ${elementKey}`);
            } else {
                console.log(`✅ Elemento encontrado: ${elementKey}`);
            }
        });
    }

    // Método para obtener el contenedor de cartas descartadas apropiado
    getDiscardedCardsContainer() {
        return this.isMobile ? this.elements.discardedCardsMobile : this.elements.discardedCardsDesktop;
    }

    bindEvents() {
        this.elements.start60.addEventListener('click', () => this.startRound(60));
        this.elements.start120.addEventListener('click', () => this.startRound(120));
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        
        this.elements.correctBtn.addEventListener('click', () => this.handleAction('correct'));
        this.elements.passBtn.addEventListener('click', () => this.handleAction('pass'));
        this.elements.errorBtn.addEventListener('click', () => this.handleAction('error'));
        
        this.elements.newRound60.addEventListener('click', () => this.startRound(60));
        this.elements.newRound120.addEventListener('click', () => this.startRound(120));
        
        // Event listeners para mapa y reglas
        this.elements.showMap.addEventListener('click', () => this.showMapScreen());
        this.elements.showRules.addEventListener('click', () => this.showRulesScreen());
        this.elements.closeMap.addEventListener('click', () => this.hideMapScreen());
        this.elements.closeRules.addEventListener('click', () => this.hideRulesScreen());
        
        // Event listener para descargar mapa
        this.elements.downloadMapBtn.addEventListener('click', () => this.downloadMap());
        
        // Cerrar mapa y reglas al hacer click fuera
        this.elements.mapScreen.addEventListener('click', (e) => {
            if (e.target === this.elements.mapScreen) {
                this.hideMapScreen();
            }
        });
        
        this.elements.rulesScreen.addEventListener('click', (e) => {
            if (e.target === this.elements.rulesScreen) {
                this.hideRulesScreen();
            }
        });
        
        this.elements.errorClose.addEventListener('click', () => this.hideError());
        this.elements.errorOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.errorOverlay) {
                this.hideError();
            }
        });

        document.addEventListener('keydown', (e) => {
            // Si hay una pantalla modal abierta, manejar ESC
            if (this.elements.mapScreen.classList.contains('active') || 
                this.elements.rulesScreen.classList.contains('active')) {
                if (e.code === 'Escape') {
                    e.preventDefault();
                    this.hideMapScreen();
                    this.hideRulesScreen();
                }
                return;
            }
            
            if (this.gameState === 'playing') {
                switch(e.code) {
                    case 'KeyX':
                    case 'Escape':
                        e.preventDefault();
                        this.handleAction('error');
                        break;
                    case 'KeyC':
                    case 'Enter':
                        e.preventDefault();
                        this.handleAction('correct');
                        break;
                    case 'KeyP':
                    case 'ArrowRight':
                        e.preventDefault();
                        if (this.counters.pass < this.maxPasses) {
                            this.handleAction('pass');
                        }
                        break;
                    case 'Space':
                        e.preventDefault();
                        this.togglePause();
                        break;
                }
            } else if (this.elements.errorOverlay.classList.contains('active')) {
                if (e.code === 'Enter' || e.code === 'Escape') {
                    e.preventDefault();
                    this.hideError();
                }
            }
        });
    }

    // Métodos para mapa y reglas
    showMapScreen() {
        this.elements.mapScreen.classList.add('active');
        console.log('📍 Mostrando mapa del juego');
    }

    hideMapScreen() {
        this.elements.mapScreen.classList.remove('active');
        console.log('📍 Ocultando mapa del juego');
    }

    showRulesScreen() {
        this.elements.rulesScreen.classList.add('active');
        console.log('📋 Mostrando reglas del juego');
    }

    hideRulesScreen() {
        this.elements.rulesScreen.classList.remove('active');
        console.log('📋 Ocultando reglas del juego');
    }

    async downloadMap() {
        try {
            console.log('📥 Iniciando descarga del mapa...');
            
            // Deshabilitar botón y mostrar estado de carga
            const originalText = this.elements.downloadMapBtn.textContent;
            this.elements.downloadMapBtn.textContent = '⏳ Descargando...';
            this.elements.downloadMapBtn.disabled = true;
            
            // Crear un enlace temporal para forzar la descarga
            const imageUrl = 'https://raw.githubusercontent.com/PoltorProgrammer/Taboup/refs/heads/main/images/tablero_Taboup.png';
            
            // Fetch la imagen y convertirla a blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // Crear URL temporal del blob
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Crear enlace temporal y hacer click automáticamente
            const tempLink = document.createElement('a');
            tempLink.href = blobUrl;
            tempLink.download = 'tablero_taboup.png';
            tempLink.style.display = 'none';
            
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            
            // Limpiar el blob URL
            window.URL.revokeObjectURL(blobUrl);
            
            console.log('✅ Descarga completada');
            
            // Restaurar botón
            this.elements.downloadMapBtn.textContent = originalText;
            this.elements.downloadMapBtn.disabled = false;
            
        } catch (error) {
            console.error('❌ Error al descargar el mapa:', error);
            this.showError('Error al descargar el mapa. Por favor, intenta de nuevo.');
            
            // Restaurar botón en caso de error
            this.elements.downloadMapBtn.textContent = '💾 DESCARGAR MAPA';
            this.elements.downloadMapBtn.disabled = false;
        }
    }

    showLoading() {
        this.elements.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.remove('active');
    }

    async loadCards() {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const response = await fetch('./data/cartas_taboup.json');
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}: No se pudo cargar el archivo de cartas`);
            }
            
            const text = await response.text();
            this.cards = JSON.parse(text);
            
            if (!Array.isArray(this.cards) || this.cards.length === 0) {
                throw new Error('El archivo no contiene cartas válidas o está vacío');
            }
            
            for (let i = 0; i < this.cards.length; i++) {
                const card = this.cards[i];
                // Aceptar tanto "principal" como "palabra"
                const mainWord = card.principal || card.palabra;
                if (!mainWord || !Array.isArray(card.prohibidas) || card.prohibidas.length === 0) {
                    throw new Error(`Carta ${i + 1} tiene formato inválido`);
                }
                // Normalizar la estructura
                if (card.palabra && !card.principal) {
                    card.principal = card.palabra;
                }
            }
            
            console.log(`📚 Cartas cargadas: ${this.cards.map((c, i) => `${i}: ${c.principal}`).join(', ')}`);
            
            // 🎯 NUEVA FUNCIONALIDAD: Crear lista aleatoria de cartas al cargar
            // Añadir semilla de aleatoriedad basada en tiempo
            const seed = Date.now() + Math.random() * 1000;
            console.log(`🌱 Semilla de aleatoriedad: ${seed}`);
            
            this.shuffleCardIndices();
            
            this.hideLoading();
            console.log(`✓ Cargadas ${this.cards.length} cartas correctamente`);
            console.log(`🔀 Sistema de lista aleatoria inicializado - sin repeticiones hasta completar ${this.cards.length} cartas`);
            console.log(`🎮 ¡Listo para jugar!`);
            
        } catch (error) {
            this.hideLoading();
            this.showError(`Error al cargar las cartas:\n${error.message}\n\nVerifica que el archivo 'data/cartas_taboup.json' existe y tiene el formato correcto.`);
            console.error('Error loading cards:', error);
        }
    }

    // 🎯 NUEVA FUNCIONALIDAD: Crear lista aleatoria de índices de cartas
    shuffleCardIndices() {
        console.log('🔀 Iniciando barajado de cartas...');
        
        // Crear array con todos los índices de cartas [0, 1, 2, ..., n-1]
        this.shuffledCardIndices = Array.from({length: this.cards.length}, (_, i) => i);
        console.log(`📋 Lista inicial creada: [${this.shuffledCardIndices.join(', ')}]`);
        
        // Verificar que Math.random() funciona correctamente
        console.log(`🎲 Test de aleatoriedad: ${Math.random()}, ${Math.random()}, ${Math.random()}`);
        
        // Algoritmo Fisher-Yates mejorado para barajar la lista aleatoriamente
        for (let i = this.shuffledCardIndices.length - 1; i > 0; i--) {
            const randomValue = Math.random();
            const j = Math.floor(randomValue * (i + 1));
            console.log(`🔄 Intercambiando posición ${i} con ${j} (random: ${randomValue.toFixed(4)})`);
            
            // Intercambiar elementos
            const temp = this.shuffledCardIndices[i];
            this.shuffledCardIndices[i] = this.shuffledCardIndices[j];
            this.shuffledCardIndices[j] = temp;
        }
        
        // Resetear el puntero al inicio de la lista
        this.currentCardIndex = 0;
        
        console.log(`✅ Lista aleatoria final: [${this.shuffledCardIndices.join(', ')}]`);
        console.log(`🎯 Primeras 10 cartas serán: ${this.shuffledCardIndices.slice(0, 10).map(i => this.cards[i]?.principal || 'undefined').join(', ')}`);
        console.log(`🔢 Total de cartas barajadas: ${this.cards.length}`);
    }

    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.errorOverlay.classList.add('active');
    }

    hideError() {
        this.elements.errorOverlay.classList.remove('active');
    }

    startRound(seconds) {
        if (this.cards.length === 0) {
            this.showError('No se han cargado las cartas del juego.\nPor favor recarga la página.');
            return;
        }

        this.gameState = 'playing';
        this.timeLeft = seconds;
        this.resetCounters();
        this.playedCards = [];
        
        this.showGameArea();
        this.clearDiscardedCards();
        
        // Cargar las dos primeras cartas
        this.loadInitialCards();
        
        this.startTimer();
        this.updateButtons();
        
        console.log(`🎮 Iniciando ronda de ${seconds} segundos`);
    }

    resetCounters() {
        this.counters = {
            correct: 0,
            pass: 0,
            total: 0
        };
    }

    showGameArea() {
        this.elements.initialScreen.style.display = 'none';
        this.elements.reviewArea.classList.remove('active');
        
        // Resetear estilos de transición
        this.elements.gameArea.style.transition = '';
        this.elements.gameArea.style.opacity = '1';
        this.elements.reviewArea.style.transition = '';
        this.elements.reviewArea.style.opacity = '1';
        
        this.elements.gameArea.classList.add('active');
        
        document.querySelector('.header').classList.add('active');
    }

    showInitialScreen() {
        this.elements.gameArea.classList.remove('active');
        this.elements.reviewArea.classList.remove('active');
        
        // Resetear estilos de transición
        this.elements.gameArea.style.transition = '';
        this.elements.gameArea.style.opacity = '1';
        this.elements.reviewArea.style.transition = '';
        this.elements.reviewArea.style.opacity = '1';
        
        this.elements.initialScreen.style.display = 'flex';
        
        document.querySelector('.header').classList.remove('active');
    }

    showReviewScreen() {
        this.elements.gameArea.classList.remove('active');
        this.elements.reviewArea.classList.add('active');
        
        document.querySelector('.header').classList.remove('active');
        
        this.generateReviewSummary();
    }

    clearDiscardedCards() {
        const container = this.getDiscardedCardsContainer();
        if (container) {
            container.innerHTML = '';
        }
    }

    // 🎯 NUEVA FUNCIONALIDAD: Obtener siguiente carta de la lista aleatoria (sin repeticiones)
    getNextCard() {
        console.log(`🎲 Solicitando carta. Estado actual: currentCardIndex=${this.currentCardIndex}, total=${this.shuffledCardIndices.length}`);
        
        // Si hemos llegado al final de la lista, crear una nueva lista aleatoria
        if (this.currentCardIndex >= this.shuffledCardIndices.length) {
            console.log('🔄 ¡Todas las cartas han sido jugadas! Generando nueva lista aleatoria...');
            this.shuffleCardIndices();
        }
        
        // Obtener la carta en la posición actual de la lista aleatoria
        const cardIndex = this.shuffledCardIndices[this.currentCardIndex];
        const card = this.cards[cardIndex];
        
        console.log(`📍 Obteniendo carta en posición ${this.currentCardIndex} de la lista`);
        console.log(`📄 Índice de carta: ${cardIndex}, Palabra: "${card.principal}"`);
        
        // Avanzar el puntero para la próxima carta
        this.currentCardIndex++;
        
        console.log(`➡️ Puntero avanzado a posición ${this.currentCardIndex}`);
        console.log(`🔮 Próximas 3 cartas: ${this.shuffledCardIndices.slice(this.currentCardIndex, this.currentCardIndex + 3).map(i => this.cards[i]?.principal).join(', ')}`);
        
        return card;
    }

    loadInitialCards() {
        console.log('🚀 Cargando cartas iniciales para nueva ronda...');
        console.log(`📊 Estado antes de cargar: currentCardIndex=${this.currentCardIndex}, lista length=${this.shuffledCardIndices.length}`);
        
        // Cargar carta actual y siguiente usando el nuevo sistema
        this.currentCard = this.getNextCard();
        console.log(`✅ Carta actual cargada: "${this.currentCard.principal}"`);
        
        this.nextCard = this.getNextCard();
        console.log(`✅ Carta siguiente cargada: "${this.nextCard.principal}"`);
        
        this.displayCards();
        console.log('🎴 Cartas mostradas en pantalla');
    }

    loadNextCard() {
        console.log('🔄 Cargando siguiente carta...');
        console.log(`📋 Carta actual antes del cambio: "${this.currentCard.principal}"`);
        console.log(`📋 Carta siguiente antes del cambio: "${this.nextCard.principal}"`);
        
        // La carta siguiente se convierte en actual
        this.currentCard = this.nextCard;
        console.log(`➡️ Nueva carta actual: "${this.currentCard.principal}"`);
        
        // Cargar nueva carta siguiente
        this.nextCard = this.getNextCard();
        console.log(`🆕 Nueva carta siguiente: "${this.nextCard.principal}"`);
        
        this.displayCards();
        console.log('🎴 Cartas actualizadas en pantalla');
    }

    displayCards() {
        if (!this.currentCard) return;
        
        // Resetear animaciones
        this.elements.currentCard.classList.remove('slide-out');
        
        // Mostrar carta actual
        this.elements.cardWord.textContent = this.currentCard.principal;
        
        this.elements.cardForbidden.innerHTML = '';
        this.currentCard.prohibidas.forEach((word, index) => {
            const wordElement = document.createElement('div');
            wordElement.className = 'forbidden-word';
            wordElement.textContent = word;
            this.elements.cardForbidden.appendChild(wordElement);
        });

        // Mostrar preview de la siguiente carta en el fondo
        this.showNextCardPreview();
    }

    showNextCardPreview() {
        if (!this.nextCard || !this.elements.nextCard) return;
        
        // Crear estructura de la carta siguiente si no existe
        if (!this.elements.nextCard.querySelector('.next-card-preview')) {
            this.elements.nextCard.innerHTML = `
                <div class="next-card-preview">
                    <div class="next-card-word"></div>
                    <div class="next-card-separator"></div>
                    <div class="next-card-forbidden"></div>
                </div>
            `;
        }
        
        const nextWordElement = this.elements.nextCard.querySelector('.next-card-word');
        const nextForbiddenElement = this.elements.nextCard.querySelector('.next-card-forbidden');
        
        if (nextWordElement && nextForbiddenElement) {
            nextWordElement.textContent = this.nextCard.principal;
            
            nextForbiddenElement.innerHTML = '';
            this.nextCard.prohibidas.forEach((word) => {
                const wordElement = document.createElement('div');
                wordElement.className = 'next-forbidden-word';
                wordElement.textContent = word;
                nextForbiddenElement.appendChild(wordElement);
            });
        }
    }

    startTimer() {
        this.updateTimerDisplay();
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            // Detener el timer inmediatamente cuando llegue a 0
            if (this.timeLeft <= 0) {
                console.log('⏰ Tiempo llegó a 0, deteniendo timer...');
                this.stopTimer();
                this.showTimeUpAnimation();
            }
        }, 1000);
    }

    showTimeUpAnimation() {
        console.log('⏰ ¡TIEMPO AGOTADO! Ejecutando secuencia...');
        console.log('⏰ Estado del timer:', this.timer ? 'activo' : 'detenido');
        console.log('⏰ Tiempo restante:', this.timeLeft);
        
        // Cambiar estado del juego inmediatamente
        this.gameState = 'ending';
        
        // Deshabilitar botones
        this.elements.correctBtn.disabled = true;
        this.elements.passBtn.disabled = true;
        this.elements.errorBtn.disabled = true;
        
        // Mostrar animación de TIEMPO
        if (this.elements.gameTimeAnimation) {
            console.log('⏰ Mostrando animación ¡TIEMPO!...');
            this.elements.gameTimeAnimation.classList.add('active');
            
            // Verificar que la animación esté funcionando
            setTimeout(() => {
                const hasActive = this.elements.gameTimeAnimation.classList.contains('active');
                const computedStyle = window.getComputedStyle(this.elements.gameTimeAnimation);
                console.log('⏰ Animación activa:', hasActive);
                console.log('⏰ Display:', computedStyle.display);
                console.log('⏰ Z-index:', computedStyle.zIndex);
                console.log('⏰ Opacity:', computedStyle.opacity);
            }, 100);
        } else {
            console.error('⏰ ERROR: Elemento gameTimeAnimation no encontrado!');
        }
        
        // Después de 2.5 segundos, quitar animación y ir a revisión
        setTimeout(() => {
            console.log('⏰ Terminando animación de tiempo...');
            if (this.elements.gameTimeAnimation) {
                this.elements.gameTimeAnimation.classList.remove('active');
            }
            
            // Ir a pantalla de revisión
            setTimeout(() => {
                console.log('⏰ Ir a pantalla de revisión...');
                this.endRound('time');
            }, 300);
            
        }, 2500);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.stopTimer();
            this.elements.pauseBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
            this.updateButtons();
            console.log('⏸️ Juego pausado');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.startTimer();
            this.elements.pauseBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
            `;
            this.updateButtons();
            console.log('▶️ Juego reanudado');
        }
    }

    handleAction(action) {
        if (this.gameState !== 'playing') return;
        
        if (action === 'pass' && this.counters.pass >= this.maxPasses) {
            console.log('❌ No se pueden hacer más pases');
            return;
        }
        
        // Deshabilitar botones temporalmente
        this.elements.correctBtn.disabled = true;
        this.elements.passBtn.disabled = true;
        this.elements.errorBtn.disabled = true;
        
        // Registrar la carta jugada
        this.playedCards.push({
            word: this.currentCard.principal,
            forbidden: this.currentCard.prohibidas,
            action: action
        });

        if (action === 'correct') {
            this.counters.correct++;
            this.counters.total++;
        } else if (action === 'pass') {
            this.counters.pass++;
            this.counters.total++;
        }
        
        console.log(`${action.toUpperCase()}: ${this.currentCard.principal}`);
        
        // Si es error, solo mostrar animación y terminar ronda (sin descartar carta)
        if (action === 'error') {
            this.showErrorAnimation();
            // Esperar a que termine la animación de error antes de ir a revisión
            setTimeout(() => {
                this.endRound('error');
            }, 2500); // Coincidir con la duración de la animación de error
            return;
        }
        
        // Para correcto y pasar: crear carta descartada y avanzar a la siguiente carta
        this.addDiscardedCard(action);
        this.animateCardOut(() => {
            this.loadNextCard();
            setTimeout(() => {
                this.updateButtons();
            }, 100);
        });
    }

    animateCardOut(callback) {
        // Animar carta actual saliendo
        this.elements.currentCard.classList.add('slide-out');
        
        // Animar carta siguiente moviéndose hacia adelante
        if (this.elements.nextCard) {
            this.elements.nextCard.classList.add('moving-forward');
        }
        
        setTimeout(() => {
            this.elements.currentCard.classList.remove('slide-out');
            if (this.elements.nextCard) {
                this.elements.nextCard.classList.remove('moving-forward');
            }
            if (callback) callback();
        }, 800);
    }

    addDiscardedCard(action) {
        const discardedCard = document.createElement('div');
        discardedCard.className = `discarded-card ${action}`;
        
        const statusEmoji = {
            correct: '✓',
            pass: '→',
            error: '✕'
        };
        
        const forbiddenWordsHTML = this.currentCard.prohibidas
            .map(word => `<div class="discarded-forbidden-word">${word}</div>`)
            .join('');
        
        discardedCard.innerHTML = `
            <div class="discarded-card-word">${this.currentCard.principal}</div>
            <div class="discarded-card-separator"></div>
            <div class="discarded-card-forbidden">${forbiddenWordsHTML}</div>
            <div class="discarded-card-status">${statusEmoji[action]}</div>
        `;
        
        const container = this.getDiscardedCardsContainer();
        if (!container) return;
        
        // Comportamiento diferente según el dispositivo
        if (this.isMobile) {
            // En móvil: agregar al final para scroll horizontal
            container.appendChild(discardedCard);
            // Scroll automático al final en móvil
            setTimeout(() => {
                container.scrollTo({
                    left: container.scrollWidth,
                    behavior: 'smooth'
                });
            }, 100);
        } else {
            // En desktop: agregar al principio como antes
            container.insertBefore(discardedCard, container.firstChild);
            // Scroll al principio en desktop
            container.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        // Limitar número de cartas mostradas
        const maxCards = this.isMobile ? 20 : 15;
        while (container.children.length > maxCards) {
            if (this.isMobile) {
                container.removeChild(container.firstChild);
            } else {
                container.removeChild(container.lastChild);
            }
        }
    }

    updateTimerDisplay() {
        // Asegurar que no muestre números negativos
        const displayTime = Math.max(0, this.timeLeft);
        const minutes = Math.floor(displayTime / 60);
        const seconds = displayTime % 60;
        this.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.timeLeft <= 30 && this.timeLeft > 0) {
            this.elements.timer.classList.add('warning');
        } else {
            this.elements.timer.classList.remove('warning');
        }
    }

    updateButtons() {
        const isPlaying = this.gameState === 'playing';
        const canPass = this.counters.pass < this.maxPasses;
        
        this.elements.correctBtn.disabled = !isPlaying;
        this.elements.passBtn.disabled = !isPlaying || !canPass;
        this.elements.errorBtn.disabled = !isPlaying;
        this.elements.pauseBtn.disabled = this.gameState === 'initial';
        
        console.log(`Buttons update: playing=${isPlaying}, canPass=${canPass}, passes=${this.counters.pass}/${this.maxPasses}`);
    }

    showErrorAnimation() {
        this.elements.gameErrorAnimation.classList.add('active');
        
        // Quitar la animación después de que termine
        setTimeout(() => {
            this.elements.gameErrorAnimation.classList.remove('active');
        }, 2500);
    }

    endRound(reason) {
        this.stopTimer();
        this.gameState = 'review';
        
        const endMessages = {
            time: '⏰ Tiempo agotado',
            error: '❌ Ronda terminada por ERROR'
        };
        
        console.log(`🏁 ${endMessages[reason]}`);
        
        // Transición más suave con fade
        if (reason === 'error') {
            // Para error, esperar más tiempo después de la animación
            setTimeout(() => {
                this.fadeToReviewScreen();
            }, 1500);
        } else {
            // Para tiempo agotado, transición normal pero suave
            setTimeout(() => {
                this.fadeToReviewScreen();
            }, 800);
        }
    }

    fadeToReviewScreen() {
        // Crear efecto fade out en el área de juego
        this.elements.gameArea.style.transition = 'opacity 0.5s ease-out';
        this.elements.gameArea.style.opacity = '0';
        
        setTimeout(() => {
            this.showReviewScreen();
            
            // Fade in de la pantalla de revisión
            this.elements.reviewArea.style.opacity = '0';
            this.elements.reviewArea.style.transition = 'opacity 0.5s ease-in';
            
            setTimeout(() => {
                this.elements.reviewArea.style.opacity = '1';
            }, 50);
            
        }, 500);
    }

    generateReviewSummary() {
        const total = this.counters.total;
        const errorCards = this.playedCards.filter(card => card.action === 'error').length;
        const percentage = total > 0 ? Math.round((this.counters.correct / total) * 100) : 0;
        
        let endReason = '';
        let titleColor = '#f39c12';
        const lastCard = this.playedCards[this.playedCards.length - 1];
        
        if (lastCard && lastCard.action === 'error') {
            endReason = '❌ Ronda terminada por ERROR';
            titleColor = '#e74c3c';
        } else {
            endReason = '⏰ Tiempo agotado';
            titleColor = '#f39c12';
        }
        
        this.elements.reviewTitle.textContent = endReason;
        this.elements.reviewTitle.style.color = titleColor;
        
        this.elements.reviewSummary.innerHTML = `
            <div class="final-stats">
                <div class="stat-card">
                    <div class="stat-value">${this.counters.correct}</div>
                    <div class="stat-label">ACIERTOS</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${this.counters.pass}</div>
                    <div class="stat-label">PASES</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${errorCards}</div>
                    <div class="stat-label">ERRORES</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${percentage}%</div>
                    <div class="stat-label">EFECTIVIDAD</div>
                </div>
            </div>
            
            <div class="review-cards-section">
                <div class="review-cards-title">
                    📚 Cartas de esta ronda (${this.playedCards.length})
                </div>
                <div class="review-cards">
                    ${this.playedCards.map(card => {
                        const statusText = {
                            correct: 'ACERTÓ',
                            pass: 'PASÓ',
                            error: 'ERROR'
                        };
                        
                        const forbiddenHTML = card.forbidden
                            .map(word => `<div>${word}</div>`)
                            .join('');
                        
                        return `
                            <div class="review-card ${card.action}">
                                <div class="review-card-word">${card.word}</div>
                                <div class="review-card-separator"></div>
                                <div class="review-card-forbidden">${forbiddenHTML}</div>
                                <span class="review-card-status status-${card.action}">${statusText[card.action]}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    finishRound() {
        this.gameState = 'initial';
        this.elements.timer.textContent = '--:--';
        this.elements.timer.classList.remove('warning');
        this.elements.pauseBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
        `;
        this.showInitialScreen();
        console.log('🏠 Volviendo al menú principal');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Inicializando juego de Tabú...');
    new TabuGame();
});

document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});

// Mejorar el manejo del scroll para móvil
document.body.addEventListener('touchmove', function (e) {
    // Permitir scroll en elementos específicos en móvil
    if (window.innerWidth <= 768) {
        const allowScrollElements = [
            '.review-area',
            '.review-cards',
            '.discarded-cards.horizontal', // Permitir scroll horizontal en cartas descartadas móvil
            '.rules-content',
            '.map-content'
        ];
        
        let allowScroll = false;
        for (let selector of allowScrollElements) {
            if (e.target.closest(selector)) {
                allowScroll = true;
                break;
            }
        }
        
        if (!allowScroll) {
            e.preventDefault();
        }
    } else {
        // En desktop solo permitir scroll en ciertos elementos
        const allowScrollElements = [
            '.review-area',
            '.review-cards', 
            '.discarded-cards',
            '.rules-content',
            '.map-content'
        ];
        
        let allowScroll = false;
        for (let selector of allowScrollElements) {
            if (e.target.closest(selector)) {
                allowScroll = true;
                break;
            }
        }
        
        if (!allowScroll) {
            e.preventDefault();
        }
    }
}, { passive: false });
