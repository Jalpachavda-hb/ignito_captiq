/**
 * OUTPUT PARAMETER FILE: Send Student Login OTP Output DTO Parser
 * Parses API response payload from SendStudentLoginOTP endpoint.
 * 
 * Backend Model: SendStudentLoginOTPOutputParameter : ResponseBase
 * - IsSuccess: bool
 * - Message: string
 * - ErrorDescription: string
 * - ErrorNo: Int64
 * - StudentId: long
 * - OtpId: long
 * - Email: string
 * - MobileNumber: string
 * 
 * @param {object} rawJson - Raw JSON response object from backend API
 * @param {number} [status=200] - HTTP status code
 * @returns {object} Clean parsed result object for UI consumption
 */
export function parseSendStudentLoginOTPOutput(rawJson = {}, status = 200) {
  const isOk = status >= 200 && status < 300;

  const isSuccess = Boolean(
    rawJson?.isSuccess ?? 
    rawJson?.IsSuccess ?? 
    rawJson?.success ?? 
    (isOk && !rawJson?.error)
  );

  const message = rawJson?.message || rawJson?.Message || (isSuccess ? 'OTP sent successfully.' : 'Failed to send OTP.');
  const errorDescription = rawJson?.errorDescription || rawJson?.ErrorDescription || '';
  const errorNo = Number(rawJson?.errorNo || rawJson?.ErrorNo || 0);

  const source = rawJson?.data || rawJson?.Data || rawJson?.result || rawJson?.Result || rawJson || {};
  const studentId = Number(source?.studentId || source?.StudentId || rawJson?.studentId || rawJson?.StudentId || 0);
  const otpId = Number(source?.otpId || source?.OtpId || rawJson?.otpId || rawJson?.OtpId || 0);
  const email = source?.email || source?.Email || rawJson?.email || rawJson?.Email || '';
  const mobileNumber = source?.mobileNumber || source?.MobileNumber || rawJson?.mobileNumber || rawJson?.MobileNumber || '';

  return {
    success: isSuccess,
    isSuccess,
    status,
    message,
    errorDescription,
    errorNo,
    studentId,
    otpId,
    email,
    mobileNumber,
    error: isSuccess ? null : (message || errorDescription || 'Failed to send OTP')
  };
}
