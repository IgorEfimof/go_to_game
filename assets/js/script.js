document.addEventListener('DOMContentLoaded', function() {
    console.log('--- DOM Content Loaded. Starting Script Execution ---');

    const games = [5, 6, 7, 8, 9, 10];
    const fields = games.flatMap(g => [`g${g}P1`, `g${g}P2`]);
    const inputElements = fields.map(id => {
        const el = document.getElementById(id);
        if (!el) console.error(`Element with ID '${id}' not found!`);
        return el;
    }).filter(el => el !== null);

    const mainContentBlock = document.getElementById('main-content-block');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error'); // Правильно ссылается на errorDiv

    const keyboardContainer = document.getElementById('custom-keyboard-container');
    const keyboard = document.getElementById('custom-keyboard');
    let activeInput = null;
    const clearDataBtn = document.getElementById('clearDataBtn');
    
    const aiPredictionBlock = document.getElementById('ai-prediction-block');
    const predictedWinnerNumber = document.getElementById('predicted-winner-number');
    const predictedReason = document.getElementById('predicted-reason');
    const newCalculationBtn = document.getElementById('newCalculationBtn');

    // --- INITIAL VISIBILITY SETUP ---
    // Убедимся, что основной блок виден при загрузке, а AI-блок скрыт
    if (mainContentBlock) {
        mainContentBlock.style.display = 'block'; // Или 'flex' если он flex-контейнер
        mainContentBlock.classList.remove('hidden');
        mainContentBlock.classList.add('visible'); // Убедимся, что visible класс есть
        console.log('mainContentBlock set to visible on load.');
    } else {
        console.error('mainContentBlock not found!');
    }

    if (aiPredictionBlock) {
        aiPredictionBlock.style.display = 'none'; // Полностью скрыт по умолчанию
        aiPredictionBlock.classList.remove('visible');
        aiPredictionBlock.classList.add('hidden'); // Убедимся, что hidden класс есть
        console.log('aiPredictionBlock set to hidden on load.');
    } else {
        console.error('aiPredictionBlock not found!');
    }

    if (resultDiv) {
        resultDiv.classList.remove('visible'); // Скрываем результаты при старте
        console.log('resultDiv hidden on load.');
    } else {
        console.error('resultDiv not found!');
    }

    if (errorDiv) {
        errorDiv.classList.remove('visible'); // Скрываем ошибки при старте
        console.log('errorDiv hidden on load.');
    } else {
        console.error('errorDiv not found!');
    }

    // --- Keyboard Logic ---
    function showKeyboard(input) {
        console.log('showKeyboard called for input:', input.id);
        if (activeInput === input && keyboardContainer.classList.contains('show')) {
            console.log('Keyboard already visible for this input. Skipping.');
            return;
        }

        activeInput = input;
        if (input) {
            input.setSelectionRange(input.value.length, input.value.length);
        }
        
        // Убедимся, что основной блок виден и блок прогноза скрыт
        if (mainContentBlock) {
            mainContentBlock.style.display = 'block'; // или 'flex'
            mainContentBlock.classList.remove('hidden');
            mainContentBlock.classList.add('visible');
            console.log('showKeyboard: mainContentBlock set to visible.');
        }

        if (aiPredictionBlock) {
            aiPredictionBlock.classList.remove('visible');
            aiPredictionBlock.classList.add('hidden');
            aiPredictionBlock.style.display = 'none';
            console.log('showKeyboard: aiPredictionBlock set to hidden.');
        }

        if (resultDiv) {
            resultDiv.classList.remove('visible');
            console.log('showKeyboard: resultDiv hidden.');
        }
        if (errorDiv) {
            errorDiv.classList.remove('visible');
            errorText.textContent = '';
            console.log('showKeyboard: errorDiv hidden.');
        }

        if (keyboardContainer) {
            keyboardContainer.style.display = 'flex';
            setTimeout(() => {
                keyboardContainer.classList.add('show');
                console.log('showKeyboard: Keyboard container shown.');
            }, 50);
        } else {
            console.error('keyboardContainer not found!');
        }
    }

    function hideKeyboardAndProcessData() {
        console.log('hideKeyboardAndProcessData called.');
        
        if (activeInput) {
            activeInput.blur(); 
            activeInput = null;
            console.log('hideKeyboardAndProcessData: Active input blurred.');
        }

        if (keyboardContainer) {
            keyboardContainer.classList.remove('show');
            keyboardContainer.addEventListener('transitionend', function handler() {
                keyboardContainer.style.display = 'none';
                keyboardContainer.removeEventListener('transitionend', handler);
                console.log('hideKeyboardAndProcessData: Keyboard container fully hidden after transition.');
                
                // После скрытия клавиатуры, сначала вызываем calculateWinner
                const calculationData = calculateWinner(true); // Передаем true, чтобы показать resultDiv
                console.log('hideKeyboardAndProcessData: calculateWinner called, data:', calculationData);
                
                // Если расчеты прошли успешно (или есть что показать)
                if (calculationData) {
                    // Задержка перед показом AI-блока, чтобы resultDiv успел отобразиться
                    setTimeout(() => {
                         displayAiPrediction(calculationData);
                         console.log('hideKeyboardAndProcessData: displayAiPrediction called.');
                    }, 300); // Небольшая задержка
                } else {
                    console.log('Calculation data not available (null), AI prediction skipped.');
                }

            }, { once: true });
        } else {
            console.error('keyboardContainer not found for hideKeyboardAndProcessData!');
            // Если клавиатура не найдена, все равно пытаемся выполнить расчет
            const calculationData = calculateWinner(true);
            if (calculationData) {
                displayAiPrediction(calculationData);
            }
        }
    }

    // Обработчики событий для полей ввода
    inputElements.forEach((input) => {
        if (input) {
            input.addEventListener('focus', function(e) {
                console.log(`Input ${this.id} focused.`);
                showKeyboard(this);
            });

            input.addEventListener('touchstart', function(e) {
                console.log(`Input ${this.id} touchstarted.`);
                e.preventDefault();
                if (document.activeElement !== this) {
                    this.focus();
                }
            }, { passive: false });

            input.addEventListener('input', function(e) {
                console.log(`Input ${this.id} value changed to: ${this.value}`);
                let val = this.value.replace(/[^\d.]/g, '');
                const parts = val.split('.');
                if (parts.length > 2) {
                    val = parts[0] + '.' + parts.slice(1).join('');
                }
                if (parts[0].length > 1 && !val.includes('.')) {
                    val = parts[0].substring(0,1) + '.' + parts[0].substring(1);
                    if (val.length > this.maxLength) {
                         val = val.substring(0, this.maxLength);
                    }
                }
                if (val.length > this.maxLength) {
                    val = val.substring(0, this.maxLength);
                }
                this.value = val;

                if (this.value.length === this.maxLength && !this.value.endsWith('.')) {
                    const currentIndex = inputElements.indexOf(this);
                    if (currentIndex !== -1 && currentIndex < inputElements.length - 1) {
                        console.log(`Auto-advancing from ${this.id} to ${inputElements[currentIndex + 1].id}`);
                        setTimeout(() => {
                            inputElements[currentIndex + 1].focus();
                        }, 50);
                    } else if (currentIndex === inputElements.length - 1) {
                        console.log(`Last input ${this.id} filled. Hiding keyboard and processing data.`);
                        hideKeyboardAndProcessData();
                    }
                }
            });
        }
    });

    // Обработчик кликов по кнопкам клавиатуры
    if (keyboard) {
        keyboard.addEventListener('click', function(e) {
            e.preventDefault();
            const button = e.target.closest('button');
            if (!button) return;

            if (!activeInput) {
                console.warn('No active input during keyboard click.');
                const firstEmptyInput = inputElements.find(input => input.value === '');
                if (firstEmptyInput) {
                    showKeyboard(firstEmptyInput);
                    console.log('Attempting to focus on first empty input:', firstEmptyInput.id);
                } else {
                    console.log('No empty inputs found. Keyboard click ignored.');
                    return; 
                }
            }

            const key = button.dataset.key;
            console.log('Keyboard button pressed:', key, 'for active input:', activeInput ? activeInput.id : 'N/A');
            let currentValue = activeInput.value;

            if (key === 'delete') {
                activeInput.value = currentValue.slice(0, -1);
            } else if (key === '.') {
                if (!currentValue.includes('.')) {
                    if (currentValue === '') {
                        activeInput.value = '1.';
                    } else {
                        activeInput.value += '.';
                    }
                }
            } else if (currentValue.length < activeInput.maxLength) {
                if (currentValue === '1.' && key === '0' && activeInput.maxLength === 4) {
                     activeInput.value = '1.0';
                } else if (currentValue.length === 1 && !currentValue.includes('.') && activeInput.maxLength === 4) {
                    activeInput.value = currentValue + '.' + key;
                } else {
                    activeInput.value += key;
                }
            }

            const event = new Event('input', { bubbles: true });
            activeInput.dispatchEvent(event);
            console.log('Input event dispatched for:', activeInput.id);
        });
    } else {
        console.error('Keyboard element not found!');
    }

    // --- Функция очистки данных (с возвратом к форме ввода) ---
    function clearAllData() {
        console.log('Clearing all data...');
        inputElements.forEach(input => {
            if (input) {
                input.value = '';
                input.classList.remove('is-invalid');
            }
        });

        if (resultDiv) resultDiv.classList.remove('visible');
        if (errorDiv) {
            errorDiv.classList.remove('visible');
            errorText.textContent = '';
        }

        // Показываем основной блок и скрываем AI-прогноз
        if (aiPredictionBlock) {
            aiPredictionBlock.classList.remove('visible');
            aiPredictionBlock.classList.add('hidden');
            aiPredictionBlock.style.display = 'none';
        }

        if (mainContentBlock) {
            mainContentBlock.classList.remove('hidden');
            mainContentBlock.classList.add('visible');
            mainContentBlock.style.display = 'block'; // или 'flex'
        }
        
        if (inputElements.length > 0) {
            inputElements[0].focus();
            showKeyboard(inputElements[0]);
            console.log('clearAllData: Focused on first input and showing keyboard.');
        } else {
            console.warn('No input elements found to focus on after clearAllData.');
        }
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
        console.log('clearDataBtn event listener attached.');
    } else {
        console.error('clearDataBtn not found!');
    }

    if (newCalculationBtn) {
        newCalculationBtn.addEventListener('click', clearAllData);
        console.log('newCalculationBtn event listener attached.');
    } else {
        console.error('newCalculationBtn not found!');
    }

    // --- Main Calculation Function ---
    function calculateWinner(forceShowResultDiv = false) {
        console.log('calculateWinner called with forceShowResultDiv:', forceShowResultDiv);
        let player1Coeffs = [];
        let player2Coeffs = [];
        let allCoeffsValid = true;
        let lastFilledGameIndex = -1;

        for (let i = 0; i < games.length; i++) {
            const gameNumber = games[i];
            const p1Input = document.getElementById(`g${gameNumber}P1`);
            const p2Input = document.getElementById(`g${gameNumber}P2`);

            if (p1Input && p2Input) {
                const p1Val = parseFloat(p1Input.value);
                const p2Val = parseFloat(p2Input.value);

                const isP1Valid = !isNaN(p1Val) && p1Val >= 1.00 && p1Val <= 10.00;
                const isP2Valid = !isNaN(p2Val) && p2Val >= 1.00 && p2Val <= 10.00;

                if (p1Input.value.length > 0 && !isP1Valid) {
                    p1Input.classList.add('is-invalid');
                    allCoeffsValid = false;
                    console.warn(`Validation failed for ${p1Input.id}: ${p1Input.value}`);
                } else {
                    p1Input.classList.remove('is-invalid');
                }

                if (p2Input.value.length > 0 && !isP2Valid) {
                    p2Input.classList.add('is-invalid');
                    allCoeffsValid = false;
                    console.warn(`Validation failed for ${p2Input.id}: ${p2Input.value}`);
                } else {
                    p2Input.classList.remove('is-invalid');
                }

                player1Coeffs.push(isP1Valid ? p1Val : NaN);
                player2Coeffs.push(isP2Valid ? p2Val : NaN);

                if (p1Input.value.length > 0 || p2Input.value.length > 0) {
                    lastFilledGameIndex = i;
                }
            } else {
                console.warn(`Input elements g${gameNumber}P1 or g${gameNumber}P2 not found in calculateWinner.`);
            }
        }

        const hasMinimumInput = (inputElements[0] && inputElements[0].value.length > 0 && !isNaN(parseFloat(inputElements[0].value))) && 
                                (inputElements[1] && inputElements[1].value.length > 0 && !isNaN(parseFloat(inputElements[1].value)));
        
        console.log(`Validation result: allCoeffsValid=${allCoeffsValid}, hasMinimumInput=${hasMinimumInput}`);

        if (!allCoeffsValid || !hasMinimumInput) {
            if (errorText && errorDiv && resultDiv) {
                errorText.textContent = 'Проверьте формат коэффициентов (например, 1.85). Значения должны быть от 1.00 до 10.00. Необходимо заполнить минимум гейм 5.';
                errorDiv.classList.add('visible');
                resultDiv.classList.remove('visible');
                console.log('calculateWinner: Validation failed, error message displayed.');
            }
            return {
                player1Coeffs: [], player2Coeffs: [], totalDecimalPlayer1: 0, totalDecimalPlayer2: 0,
                totalDecreaseSpreadP1: 0, totalIncreaseSpreadP1: 0, totalDecreaseSpreadP2: 0, totalIncreaseSpreadP2: 0,
                p1ConfidencePercent: 0, p2ConfidencePercent: 0, player1SmallestDecimalWins: 0, player2SmallestDecimalWins: 0,
                filledGamesCount: 0, lastFilledGameIndex: -1,
                hasError: true
            };
        }

        if (errorText && errorDiv) {
            errorText.textContent = '';
            errorDiv.classList.remove('visible');
            console.log('calculateWinner: No validation errors, error message hidden.');
        }

        if (resultDiv) {
            if (forceShowResultDiv) {
                resultDiv.classList.add('visible');
                console.log('calculateWinner: resultDiv forced to be visible.');
            } else {
                resultDiv.classList.remove('visible');
                console.log('calculateWinner: resultDiv hidden (not forced).');
            }
        }

        // --- Расчеты (без изменений) ---
        let totalDecimalPlayer1 = 0;
        let totalDecimalPlayer2 = 0;
        let totalDecreaseSpreadP1 = 0;
        let totalIncreaseSpreadP1 = 0;
        let totalDecreaseSpreadP2 = 0;
        let totalIncreaseSpreadP2 = 0;
        let filledGamesCount = 0;

        for (let i = 0; i <= lastFilledGameIndex; i++) {
            const p1Current = player1Coeffs[i];
            const p2Current = player2Coeffs[i];

            if (!isNaN(p1Current) && !isNaN(p2Current)) {
                totalDecimalPlayer1 += (p1Current - Math.floor(p1Current));
                totalDecimalPlayer2 += (p2Current - Math.floor(p2Current));
                filledGamesCount++;

                if (i > 0) {
                    const p1Previous = player1Coeffs[i - 1];
                    const p2Previous = player2Coeffs[i - 1];

                    if (!isNaN(p1Previous) && !isNaN(p1Current)) {
                        const spreadP1 = p1Previous - p1Current;
                        if (spreadP1 > 0) { totalDecreaseSpreadP1 += spreadP1; }
                        else if (spreadP1 < 0) { totalIncreaseSpreadP1 += Math.abs(spreadP1); }
                    }
                    if (!isNaN(p2Previous) && !isNaN(p2Current)) {
                        const spreadP2 = p2Previous - p2Current;
                        if (spreadP2 > 0) { totalDecreaseSpreadP2 += spreadP2; }
                        else if (spreadP2 < 0) { totalIncreaseSpreadP2 += Math.abs(spreadP2); }
                    }
                }
            }
        }
        
        let overallWinnerDecimalSumMessage;
        let decimalSumVerdictMessage;
        let advantageDecimal = Math.abs(totalDecimalPlayer1 - totalDecimalPlayer2);

        if (document.getElementById('player1_sum')) document.getElementById('player1_sum').textContent = `Сумма дес. частей (И1): ${totalDecimalPlayer1.toFixed(4)}`;
        if (document.getElementById('player2_sum')) document.getElementById('player2_sum').textContent = `Сумма дес. частей (И2): ${totalDecimalPlayer2.toFixed(4)}`;
        
        if (totalDecimalPlayer1 < totalDecimalPlayer2) {
            overallWinnerDecimalSumMessage = `<span class="text-success-custom">Победитель: **Игрок 1**</span>`;
            decimalSumVerdictMessage = `Преимущество Игрока 1 по дес. частям: ${advantageDecimal.toFixed(4)}`;
        } else if (totalDecimalPlayer2 < totalDecimalPlayer1) {
            overallWinnerDecimalSumMessage = `<span class="text-success-custom">Победитель: **Игрок 2**</span>`;
            decimalSumVerdictMessage = `Преимущество Игрока 2 по дес. частям: ${advantageDecimal.toFixed(4)}`;
        } else {
            overallWinnerDecimalSumMessage = `<span class="text-info-custom">Вероятно трость</span>`;
            decimalSumVerdictMessage = "Разница десятичных частей = 0";
        }
        if (document.getElementById('overall_winner_decimal_sum')) document.getElementById('overall_winner_decimal_sum').innerHTML = overallWinnerDecimalSumMessage;
        if (document.getElementById('decimal_sum_verdict')) document.getElementById('decimal_sum_verdict').innerHTML = decimalSumVerdictMessage;

        let p1Uncertainty = 0;
        let p1ConfidencePercent = 0;
        if ((totalDecreaseSpreadP1 + totalIncreaseSpreadP1) > 0) { p1Uncertainty = (totalIncreaseSpreadP1 / (totalDecreaseSpreadP1 + totalIncreaseSpreadP1)) * 100; p1ConfidencePercent = 100 - p1Uncertainty; }
        let p1SpreadDetails = `Игрок 1: Снижение Кф. <span class="text-success-custom">↓${totalDecreaseSpreadP1.toFixed(4)}</span> | Увеличение Кф. <span class="text-danger-custom">↑${totalIncreaseSpreadP1.toFixed(4)}</span> | Уверенность: **${p1ConfidencePercent.toFixed(2)}%**`;

        let p2Uncertainty = 0;
        let p2ConfidencePercent = 0;
        if ((totalDecreaseSpreadP2 + totalIncreaseSpreadP2) > 0) { p2Uncertainty = (totalIncreaseSpreadP2 / (totalDecreaseSpreadP2 + totalIncreaseSpreadP2)) * 100; p2ConfidencePercent = 100 - p2Uncertainty; }
        let p2SpreadDetails = `Игрок 2: Снижение Кф. <span class="text-success-custom">↓${totalDecreaseSpreadP2.toFixed(4)}</span> | Увеличение Кф. <span class="text-danger-custom">↑${totalIncreaseSpreadP2.toFixed(4)}</span> | Уверенность: **${p2ConfidencePercent.toFixed(2)}%**`;

        let spreadVerdictMessage = "Вердикт по разбегу: ";
        let p1HasHigherChances = p1ConfidencePercent >= 75 && totalDecreaseSpreadP1 > totalIncreaseSpreadP1;
        let p2HasHigherChances = p2ConfidencePercent >= 75 && totalDecreaseSpreadP2 > totalIncreaseSpreadP2;

        if (filledGamesCount < 2) { spreadVerdictMessage += `<span class="text-warning-custom">Недостаточно данных (требуется мин. 2 гейма)</span>`; }
        else if (p1HasHigherChances && !p2HasHigherChances) { spreadVerdictMessage += `<span class="text-success-custom">**Игрок 1** имеет выше шансы.</span>`; }
        else if (!p1HasHigherChances && p2HasHigherChances) { spreadVerdictMessage += `<span class="text-success-custom">**Игрок 2** имеет выше шансы.</span>`; }
        else if (p1HasHigherChances && p2HasHigherChances) {
            if (p1ConfidencePercent > p2ConfidencePercent) { spreadVerdictMessage += `<span class="text-info-custom">Оба игрока сильны, но у **Игрока 1** более выражена уверенность.</span>`; }
            else if (p2ConfidencePercent > p1ConfidencePercent) { spreadVerdictMessage += `<span class="text-info-custom">Оба игрока сильны, но у **Игрока 2** более выражена уверенность.</span>`; }
            else { spreadVerdictMessage += `<span class="text-info-custom">Оба игрока **сильны** (одинаковая уверенность).</span>`; }
        } else {
            if (totalIncreaseSpreadP1 > 0 || totalIncreaseSpreadP2 > 0) { spreadVerdictMessage += `<span class="text-danger-custom">Неопределённо (преобладание повышения Кф. или нейтрально).</span>`; }
            else { spreadVerdictMessage += `<span class="text-warning-custom">Неопределённо (нет значимых движений Кф.).</span>`; }
        }
        if (document.getElementById('p1_spread_summary')) document.getElementById('p1_spread_summary').innerHTML = p1SpreadDetails;
        if (document.getElementById('p2_spread_summary')) document.getElementById('p2_spread_summary').innerHTML = p2SpreadDetails;
        if (document.getElementById('overall_winner_spread_analysis')) document.getElementById('overall_winner_spread_analysis').innerHTML = spreadVerdictMessage;

        let lastGameSpreadDynamicMessage = '';
        if (lastFilledGameIndex > 0) {
            const p1Last = player1Coeffs[lastFilledGameIndex];
            const p2Last = player2Coeffs[lastFilledGameIndex];
            const p1Prev = player1Coeffs[lastFilledGameIndex - 1];
            const p2Prev = player2Coeffs[lastFilledGameIndex - 1];

            if (!isNaN(p1Last) && !isNaN(p2Last) && !isNaN(p1Prev) && !isNaN(p2Prev)) {
                const spreadP1Last = p1Prev - p1Last;
                const spreadP2Last = p2Prev - p2Last;

                let p1ChangeText = ''; let p2ChangeText = ''; let p1Class = ''; let p2Class = '';
                if (spreadP1Last > 0) { p1ChangeText = `снизился на ${spreadP1Last.toFixed(2)}`; p1Class = 'text-success-custom'; }
                else if (spreadP1Last < 0) { p1ChangeText = `вырос на ${Math.abs(spreadP1Last).toFixed(2)}`; p1Class = 'text-danger-custom'; }
                else { p1ChangeText = `не изменился`; p1Class = 'text-info-custom'; }
                if (spreadP2Last > 0) { p2ChangeText = `снизился на ${spreadP2Last.toFixed(2)}`; p2Class = 'text-success-custom'; }
                else if (spreadP2Last < 0) { p2ChangeText = `вырос на ${Math.abs(spreadP2Last).toFixed(2)}`; p2Class = 'text-danger-custom'; }
                else { p2ChangeText = `не изменился`; p2Class = 'text-info-custom'; }

                lastGameSpreadDynamicMessage = `<br><strong>Динамика посл. гейма (Г${games[lastFilledGameIndex]}):</strong><br>`;
                lastGameSpreadDynamicMessage += `И1: <span class="${p1Class}">Кф. ${p1ChangeText}.</span><br>`;
                lastGameSpreadDynamicMessage += `И2: <span class="${p2Class}">Кф. ${p2ChangeText}.</span>`;
            }
        }
        if (document.getElementById('last_game_spread_dynamic')) document.getElementById('last_game_spread_dynamic').innerHTML = lastGameSpreadDynamicMessage;


        let player1SmallestDecimalWins = 0;
        let player2SmallestDecimalWins = 0;
        let comparisonCount = 0;

        for (let i = 0; i <= lastFilledGameIndex; i++) {
            const p1Current = player1Coeffs[i];
            const p2Current = player2Coeffs[i];

            if (!isNaN(p1Current) && !isNaN(p2Current)) {
                const decimalP1 = Math.round((p1Current % 1) * 100);
                const decimalP2 = Math.round((p2Current % 1) * 100);

                if (decimalP1 < decimalP2) { player1SmallestDecimalWins++; }
                else if (decimalP2 < decimalP1) { player2SmallestDecimalWins++; }
                comparisonCount++;
            }
        }

        let smallestDecimalWinnerMessage = "Вероятный победитель (меньшая дес. часть): ";
        let smallestDecimalWinnerClass = 'text-info-custom';

        if (comparisonCount === 0) { smallestDecimalWinnerMessage += `<span class="text-warning-custom">Недостаточно данных (нет пар Кф. для сравнения)</span>`; smallestDecimalWinnerClass = 'text-warning-custom'; }
        else if (player1SmallestDecimalWins > player2SmallestDecimalWins) { smallestDecimalWinnerMessage += `<span class="text-success-custom">**Игрок 1** (${player1SmallestDecimalWins} против ${player2SmallestDecimalWins})</span>`; smallestDecimalWinnerClass = 'text-success-custom'; }
        else if (player2SmallestDecimalWins > player1SmallestDecimalWins) { smallestDecimalWinnerMessage += `<span class="text-success-custom">**Игрок 2** (${player2SmallestDecimalWins} против ${player1SmallestDecimalWins})</span>`; smallestDecimalWinnerClass = 'text-success-custom'; }
        else { smallestDecimalWinnerMessage += `<span class="text-info-custom">Ничья (равное количество меньших дес. частей)</span>`; smallestDecimalWinnerClass = 'text-info-custom'; }

        if (document.getElementById('overall_winner_smallest_decimal')) {
            document.getElementById('overall_winner_smallest_decimal').innerHTML = smallestDecimalWinnerMessage;
            document.getElementById('overall_winner_smallest_decimal').className = `text-center ${smallestDecimalWinnerClass}`;
        }


        return {
            player1Coeffs, player2Coeffs, totalDecimalPlayer1, totalDecimalPlayer2,
            totalDecreaseSpreadP1, totalIncreaseSpreadP1, totalDecreaseSpreadP2, totalIncreaseSpreadP2,
            p1ConfidencePercent, p2ConfidencePercent, player1SmallestDecimalWins, player2SmallestDecimalWins,
            filledGamesCount, lastFilledGameIndex, hasError: false, comparisonCount // Добавил comparisonCount
        };
    }

    // --- AI Prediction Logic ---
    function getAiPrediction(data) {
        console.log('getAiPrediction called with data:', data);
        if (data.hasError) {
            return { winner: 'Н/Д', reason: 'Некорректные или недостаточные данные для прогноза.' };
        }

        let player1Score = 0;
        let player2Score = 0;
        let reason = [];

        const minGamesForSpread = 2;

        // 1. Оценка по сумме десятичных частей
        if (data.totalDecimalPlayer1 < data.totalDecimalPlayer2) {
            player1Score += 2;
            reason.push(`Игрок 1 лидирует по сумме десятичных частей (${data.totalDecimalPlayer1.toFixed(2)} vs ${data.totalDecimalPlayer2.toFixed(2)}).`);
        } else if (data.totalDecimalPlayer2 < data.totalDecimalPlayer1) {
            player2Score += 2;
            reason.push(`Игрок 2 лидирует по сумме десятичных частей (${data.totalDecimalPlayer2.toFixed(2)} vs ${data.totalDecimalPlayer1.toFixed(2)}).`);
        } else if (data.totalDecimalPlayer1 > 0 || data.filledGamesCount > 0) {
            reason.push(`Равенство по сумме десятичных частей.`);
        }


        // 2. Оценка по разбегу коэффициентов
        if (data.filledGamesCount >= minGamesForSpread) {
            if (data.p1ConfidencePercent >= 75 && data.totalDecreaseSpreadP1 > data.totalIncreaseSpreadP1) {
                player1Score += 3;
                reason.push(`Игрок 1 показывает высокую уверенность по динамике Кф. (${data.p1ConfidencePercent.toFixed(1)}%).`);
            }
            if (data.p2ConfidencePercent >= 75 && data.totalDecreaseSpreadP2 > data.totalIncreaseSpreadP2) {
                player2Score += 3;
                reason.push(`Игрок 2 показывает высокую уверенность по динамике Кф. (${data.p2ConfidencePercent.toFixed(1)}%).`);
            }
            if (data.p1ConfidencePercent >= 75 && data.p2ConfidencePercent >= 75) {
                if (data.p1ConfidencePercent > data.p2ConfidencePercent + 5) {
                    player1Score += 1;
                    reason.push(`Игрок 1 сильнее в динамике Кф. при равной силе.`);
                } else if (data.p2ConfidencePercent > data.p1ConfidencePercent + 5) {
                    player2Score += 1;
                    reason.push(`Игрок 2 сильнее в динамике Кф. при равной силе.`);
                }
            }
        } else {
            reason.push('Недостаточно данных для полного анализа разбега коэффициентов (нужно минимум 2 гейма).');
        }

        // 3. Оценка по наименьшей десятичной части в геймах
        if (data.player1SmallestDecimalWins > data.player2SmallestDecimalWins) {
            player1Score += 1;
            reason.push(`Игрок 1 чаще имеет меньшую десятичную часть (${data.player1SmallestDecimalWins} vs ${data.player2SmallestDecimalWins} геймов).`);
        } else if (data.player2SmallestDecimalWins > data.player1SmallestDecimalWins) {
            player2Score += 1;
            reason.push(`Игрок 2 чаще имеет меньшую десятичную часть (${data.player2SmallestDecimalWins} vs ${data.player1SmallestDecimalWins} геймов).`);
        } else if (data.comparisonCount > 0) {
            reason.push(`Равенство по количеству меньших десятичных частей.`);
        }


        let finalWinner = null;
        let finalReason = "Прогноз затруднен.";

        const confidenceThreshold = 3;

        if (player1Score - player2Score >= confidenceThreshold) {
            finalWinner = 1;
            finalReason = "Игрок 1 демонстрирует значительное преимущество по ключевым метрикам. " + reason.join(' ');
        } else if (player2Score - player1Score >= confidenceThreshold) {
            finalWinner = 2;
            finalReason = "Игрок 2 демонстрирует значительное преимущество по ключевым метрикам. " + reason.join(' ');
        } else if (player1Score > player2Score) {
             finalWinner = 1;
             finalReason = "Игрок 1 имеет небольшое преимущество. " + reason.join(' ');
        } else if (player2Score > player1Score) {
             finalWinner = 2;
             finalReason = "Игрок 2 имеет небольшое преимущество. " + reason.join(' ');
        } else {
            finalWinner = 'Н/Д';
            finalReason = "Недостаточно явных признаков для определения победителя или ничья. " + reason.join(' ');
        }

        return { winner: finalWinner, reason: finalReason };
    }

    function displayAiPrediction(calculationData) {
        console.log('displayAiPrediction called with calculationData:', calculationData);
        const prediction = getAiPrediction(calculationData);

        if (predictedWinnerNumber) predictedWinnerNumber.textContent = prediction.winner;
        if (predictedReason) predictedReason.textContent = prediction.reason;

        if (predictedWinnerNumber) {
            predictedWinnerNumber.classList.remove('player2', 'text-warning-custom');
            if (prediction.winner === 2) {
                predictedWinnerNumber.classList.add('player2');
            } else if (prediction.winner === 'Н/Д') {
                 predictedWinnerNumber.classList.add('text-warning-custom');
            }
        }

        // Скрываем основной блок и показываем блок прогноза
        if (mainContentBlock) {
            mainContentBlock.classList.remove('visible');
            mainContentBlock.classList.add('hidden');
            // Переключение display только после transitionend, чтобы анимация сработала
            // mainContentBlock.style.display = 'none'; // Удалено отсюда, чтобы анимация успела отработать
            console.log('displayAiPrediction: mainContentBlock set to hidden class.');
            
            mainContentBlock.addEventListener('transitionend', function handler() {
                mainContentBlock.removeEventListener('transitionend', handler);
                mainContentBlock.style.display = 'none'; // Теперь можно полностью скрыть
                console.log('displayAiPrediction: mainContentBlock display: none after transition.');

                if (aiPredictionBlock) {
                    aiPredictionBlock.style.display = 'flex'; // Показываем как flex-контейнер
                    setTimeout(() => {
                        aiPredictionBlock.classList.remove('hidden');
                        aiPredictionBlock.classList.add('visible'); // Запускаем анимацию показа
                        console.log('displayAiPrediction: aiPredictionBlock set to visible.');
                    }, 50); // Небольшая задержка для плавности
                } else {
                    console.error('aiPredictionBlock not found in displayAiPrediction!');
                }
            }, { once: true });
        } else {
            console.error('mainContentBlock not found in displayAiPrediction!');
            // Если mainContentBlock не найден, пытаемся показать aiPredictionBlock напрямую
            if (aiPredictionBlock) {
                aiPredictionBlock.style.display = 'flex';
                aiPredictionBlock.classList.remove('hidden');
                aiPredictionBlock.classList.add('visible');
            }
        }
    }

    // Инициализируем расчет при загрузке страницы, чтобы показать начальные сообщения (ошибки)
    // Но не показываем resultDiv сразу, т.к. поля пустые.
    calculateWinner(false);
    console.log('Initial calculateWinner called.');

    // Присваиваем фокус первому полю при загрузке
    if (inputElements.length > 0) {
        inputElements[0].focus();
        console.log('Focused on first input element on load.');
    } else {
        console.warn('No input elements found on load to focus on.');
    }

    console.log('--- Script Execution Finished Setup ---');
});
