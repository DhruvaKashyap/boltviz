/**
 * Boltzmann Machine Visualization - Core Logic
 */

// Configuration
const CONFIG = {
    neuronRadius: 20,
    colors: {
        bg: '#1a1d2d',
        neuronOn: '#10b981',
        neuronOff: '#ef4444',
        edgePositive: 'rgba(16, 185, 129, 0.4)',
        edgeNegative: 'rgba(239, 68, 68, 0.4)',
        text: '#f1f5f9',
        energyLine: '#06b6d4',
        accent: '#8b5cf6'
    },
    canvasPadding: 40
};

// State
let state = {
    neurons: [],
    weights: [],
    energyHistory: [],
    step: 0,
    isRunning: false,
    speed: 10,
    lastUpdate: 0,
    neuronCount: 6,
    binaryWeights: false,
    lastActiveIdx: -1,
    lastFlip: false,
    m: null, // Legacy for single m
    patterns: [], // Array of patterns
    initialOverlaps: [],
    patternCount: 1,
    patternType: 'digit',
    patternNoise: 0.05,
    temperature: 1.0,
    isStochastic: false,
    updateStrategy: 'random',
    zeroDiagonal: true,
    weightSymmetry: 'symmetric',
    currentEnergy: 0,
    sequentialIdx: 0,
    flippedIndices: []
};

// DOM Elements
const canvasNetwork = document.getElementById('network-canvas');
const ctxNetwork = canvasNetwork.getContext('2d');
const canvasEnergy = document.getElementById('energy-canvas');
const ctxEnergy = canvasEnergy.getContext('2d');
const canvasStateGrid = document.getElementById('state-grid-canvas');
const ctxStateGrid = canvasStateGrid.getContext('2d');

const elEnergyValue = document.getElementById('energy-value');
const elStepValue = document.getElementById('step-value');
const btnToggle = document.getElementById('btn-toggle');
const btnResetState = document.getElementById('btn-reset-state');
const btnResetWeights = document.getElementById('btn-reset-weights');
const btnRank1 = document.getElementById('btn-rank1');
const elOverlapDisplay = document.getElementById('overlap-display');
const elOverlapList = document.getElementById('overlap-list');

const sliderSpeed = document.getElementById('speed-slider');
const sliderNeuron = document.getElementById('neuron-slider');
const inputNeuron = document.getElementById('neuron-input');
const checkBinary = document.getElementById('binary-weights');
const selectStrategy = document.getElementById('strategy-select');

// New Controls
const sliderPatternCount = document.getElementById('pattern-count-slider');
const inputPatternCount = document.getElementById('pattern-count-input');
const sliderPatternNoise = document.getElementById('pattern-noise-slider');
const inputPatternNoise = document.getElementById('pattern-noise-input');
const sliderTemp = document.getElementById('temp-slider');
const inputTemp = document.getElementById('temp-input');
const divTempBox = document.getElementById('temp-box');
const selectPatternType = document.getElementById('pattern-type-select');
const checkStochastic = document.getElementById('check-stochastic');
const checkZeroDiagonal = document.getElementById('zero-diagonal');
const selectSymmetry = document.getElementById('symmetry-select');
const containerPatterns = document.getElementById('patterns-container');
const vizGrid = document.querySelector('.viz-grid');
const cardEnergy = document.getElementById('card-energy');

// Cards for visibility
const cardNetwork = document.getElementById('card-network');
const cardStateGrid = document.getElementById('card-state-grid');

