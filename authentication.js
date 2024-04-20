const appConfig = require("./config/appConfig");
const synthifyConfig = require(`${appConfig.synthifyConfigPath}`);
const synthifyAuthHelpers = require(`${synthifyConfig.utilsPath}/synthifyAuthHelpers`);
const { SynthifyError, hydrateError } = require(`${synthifyConfig.utilsPath}/synthifyError`);
const synthifyJwt = require(`${synthifyConfig.utilsPath}/synthifyJwt`);
const synthifyCrypto = require(`${synthifyConfig.utilsPath}/synthifyCrypto`);

const {getEmailConfirmationViaCodeTemplate, getEmailConfirmationViaLinkTemplate} = require('./constants/emailConfirmationTemplate');
class Authentication {
    #ERROR_CODE = 'synthify/errors/auth';
    constructor ({ authProvider, emailProvider, redisProvider }) {
        this.authProvider = authProvider;
        if (emailProvider) {
            this.emailProvider = emailProvider;
        }
        if (redisProvider) {
            this.redisProvider = redisProvider;
        }
    }

    
    signupWithUsername = async ({
        username,
        password
    }) => {
        
    }

    signupWithEmailPass = async ({email, password, passwordConfig, emailValidatorRegex, otherFields, confirmationConfig}) => {
        try {
            const hashedPassword = await synthifyCrypto.hashText({ text: password });
            const user = await this.authProvider.signupWithEmailPass({
                email,
                password: hashedPassword,
                otherFields,
                passwordConfig,
                emailValidatorRegex,
                confirmationConfig
            });
            if (confirmationConfig) {
                await this.#handleSendEmailConfirmation({
                    email: user.email,
                    confirmationConfig
                });
            }
            return user;
        }
        catch (error) {
            if (error instanceof SynthifyError) {
                throw error;
            }
            console.error(error);
            throw hydrateError({
                key: 'ERR_INTERNAL',
                message: 'Something went wrong',
            });
        }
    }

    signinWithPhone = ({}) => {}
    signinWithEmail = ({}) => {}
    signinWithUsername = async ({ username, password, otherFields, usernameValidatorRegex, passwordConfig }) => {
        try {
            const hashedPassword = await synthifyCrypto.hashText({ text: password });
            const user = await this.authProvider.signupWithUsernamePass({
                username,
                password: hashedPassword,
                otherFields,
                passwordConfig,
                usernameValidatorRegex
            });
            return user;
        }
        catch (error) {
            if (error instanceof SynthifyError) {
                throw error;
            }
            console.error(error);
            throw hydrateError({
                key: 'ERR_INTERNAL',
                message: 'Something went wrong',
            });
        }
    }

    #handleSendEmailCodeConfirmation = async (email) => {
        const existingAuthCode = await this.redisProvider.get({
            key: `synthify-auth-${email}-verification-code`
        });
        const authCode = existingAuthCode || synthifyAuthHelpers.generateAuthCode();
        const template = getEmailConfirmationViaCodeTemplate({ code: authCode });
        await this.redisProvider.setWithExpiration({
            key: `synthify-auth-${email}-verification-code`,
            value: authCode,
            expiresIn: '1h'
        })
        await this.emailProvider.sendEmail({ to: email, subject: 'Email confirmation', html: template });
    }

    #handleSendEmailLinkConfirmation = async (email, link) => {
        const token = synthifyJwt.generateToken({
            payload: {
                email
            },
            secretKey: appConfig.jwt.secretKey,
            expiresIn: '1h'
        })
        const template = getEmailConfirmationViaLinkTemplate({ link: `${link}/token=${token}` });
        await this.emailProvider.sendEmail({ to: email, subject: 'Email confirmation', html: template });
    }

    #handleSendEmailConfirmation = async ({ email, confirmationConfig }) => {
        try {
            const { code, link } = confirmationConfig;
            if (code) {
                await this.#handleSendEmailCodeConfirmation(email);
                return true;
            }
            await this.#handleSendEmailLinkConfirmation(email, link);
            return true;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }

    resendEmailConfirmation = async ({ email, confirmationConfig }) => {
        try {
            const result = await this.#handleSendEmailConfirmation({ email, confirmationConfig });
            return result;
        }
        catch (error) {
            console.error(error);
            if (error instanceof SynthifyError) {
                throw error;
            }
            console.error(error);
            throw hydrateError({
                key: 'ERR_INTERNAL',
                message: 'Something went wrong',
            });
        }
    }
}

module.exports = Authentication