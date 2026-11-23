/**
 * INPUT PARAMETER FILE: Get Student Issued Certificate Input DTO Builder
 * Builds input payload for GetStudentIssuedCertificate POST request.
 *
 * @param {number} studentId - Student ID (default 0 uses the logged-in student)
 * @returns {object} Object containing headers and stringified JSON body
 */
export function buildGetStudentIssuedCertificateInput(studentId = 0) {
    const parsedId = Number(studentId) || 0;

    return {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain'
        },
        body: JSON.stringify({
            studentId: parsedId
        })
    };
}