// Initialization
function init() {
    state.neuronCount = parseInt(sliderNeuron.value);
    inputNeuron.value = state.neuronCount;
    state.binaryWeights = checkBinary.checked;
    state.speed = parseInt(sliderSpeed.value);
    state.updateStrategy = selectStrategy.value;
    state.patternType = selectPatternType.value;
    state.patternCount = parseInt(sliderPatternCount.value);
    inputPatternCount.value = state.patternCount;
    state.patternNoise = parseFloat(sliderPatternNoise.value);
    inputPatternNoise.value = state.patternNoise;
    state.temperature = parseFloat(sliderTemp.value);
    inputTemp.value = state.temperature.toFixed(1);
    state.isStochastic = checkStochastic.checked;
    state.zeroDiagonal = checkZeroDiagonal.checked;
    state.weightSymmetry = selectSymmetry.value;

    divTempBox.style.display = state.isStochastic ? 'block' : 'none';

    initWeights();
    initNeurons();
    calcEnergy();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Event Listeners
    btnToggle.addEventListener('click', toggleSimulation);
    btnResetState.addEventListener('click', () => {
        resetNeurons();
        if (state.patterns.length > 0) calcOverlap();
        draw();
    });
    btnResetWeights.addEventListener('click', () => {
        state.patterns = [];
        state.energyHistory = [];
        updateOverlapDisplay();
        initWeights();
        calcEnergy();
        draw();
    });
    btnRank1.addEventListener('click', () => {
        initMultiplePatterns();
        resetNeurons();
        calcOverlap();
        draw();
    });

    sliderSpeed.addEventListener('input', (e) => { state.speed = parseInt(e.target.value); });

    // Neurons Sync
    sliderNeuron.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        inputNeuron.value = val;
        updateNeuronCount(val);
    });
    inputNeuron.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        val = Math.max(3, Math.min(1024, val));
        e.target.value = val;
        sliderNeuron.value = val;
        updateNeuronCount(val);
    });

    // Patterns Sync
    sliderPatternCount.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        inputPatternCount.value = val;
        state.patternCount = val;
    });
    inputPatternCount.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        val = Math.max(1, Math.min(100, val)); // Allow more than 10 via input
        e.target.value = val;
        sliderPatternCount.value = val;
        state.patternCount = val;
    });

    // Patterns Noise Sync
    sliderPatternNoise.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        inputPatternNoise.value = val.toFixed(2);
        state.patternNoise = val;
    });
    inputPatternNoise.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        val = Math.max(0, Math.min(1, val));
        e.target.value = val.toFixed(2);
        sliderPatternNoise.value = val;
        state.patternNoise = val;
    });

    // Temperature Sync
    sliderTemp.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        inputTemp.value = val.toFixed(1);
        state.temperature = val;
    });
    inputTemp.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        val = Math.max(0.1, Math.min(100, val)); // Allow higher T via input
        e.target.value = val.toFixed(1);
        sliderTemp.value = val;
        state.temperature = val;
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.val);
            sliderNeuron.value = val;
            updateNeuronCount(val);
        });
    });

    checkBinary.addEventListener('change', (e) => {
        state.binaryWeights = e.target.checked;
        state.patterns = [];
        state.energyHistory = [];
        updateOverlapDisplay();
        initWeights();
        calcEnergy();
        draw();
    });

    selectStrategy.addEventListener('change', (e) => {
        state.updateStrategy = e.target.value;
        state.sequentialIdx = 0;
    });

    selectPatternType.addEventListener('change', (e) => {
        state.patternType = e.target.value;
    });

    checkStochastic.addEventListener('change', (e) => {
        state.isStochastic = e.target.checked;
        divTempBox.style.display = state.isStochastic ? 'block' : 'none';
    });

    checkZeroDiagonal.addEventListener('change', (e) => {
        state.zeroDiagonal = e.target.checked;
        initWeights();
        calcEnergy();
        draw();
    });

    selectSymmetry.addEventListener('change', (e) => {
        state.weightSymmetry = e.target.value;
        initWeights();
        calcEnergy();
        draw();
    });

    requestAnimationFrame(loop);
}

