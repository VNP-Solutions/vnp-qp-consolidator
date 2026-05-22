const XLSX = require('xlsx');

// Source-of-truth: Excel header → DB field. Order here is also the
// canonical header order for the QP report format.
const HEADER_MAP = Object.freeze({
    MID: 'mid',
    DBA: 'dba',
    TransactionDateTimeLocal: 'transaction_date_time_local',
    TransactionDateLocal: 'transaction_date_local',
    TransactionID: 'transaction_id',
    PaymentType: 'payment_type',
    ProcessorID: 'processor_id',
    Type: 'type',
    Account: 'account',
    AccountExpiration: 'account_expiration',
    OrderID: 'order_id',
    OrderDescription: 'order_description',
    Time: 'time',
    Amount: 'amount',
    Status: 'status',
    Response: 'response',
    ResponseText: 'response_text',
    AvsResults: 'avs_results',
    CscResults: 'csc_results',
    AuthCode: 'auth_code',
    BatchID: 'batch_id',
    FirstName: 'first_name',
    LastName: 'last_name',
    CompanyName: 'company_name',
    AddressOne: 'address_one',
    AddressTwo: 'address_two',
    City: 'city',
    State: 'state',
    ZipCode: 'zip_code',
    Country: 'country',
    Email: 'email',
    ShippingFirstName: 'shipping_first_name',
    ShippingLastName: 'shipping_last_name',
    ShippingToCompanyName: 'shipping_to_company_name',
    ShippingToAddressOne: 'shipping_to_address_one',
    ShippingToAddressTwo: 'shipping_to_address_two',
    ShippingToCity: 'shipping_to_city',
    ShippingToState: 'shipping_to_state',
    ShippingToPostalCode: 'shipping_to_postal_code',
    ShippingToCountry: 'shipping_to_country',
    ShippingEmail: 'shipping_email',
    PhoneNumber: 'phone_number',
    Fax: 'fax',
    UserName: 'user_name',
    EntryMethod: 'entry_method',
    ServiceType: 'service_type',
    DescriptorDBA: 'descriptor_dba',
    DescriptorPhoneNumber: 'descriptor_phone_number',
    AuthenticationResult: 'authentication_result',
});

const EXPECTED_HEADERS = Object.freeze(Object.keys(HEADER_MAP));

function normalizeHeader(h) {
    return String(h || '').trim();
}

function readWorkbook(buffer) {
    return XLSX.read(buffer, { type: 'buffer', cellDates: false, cellNF: false });
}

function getFirstSheet(workbook) {
    const name = workbook.SheetNames[0];
    if (!name) throw new Error('Workbook has no sheets');
    return workbook.Sheets[name];
}

function getHeadersFromSheet(sheet) {
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const firstRow = aoa[0] || [];
    return firstRow.map(normalizeHeader);
}

/**
 * Validate that the workbook's first sheet contains all expected QP report headers.
 * Returns { valid, missing, extra, headers } — does NOT throw.
 */
function validateBuffer(buffer) {
    let workbook;
    try {
        workbook = readWorkbook(buffer);
    } catch (e) {
        return { valid: false, missing: EXPECTED_HEADERS.slice(), extra: [], headers: [], error: 'Could not read the workbook' };
    }
    const sheet = getFirstSheet(workbook);
    const headers = getHeadersFromSheet(sheet);
    const headerSet = new Set(headers);
    const missing = EXPECTED_HEADERS.filter((h) => !headerSet.has(h));
    const extra = headers.filter((h) => h && !HEADER_MAP[h]);
    return { valid: missing.length === 0, missing, extra, headers };
}

function parseAmount(raw) {
    if (raw === null || raw === undefined || raw === '') return undefined;
    const cleaned = String(raw).replace(/[$,\s]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
}

/**
 * Map an Excel row object (keyed by Excel headers) to our DB document fields.
 * Throws if amount is present but unparseable.
 */
function mapRowToDocument(row) {
    const doc = {};
    for (const [excelHeader, dbField] of Object.entries(HEADER_MAP)) {
        const raw = row[excelHeader];
        if (raw === undefined || raw === '' || raw === null) continue;

        if (dbField === 'amount') {
            const n = parseAmount(raw);
            if (n === undefined) {
                throw new Error(`Could not parse Amount value: "${raw}"`);
            }
            doc.amount = n;
        } else {
            doc[dbField] = String(raw).trim();
        }
    }
    return doc;
}

function parseRows(buffer) {
    const workbook = readWorkbook(buffer);
    const sheet = getFirstSheet(workbook);
    return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

/**
 * Extract the reported-date from a QP report filename.
 * Filenames are expected to look like: "VNPS HOLDINGS, LLC_Compiled_Report_20260519.xlsx"
 * The trailing 8 digits before the extension encode YYYYMMDD.
 *
 * Returns a Date (UTC midnight) or null if the pattern is absent / invalid.
 */
function extractReportedDate(filename) {
    if (!filename) return null;
    const noExt = filename.replace(/\.[^.]+$/, '');
    const match = noExt.match(/(\d{8})$/);
    if (!match) return null;

    const stamp = match[1];
    const year = Number(stamp.slice(0, 4));
    const month = Number(stamp.slice(4, 6));
    const day = Number(stamp.slice(6, 8));

    if (year < 1900 || year > 2100) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const d = new Date(Date.UTC(year, month - 1, day));
    // Guard against e.g. Feb 30 being silently coerced
    if (
        d.getUTCFullYear() !== year ||
        d.getUTCMonth() !== month - 1 ||
        d.getUTCDate() !== day
    ) {
        return null;
    }
    return d;
}

module.exports = {
    EXPECTED_HEADERS,
    HEADER_MAP,
    validateBuffer,
    parseRows,
    mapRowToDocument,
    extractReportedDate,
};