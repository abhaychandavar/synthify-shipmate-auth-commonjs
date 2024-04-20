const appConfig = require('../config/appConfig');
const synthifyConfig = require(appConfig.synthifyConfigPath);
const { hydrateError } = require(`${synthifyConfig.utilsPath}/synthifyError`);
const getPasswordValidator = (passwordConfig) => {
    let validator = new RegExp(/.+/);
    const { regex, useDefaultStrongPassRegex } = (passwordConfig || {});
    if (regex) {
        validator = passwordConfig.expression;
    }
    else if (useDefaultStrongPassRegex) {
        validator = new RegExp(appConfig.strongPassRegex);
    }
    return validator;
}

const getEmailValidator = (expression) => {
    let validator = new RegExp(appConfig.emailValidatorRegex);
    if (expression) {
        validator = new RegExp(expression);
    }
    return validator;
}

const getUsernameValidator = (expression) => {
    let validator = new RegExp(appConfig.usernameValidatorRegex);
    if (expression) {
        validator = new RegExp(expression);
    }
    return validator;
}

class MongoAuthProvider {

    #ERROR_CODE = 'synthify/errors/auth';

    /**
     * Constructs a new instance of the class.
     *
     * @param {Object} options.userModel - The user model.
     */
    constructor ({ userModel }) {
        this.User = userModel;
    }

    #validateEmailPass = (data) => {
        const { email, password, passwordConfig, emailValidatorRegex } = data;
        const emailValidatorExpression = getEmailValidator(emailValidatorRegex);
        const passwordValidatorExpression = getPasswordValidator(passwordConfig);
        const isValidEmail = emailValidatorExpression.test(email);
        const isValidPass = passwordValidatorExpression.test(password);
        return isValidEmail && isValidPass;
    }
    
    #validateSignupWithEmailPass = async ({ email, password, passwordConfig, emailValidatorRegex, confirmationConfig }) => {
        if (!this.#validateEmailPass({ email, password, passwordConfig, emailValidatorRegex })) {
            throw hydrateError({
                key: 'ERR_BAD_REQUEST',
                message: 'Invalid email or password',
                code: `${this.#ERROR_CODE}/invalid-creds`
            });
        }
        if (confirmationConfig && !this.User.schema.paths.emailConfirmedAt) {
            throw hydrateError({
                key: 'ERR_BAD_REQUEST',
                message: 'emailConfirmedAt field required in User schema',
                code: `${this.#ERROR_CODE}/invalid-schema`
            })
        }
        const user = await this.User.findOne({
            email
        });
        if (user) throw hydrateError({
            key: 'ERR_BAD_REQUEST',
            message: 'User with this email already exists',
            code: `${this.#ERROR_CODE}/user-already-exists`
        })
    }
    signupWithEmailPass = async ({ email, hashedPassword, otherFields, passwordConfig, emailValidatorRegex, confirmationConfig }) => {
        await this.#validateSignupWithEmailPass({ email, hashedPassword, otherFields, passwordConfig, emailValidatorRegex, confirmationConfig });
        const user = await this.User.create({ ...otherFields, email, password: hashedPassword });
        if (!user) {
            throw this.hydrateError({
                key: 'ERR_INTERNAL',
                code: `${this.#ERROR_CODE}/internal`
            });
        }
        return user;
    }

    #validateUsernamePass = (data) => {
        const { username, password, usernameValidatorRegex, passwordConfig } = data;
        const usernameValidatorExpression = getUsernameValidator(usernameValidatorRegex);
        const passwordValidatorExpression = getPasswordValidator(passwordConfig);
        const isValidUsername = usernameValidatorExpression.test(username);
        const isValidPass = passwordValidatorExpression.test(password);
        return isValidUsername && isValidPass;
    }

    #validateSignupWithUsernamePass = ({ username, password, usernameValidatorRegex, passwordConfig }) => {
        if (!this.User.schema.paths.username) {
            throw hydrateError({
                key: 'ERR_BAD_REQUEST',
                message: 'Username is required',
                code: `${this.#ERROR_CODE}/missing-username`
            });
        }
        if (!this.#validateUsernamePass({ username, password, usernameValidatorRegex, passwordConfig })) {
            throw hydrateError({
                key: 'ERR_BAD_REQUEST',
                message: 'Invalid username or password',
                code: `${this.#ERROR_CODE}/invalid-creds`
            });
        }
    }

    signupWithUsernamePass = async ({ username, hashedPassword, otherFields, usernameValidatorRegex, passwordConfig }) => {
        this.#validateSignupWithUsernamePass({ username, hashedPassword, otherFields, usernameValidatorRegex, passwordConfig });
        const user = await this.User.create({ ...otherFields, username, password: hashedPassword });
        if (!user) {
            throw this.hydrateError({
                key: 'ERR_INTERNAL',
                code: `${this.#ERROR_CODE}/internal`
            });
        }
        return user;
    }
}

module.exports = MongoAuthProvider;