function updateNeuronCount(val) {
    state.neuronCount = val;
    inputNeuron.value = val;
    state.m = null;

    // UI adaptation for large N
    if (val > 30) {
        cardNetwork.style.display = 'none';
        vizGrid.classList.remove('small-n-layout');
    } else {
        cardNetwork.style.display = 'flex';
        vizGrid.classList.add('small-n-layout');
        if (val > 100) {
            cardNetwork.classList.add('mini-graph');
        } else {
            cardNetwork.classList.remove('mini-graph');
        }
    }

    state.patterns = [];
    state.initialOverlaps = [];
    updateOverlapDisplay();
    initWeights();
    initNeurons();
    calcEnergy();
    draw();

    // Trigger resize because layout changed
    setTimeout(resizeCanvas, 0);
}

window.addEventListener('load', init);

// Helper to resize a single canvas
function resizeSingleCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (width > 0 && height > 0) {
        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            return true;
        }
    }
    return false;
}

function resizeCanvas() {
    resizeSingleCanvas(canvasNetwork, ctxNetwork);
    resizeSingleCanvas(canvasEnergy, ctxEnergy);
    resizeSingleCanvas(canvasStateGrid, ctxStateGrid);

    // Resize dynamic pattern canvases
    state.patterns.forEach((_, i) => {
        const canvas = document.getElementById(`pattern-canvas-${i}`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            resizeSingleCanvas(canvas, ctx);
        }
    });
    draw();
}

function initWeights() {
    state.weights = [];
    const N = state.neuronCount;

    // Initialize empty
    for (let i = 0; i < N; i++) state.weights[i] = new Array(N).fill(0);

    const getRandom = () => state.binaryWeights ? (Math.random() > 0.5 ? 1 : -1) : (Math.random() * 2 - 1);

    if (state.weightSymmetry === 'fullydiagonal') {
        for (let i = 0; i < N; i++) {
            if (!state.zeroDiagonal) state.weights[i][i] = getRandom();
        }
    } else {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (i === j) {
                    if (!state.zeroDiagonal) state.weights[i][i] = getRandom();
                } else if (j > i) {
                    const val = getRandom();
                    if (state.weightSymmetry === 'symmetric') {
                        state.weights[i][j] = val;
                        state.weights[j][i] = val;
                    } else if (state.weightSymmetry === 'antisymmetric') {
                        state.weights[i][j] = val;
                        state.weights[j][i] = -val;
                    } else { // asymmetric
                        state.weights[i][j] = val;
                        state.weights[j][i] = getRandom();
                    }
                }
            }
        }
    }
}

function initMultiplePatterns() {
    state.weights = [];
    state.patterns = [];
    const N = state.neuronCount;
    const P = state.patternCount;

    // Find grid size to match visualization
    const K = Math.ceil(Math.sqrt(N));

    // Helper to generate a digit pattern using an offscreen canvas
    const generateDigit = (digit) => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = K;
        offCanvas.height = K;
        const offCtx = offCanvas.getContext('2d');

        offCtx.fillStyle = 'black';
        offCtx.fillRect(0, 0, K, K);

        offCtx.fillStyle = 'white';
        // Add slight random rotation/jitter to digits
        const jitter = (Math.random() - 0.5) * (K * 0.1);
        const rotation = (Math.random() - 0.5) * 0.2;

        offCtx.save();
        offCtx.translate(K / 2 + jitter, K / 2 + jitter);
        offCtx.rotate(rotation);

        const fontSize = Math.floor(K * 0.85);
        offCtx.font = `bold ${fontSize}px "Inter", "Arial", sans-serif`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(digit.toString(), 0, K * 0.05);
        offCtx.restore();

        const imgData = offCtx.getImageData(0, 0, K, K).data;
        const pattern = new Array(N).fill(-1);

        for (let i = 0; i < N; i++) {
            const r = Math.floor(i / K);
            const c = i % K;
            const pixelIdx = (r * K + c) * 4;
            let val = imgData[pixelIdx] > 120 ? 1 : -1;

            // Add noise: flip pixels with probability state.patternNoise
            if (Math.random() < state.patternNoise) {
                val *= -1;
            }
            pattern[i] = val;
        }
        return pattern;
    };

    // For unique digits: shuffle [0..9]
    let digitSelection = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    if (state.patternType === 'digit') {
        for (let i = digitSelection.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [digitSelection[i], digitSelection[j]] = [digitSelection[j], digitSelection[i]];
        }
    }

    // Generate P patterns based on selected type
    for (let p = 0; p < P; p++) {
        if (state.patternType === 'digit') {
            // Even with unique digit base, jitter and noise make each pattern unique
            const digit = digitSelection[p % 10];
            state.patterns.push(generateDigit(digit));
        } else {
            const pattern = [];
            for (let i = 0; i < N; i++) {
                pattern[i] = Math.random() > 0.5 ? 1 : -1;
            }
            state.patterns.push(pattern);
        }
    }

    // Initialize Weights Matrix with zeros
    for (let i = 0; i < N; i++) {
        state.weights[i] = new Array(N).fill(0);
    }

    // W = 1/p * sum(m_mu * m_mu^T)
    for (let mu = 0; mu < P; mu++) {
        const m = state.patterns[mu];
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (i === j && state.zeroDiagonal) {
                    state.weights[i][j] = 0;
                } else {
                    state.weights[i][j] += (m[i] * m[j]) / P;
                }
            }
        }
    }
}

