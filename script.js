// Глобальные переменные
let numVars = parseInt(document.getElementById('varCount').value);
const kmapContainer = document.getElementById('kmapContainer');
const resultDiv = document.getElementById('result');
let cells = [];

// При загрузке и при изменении количества переменных строим карту
document.getElementById('varCount').addEventListener('change', function () {
    numVars = parseInt(this.value);
    buildKMap();
});

function buildKMap() {
    kmapContainer.innerHTML = ''; // Очистка контейнера

    let rows, cols;
    let rowLabels = [];
    let colLabels = [];
    let getMintermIndex; // Функция для вычисления номера минтерма

    if (numVars === 2) {
        // 2 переменные: 2x2 (переменные A и B)
        rows = 2;
        cols = 2;
        rowLabels = ["0", "1"];
        colLabels = ["0", "1"];
        getMintermIndex = (r, c) => r * 2 + c;
    } else if (numVars === 3) {
        // 3 переменные: 2 строки (переменная A) и 4 столбца (переменные B и C по Gray code)
        rows = 2;
        cols = 4;
        rowLabels = ["0", "1"]; // A
        colLabels = ["00", "01", "11", "10"];
        getMintermIndex = (r, c) => {
            const colMap = [0, 1, 3, 2];
            return r * 4 + colMap[c];
        };
    } else if (numVars === 4) {
        // 4 переменные: 4x4, строки – AB, столбцы – CD по Gray code
        rows = 4;
        cols = 4;
        rowLabels = ["00", "01", "11", "10"];
        colLabels = ["00", "01", "11", "10"];
        getMintermIndex = (r, c) => {
            const rowMap = [0, 1, 3, 2];
            const colMap = [0, 1, 3, 2];
            return rowMap[r] * 4 + colMap[c];
        };
    }

    // Создаём таблицу
    let table = document.createElement('table');
    let thead = document.createElement('thead');
    let headRow = document.createElement('tr');

    // Пустая клетка с текстом переменных
    let emptyTh = document.createElement('th');
    if (numVars === 4) {
        emptyTh.innerHTML = `<div style="position: relative; width: 50px; height: 50px;">
                                <span style="position: absolute; top: 5px; right: 0; font-size: 0.9em;">CD</span>
                                <span style="position: absolute; bottom: 5px; left: 10px; font-size: 0.9em;">AB</span>
                                <div style="position: absolute; top: 50%; left: 50%; width: 70%; height: 2px; 
                                            background-color: black; transform: translate(-33%) rotate(45deg);"></div>
                             </div>`;
    } else if (numVars === 3) {
        emptyTh.innerHTML = `<div style="position: relative; width: 50px; height: 50px;">
                                <span style="position: absolute; top: 5px; right: 0px; font-size: 0.9em;">BC</span>
                                <span style="position: absolute; bottom: 5px; left: 10px; font-size: 0.9em;">A</span>
                                <div style="position: absolute; top: 50%; left: 50%; width: 70%; height: 2px; 
                                            background-color: black; transform: translate(-33%) rotate(45deg);"></div>
                             </div>`;
    } else if (numVars === 2) {
        emptyTh.innerHTML = `<div style="position: relative; width: 50px; height: 50px;">
                                <span style="position: absolute; top: 5px; right: 0px; font-size: 0.9em;">B</span>
                                <span style="position: absolute; bottom: 5px; left: 10px; font-size: 0.9em;">A</span>
                                <div style="position: absolute; top: 50%; left: 50%; width: 70%; height: 2px; 
                                            background-color: black; transform: translate(-33%) rotate(45deg);"></div>
                             </div>`;
    } else {
        emptyTh.textContent = ""; // Оставляем пустым для других случаев
    }
    headRow.appendChild(emptyTh);

    // Заголовки столбцов
    for (let c = 0; c < cols; c++) {
        let th = document.createElement('th');
        th.textContent = colLabels[c]; // Убираем буквы
        headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    let tbody = document.createElement('tbody');
    cells = []; // Сброс ячеек

    for (let r = 0; r < rows; r++) {
        let row = document.createElement('tr');
        let th = document.createElement('th');
        th.textContent = rowLabels[r]; // Убираем буквы
        row.appendChild(th);
        for (let c = 0; c < cols; c++) {
            let cell = document.createElement('td');
            let minterm = getMintermIndex(r, c);
            cell.setAttribute('data-minterm', minterm);
            // Значение по умолчанию "0"
            cell.textContent = "0";
            cell.addEventListener('click', function () {
                cell.classList.toggle('active');
                cell.textContent = cell.classList.contains('active') ? '1' : '0';
            });
            row.appendChild(cell);
            cells.push(cell);
        }
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    kmapContainer.appendChild(table);

    resultDiv.innerHTML = "";
}

/* Инициализация карты при загрузке */
buildKMap();

/* ------------------- Алгоритм минимизации ------------------- */

// Преобразование числа в бинарную строку с ведущими нулями
function getBinary(num, bits) {
    let s = num.toString(2);
    return "0".repeat(bits - s.length) + s;
}

// Объединяет два терма, если они отличаются ровно в одном разряде
function combineTerms(term1, term2) {
    let diffCount = 0;
    let combined = "";
    for (let i = 0; i < term1.length; i++) {
        if (term1[i] === term2[i]) {
            combined += term1[i];
        } else {
            diffCount++;
            combined += "-";
        }
    }
    return diffCount === 1 ? combined : null;
}

// Алгоритм Квайна–МакКласки для минимизации (SOP)
function quineMcCluskey(minterms, numVars) {
    let terms = [];
    minterms.sort((a, b) => a - b);
    for (let m of minterms) {
        terms.push({ term: getBinary(m, numVars), minterms: [m], combined: false });
    }

    let allPrimeImplicants = [];
    let changed = true;

    while (changed) {
        changed = false;
        let groups = {};
        let newTerms = [];

        for (let t of terms) {
            let ones = t.term.replace(/-/g, "").split("").filter(x => x === "1").length;
            if (!groups[ones]) groups[ones] = [];
            groups[ones].push(t);
        }

        let groupKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);

        for (let i = 0; i < groupKeys.length - 1; i++) {
            let group1 = groups[groupKeys[i]];
            let group2 = groups[groupKeys[i + 1]];
            for (let t1 of group1) {
                for (let t2 of group2) {
                    let combined = combineTerms(t1.term, t2.term);
                    if (combined !== null) {
                        t1.combined = true;
                        t2.combined = true;
                        let exists = newTerms.some(x => x.term === combined &&
                            JSON.stringify(x.minterms) === JSON.stringify(t1.minterms.concat(t2.minterms).sort((a, b) => a - b)));
                        if (!exists) {
                            let combinedMinterms = Array.from(new Set(t1.minterms.concat(t2.minterms))).sort((a, b) => a - b);
                            newTerms.push({ term: combined, minterms: combinedMinterms, combined: false });
                        }
                        changed = true;
                    }
                }
            }
        }

        for (let t of terms) {
            if (!t.combined) {
                let exists = allPrimeImplicants.some(x => x.term === t.term &&
                    JSON.stringify(x.minterms) === JSON.stringify(t.minterms));
                if (!exists) {
                    allPrimeImplicants.push(t);
                }
            }
        }
        terms = newTerms;
    }

    return allPrimeImplicants;
}

function findEssentialPrimeImplicants(primeImplicants, minterms) {
    let coverage = {};
    for (let m of minterms) {
        coverage[m] = [];
    }
    primeImplicants.forEach((pi, index) => {
        for (let m of pi.minterms) {
            if (coverage[m]) {
                coverage[m].push(index);
            }
        }
    });

    let essentialIndices = new Set();
    for (let m in coverage) {
        if (coverage[m].length === 1) {
            essentialIndices.add(coverage[m][0]);
        }
    }

    let essential = [];
    essentialIndices.forEach(idx => {
        essential.push(primeImplicants[idx]);
    });

    let covered = new Set();
    essential.forEach(pi => {
        pi.minterms.forEach(m => covered.add(m));
    });

    let remaining = minterms.filter(m => !covered.has(m));
    while (remaining.length > 0) {
        let bestPI = null;
        let bestCount = 0;
        primeImplicants.forEach((pi, index) => {
            if (essentialIndices.has(index)) return;
            let count = pi.minterms.filter(m => remaining.includes(m)).length;
            if (count > bestCount) {
                bestCount = count;
                bestPI = pi;
            }
        });
        if (bestPI === null) break;
        essential.push(bestPI);
        bestPI.minterms.forEach(m => {
            remaining = remaining.filter(x => x !== m);
        });
    }
    return essential;
}

// Форматирование литерала с учётом инверсии (черта над буквой)
function literalHTML(variable, inverted) {
    return inverted ? `<span class="overline">${variable}</span>` : variable;
}

// Преобразование терма в SOP‑выражение (HTML)
function termToSOPHTML(term) {
    const vars = ["A", "B", "C", "D"];
    let out = "";
    for (let i = 0; i < term.length; i++) {
        if (term[i] === "1") {
            out += literalHTML(vars[i], false);
        } else if (term[i] === "0") {
            out += literalHTML(vars[i], true);
        }
    }
    return out === "" ? "1" : out;
}

// Преобразование терма в POS‑выражение (HTML)
function termToPOSHTML(term) {
    const vars = ["A", "B", "C", "D"];
    let out = [];
    for (let i = 0; i < term.length; i++) {
        if (term[i] === "0") {
            out.push(literalHTML(vars[i], false));
        } else if (term[i] === "1") {
            out.push(literalHTML(vars[i], true));
        }
    }
    return out.length > 0 ? "(" + out.join(" + ") + ")" : "";
}

// Минимизация функции в форме SOP
function minimizeSOP(minterms, numVars) {
    if (minterms.length === 0) return "0";
    if (minterms.length === Math.pow(2, numVars)) return "1";
    let primeImplicants = quineMcCluskey(minterms, numVars);
    let selected = findEssentialPrimeImplicants(primeImplicants, minterms);
    return selected.map(pi => termToSOPHTML(pi.term)).join(" + ");
}

// Минимизация функции в форме POS
function minimizePOS(selectedMinterms, numVars) {
    const total = Math.pow(2, numVars);
    if (selectedMinterms.length === total) return "1";
    if (selectedMinterms.length === 0) return "0";

    let allMinterms = [];
    for (let i = 0; i < total; i++) {
        allMinterms.push(i);
    }
    let maxterms = allMinterms.filter(m => !selectedMinterms.includes(m));

    let primeImplicants = quineMcCluskey(maxterms, numVars);
    let selected = findEssentialPrimeImplicants(primeImplicants, maxterms);
    let posTerms = selected.map(pi => termToPOSHTML(pi.term));
    return posTerms.join(" · ");
}

// Обработка нажатия кнопки "Решить"
document.getElementById('solveBtn').addEventListener('click', () => {
    let selectedMinterms = [];
    cells.forEach(cell => {
        if (cell.classList.contains('active')) {
            selectedMinterms.push(parseInt(cell.getAttribute('data-minterm')));
        }
    });
    selectedMinterms.sort((a, b) => a - b);

    let sopExpression = minimizeSOP(selectedMinterms, numVars);
    let posExpression = minimizePOS(selectedMinterms, numVars);

    resultDiv.innerHTML = `<div>Сумма произведений: ${sopExpression}</div>
                         <div>Произведение сумм: ${posExpression}</div>`;
});

// Обработка нажатия кнопки "Очистить"
document.getElementById('clearBtn').addEventListener('click', () => {
    cells.forEach(cell => {
        cell.classList.remove('active');
        cell.textContent = "0";
    });
    resultDiv.innerHTML = '';
});
