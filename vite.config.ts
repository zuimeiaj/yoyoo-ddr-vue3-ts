import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'
import { babel } from '@rollup/plugin-babel'
import ts from '@rollup/plugin-typescript'
import { resolve } from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), jsx()],
  build: {
    lib: {
      entry: 'src/components/index.tsx',
      name: 'yoyoo-ddr-vue3-ts',
      fileName: (name) => `yoyoo-ddr-vue3-ts.${name}.js`,
    },
    sourcemap: true,
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
      plugins: [
        ts({
          target: 'es2015', // 这里指定编译到的版本，
          rootDir: 'src/components/',
          declaration: true,
          declarationDir: resolve(__dirname, 'dist'),
          exclude: resolve(__dirname, 'node_modules/**'),
          allowSyntheticDefaultImports: true,
        }),
        babel({
          babelHelpers: 'runtime',
          extensions: ['.tsx', '.ts'],
          plugins: ['@babel/plugin-transform-runtime'],
          presets: [
            [
              '@babel/preset-env',
              {
                useBuiltIns: false,
                targets: {
                  browsers: ['last 2 versions', '> 1%', 'not ie <= 11'],
                },
              },
            ],
          ],
        }),
      ],
    },
  },
})
