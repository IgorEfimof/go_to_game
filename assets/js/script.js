document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('#mainForm input[type="text"]');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const customKeyboardContainer = document.getElementById('custom-keyboard-container');
    const customKeyboard = document.getElementById('custom-keyboard');
    const mainForm = document.getElementById('mainForm'); // Получаем форму
    const predictionDisplay = document.getElementById('prediction-display'); // Новый элемент для прогноза
    const predictedWinnerText = document.getElementById('predicted-winner'); // Текст победителя
    const clearButtonContainer = document.querySelector('.d-grid.gap-2.mt-3.mb-2'); // Контейнер кнопки "Очистить"

    let activeInput = null;

    // Load saved data from localStorage
    function loadData() {
        inputs.forEach(input => {
            const savedValue = localStorage.getItem(input.id);
            if (savedValue) {
                input.value = savedValue;
            }
        });
        calculateAndDisplayResults();
    }

    // Save data to localStorage
    function saveData() {
        inputs.forEach(input => {
            localStorage.setItem(input.id, input.value);
        });
    }

    // Function to calculate and display results
    function calculateAndDisplayResults() {
        let allInputsFilled = true;
        let player1TotalDecimal = 0;
        let player2TotalDecimal = 0;
        let lastGamePlayer1Coeff = null;
        let lastGamePlayer2Coeff = null;
        let p1Coeffs = [];
        let p2Coeffs = [];

        errorDiv.textContent = '';
        errorDiv.classList.remove('visible');

        inputs.forEach(input => {
            const gameNumber = input.id.substring(1, input.id.indexOf('P'));
            const playerNumber = input.id.includes('P1') ? 1 : 2;
            const value = parseFloat(input.value.replace(',', '.'));

            if (input.value === '') {
                allInputsFilled = false;
                input.classList.remove('is-invalid');
                return; // Skip empty inputs for calculation
            }

            if (isNaN(value) || value <= 0) {
                allInputsFilled = false;
                input.classList.add('is-invalid');
                errorDiv.textContent = 'Ошибка: Введите корректные коэффициенты (числа > 0).';
                errorDiv.classList.add('visible');
                return;
            } else {
                input.classList.remove('is-invalid');
            }

            const decimalPart = value - Math.floor(value);

            if (playerNumber === 1) {
                player1TotalDecimal += decimalPart;
                p1Coeffs.push(value);
            } else {
                player2TotalDecimal += decimalPart;
                p2Coeffs.push(value);
            }

            // Capture last filled game coefficients
            if (input.id === 'g10P1' && !isNaN(value)) {
                lastGamePlayer1Coeff = value;
            }
            if (input.id === 'g10P2' && !isNaN(value)) {
                lastGamePlayer2Coeff = value;
            }
        });

        if (!allInputsFilled) {
            resultDiv.classList.remove('visible');
            hidePrediction(); // Скрываем прогноз, если данные неполные
            return;
        }

        // Display results
        document.getElementById('player1_sum').textContent = `Сумма дес. частей Игрока 1: ${player1TotalDecimal.toFixed(2)}`;
        document.getElementById('player2_sum').textContent = `Сумма дес. частей Игрока 2: ${player2TotalDecimal.toFixed(2)}`;

        let overallWinnerDecimalSum = '';
        if (player1TotalDecimal < player2TotalDecimal) {
            overallWinnerDecimalSum = `Победитель по сумме дес. частей: Игрок 1`;
            document.getElementById('overall_winner_decimal_sum').classList.remove('text-danger-custom', 'text-info-custom');
            document.getElementById('overall_winner_decimal_sum').classList.add('text-success-custom');
        } else if (player2TotalDecimal < player1TotalDecimal) {
            overallWinnerDecimalSum = `Победитель по сумме дес. частей: Игрок 2`;
            document.getElementById('overall_winner_decimal_sum').classList.remove('text-success-custom', 'text-info-custom');
            document.getElementById('overall_winner_decimal_sum').classList.add('text-danger-custom');
        } else {
            overallWinnerDecimalSum = `Суммы дес. частей равны`;
            document.getElementById('overall_winner_decimal_sum').classList.remove('text-success-custom', 'text-danger-custom');
            document.getElementById('overall_winner_decimal_sum').classList.add('text-info-custom');
        }
        document.getElementById('overall_winner_decimal_sum').textContent = overallWinnerDecimalSum;

        // Spread analysis
        const calculateSpread = (coeffs) => {
            if (coeffs.length < 2) return null;
            let sumDiff = 0;
            for (let i = 1; i < coeffs.length; i++) {
                sumDiff += Math.abs(coeffs[i] - coeffs[i - 1]);
            }
            return sumDiff;
        };

        const p1Spread = calculateSpread(p1Coeffs);
        const p2Spread = calculateSpread(p2Coeffs);

        let p1SpreadSummary = p1Spread !== null ? `Разбег кф Игрока 1: ${p1Spread.toFixed(2)}` : 'Недостаточно данных для разбега Игрока 1';
        let p2SpreadSummary = p2Spread !== null ? `Разбег кф Игрока 2: ${p2Spread.toFixed(2)}` : 'Недостаточно данных для разбега Игрока 2';

        document.getElementById('p1_spread_summary').textContent = p1SpreadSummary;
        document.getElementById('p2_spread_summary').textContent = p2SpreadSummary;

        let overallWinnerSpreadAnalysis = '';
        if (p1Spread !== null && p2Spread !== null) {
            if (p1Spread < p2Spread) {
                overallWinnerSpreadAnalysis = `Вердикт по разбегу: Игрок 1 стабильнее`;
                document.getElementById('overall_winner_spread_analysis').classList.remove('text-danger-custom', 'text-info-custom');
                document.getElementById('overall_winner_spread_analysis').classList.add('text-success-custom');
            } else if (p2Spread < p1Spread) {
                overallWinnerSpreadAnalysis = `Вердикт по разбегу: Игрок 2 стабильнее`;
                document.getElementById('overall_winner_spread_analysis').classList.remove('text-success-custom', 'text-info-custom');
                document.getElementById('overall_winner_spread_analysis').classList.add('text-danger-custom');
            } else {
                overallWinnerSpreadAnalysis = `Разбег кф равен`;
                document.getElementById('overall_winner_spread_analysis').classList.remove('text-success-custom', 'text-danger-custom');
                document.getElementById('overall_winner_spread_analysis').classList.add('text-info-custom');
            }
        } else {
            overallWinnerSpreadAnalysis = `Недостаточно данных для анализа разбега`;
            document.getElementById('overall_winner_spread_analysis').classList.remove('text-success-custom', 'text-danger-custom');
            document.getElementById('overall_winner_spread_analysis').classList.add('text-info-custom');
        }
        document.getElementById('overall_winner_spread_analysis').textContent = overallWinnerSpreadAnalysis;


        // Last game spread dynamic
        let lastGameSpreadDynamic = '';
        if (lastGamePlayer1Coeff !== null && lastGamePlayer2Coeff !== null) {
            const prevG9P1 = parseFloat(localStorage.getItem('g9P1')) || 0;
            const prevG9P2 = parseFloat(localStorage.getItem('g9P2')) || 0;

            const p1Dynamic = lastGamePlayer1Coeff - prevG9P1; // Разница кф. между Г10 и Г9 для Игрока 1
            const p2Dynamic = lastGamePlayer2Coeff - prevG9P2; // Разница кф. между Г10 и Г9 для Игрока 2

            // Логика: чем больше отрицательное изменение (снижение кф.), тем сильнее позиция
            if (p1Dynamic < p2Dynamic) { // Если у P1 снижение больше (или рост меньше)
                lastGameSpreadDynamic = `Динамика последнего гейма: Игрок 1 (снижение кф)`;
                document.getElementById('last_game_spread_dynamic').classList.remove('text-danger-custom', 'text-info-custom');
                document.getElementById('last_game_spread_dynamic').classList.add('text-success-custom');
            } else if (p2Dynamic < p1Dynamic) { // Если у P2 снижение больше (или рост меньше)
                lastGameSpreadDynamic = `Динамика последнего гейма: Игрок 2 (снижение кф)`;
                document.getElementById('last_game_spread_dynamic').classList.remove('text-success-custom', 'text-info-custom');
                document.getElementById('last_game_spread_dynamic').classList.add('text-danger-custom');
            } else {
                lastGameSpreadDynamic = `Динамика последнего гейма: Кф. равны или нет существенных изменений`;
                document.getElementById('last_game_spread_dynamic').classList.remove('text-success-custom', 'text-danger-custom');
                document.getElementById('last_game_spread_dynamic').classList.add('text-info-custom');
            }
        } else {
            lastGameSpreadDynamic = `Динамика последнего гейма: Недостаточно данных (нужны Г9 и Г10)`;
            document.getElementById('last_game_spread_dynamic').classList.remove('text-success-custom', 'text-danger-custom');
            document.getElementById('last_game_spread_dynamic').classList.add('text-info-custom');
        }
        document.getElementById('last_game_spread_dynamic').textContent = lastGameSpreadDynamic;


        // Smallest decimal part overall winner
        let overallWinnerSmallestDecimal = '';
        let smallestP1Decimal = null;
        let smallestP2Decimal = null;

        p1Coeffs.forEach(c => {
            const dec = c - Math.floor(c);
            if (smallestP1Decimal === null || dec < smallestP1Decimal) {
                smallestP1Decimal = dec;
            }
        });

        p2Coeffs.forEach(c => {
            const dec = c - Math.floor(c);
            if (smallestP2Decimal === null || dec < smallestP2Decimal) {
                smallestP2Decimal = dec;
            }
        });

        if (smallestP1Decimal !== null && smallestP2Decimal !== null) {
            if (smallestP1Decimal < smallestP2Decimal) {
                overallWinnerSmallestDecimal = `Вероятный победитель (наим. дес. часть): Игрок 1`;
                document.getElementById('overall_winner_smallest_decimal').classList.remove('text-danger-custom', 'text-info-custom');
                document.getElementById('overall_winner_smallest_decimal').classList.add('text-success-custom');
            } else if (smallestP2Decimal < smallestP1Decimal) {
                overallWinnerSmallestDecimal = `Вероятный победитель (наим. дес. часть): Игрок 2`;
                document.getElementById('overall_winner_smallest_decimal').classList.remove('text-success-custom', 'text-info-custom');
                document.getElementById('overall_winner_smallest_decimal').classList.add('text-danger-custom');
            } else {
                overallWinnerSmallestDecimal = `Вероятные победители (наим. дес. часть): Равны`;
                document.getElementById('overall_winner_smallest_decimal').classList.remove('text-success-custom', 'text-danger-custom');
                document.getElementById('overall_winner_smallest_decimal').classList.add('text-info-custom');
            }
        } else {
            overallWinnerSmallestDecimal = `Вероятный победитель (наим. дес. часть): Недостаточно данных`;
            document.getElementById('overall_winner_smallest_decimal').classList.remove('text-success-custom', 'text-danger-custom');
            document.getElementById('overall_winner_smallest_decimal').classList.add('text-info-custom');
        }
        document.getElementById('overall_winner_smallest_decimal').textContent = overallWinnerSmallestDecimal;


        // AI Prediction Logic
        let aiPredictedWinner = null;
        let predictionReason = '';

        // Priority 1: Last Game Dynamic
        if (lastGamePlayer1Coeff !== null && lastGamePlayer2Coeff !== null) {
            const prevG9P1 = parseFloat(localStorage.getItem('g9P1')) || 0;
            const prevG9P2 = parseFloat(localStorage.getItem('g9P2')) || 0;
            const p1DynamicChange = lastGamePlayer1Coeff - prevG9P1;
            const p2DynamicChange = lastGamePlayer2Coeff - prevG9P2;

            // Если кто-то значительно снизил кф, это сильный индикатор
            if (p1DynamicChange < p2DynamicChange && Math.abs(p1DynamicChange - p2DynamicChange) > 0.05) { // P1 снизился больше
                aiPredictedWinner = 1;
                predictionReason = 'по динамике последнего гейма (снижение кф. у Игрока 1)';
            } else if (p2DynamicChange < p1DynamicChange && Math.abs(p1DynamicChange - p2DynamicChange) > 0.05) { // P2 снизился больше
                aiPredictedWinner = 2;
                predictionReason = 'по динамике последнего гейма (снижение кф. у Игрока 2)';
            }
        }

        // Priority 2: Total Decimal Sum (if Priority 1 not conclusive)
        if (aiPredictedWinner === null) {
            if (player1TotalDecimal < player2TotalDecimal) {
                aiPredictedWinner = 1;
                predictionReason = 'по сумме десятичных частей (меньше у Игрока 1)';
            } else if (player2TotalDecimal < player1TotalDecimal) {
                aiPredictedWinner = 2;
                predictionReason = 'по сумме десятичных частей (меньше у Игрока 2)';
            }
        }
        
        // Display AI Prediction
        if (aiPredictedWinner !== null) {
            predictedWinnerText.textContent = aiPredictedWinner;
            showPrediction(); // Показываем блок с прогнозом
        } else {
            predictedWinnerText.textContent = '';
            hidePrediction(); // Скрываем, если прогноз не определен
        }


        resultDiv.classList.add('visible'); // Show results only if all inputs are filled and valid
    }

    // Function to show the prediction display and hide the form
    function showPrediction() {
        mainForm.classList.add('hidden');
        clearButtonContainer.classList.add('hidden');
        predictionDisplay.classList.remove('prediction-hidden');
        predictionDisplay.classList.add('prediction-visible');
    }

    // Function to hide the prediction display and show the form
    function hidePrediction() {
        mainForm.classList.remove('hidden');
        clearButtonContainer.classList.remove('hidden');
        predictionDisplay.classList.remove('prediction-visible');
        predictionDisplay.classList.add('prediction-hidden');
    }


    // Event listeners for input fields (on focus to show keyboard, on input to calculate)
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            activeInput = input;
            customKeyboardContainer.classList.add('show');
            // Scroll to the active input if keyboard covers it
            setTimeout(() => {
                input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300); // Allow keyboard animation to start
        });
        input.addEventListener('blur', () => {
            // Delay hiding the keyboard to allow click events on keyboard buttons
            setTimeout(() => {
                if (!customKeyboardContainer.contains(document.activeElement)) {
                    customKeyboardContainer.classList.remove('show');
                    activeInput = null;
                }
            }, 100);
        });
        input.addEventListener('input', calculateAndDisplayResults);
    });

    // Custom keyboard input logic
    customKeyboard.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && activeInput) {
            const key = e.target.dataset.key;
            if (key === 'delete') {
                activeInput.value = activeInput.value.slice(0, -1);
            } else if (key === '.') {
                if (!activeInput.value.includes('.')) {
                    activeInput.value += key;
                }
            } else {
                // Limit to 4 characters (e.g., 1.91)
                if (activeInput.value.length < activeInput.maxLength) {
                    activeInput.value += key;
                }
            }
            calculateAndDisplayResults();
            saveData(); // Save data immediately after input
        }
    });

    // Handle clear button
    clearDataBtn.addEventListener('click', () => {
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('is-invalid');
            localStorage.removeItem(input.id);
        });
        resultDiv.classList.remove('visible');
        errorDiv.classList.remove('visible');
        errorDiv.textContent = '';
        hidePrediction(); // Скрываем прогноз при очистке
    });

    // Initial load
    loadData();
});
