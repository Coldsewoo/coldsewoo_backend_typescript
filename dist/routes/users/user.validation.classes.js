"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const validRoles = ["Owner", "Admin", "User"];
const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
let IsValidRoles = class IsValidRoles {
    validate(text, args) {
        return validRoles.includes(text);
    }
    defaultMessage(args) {
        return `Role '$value' should be one of the following : ${validRoles.join(', ')}`;
    }
};
IsValidRoles = __decorate([
    class_validator_1.ValidatorConstraint({ name: "role", async: false })
], IsValidRoles);
exports.IsValidRoles = IsValidRoles;
let IsValidEmail = class IsValidEmail {
    validate(text, args) {
        return emailRegex.exec(text) !== null;
    }
    defaultMessage(args) {
        return `Should be a vaild email address!`;
    }
};
IsValidEmail = __decorate([
    class_validator_1.ValidatorConstraint({ name: "email", async: false })
], IsValidEmail);
exports.IsValidEmail = IsValidEmail;
//# sourceMappingURL=user.validation.classes.js.map