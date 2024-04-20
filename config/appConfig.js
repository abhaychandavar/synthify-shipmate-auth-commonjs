const appConfig = {
    synthifyConfigPath: process.env.SYNTHIFY_CONFIG_PATH || `${process.cwd()}/synthify.shipmate.config`,
    strongPassRegex: new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    emailValidatorRegex: new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/),
    usernameValidatorRegex: new RegExp(/^[a-zA-Z0-9]+$/),
    jwt: {
        secretKey: process.env.JWT_SECRET_KEY || 'secret',
    }
}

module.exports = appConfig;