"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFunctions = void 0;
exports.userFunctions = {
    'create-user': {
        handler: 'src/handlers/user/create-user-handler.handler',
        events: [
            {
                http: {
                    path: '/user',
                    method: 'POST',
                },
            },
        ],
    },
};