function calcOverlap() {
    if (state.patterns.length === 0) return;
    state.initialOverlaps = state.patterns.map(m => {
        let overlap = 0;
        for (let i = 0; i < state.neuronCount; i++) {
            overlap += m[i] * state.neurons[i];
        }
        return overlap;
    });
    updateOverlapDisplay();
}

function updateOverlapDisplay() {
    if (state.patterns.length > 0) {
        elOverlapDisplay.style.display = 'block';
        containerPatterns.style.display = 'grid';
        elOverlapList.innerHTML = '';

        // Re-generate container content if needed
        if (containerPatterns.children.length !== state.patterns.length) {
            containerPatterns.innerHTML = '';
            state.patterns.forEach((_, i) => {
                const card = document.createElement('div');
                card.className = 'canvas-card';
                card.innerHTML = `
                    <div class="card-header">
                        <h2>Pattern ${i + 1}</h2>
                        <div class="diagnostic-item">
                            <span class="label">m·sₜ:</span>
                            <span class="value" id="overlap-val-t-${i}">0</span>
                        </div>
                    </div>
                    <div class="canvas-container">
                        <canvas id="pattern-canvas-${i}"></canvas>
                    </div>
                `;
                containerPatterns.appendChild(card);
            });
            setTimeout(resizeCanvas, 0);
        }

        let maxAbsOverlap = -1;
        let bestPatternIdx = -1;
        const currentOverlaps = [];

        state.patterns.forEach((m, i) => {
            let valt = 0;
            for (let j = 0; j < state.neuronCount; j++) valt += m[j] * state.neurons[j];
            currentOverlaps.push(valt);

            const absVal = Math.abs(valt);
            if (absVal > maxAbsOverlap) {
                maxAbsOverlap = absVal;
                bestPatternIdx = i;
            }
        });

        state.patterns.forEach((m, i) => {
            const valt = currentOverlaps[i];

            // Add to sidebar diagnostics
            const item = document.createElement('div');
            item.className = 'diagnostic-item';
            item.innerHTML = `
                <span class="label">m${i + 1}·s:</span>
                <span class="value ${valt > 0 ? 'positive' : (valt < 0 ? 'negative' : '')}">${(valt > 0 ? '+' : '') + valt}</span>
            `;
            elOverlapList.appendChild(item);

            // Update card diagnostic and highlight
            const elValT = document.getElementById(`overlap-val-t-${i}`);
            const card = containerPatterns.children[i];

            if (elValT) {
                elValT.innerText = (valt > 0 ? '+' : '') + valt;
                elValT.className = 'value ' + (valt > 0 ? 'positive' : (valt < 0 ? 'negative' : ''));
            }

            if (card) {
                // Highlight the best pattern if there's significant overlap
                if (i === bestPatternIdx && maxAbsOverlap > 0.05 * state.neuronCount) {
                    card.classList.add('active-pattern');
                } else {
                    card.classList.remove('active-pattern');
                }
            }
        });

        cardStateGrid.classList.remove('hidden');
    } else {
        elOverlapDisplay.style.display = 'none';
        containerPatterns.style.display = 'none';
        cardStateGrid.classList.add('hidden');
    }
}

