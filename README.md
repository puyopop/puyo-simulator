# Puyo Puyo Simulator

A simple Puyo Puyo game simulator built with Deno and TypeScript, designed to be deployed to GitHub Pages.

## Demo

You can play the game online at: [GitHub Pages URL after deployment]

## Features

- Classic Puyo Puyo gameplay
- Colorful Puyo pieces
- Chain reactions
- Score tracking
- Responsive design

## Prerequisites

- [Deno](https://deno.land/) v1.x or higher

## Development

### Running Locally

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/puyo-simulator.git
   cd puyo-simulator
   ```

2. Start the development server:
   ```
   deno task dev
   ```

3. Open your browser and navigate to `http://localhost:8000`

### Building for Production

1. Build the project:
   ```
   deno task build
   ```

2. The built files will be in the `dist` directory.

3. You can serve the built files locally:
   ```
   deno task serve
   ```

## Deployment to GitHub Pages

This project is set up for automatic deployment to GitHub Pages using GitHub Actions.

1. Push your changes to the `main` branch:
   ```
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. The GitHub Actions workflow will automatically build and deploy the project to GitHub Pages.

3. Your game will be available at `https://puyopop.github.io/puyo-simulator/`

## Game Controls

- **Left/Right Arrow**: Move horizontally
- **Down Arrow**: Move down faster
- **Up Arrow**: Rotate clockwise
- **Z Key**: Rotate counter-clockwise
- **Space**: Hard drop
- **Enter**: Restart game (after game over)

## Project Structure

- `public/`: Static files
- `src/`: Source code
  - `domain/`: Game domain logic
  - `adapter/`: Adapters connecting domain to UI
- `deno.json`: Deno configuration
- `main.ts`: Development server
- `build.ts`: Build script for production

## License

MIT