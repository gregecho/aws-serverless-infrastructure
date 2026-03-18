"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    resolve: {
        alias: [
            {
                find: '@@handlers',
                replacement: node_path_1.default.resolve(__dirname, 'src/handlers'),
            },
            {
                find: '@@schemas',
                replacement: node_path_1.default.resolve(__dirname, 'src/schemas'),
            },
            {
                find: '@@repositories',
                replacement: node_path_1.default.resolve(__dirname, 'src/repositories'),
            },
            {
                find: '@@middleware',
                replacement: node_path_1.default.resolve(__dirname, 'src/middleware'),
            },
            {
                find: '@@clients',
                replacement: node_path_1.default.resolve(__dirname, 'src/clients'),
            },
            {
                find: '@@services',
                replacement: node_path_1.default.resolve(__dirname, 'src/services'),
            },
        ],
    },
    test: {
        globals: true,
        environment: 'node',
    },
});
