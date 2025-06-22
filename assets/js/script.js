document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded. Initializing script.');

    const games = [5, 6, 7, 8, 9, 10];
    const fields = games.flatMap(g => [`g${g}P1`, `g${g}P2`]);
    const inputElements = fields.map(id => document.getElementById(id)).filter(el => el !== null);

    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const errorText = document.getElementById('error'); 

    const keyboardContainer = document.getElementById('custom-keyboard-container');
    const keyboard = document.getElementById('custom-keyboard');
    let activeInput = null;
    const clearDataBtn = document.getElementById('clearDataBtn'); // НОВАЯ КОНСТАНТА ДЛЯ КНОПКИ ОЧИСТИТЬ

    // Функция для блокировки нативной клавиатуры (осталась для контроля)
    function preventNativeKeyboard(e) {
        if (e.relatedTarget && e.relatedTarget.tagName === 'BUTTON') {
             return;
        }
    }

    // --- Keyboard Logic ---
    function showKeyboard(input) {
        console.log('showKeyboard called for input:', input.id);
        if (activeInput === input && keyboardContainer.classList.contains('show')) {
            return;
        }

        activeInput = input;
        
        input.blur(); 
        setTimeout(() => {
            input.focus(); 
            input.setSelectionRange(input.value.length, input.value.length); 
            keyboardContainer.style.display = 'flex'; 
            setTimeout(() => {
                keyboardContainer.classList.add('show'); 
            }, 50); 
        }, 50); 

        resultDiv.classList.remove('visible');
        errorDiv.classList.remove('visible');
    }

    function hideKeyboard() {
        console.log('hideKeyboard called.');
        keyboardContainer.classList.remove('show');
        keyboardContainer.addEventListener('transitionend', function handler() {
            keyboardContainer.style.display = 'none';
            keyboardContainer.removeEventListener('transitionend', handler);
            activeInput = null; 
        }, { once: true }); 
        
        calculateWinner(); 
    }

    // Обработчики событий для полей ввода
    inputElements.forEach((input, index) => {
        if (input) {
            input.addEventListener('focus', function(e) {
                console.log('Input focused:', this.id, 'from event:', e.type);
                showKeyboard(this);
            });

            input.addEventListener('touchstart', function(e) {
                console.log('Input touchstarted:', this.id);
                e.preventDefault(); 
                if (document.activeElement !== this) {
                    this.focus(); 
                }
            }, { passive: false }); 

            input.addEventListener('blur', function(e) {
                console.log('Input blurred:', this.id, 'relatedTarget:', e.relatedTarget ? e.relatedTarget.tagName : 'none');
                // Логика скрытия клавиатуры здесь не меняется, она скрывается при нажатии на последнюю кнопку или когда последнее поле заполнено
            });

            input.addEventListener('input', function(e) {
                console.log('Input value changed:', this.id, this.value);
                let val = this.value.replace(/[^\d]/g, ''); 
                if (val.length === 3) {
                    val = val.substring(0, 1) + '.' + val.substring(1, 3);
                } else if (val.length > 3) {
                    val = val.substring(0, 1) + '.' + val.substring(1, 3);
                }
                this.value = val;

                // Автоматический переход к следующему полю, если текущее заполнено
                if (this.value.length === this.maxLength) {
                    const currentIndex = inputElements.indexOf(this);
                    if (currentIndex !== -1 && currentIndex < inputElements.length - 1) {
                        setTimeout(() => {
                            inputElements[currentIndex + 1].focus();
                        }, 100); 
                    } else if (currentIndex === inputElements.length - 1) {
                        // Если это последнее поле, скрываем клавиатуру
                        this.blur(); 
                        hideKeyboard();
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
            console.warn('No active input, keyboard button click ignored.');
            return;
        }

        const key = button.dataset.key;
        console.log('Keyboard button pressed:', key);

        if (key === 'delete') {
            activeInput.value = activeInput.value.slice(0, -1);
        } else if (key === '.') {
            if (!activeInput.value.includes('.')) {
                if (activeInput.value === '') {
                    activeInput.value = '1.';
                } else {
                    activeInput.value += '.';
                }
            }
        } else if (key === '0') {
            if (activeInput.value.length < activeInput.maxLength) {
                activeInput.value += key;
            }
        }
        // Логика для кнопки 'next' была удалена
        else { // Числовые кнопки (1-9)
            if (activeInput.value.length < activeInput.maxLength) {
                activeInput.value += key;
            }
        }
        
        const event = new Event('input', { bubbles: true });
        activeInput.dispatchEvent(event);
    });

    // --- Новая функция очистки данных ---
    function clearAllData() {
        console.log('Clearing all data...');
        // Очищаем все поля ввода
        inputElements.forEach(input => {
            input.value = '';
            input.classList.remove('is-invalid');
        });

        // Скрываем блоки результата и ошибки
        resultDiv.classList.remove('visible');
        errorDiv.classList.remove('visible');
        errorText.textContent = ''; // Очищаем текст ошибки

        // Возвращаем фокус на первое поле (опционально)
        if (inputElements.length > 0) {
            inputElements[0].focus();
        }
        
        // Пересчитываем, чтобы обновить состояние после очистки (покажет начальное сообщение)
        calculateWinner(); 
    }

    // Обработчик события для кнопки "Очистить"
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }

    // --- Main Calculation Function (unchanged) ---
    function calculateWinner() {
        console.log('calculateWinner called.');
        let player1Coeffs = [];
        let player2Coeffs = [];
        let allCoeffsValid = true;

        for (let i = 5; i <= 10; i++) {
            const p1Input = document.getElementById(`g${i}P1`);
            const p2Input = document.getElementById(`g${i}P2`);

            if (p1Input && p2Input) {
                const p1Val = parseFloat(p1Input.value);
                const p2Val = parseFloat(p2Input.value);

                if (!isNaN(p1Val) && p1Val >= 1.00 && p1Val <= 10.00) { 
                    player1Coeffs.push(p1Val);
                    p1Input.classList.remove('is-invalid');
                } else if (p1Input.value.length > 0) {
                    p1Input.classList.add('is-invalid');
                    allCoeffsValid = false;
                } else {
                    player1Coeffs.push(NaN);
                    p1Input.classList.remove('is-invalid');
                }

                if (!isNaN(p2Val) && p2Val >= 1.00 && p2Val <= 10.00) {
                    player2Coeffs.push(p2Val);
                    p2Input.classList.remove('is-invalid');
                } else if (p2Input.value.length > 0) {
                    p2Input.classList.add('is-invalid');
                    allCoeffsValid = false;
                } else {
                    player2Coeffs.push(NaN);
                    p2Input.classList.remove('is-invalid');
                }
            }
        }

        const hasMinimumInput = !isNaN(player1Coeffs[0]) && !isNaN(player2Coeffs[0]);

        if (!allCoeffsValid) {
            errorText.textContent = 'Проверьте формат коэффициентов (например, 1.85).';
            errorDiv.classList.add('visible');
            resultDiv.classList.remove('visible'); 
            return;
        }

        if (!hasMinimumInput) {
            errorText.textContent = 'Заполните коэффициенты для Гейма 5, чтобы начать расчет.';
            errorDiv.classList.add('visible');
            resultDiv.classList.remove('visible'); 
            return;
        }
        
        errorText.textContent = ''; 
        errorDiv.classList.remove('visible'); 
        
        // Показываем результат только если клавиатура не активна
        // Или если она активна, но пользователь нажал на последнее поле и оно заполнилось
        if (!keyboardContainer.classList.contains('show')) {
            resultDiv.classList.add('visible'); 
        }

        let totalDecimalPlayer1 = 0;
        let totalDecimalPlayer2 = 0;
        
        let totalDecreaseSpreadP1 = 0;
        let totalIncreaseSpreadP1 = 0;
        let totalDecreaseSpreadP2 = 0;
        let totalIncreaseSpreadP2 = 0;

        for (let i = 0; i < games.length; i++) {
            const p1Current = player1Coeffs[i];
            const p2Current = player2Coeffs[i];

            if (!isNaN(p1Current)) {
                totalDecimalPlayer1 += (p1Current - Math.floor(p1Current));
            }
            if (!isNaN(p2Current)) {
                totalDecimalPlayer2 += (p2Current - Math.floor(p2Current));
            }

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
        
        let overallWinnerDecimalSumMessage;
        let advantageDecimal = Math.abs(totalDecimalPlayer1 - totalDecimalPlayer2);

        if (totalDecimalPlayer1 < totalDecimalPlayer2) {
            overallWinnerDecimalSumMessage = `Победитель: **Игрок 1** (преимущество ${advantageDecimal.toFixed(4)})`;
        } else if (totalDecimalPlayer2 < totalDecimalPlayer1) {
            overallWinnerDecimalSumMessage = `Победитель: **Игрок 2** (преимущество ${advantageDecimal.toFixed(4)})`;
        } else {
            overallWinnerDecimalSumMessage = "Вероятно трость (разница дес. частей = 0)";
        }

        let p1Uncertainty = 0;
        if ((totalDecreaseSpreadP1 + totalIncreaseSpreadP1) > 0) {
             p1Uncertainty = (totalIncreaseSpreadP1 / (totalDecreaseSpreadP1 + totalIncreaseSpreadP1)) * 100;
        }
        let p1SpreadDetails = `Игрок 1: Снижение Кф. **↓${totalDecreaseSpreadP1.toFixed(4)}** | Уверенность **${(100 - p1Uncertainty).toFixed(2)}%**`;
        
        let p2Uncertainty = 0;
        if ((totalDecreaseSpreadP2 + totalIncreaseSpreadP2) > 0) {
            p2Uncertainty = (totalIncreaseSpreadP2 / (totalDecreaseSpreadP2 + totalIncreaseSpreadP2)) * 100;
        }
        let p2SpreadDetails = `Игрок 2: Снижение Кф. **↓${totalDecreaseSpreadP2.toFixed(4)}** | Уверенность **${(100 - p2Uncertainty).toFixed(2)}%**`;

        let spreadVerdictMessage = "Вердикт по разбегу: ";

        let p1HasHigherChances = (totalDecreaseSpreadP1 > 0) && (totalDecreaseSpreadP1 > totalIncreaseSpreadP1);
        let p2HasHigherChances = (totalDecreaseSpreadP2 > 0) && (totalDecreaseSpreadP2 > totalIncreaseSpreadP2);

        const anySpreadMovement = (totalDecreaseSpreadP1 + totalIncreaseSpreadP1 + totalDecreaseSpreadP2 + totalIncreaseSpreadP2) > 0;

        if (!anySpreadMovement) {
            spreadVerdictMessage += "Недостаточно данных (нет изменений Кф.)";
        } else if (p1HasHigherChances && !p2HasHigherChances) {
            spreadVerdictMessage += "**Игрок 1** имеет выше шансы.";
        } else if (!p1HasHigherChances && p2HasHigherChances) {
            spreadVerdictMessage += "**Игрок 2** имеет выше шансы.";
        } else if (p1HasHigherChances && p2HasHigherChances) {
            if (totalDecreaseSpreadP1 > totalDecreaseSpreadP2) {
                spreadVerdictMessage += "Оба игрока сильны, но у **Игрока 1** более выражено снижение Кф.";
            } else if (totalDecreaseSpreadP2 > totalDecreaseSpreadP1) {
                spreadVerdictMessage += "Оба игрока сильны, но у **Игрока 2** более выражено снижение Кф.";
            } else {
                spreadVerdictMessage += "Оба игрока **сильны** (одинаковое преобладание снижения Кф.)";
            }
        } else {
            if (totalIncreaseSpreadP1 > 0 || totalIncreaseSpreadP2 > 0) { 
                spreadVerdictMessage += "Неопределённо (преобладание повышения Кф. или нейтрально)";
            } else {
                 spreadVerdictMessage += "Неопределённо";
            }
        }

        let player1SmallestDecimalWins = 0;
        let player2SmallestDecimalWins = 0;
        let comparisonCount = 0;

        for (let i = 0; i < games.length; i++) {
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

        if (comparisonCount === 0) {
            smallestDecimalWinnerMessage += "Недостаточно данных (нет пар Кф. для сравнения)";
        } else if (player1SmallestDecimalWins > player2SmallestDecimalWins) {
            smallestDecimalWinnerMessage += `**Игрок 1** (${player1SmallestDecimalWins} против ${player2SmallestDecimalWins})`;
        } else if (player2SmallestDecimalWins > player1SmallestDecimalWins) {
            smallestDecimalWinnerMessage += `**Игрок 2** (${player2SmallestDecimalWins} против ${player1SmallestDecimalWins})`;
        } else {
            smallestDecimalWinnerMessage += "Ничья (равное количество меньших дес. частей)";
        }

        document.getElementById('player1_sum').textContent = `Сумма дес. частей (И1): ${totalDecimalPlayer1.toFixed(4)}`;
        document.getElementById('player2_sum').textContent = `Сумма дес. частей (И2): ${totalDecimalPlayer2.toFixed(4)}`;
        document.getElementById('overall_winner_decimal_sum').innerHTML = overallWinnerDecimalSumMessage;
        
        document.getElementById('p1_spread_summary').innerHTML = p1SpreadDetails;
        document.getElementById('p2_spread_summary').innerHTML = p2SpreadDetails;
        document.getElementById('overall_winner_spread_analysis').innerHTML = spreadVerdictMessage;

        document.getElementById('overall_winner_smallest_decimal').innerHTML = smallestDecimalWinnerMessage;
    }

    calculateWinner();
});
