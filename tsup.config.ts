import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  target: 'es2020',
  external: [
    '@thiagoprazeres/ispb-participants',
    '@thiagoprazeres/parse-e2eid',
    '@thiagoprazeres/pix-static-brcode',
  ],
});