function initNeurons() {
    resetNeurons();
}

function resetNeurons() {
    state.neurons = [];
    const N = state.neuronCount;
    for (let i = 0; i < N; i++) {
        state.neurons[i] = Math.random() > 0.5 ? 1 : -1;
    }
    state.step = 0;
    state.energyHistory = [];
    state.lastActiveIdx = -1;
    state.sequentialIdx = 0;
    state.flippedIndices = [];
    calcEnergy();
}

function update() {
    if (state.neuronCount === 0) return;
    state.flippedIndices = [];

    const getNewValue = (idx, field, currentVal) => {
        if (state.isStochastic) {
            // Gibbs Sampling: P(s=1) = 1 / (1 + exp(-2*field / T))
            const prob = 1 / (1 + Math.exp(-2 * field / state.temperature));
            return Math.random() < prob ? 1 : -1;
        } else {
            return field !== 0 ? Math.sign(field) : currentVal;
        }
    };

    if (state.updateStrategy === 'synchronous') {
        const oldNeurons = [...state.neurons];
        for (let i = 0; i < state.neuronCount; i++) {
            let field = 0;
            const weights_i = state.weights[i];
            for (let j = 0; j < state.neuronCount; j++) {
                field += weights_i[j] * oldNeurons[j];
            }
            const newVal = getNewValue(i, field, oldNeurons[i]);
            if (newVal !== oldNeurons[i]) state.flippedIndices.push(i);
            state.neurons[i] = newVal;
        }
        state.lastActiveIdx = -2;
        state.lastFlip = state.flippedIndices.length > 0;
        // Recalculate full energy after synchronous update
        refreshEnergyValue();
    } else {
        let idx;
        if (state.updateStrategy === 'sequential') {
            idx = state.sequentialIdx;
            state.sequentialIdx = (state.sequentialIdx + 1) % state.neuronCount;
        } else {
            idx = Math.floor(Math.random() * state.neuronCount);
        }

        const oldVal = state.neurons[idx];
        let field = 0;
        for (let j = 0; j < state.neuronCount; j++) {
            field += state.weights[idx][j] * state.neurons[j];
        }

        const newVal = getNewValue(idx, field, oldVal);

        if (newVal !== oldVal) {
            // Delta Energy O(1) given field: dE = -h_i * ds_i - 0.5 * w_ii * (ds_i)^2
            // For s in {-1, 1}, ds = 2 or -2.
            const ds = newVal - oldVal;
            const deltaE = -field * ds - 0.5 * state.weights[idx][idx] * ds * ds;
            state.currentEnergy += deltaE;
            state.lastFlip = true;
            state.flippedIndices = [idx];
        } else {
            state.lastFlip = false;
        }

        state.neurons[idx] = newVal;
        state.lastActiveIdx = idx;
    }

    state.step++;

    // Add to history
    state.energyHistory.push(state.currentEnergy);
    if (state.energyHistory.length > 200) state.energyHistory.shift();
    elEnergyValue.innerText = state.currentEnergy.toFixed(4);
    elStepValue.innerText = state.step;

    if (state.patterns.length > 0) updateOverlapDisplay();
}

