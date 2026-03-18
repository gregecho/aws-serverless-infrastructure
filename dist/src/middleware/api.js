"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApiErrors = exports.validateResponse = exports.restApiHandler = void 0;
const core_1 = __importDefault(require("@middy/core"));
const http_json_body_parser_1 = __importDefault(require("@middy/http-json-body-parser"));
/**
 * Middy-enabled handler for API Gateway Proxy Lambda handlers
 */
const restApiHandler = (options) => {
    const wrapper = (0, core_1.default)()
        .use((0, http_json_body_parser_1.default)())
        .use({
        before: (request) => {
            // Parese body and set the validated body back
            try {
                request.event.body = options.requestSchema.parse(request.event.body);
            }
            catch (e) {
                throw e;
            }
        },
    })
        .use((0, exports.handleApiErrors)());
    if (options.responseSchema) {
        wrapper.use((0, exports.validateResponse)(options.responseSchema));
    }
    return {
        handler: (handler) => {
            return wrapper.handler(async (event, context) => {
                return handler(event.body, context);
            });
        },
    };
};
exports.restApiHandler = restApiHandler;
const validateResponse = (schema) => {
    return {
        after: (request) => {
            const { response } = request;
            if (response?.body) {
                try {
                    const data = typeof response.body === 'string'
                        ? JSON.parse(response.body)
                        : response.body;
                    schema.parse(data); // Throws ZodError if invalid, caught by handleApiErrors
                }
                catch (e) {
                    console.error('Response Validation Error:', e);
                    throw e;
                }
            }
        },
    };
};
exports.validateResponse = validateResponse;
const handleApiErrors = () => {
    return {
        onError: (request) => {
            const error = request.error;
            const cause = error?.cause;
            //1. Try to identify zodError
            if (isZodError(error))
                return buildZodResponse(error, request);
            if (isZodError(cause))
                return buildZodResponse(cause, request);
            // 3. Parse error
            if (error?.name === 'ParseError' ||
                error?.name === 'UnprocessableEntityError') {
                request.response = {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'Invalid JSON format',
                        details: error.message,
                    }),
                };
                return;
            }
            // 4. Other
            request.response = {
                statusCode: 500,
                body: JSON.stringify({
                    message: 'Internal Server Error',
                    error: error?.message,
                }),
            };
        },
    };
};
exports.handleApiErrors = handleApiErrors;
const isZodError = (err) => {
    return err && Array.isArray(err.issues);
};
const buildZodResponse = (zodError, request) => {
    request.response = {
        statusCode: 400,
        body: JSON.stringify({
            message: 'Validation Failed',
            errors: zodError.issues.map((issue) => ({
                path: Array.isArray(issue.path) ? issue.path.join('.') : issue.path,
                message: issue.message,
            })),
        }),
    };
};
