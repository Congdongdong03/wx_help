import { defineConfig } from "@tarojs/cli";

export default defineConfig({
  mini: {},
  h5: {},
  vite: {
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "/api"),
        },
      },
    },
  },
});