function refreshEnergyValue() {
    let e = 0;
    const N = state.neuronCount;
    // Standard energy: -0.5 * sum w_ij s_i s_j
    for (let i = 0; i < N; i++) {
        let rowSum = 0;
        const weights_i = state.weights[i];
        for (let j = 0; j < N; j++) {
            rowSum += weights_i[j] * state.neurons[j];
        }
        e += state.neurons[i] * rowSum;
    }
    state.currentEnergy = -0.5 * e;

    // Check for numerical artifacts (Infinity/NaN)
    if (!isFinite(state.currentEnergy)) state.currentEnergy = 0;
}

function calcEnergy() {
    refreshEnergyValue();

    state.energyHistory.push(state.currentEnergy);
    if (state.energyHistory.length > 200) state.energyHistory.shift();
    elEnergyValue.innerText = state.currentEnergy.toFixed(4);
    elStepValue.innerText = state.step;
}

function toggleSimulation() {
    state.isRunning = !state.isRunning;
    btnToggle.innerText = state.isRunning ? "Stop Simulation" : "Start Simulation";
    btnToggle.classList.toggle('primary');
}

function loop(timestamp) {
    if (state.isRunning) {
        const interval = 1000 / state.speed;
        if (timestamp - state.lastUpdate > interval) {
            update();
            state.lastUpdate = timestamp;
            draw();
        }
    }
    requestAnimationFrame(loop);
}

function draw() {
    if (!state.weights || state.weights.length === 0) return;
    drawNetwork();
    drawEnergy();
    if (state.patterns.length > 0) drawGrids();
}

function drawNetwork() {
    const w = canvasNetwork.clientWidth;
    const h = canvasNetwork.clientHeight;
    if (w === 0 || h === 0) return;
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) / 2 - CONFIG.canvasPadding;

    ctxNetwork.clearRect(0, 0, w, h);
    const N = state.neuronCount;
    const positions = [];
    for (let i = 0; i < N; i++) {
        const angle = (2 * Math.PI * i) / N - Math.PI / 2;
        positions.push({ x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) });
    }

    // Performance threshold for edge drawing
    if (N <= 150) {
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const weight = state.weights[i][j];
                if (Math.abs(weight) < 0.01) continue;
                const p1 = positions[i];
                const p2 = positions[j];
                ctxNetwork.beginPath();
                ctxNetwork.moveTo(p1.x, p1.y);
                ctxNetwork.lineTo(p2.x, p2.y);
                ctxNetwork.strokeStyle = weight > 0 ? CONFIG.colors.edgePositive : CONFIG.colors.edgeNegative;
                ctxNetwork.lineWidth = Math.abs(weight) * (N > 50 ? 2 : 5);
                ctxNetwork.stroke();
            }
        }
    }

    const activeRadius = N > 500 ? 1 : (N > 200 ? 3 : (N > 100 ? 5 : (N > 40 ? 6 : (N > 20 ? 12 : CONFIG.neuronRadius))));
    positions.forEach((p, i) => {
        const val = state.neurons[i];
        ctxNetwork.beginPath();
        ctxNetwork.arc(p.x, p.y, activeRadius, 0, 2 * Math.PI);
        ctxNetwork.fillStyle = val > 0 ? CONFIG.colors.neuronOn : CONFIG.colors.neuronOff;
        if (N <= 30) {
            ctxNetwork.shadowColor = ctxNetwork.fillStyle;
            ctxNetwork.shadowBlur = 10;
        }
        ctxNetwork.fill();
        ctxNetwork.shadowBlur = 0;

        if (N <= 200) {
            ctxNetwork.strokeStyle = '#fff';
            ctxNetwork.lineWidth = N > 50 ? 0.5 : 1.5;
            ctxNetwork.stroke();
        }

        // Only draw highlight ring for reasonable N
        if (N <= 300) {
            if (i === state.lastActiveIdx || (state.lastActiveIdx === -2 && state.isRunning)) {
                ctxNetwork.beginPath();
                ctxNetwork.arc(p.x, p.y, activeRadius + (N > 30 ? 3 : 5), 0, 2 * Math.PI);
                ctxNetwork.lineWidth = N > 30 ? 1.5 : 3;
                if (state.flippedIndices.includes(i)) {
                    ctxNetwork.strokeStyle = '#fbbf24';
                } else {
                    ctxNetwork.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                }
                ctxNetwork.stroke();
            }
        }

        if (N <= 30) {
            ctxNetwork.fillStyle = '#fff';
            ctxNetwork.font = `bold ${activeRadius * 0.7}px sans-serif`;
            ctxNetwork.textAlign = 'center';
            ctxNetwork.textBaseline = 'middle';
            ctxNetwork.fillText(val > 0 ? '+1' : '-1', p.x, p.y);
        }
    });
}

