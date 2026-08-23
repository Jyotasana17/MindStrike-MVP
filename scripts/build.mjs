import { build } from 'vite';

// Programmatic Vite build — avoids depending on the node_modules/.bin wrapper.
(async () => {
  try {
    await build();
    console.log('Vite build completed successfully (scripts/build.mjs)');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
