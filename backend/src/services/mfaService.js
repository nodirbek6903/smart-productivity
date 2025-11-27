const speakeasy = require("speakeasy")
const qrcode = require("qrcode")


exports.generateMFASecret = async (userEmail) => {
    const secret = speakeasy.generateSecret({
        name:`MyApp (${userEmail})`,
        length:20
    })

    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url)

    return {
        otpauthURL:secret.otpauth_url,
        base32:secret.base32,
        qrCodeDataURL
    }
}

exports.verifyMFA = (token,secret) => {
    return speakeasy.totp.verify({
        secret,
        encoding:"base32",
        token,
        window:1
    })
}