function drawEnergy() {
    const w = canvasEnergy.clientWidth;
    const h = canvasEnergy.clientHeight;
    if (w === 0 || h === 0) return;
    ctxEnergy.clearRect(0, 0, w, h);
    if (state.energyHistory.length === 0) return;
    let minE = Math.min(...state.energyHistory);
    let maxE = Math.max(...state.energyHistory);
    let range = maxE - minE;

    // Prevent artifacts from tiny precision ranges (e.g. 1e-15)
    if (range < 0.001) {
        minE -= 0.5;
        maxE += 0.5;
        range = 1;
    } else {
        minE -= range * 0.1;
        maxE += range * 0.1;
    }

    const mapX = (i) => (i / (state.energyHistory.length - 1 || 1)) * (w - 20) + 10;
    const mapY = (val) => {
        const y = h - ((val - minE) / (maxE - minE || 1) * (h - 20) + 10);
        return isFinite(y) ? y : h / 2;
    };
    ctxEnergy.beginPath();
    ctxEnergy.strokeStyle = CONFIG.colors.energyLine;
    ctxEnergy.lineWidth = 2;
    state.energyHistory.forEach((val, i) => {
        const x = mapX(i); const y = mapY(val);
        if (i === 0) ctxEnergy.moveTo(x, y); else ctxEnergy.lineTo(x, y);
    });
    ctxEnergy.stroke();
}

function drawGrids() {
    const N = state.neuronCount;
    if (state.patterns.length === 0) return;

    // Find smallest K such that K*K >= N
    const K = Math.ceil(Math.sqrt(N));

    const drawGrid = (canvas, ctx, data) => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (w === 0 || h === 0) return;

        // Ensure proper scaling and clear
        resizeSingleCanvas(canvas, ctx);
        ctx.clearRect(0, 0, w, h);

        const cellSize = Math.floor(Math.min(w, h) / K);
        const offsetX = (w - cellSize * K) / 2;
        const offsetY = (h - cellSize * K) / 2;

        for (let i = 0; i < K * K; i++) {
            const row = Math.floor(i / K);
            const col = i % K;
            const x = offsetX + col * cellSize;
            const y = offsetY + row * cellSize;

            if (i < N) {
                // Neuron slot: Black and White
                ctx.fillStyle = data[i] > 0 ? '#ffffff' : '#000000';
            } else {
                // Inactive slot: Grey out
                ctx.fillStyle = '#2d3748'; // Slate/Grey
            }

            ctx.fillRect(x, y, cellSize, cellSize);

            // Subtle cell borders
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize, cellSize);
        }
    };

    // Draw all patterns
    state.patterns.forEach((m, i) => {
        const canvas = document.getElementById(`pattern-canvas-${i}`);
        if (canvas) {
            drawGrid(canvas, canvas.getContext('2d'), m);
        }
    });

    // Draw current state
    drawGrid(canvasStateGrid, ctxStateGrid, state.neurons);
}
