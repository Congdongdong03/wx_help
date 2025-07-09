"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("@tarojs/cli");
exports.default = (0, cli_1.defineConfig)({
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
//# sourceMappingURL=dev.js.map