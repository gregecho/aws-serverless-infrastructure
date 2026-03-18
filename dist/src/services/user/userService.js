"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
exports.createUserService = createUserService;
class UserService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async createUser(user) {
        return this.repository.save(user);
    }
}
exports.UserService = UserService;
function createUserService(repository) {
    return new UserService(repository);
}
