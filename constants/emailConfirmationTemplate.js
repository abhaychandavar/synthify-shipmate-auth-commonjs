const getEmailConfirmationViaCodeTemplate = ({ code }) => `
<!DOCTYPE html>
<html>
<head>
    <title>Email Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #007BFF;
        }
        p {
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Email Confirmation</h1>
        <p>Thank you for confirming your email.</p>
        <p>Your OTP code is: <span style="font-weight: bold;">${code}</span></p>
        <p>Please enter this code to complete your registration.</p>
    </div>
</body>
</html>
`;

const getEmailConfirmationViaLinkTemplate = ({ link }) => `
<!DOCTYPE html>
<html>
<head>
    <title>Email Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #007BFF;
        }
        p {
            font-size: 18px;
        }
        a {
            color: #007BFF;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Email Confirmation</h1>
        <p>Thank you for confirming your email.</p>
        <p>Please click the link below to complete your registration:</p>
        <p><a href="${link}">${link}</a></p>
    </div>
</body>
</html>
`


module.exports = {
    getEmailConfirmationViaCodeTemplate,
    getEmailConfirmationViaLinkTemplate
}