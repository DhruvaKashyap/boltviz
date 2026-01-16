# Dynamic Boltzmann Machine Visualization

A high-performance, interactive visualization of Boltzmann Machines and Hopfield Networks, designed to explore neural dynamics, associative memory, and stochastic optimization.

## Key Features

### Advanced Neural Dynamics
- **Stochastic Gibbs Sampling**: Transition from deterministic updates to thermal dynamics using the **Temperature (T)** slider.
- **Update Strategies**:
  - **Random (Async)**: Standard asynchronous updates.
  - **Sequential (Async)**: Deterministic ordered updates.
  - **Synchronous (All)**: Parallel updates for observing collective oscillation or convergence.

### Associative Memory
- **Hebbian Storage**: Store multiple patterns using the rule $W = \frac{1}{p} \sum_{\mu=1}^p m_\mu m_\mu^T$.
- **Pattern Diversity**: Choose between **Handwritten Digits (0-9)** or **Random Noise**.
- **Unique Memory**: Digit patterns are uniquely selected and augmented with synthetic noise/jitter to create a rich memory landscape.
- **Real-time Overlap**: Track the "Overlap" (dot product) between the current state and all stored memories simultaneously.

### Deep Network Configuration
- **Scalable Architecture**: Simulates anywhere from **3 to 1024 neurons**.
- **Weight Engineering**:
  - **Symmetry Control**: Explore Symmetric, Anti-Symmetric, Fully Diagonal, or Asymmetric connectivity.
  - **Zero Diagonal Toggle**: Research the effect of self-connections on stability.
  - **Binary Weights**: Toggle between continuous and discrete weight values.

### Premium Visualization
- **Adaptive UI**: For $N \le 30$, a detailed circular graph shows individual node transitions. For $N > 30$, the system shifts focus to high-density 2D grid representations.
- **Energy Landscapes**: Real-time plotting of the system's Energy History ($E = -1/2 \sum w_{ij}s_is_j$).
- **Glassmorphism Design**: A modern, dark-themed interface built for clarity and visual impact.

## Tech Stack
- **Core**: Vanilla JavaScript (ES6+), HTML5 Canvas.
- **Styling**: Modern CSS with HSL color tokens and responsive grid layouts.
- **DPI Aware**: Automatically scales rendering for high-resolution (Retina) displays.

## How to Use

1. **Set the Network**: Choose the number of neurons and your preferred weight symmetry.
2. **Store Patterns**: Select the pattern type (Digits/Random) and click **"Store Patterns"**.
3. **Randomize State**: Click **"Randomize State"** to place the network in a high-energy configuration.
4. **Run Simulation**: Click **"Start Simulation"** and watch the system descend the energy landscape to retrieve a stored memory.
5. **Adjust Temperature**: Enable **Stochastic (Gibbs)** mode and increase T to see the network "shake" out of local minima.

---
*Vibed with Antigravity.*
