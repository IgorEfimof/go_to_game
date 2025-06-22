document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded. Initializing script.');

    const games = [5, 6, 7, 8, 9, 10];
    const fields = games.flatMap(g => [`g${g}P1`, `g${g}P2`]);
    const inputElements = fields.map(id => document.getElementById(id)).filter(el => el !== null);

    const mainContentBlock = document.getElementById('main-content-block');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error');

    const keyboardContainer = document.getElementById('custom-keyboard-container');
    const keyboard = document.getElementById('custom-keyboard');
    let activeInput = null;
    const clearDataBtn = document.getElementById('clearDataBtn');
    
    const aiPredictionBlock = document.getElementById('ai-prediction-block');
    const predictedWinnerNumber = document.getElementById('predicted-winner-number');
    const predictedReason = document.getElementById('predicted-reason');
    const newCalculationBtn = document.getElementById('newCalculationBtn');

    // --- Keyboard Logic ---
    function showKeyboard(input) {
        console.log('showKeyboard called for input:', input.id);
        if (activeInput === input && keyboardContainer.classList.contains('show')) {
            return;
        }

        activeInput = input;
        input.setSelectionRange(input.value.length, input.value.length);
        
        // Убедимся, что основной блок виден
        mainContentBlock.classList.remove('hidden');
        mainContentBlock.classList.add('visible');
        
        // Скрываем AI-блок при показе клавиатуры/формы
        aiPredictionBlock.classList.remove('visible');
        aiPredictionBlock.style.display = 'none';

        // Скрываем обычные результаты и ошибки, чтобы они не мешали вводу
        resultDiv.classList.remove('visible');
        errorDiv.classList.remove('visible');
        errorText.textContent = ''; // Очищаем текст ошибки

        // Показываем клавиатуру
        keyboardContainer.style.display = 'flex';
        setTimeout(() => {
            keyboardContainer.classList.add('show');
        }, 50);
    }

    function hideKeyboardAndProcessData() {
        console.log('hideKeyboardAndProcessData called.');
        
        if (activeInput) {
            activeInput.blur(); 
            activeInput = null;
        }

        keyboardContainer.classList.remove('show');
        keyboardContainer.addEventListener('transitionend', function handler() {
            keyboardContainer.style.display = 'none';
            keyboardContainer.removeEventListener('transitionend', handler);
            
            // После скрытия клавиатуры, сначала вызываем calculateWinner
            const calculationData = calculateWinner(true); // Передаем true, чтобы показать resultDiv
            
            // Если расчеты прошли успешно (или есть что показать)
            if (calculationData) {
                // Затем показываем AI-прогноз
                displayAiPrediction(calculationData);
            } else {
                // Если calculateWinner() не смог получить данные (например, из-за невалидных данных),
                // то оставляем основной блок как есть, возможно, с сообщением об ошибке.
                // В этом случае AI-прогноз не будет показан.
                console.log('Calculation data not available, AI prediction skipped.');
            }

        }, { once: true });
    }

    // Обработчики событий для полей ввода
    inputElements.forEach((input) => {
        if (input) {
            input.addEventListener('focus', function(e) {
                showKeyboard(this);
            });

            input.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (document.activeElement !== this) {
                    this.focus();
                }
            }, { passive: false });

            input.addEventListener('input', function(e) {
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

                // Автоматический переход или завершение
                if (this.value.length === this.maxLength && !this.value.endsWith('.')) {
                    const currentIndex = inputElements.indexOf(this);
                    if (currentIndex !== -1 && currentIndex < inputElements.length - 1) {
                        setTimeout(() => {
                            inputElements[currentIndex + 1].focus();
                        }, 50);
                    } else if (currentIndex === inputElements.length - 1) {
                        // Если это последнее поле и оно заполнено, скрываем клавиатуру
                        // и инициируем процесс отображения прогноза
                        hideKeyboardAndProcessData();
                    }
                }
            });
        }
    });

    // Обработчик кликов по кнопкам клавиатуры
    keyboard.addEventListener('click', function(e) {
        e.preventDefault();
        const button = e.target.closest('button');
        if (!button) return;

        if (!activeInput) {
            const firstEmptyInput = inputElements.find(input => input.value === '');
            if (firstEmptyInput) {
                showKeyboard(firstEmptyInput);
            } else {
                return; 
            }
        }

        const key = button.dataset.key;
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
                // Если введено 1 цифра (например, '1') и нет точки, и макс длина 4 (т.е. 1.00), то вставляем '1.' + новую цифру
                activeInput.value = currentValue + '.' + key;
            } else {
                activeInput.value += key;
            }
        }

        const event = new Event('input', { bubbles: true });
        activeInput.dispatchEvent(event);
    });

    // --- Функция очистки данных (с возвратом к форме ввода) ---
    function clearAllData() {
        console.log('Clearing all data...');
        inputElements.forEach(input => {
            input.value = '';
            input.classList.remove('is-invalid');
        });

        resultDiv.classList.remove('visible');
        errorDiv.classList.remove('visible');
        errorText.textContent = '';

        // Показываем основной блок и скрываем AI-прогноз
        aiPredictionBlock.classList.remove('visible');
        aiPredictionBlock.style.display = 'none';

        mainContentBlock.classList.remove('hidden');
        mainContentBlock.classList.add('visible');
        
        if (inputElements.length > 0) {
            inputElements[0].focus();
            showKeyboard(inputElements[0]);
        }
        // Не вызываем calculateWinner() здесь, так как поля пустые
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }

    if (newCalculationBtn) {
        newCalculationBtn.addEventListener('click', clearAllData);
    }

    // --- Main Calculation Function ---
    // Добавлен параметр `forceShowResultDiv`
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
                } else {
                    p1Input.classList.remove('is-invalid');
                }

                if (p2Input.value.length > 0 && !isP2Valid) {
                    p2Input.classList.add('is-invalid');
                    allCoeffsValid = false;
                } else {
                    p2Input.classList.remove('is-invalid');
                }

                player1Coeffs.push(isP1Valid ? p1Val : NaN);
                player2Coeffs.push(isP2Valid ? p2Val : NaN);

                if (p1Input.value.length > 0 || p2Input.value.length > 0) {
                    lastFilledGameIndex = i;
                }
            }
        }

        const hasMinimumInput = (inputElements[0] && inputElements[0].value.length > 0 && !isNaN(parseFloat(inputElements[0].value))) && 
                                (inputElements[1] && inputElements[1].value.length > 0 && !isNaN(parseFloat(inputElements[1].value)));

        if (!allCoeffsValid || !hasMinimumInput) {
            errorText.textContent = 'Проверьте формат коэффициентов (например, 1.85). Значения должны быть от 1.00 до 10.00. Необходимо заполнить минимум гейм 5.';
            errorDiv.classList.add('visible');
            resultDiv.classList.remove('visible');
            // В случае ошибки возвращаем объект с минимальными данными, чтобы AI мог сказать "Н/Д"
            return {
                player1Coeffs: [], player2Coeffs: [], totalDecimalPlayer1: 0, totalDecimalPlayer2: 0,
                totalDecreaseSpreadP1: 0, totalIncreaseSpreadP1: 0, totalDecreaseSpreadP2: 0, totalIncreaseSpreadP2: 0,
                p1ConfidencePercent: 0, p2ConfidencePercent: 0, player1SmallestDecimalWins: 0, player2SmallestDecimalWins: 0,
                filledGamesCount: 0, lastFilledGameIndex: -1,
                hasError: true // Добавляем флаг ошибки
            };
        }

        errorText.textContent = '';
        errorDiv.classList.remove('visible');

        // Показываем resultDiv, если forceShowResultDiv = true
        if (forceShowResultDiv) {
            resultDiv.classList.add('visible');
        } else {
            resultDiv.classList.remove('visible');
        }

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
                        if (spreadP1 > 0) {
                            totalDecreaseSpreadP1 += spreadP1;
                        } else if (spreadP1 < 0) {
                            totalIncreaseSpreadP1 += Math.abs(spreadP1);
                        }
                    }

                    if (!isNaN(p2Previous) && !isNaN(p2Current)) {
                        const spreadP2 = p2Previous - p2Current;
                        if (spreadP2 > 0) {
                            totalDecreaseSpreadP2 += spreadP2;
                        } else if (spreadP2 < 0) {
                            totalIncreaseSpreadP2 += Math.abs(spreadP2);
                        }
                    }
                }
            }
        }

        let overallWinnerDecimalSumMessage;
        let decimalSumVerdictMessage;
        let advantageDecimal = Math.abs(totalDecimalPlayer1 - totalDecimalPlayer2);

        document.getElementById('player1_sum').textContent = `Сумма дес. частей (И1): ${totalDecimalPlayer1.toFixed(4)}`;
        document.getElementById('player2_sum').textContent = `Сумма дес. частей (И2): ${totalDecimalPlayer2.toFixed(4)}`;

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
        document.getElementById('overall_winner_decimal_sum').innerHTML = overallWinnerDecimalSumMessage;
        document.getElementById('decimal_sum_verdict').innerHTML = decimalSumVerdictMessage;

        let p1Uncertainty = 0;
        let p1ConfidencePercent = 0;
        if ((totalDecreaseSpreadP1 + totalIncreaseSpreadP1) > 0) {
             p1Uncertainty = (totalIncreaseSpreadP1 / (totalDecreaseSpreadP1 + totalIncreaseSpreadP1)) * 100;
             p1ConfidencePercent = 100 - p1Uncertainty;
        }
        let p1SpreadDetails = `Игрок 1: Снижение Кф. <span class="text-success-custom">↓${totalDecreaseSpreadP1.toFixed(4)}</span> | Увеличение Кф. <span class="text-danger-custom">↑${totalIncreaseSpreadP1.toFixed(4)}</span> | Уверенность: **${p1ConfidencePercent.toFixed(2)}%**`;

        let p2Uncertainty = 0;
        let p2ConfidencePercent = 0;
        if ((totalDecreaseSpreadP2 + totalIncreaseSpreadP2) > 0) {
            p2Uncertainty = (totalIncreaseSpreadP2 / (totalDecreaseSpreadP2 + totalIncreaseSpreadP2)) * 100;
            p2ConfidencePercent = 100 - p2Uncertainty;
        }
        let p2SpreadDetails = `Игрок 2: Снижение Кф. <span class="text-success-custom">↓${totalDecreaseSpreadP2.toFixed(4)}</span> | Увеличение Кф. <span class="text-danger-custom">↑${totalIncreaseSpreadP2.toFixed(4)}</span> | Уверенность: **${p2ConfidencePercent.toFixed(2)}%**`;

        let spreadVerdictMessage = "Вердикт по разбегу: ";

        let p1HasHigherChances = p1ConfidencePercent >= 75 && totalDecreaseSpreadP1 > totalIncreaseSpreadP1;
        let p2HasHigherChances = p2ConfidencePercent >= 75 && totalDecreaseSpreadP2 > totalIncreaseSpreadP2;

        if (filledGamesCount < 2) {
            spreadVerdictMessage += `<span class="text-warning-custom">Недостаточно данных (требуется мин. 2 гейма)</span>`;
        } else if (p1HasHigherChances && !p2HasHigherChances) {
            spreadVerdictMessage += `<span class="text-success-custom">**Игрок 1** имеет выше шансы.</span>`;
        } else if (!p1HasHigherChances && p2HasHigherChances) {
            spreadVerdictMessage += `<span class="text-success-custom">**Игрок 2** имеет выше шансы.</span>`;
        } else if (p1HasHigherChances && p2HasHigherChances) {
            if (p1ConfidencePercent > p2ConfidencePercent) {
                spreadVerdictMessage += `<span class="text-info-custom">Оба игрока сильны, но у **Игрока 1** более выражена уверенность.</span>`;
            } else if (p2ConfidencePercent > p1ConfidencePercent) {
                spreadVerdictMessage += `<span class="text-info-custom">Оба игрока сильны, но у **Игрока 2** более выражена уверенность.</span>`;
            } else {
                spreadVerdictMessage += `<span class="text-info-custom">Оба игрока **сильны** (одинаковая уверенность).</span>`;
            }
        } else {
            if (totalIncreaseSpreadP1 > 0 || totalIncreaseSpreadP2 > 0) {
                spreadVerdictMessage += `<span class="text-danger-custom">Неопределённо (преобладание повышения Кф. или нейтрально).</span>`;
            } else {
                spreadVerdictMessage += `<span class="text-warning-custom">Неопределённо (нет значимых движений Кф.).</span>`;
            }
        }

        document.getElementById('p1_spread_summary').innerHTML = p1SpreadDetails;
        document.getElementById('p2_spread_summary').innerHTML = p2SpreadDetails;
        document.getElementById('overall_winner_spread_analysis').innerHTML = spreadVerdictMessage;

        let lastGameSpreadDynamicMessage = '';
        if (lastFilledGameIndex > 0) {
            const p1Last = player1Coeffs[lastFilledGameIndex];
            const p2Last = player2Coeffs[lastFilledGameIndex];
            const p1Prev = player1Coeffs[lastFilledGameIndex - 1];
            const p2Prev = player2Coeffs[lastFilledGameIndex - 1];

            if (!isNaN(p1Last) && !isNaN(p2Last) && !isNaN(p1Prev) && !isNaN(p2Prev)) {
                const spreadP1Last = p1Prev - p1Last;
                const spreadP2Last = p2Prev - p2Last;

                let p1ChangeText = '';
                let p2ChangeText = '';
                let p1Class = '';
                let p2Class = '';

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
        document.getElementById('last_game_spread_dynamic').innerHTML = lastGameSpreadDynamicMessage;


        let player1SmallestDecimalWins = 0;
        let player2SmallestDecimalWins = 0;
        let comparisonCount = 0;

        for (let i = 0; i <= lastFilledGameIndex; i++) {
            const p1Current = player1Coeffs[i];
            const p2Current = player2Coeffs[i];

            if (!isNaN(p1Current) && !isNaN(p2Current)) {
                const decimalP1 = Math.round((p1Current % 1) * 100);
                const decimalP2 = Math.round((p2Current % 1) * 100);

                if (decimalP1 < decimalP2) {
                    player1SmallestDecimalWins++;
                } else if (decimalP2 < decimalP1) {
                    player2SmallestDecimalWins++;
                }
                comparisonCount++;
            }
        }

        let smallestDecimalWinnerMessage = "Вероятный победитель (меньшая дес. часть): ";
        let smallestDecimalWinnerClass = 'text-info-custom';

        if (comparisonCount === 0) {
            smallestDecimalWinnerMessage += `<span class="text-warning-custom">Недостаточно данных (нет пар Кф. для сравнения)</span>`;
            smallestDecimalWinnerClass = 'text-warning-custom';
        } else if (player1SmallestDecimalWins > player2SmallestDecimalWins) {
            smallestDecimalWinnerMessage += `<span class="text-success-custom">**Игрок 1** (${player1SmallestDecimalWins} против ${player2SmallestDecimalWins})</span>`;
            smallestDecimalWinnerClass = 'text-success-custom';
        } else if (player2SmallestDecimalWins > player1SmallestDecimalWins) {
            smallestDecimalWinnerMessage += `<span class="text-success-custom">**Игрок 2** (${player2SmallestDecimalWins} против ${player1SmallestDecimalWins})</span>`;
            smallestDecimalWinnerClass = 'text-success-custom';
        } else {
            smallestDecimalWinnerMessage += `<span class="text-info-custom">Ничья (равное количество меньших дес. частей)</span>`;
            smallestDecimalWinnerClass = 'text-info-custom';
        }

        document.getElementById('overall_winner_smallest_decimal').innerHTML = smallestDecimalWinnerMessage;
        document.getElementById('overall_winner_smallest_decimal').className = `text-center ${smallestDecimalWinnerClass}`;

        return {
            player1Coeffs, player2Coeffs, totalDecimalPlayer1, totalDecimalPlayer2,
            totalDecreaseSpreadP1, totalIncreaseSpreadP1, totalDecreaseSpreadP2, totalIncreaseSpreadP2,
            p1ConfidencePercent, p2ConfidencePercent, player1SmallestDecimalWins, player2SmallestDecimalWins,
            filledGamesCount, lastFilledGameIndex, hasError: false
        };
    }

    // --- AI Prediction Logic ---
    // Теперь принимает calculationData напрямую
    function getAiPrediction(data) {
        // Если calculateWinner() уже обнаружил ошибку, возвращаем соответствующий прогноз
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
        } else if (data.totalDecimalPlayer1 > 0 || data.filledGamesCount > 0) { // Если были данные и равенство
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

    // Теперь принимает calculationData как аргумент
    function displayAiPrediction(calculationData) {
        const prediction = getAiPrediction(calculationData); // Передаем данные

        predictedWinnerNumber.textContent = prediction.winner;
        predictedReason.textContent = prediction.reason;

        predictedWinnerNumber.classList.remove('player2', 'text-warning-custom');
        if (prediction.winner === 2) {
            predictedWinnerNumber.classList.add('player2');
        } else if (prediction.winner === 'Н/Д') {
             predictedWinnerNumber.classList.add('text-warning-custom');
        }

        // Скрываем основной блок
        mainContentBlock.classList.remove('visible');
        mainContentBlock.classList.add('hidden');
        
        // Ждем завершения анимации скрытия, прежде чем показать новый блок
        mainContentBlock.addEventListener('transitionend', function handler() {
            mainContentBlock.removeEventListener('transitionend', handler);
            aiPredictionBlock.style.display = 'flex';
            setTimeout(() => {
                aiPredictionBlock.classList.add('visible');
            }, 50);
        }, { once: true });
    }

    // Инициализируем расчет при загрузке страницы, чтобы показать начальные сообщения
    // Теперь передаем false, чтобы resultDiv не показывался сразу при загрузке
    // Он будет показан только после завершения ввода или принудительно через hideKeyboardAndProcessData
    calculateWinner(false);

    // Присваиваем фокус первому полю при загрузке
    if (inputElements.length > 0) {
        inputElements[0].focus();
    }
});
