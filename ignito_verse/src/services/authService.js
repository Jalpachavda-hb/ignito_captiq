/**
 * AUTHENTICATION SERVICE
 * Connects Login UI with .NET Web API using Input and Output Parameter DTOs.
 * Uses OTP-based login via SendStudentLoginOTP and ValidateStudentLoginOTP endpoints.
 */

import { apiClient } from './apiClient';
import { 
  buildSendStudentLoginOTPInput, 
  buildValidateStudentLoginOTPInput 
} from '../dto/input/authInputs';
import { 
  parseSendStudentLoginOTPOutput, 
  parseValidateStudentLoginOTPOutput 
} from '../dto/output/authOutputs';

const STORAGE_TOKEN_KEY = 'ignito_auth_token';
const STORAGE_USER_KEY = 'ignito_auth_user';
const IDENTITY_KEYS = [
  STORAGE_TOKEN_KEY,
  STORAGE_USER_KEY,
  'AccessToken',
  'accessToken',
  'token',
  'StudentId',
  'studentId',
  'StudentName',
  'studentName',
  'Email',
  'MobileNumber',
  'ProfileImage',
  'ignito_user',
  'user'
];

function clearStoredIdentity() {
  IDENTITY_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

/**
 * Sends OTP to student's registered Email or Mobile Number.
 * Endpoint: SendStudentLoginOTP
 * 
 * @param {object|string} emailOrPayload - Email/Mobile string or payload object { email, mobileNumber }
 * @param {string} [mobileNumber=''] - Mobile number string if first param is email
 * @returns {Promise<object>} Parsed response object `{ success, isSuccess, message, studentId, otpId, email, mobileNumber, error }`
 */
export async function sendStudentLoginOTP(emailOrPayload, mobileNumber = '') {
  // 1. Prepare Input Parameter DTO
  const inputDto = buildSendStudentLoginOTPInput(emailOrPayload, mobileNumber);

  // 2. Send request to .NET Web API endpoint [Route("SendStudentLoginOTP")]
  const response = await apiClient('api/StudentAPI/SendStudentLoginOTP', {
    method: 'POST',
    headers: inputDto.headers,
    body: inputDto.body,
    isPublic: true
  });

  // 3. Parse Output Parameter DTO
  return parseSendStudentLoginOTPOutput(response.data, response.status);
}

/**
 * Validates student login OTP.
 * Endpoint: ValidateStudentLoginOTP
 * 
 * @param {object|number} studentIdOrPayload - Student ID or payload object { studentId, otpId, otp, clientInfo, fcmToken }
 * @param {number} [otpId=0] - OTP ID string/number
 * @param {string} [otp=''] - OTP code string
 * @param {object} [clientInfo=null] - Optional ClientInfo object
 * @param {string} [fcmToken=''] - Optional FCM Token string
 * @returns {Promise<object>} Parsed response object `{ success, isSuccess, message, accessToken, user, error }`
 */
export async function validateStudentLoginOTP(
  studentIdOrPayload, 
  otpId = 0, 
  otp = '', 
  clientInfo = null, 
  fcmToken = ''
) {
  let params = {};
  if (typeof studentIdOrPayload === 'object' && studentIdOrPayload !== null) {
    params = studentIdOrPayload;
  } else {
    params = { studentId: studentIdOrPayload, otpId, otp, clientInfo, fcmToken };
  }

  // 1. Prepare Input Parameter DTO
  const inputDto = buildValidateStudentLoginOTPInput(params);

  // 2. Send request to .NET Web API endpoint [Route("ValidateStudentLoginOTP")]
  const response = await apiClient('api/StudentAPI/ValidateStudentLoginOTP', {
    method: 'POST',
    headers: inputDto.headers,
    body: inputDto.body,
    isPublic: true
  });

  // 3. Parse Output Parameter DTO
  const loginIdentity = params.loginIdentity || params.email || params.mobileNumber || '';
  const outputDto = parseValidateStudentLoginOTPOutput(response.data, response.status, loginIdentity);

  // 4. Replace any previous student session, then save this login only
  if ((outputDto.isSuccess || outputDto.success) && outputDto.studentId > 0) {
    clearStoredIdentity();
    if (outputDto.accessToken) {
      localStorage.setItem(STORAGE_TOKEN_KEY, outputDto.accessToken);
      localStorage.setItem('AccessToken', outputDto.accessToken);
    }
    if (outputDto.user) {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(outputDto.user));
    }
    if (outputDto.studentId) {
      localStorage.setItem('StudentId', outputDto.studentId.toString());
    }
    if (outputDto.studentName) {
      localStorage.setItem('StudentName', outputDto.studentName);
    }
    if (outputDto.email) {
      localStorage.setItem('Email', outputDto.email);
    }
    if (outputDto.mobileNumber) {
      localStorage.setItem('MobileNumber', outputDto.mobileNumber);
    }
    if (outputDto.profileImage) {
      localStorage.setItem('ProfileImage', outputDto.profileImage);
    }
  }

  return outputDto;
}

/**
 * Legacy wrapper function for loginUser using OTP initiation.
 * 
 * @param {string} email - Student email or mobile number
 * @returns {Promise<object>}
 */
export async function loginUser(email) {
  return await sendStudentLoginOTP(email);
}

/**
 * Logs out user and clears local session.
 */
export function logoutUser() {
  clearStoredIdentity();
}

function nameFromEmail(email = '') {
  const local = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (!local) return '';
  return local.split(/\s+/).filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function isEmailAddress(value = '') {
  return /@/.test(String(value || '').trim());
}

/**
 * Shows the student's name. An email address is not used as the visible name.
 */
export function signedInDisplayName(user, { firstNameOnly = false } = {}) {
  if (!user) return 'User';
  const candidates = [user.studentName, user.fullName, user.name]
    .map(value => String(value || '').trim())
    .filter(value => value && !isEmailAddress(value));
  const emailLocal = String(user.email || '').split('@')[0].trim().toLowerCase();
  const studentName = candidates.find(value => value.toLowerCase() !== emailLocal) || candidates[0] || '';
  const chosen = studentName || nameFromEmail(user.email) || 'User';
  if (!firstNameOnly) return chosen;
  return chosen.split(/\s+/)[0] || 'User';
}

export function normalizeSignedInUser(user) {
  if (!user) return null;
  const displayName = signedInDisplayName(user);
  return {
    ...user,
    name: displayName,
    studentName: displayName,
    fullName: displayName
  };
}

/**
 * Gets currently logged in user session from localStorage if available.
 */
export function getSavedUserSession() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? normalizeSignedInUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
