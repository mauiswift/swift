import { o as objectType, s as stringType, r as recordType, u as unknownType, b as booleanType } from "./form-vendor-BljP2yhR.js";
const koreanPhoneRegex = /^(?:\+?82|0)0?1[016789]\d{7,8}$/;
const validatePhoneNumber = (phone) => {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return koreanPhoneRegex.test(cleaned);
};
const registerSchema = objectType({
  full_name: stringType().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").transform((val) => val.trim()),
  email: stringType().email("Please enter a valid email address").max(150, "Email must be less than 150 characters").transform((val) => val.trim().toLowerCase()),
  phone: stringType().refine(
    validatePhoneNumber,
    {
      message: "유효한 한국 휴대폰 번호를 입력하세요 (예: 01012345678 또는 +821012345678)"
    }
  ),
  business_name: stringType().min(1, "Company name is required").max(150, "Business name must be less than 150 characters").transform((val) => val.trim()),
  official_store_name: stringType().min(1, "Official store name is required").max(150, "Official store name must be less than 150 characters").transform((val) => val.trim()),
  address: stringType().max(255, "Address must be less than 255 characters").optional().transform((val) => (val == null ? void 0 : val.trim()) || null).nullable(),
  nda_accepted: booleanType().refine((value) => value === true, {
    message: "You must accept the NDA before submitting your registration."
  }),
  telegram_user_id: stringType().optional(),
  telegram_username: stringType().optional(),
  google_credential: stringType().optional(),
  telegram_auth: recordType(unknownType()).nullable().optional()
});
const loginSchema = objectType({
  email: stringType().min(1, "Email is required").email("Please enter a valid email address").transform((val) => val.trim().toLowerCase()),
  password: stringType().min(1, "Password is required").min(6, "Password must be at least 6 characters")
});
export {
  loginSchema as l,
  registerSchema as r
};
