import { formatDate } from '../../utils/dateFormatter';

function readPayload(rawJson) {
    if (typeof rawJson === 'string') {
        const trimmed = rawJson.trim();
        if (!trimmed) return {};
        try {
            const parsed = JSON.parse(trimmed);
            return parsed && typeof parsed === 'object' ? parsed : { message: trimmed };
        } catch {
            return { message: trimmed };
        }
    }
    return rawJson && typeof rawJson === 'object' ? rawJson : {};
}

function isApiSuccess(value, fallback) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') return true;
        if (normalized === 'false' || normalized === '0') return false;
    }
    return fallback;
}

function toBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    return false;
}

function mapCertificate(item = {}) {
    return {
        credentialId: item?.credentialId || item?.CredentialId || '',
        studentId: Number(item?.studentId ?? item?.StudentId ?? 0) || 0,
        courseOrProgramName: item?.courseOrProgramName || item?.CourseOrProgramName || '',
        certificatePdfUrl: item?.certificatePdfUrl || item?.CertificatePdfUrl || '',
        isRevoked: toBoolean(item?.isRevoked ?? item?.IsRevoked),
        revocationReason: item?.revocationReason || item?.RevocationReason || '',
        revokedOn: formatDate(item?.revokedOn || item?.RevokedOn || ''),
        createdOn: formatDate(item?.createdOn || item?.CreatedOn || '')
    };
}

/**
 * OUTPUT PARAMETER FILE: Get Student Issued Certificate Output DTO Parser
 * Parses response data for GetStudentIssuedCertificate POST request.
 *
 * @param {object} rawJson - Raw JSON response from API
 * @param {number} status - HTTP status code
 * @returns {object} Formatted output DTO
 */
export function parseGetStudentIssuedCertificateOutput(rawJson = {}, status = 200) {
    const payload = readPayload(rawJson);
    const isHttpOk = status >= 200 && status < 300;
    const isSuccess = isApiSuccess(payload?.isSuccess ?? payload?.IsSuccess, isHttpOk);

    const rawList = payload?.getStudentIssuedCertificate
        || payload?.GetStudentIssuedCertificate
        || payload?.getStudentIssuedCertificateList
        || payload?.GetStudentIssuedCertificateList
        || [];

    const getStudentIssuedCertificate = Array.isArray(rawList)
        ? rawList.map(mapCertificate)
        : [];

    return {
        success: isSuccess,
        status,
        message: payload?.message || payload?.Message || '',
        errorDescription: payload?.errorDescription || payload?.ErrorDescription || '',
        errorNo: payload?.errorNo || payload?.ErrorNo || 0,
        getStudentIssuedCertificate,
        rawData: payload
    };
}

export function issuedCertificateErrorText(result = {}) {
    const message = String(result?.message || result?.Message || '').trim();
    const description = String(result?.errorDescription || result?.ErrorDescription || result?.error || '').trim();
    const parts = [];
    if (message) parts.push(message);
    if (description && description !== message && description !== 'Network/Server Error') parts.push(description);
    return parts.join(' — ');
}

export function parseGetStudentIssuedCertificateErrorOutput(rawJson = {}, status = 500) {
    const payload = readPayload(rawJson);
    return {
        success: false,
        status,
        message: payload?.message || payload?.Message || 'Failed to fetch issued certificates',
        errorDescription: payload?.errorDescription || payload?.ErrorDescription || payload?.error || 'Network/Server Error',
        errorNo: payload?.errorNo || payload?.ErrorNo || status,
        getStudentIssuedCertificate: [],
        rawData: rawJson
    };
}
