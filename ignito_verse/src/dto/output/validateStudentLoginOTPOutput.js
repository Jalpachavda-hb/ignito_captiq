import { formatImageUrl } from './homepageOutputs';

/**
 * OUTPUT PARAMETER FILE: Validate Student Login OTP Output DTO Parser
 * Parses API response payload from ValidateStudentLoginOTP endpoint.
 * 
 * Backend Model: MicrocredentialLoginOutputParameter : ResponseBase
 * - IsSuccess: bool
 * - Message: string
 * - ErrorDescription: string
 * - ErrorNo: Int64
 * - StudentId: Int64
 * - StudentName: string
 * - Email: string
 * - MobileNumber: string
 * - Gender: string
 * - CreatedOn: string
 * - UpdatedOn: string
 * - AccessToken: string
 * - ProfileImage: string
 * 
 * @param {object} rawJson - Raw JSON response object from backend API
 * @param {number} [status=200] - HTTP status code
 * @returns {object} Clean parsed authentication result object for UI consumption
 */
function readPayload(rawJson = {}) {
  const nested = rawJson?.data || rawJson?.Data || rawJson?.result || rawJson?.Result || rawJson?.student || rawJson?.Student || {};
  return { ...nested, ...rawJson };
}

function nameFromEmail(email = '') {
  const local = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (!local) return '';
  return local.split(/\s+/).filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function collectNames(source = {}) {
  const first = source?.firstName || source?.FirstName || '';
  const last = source?.lastName || source?.LastName || '';
  const combined = `${first} ${last}`.trim();
  return [
    source?.studentName,
    source?.StudentName,
    source?.applicantFullName,
    source?.ApplicantFullName,
    source?.fullName,
    source?.FullName,
    combined
  ].map(value => String(value || '').trim()).filter(Boolean);
}

export function parseValidateStudentLoginOTPOutput(rawJson = {}, status = 200, loginIdentity = '') {
  const isOk = status >= 200 && status < 300;
  const source = readPayload(rawJson);

  const isSuccess = Boolean(
    source?.isSuccess ??
    source?.IsSuccess ??
    source?.success ??
    (isOk && !source?.error)
  );

  const message = source?.message || source?.Message || (isSuccess ? 'Login successful.' : 'Invalid OTP or verification failed.');
  const errorDescription = source?.errorDescription || source?.ErrorDescription || '';
  const errorNo = Number(source?.errorNo || source?.ErrorNo || 0);

  const studentId = Number(source?.studentId || source?.StudentId || 0);
  const typedIdentity = String(loginIdentity || '').trim();
  const typedEmail = typedIdentity.includes('@') ? typedIdentity : '';
  const email = source?.email || source?.Email || typedEmail || '';
  const mobileNumber = source?.mobileNumber || source?.MobileNumber || (!typedEmail ? typedIdentity : '') || '';
  const emailName = nameFromEmail(email);
  const nested = rawJson?.data || rawJson?.Data || rawJson?.result || rawJson?.Result || rawJson?.student || rawJson?.Student || {};
  const candidateNames = [...collectNames(source), ...collectNames(nested)];
  const emailLocal = String(email || '').split('@')[0].trim().toLowerCase();
  const studentName = candidateNames.find(candidate => {
    const value = candidate.toLowerCase();
    return !value.includes('@') && value !== emailLocal;
  }) || candidateNames.find(candidate => !candidate.includes('@')) || '';
  const gender = source?.gender || source?.Gender || '';
  const createdOn = source?.createdOn || source?.CreatedOn || '';
  const updatedOn = source?.updatedOn || source?.UpdatedOn || '';
  const accessToken = source?.accessToken || source?.AccessToken || source?.token || source?.Token || '';

  const rawProfileImage = source?.profileImage || source?.ProfileImage || '';
  const profileImage = formatImageUrl(rawProfileImage);

  const displayName = studentName || emailName || mobileNumber || 'Student';

  return {
    success: isSuccess,
    isSuccess,
    status,
    message,
    errorDescription,
    errorNo,
    studentId,
    studentName: displayName,
    email,
    mobileNumber,
    gender,
    createdOn,
    updatedOn,
    accessToken,
    profileImage,
    token: accessToken,
    user: isSuccess ? {
      id: studentId,
      empId: studentId,
      studentId: studentId,
      name: displayName,
      fullName: displayName,
      email: email,
      mobileNumber: mobileNumber,
      role: 'Employee Learner',
      avatar: profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
    } : null,
    error: isSuccess ? null : (message || errorDescription || 'OTP Validation Failed')
  };
}
