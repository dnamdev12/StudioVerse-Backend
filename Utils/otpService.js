const crypto = require("crypto");
const bcrypt = require("bcrypt");
const twilio = require("twilio");
const OtpModel = require("./../Models/Otp");

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } =
  process.env;

// Twilio Verify generates, sends and checks the OTP for us. It is also the
// only way to send OTPs from Twilio (trial accounts block custom SMS text).
const verifyService =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN).verify.v2.services(
        TWILIO_VERIFY_SERVICE_SID,
      )
    : null;

const OTP_EXPIRY_MS = 5 * 60 * 1000; // OTP is valid for 5 minutes
const OTP_RESEND_WAIT_MS = 60 * 1000; // wait 1 minute before resending
const OTP_MAX_ATTEMPTS = 5;

class OtpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Turn Twilio error codes into messages the user can act on.
const toOtpError = (error) => {
  switch (error.code) {
    case 60200:
      return new OtpError(400, "Enter a valid mobile number");
    case 60203:
      return new OtpError(429, "Too many OTP requests. Please try again later");
    case 60202:
      return new OtpError(429, "Too many wrong attempts. Please request a new OTP");
    case 21608:
    case 21614:
      return new OtpError(
        400,
        "This number cannot receive SMS. On a Twilio trial, verify it in the Twilio console first",
      );
    default:
      return error;
  }
};

// ---------- Local fallback (development without Twilio) ----------

const sendLocalOtp = async (mobile) => {
  const existingOtp = await OtpModel.findOne({ mobile });
  if (
    existingOtp &&
    Date.now() - existingOtp.lastSentAt.getTime() < OTP_RESEND_WAIT_MS
  ) {
    throw new OtpError(429, "Please wait a minute before requesting a new OTP");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  await OtpModel.findOneAndUpdate(
    { mobile },
    {
      otpHash: await bcrypt.hash(otp, 10),
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    },
    { upsert: true },
  );

  console.log(`[DEV OTP] ${mobile}: ${otp}`);
};

const checkLocalOtp = async (mobile, otp) => {
  const otpRecord = await OtpModel.findOne({ mobile });
  if (!otpRecord || otpRecord.expiresAt.getTime() < Date.now()) {
    return false;
  }

  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    await OtpModel.deleteOne({ _id: otpRecord._id });
    throw new OtpError(429, "Too many wrong attempts. Please request a new OTP");
  }

  const isOtpValid = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isOtpValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    return false;
  }

  // OTP can only be used once.
  await OtpModel.deleteOne({ _id: otpRecord._id });
  return true;
};

// ---------- Public API ----------

const ensureProviderConfigured = () => {
  if (!verifyService && process.env.NODE_ENV === "production") {
    throw new Error("Twilio Verify is not configured");
  }
};

const sendOtp = async (mobile) => {
  ensureProviderConfigured();
  if (!verifyService) return sendLocalOtp(mobile);

  try {
    await verifyService.verifications.create({ to: mobile, channel: "sms" });
  } catch (error) {
    throw toOtpError(error);
  }
};

// Resolves to true when the OTP is correct, false when it is wrong or expired.
const checkOtp = async (mobile, otp) => {
  ensureProviderConfigured();
  if (!verifyService) return checkLocalOtp(mobile, otp);

  try {
    const check = await verifyService.verificationChecks.create({
      to: mobile,
      code: otp,
    });
    return check.status === "approved";
  } catch (error) {
    // 404: no pending verification (expired, already used, or never sent).
    if (error.status === 404) return false;
    throw toOtpError(error);
  }
};

module.exports = { sendOtp, checkOtp, OtpError };
